"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  user_id: string;
  avatar_url: string | null;
  display_name: string | null;
};

export function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({ type: "error", text: "File size must be less than 5 MB" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please upload an image file" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.user_id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setMessage({ type: "error", text: `Upload failed: ${uploadError.message}` });
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      if (updateError) {
        setMessage({ type: "error", text: `Failed to save profile: ${updateError.message}` });
      } else {
        setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
        setMessage({ type: "success", text: "Avatar updated successfully!" });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${String(error)}` });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setUploading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      if (error) {
        setMessage({ type: "error", text: `Failed to save: ${error.message}` });
      } else {
        setProfile(prev => prev ? { ...prev, display_name: displayName } : null);
        setMessage({ type: "success", text: "Profile saved successfully!" });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${String(error)}` });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="card text-center">
        <p className="text-[var(--muted)]">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card text-center">
        <p className="text-[var(--muted)]">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-500"
              : "bg-[var(--crimson)]/10 border border-[var(--crimson)]/30 text-[var(--crimson)]"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Avatar Section */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">📸 Profile Picture</h2>

        {/* Avatar Preview */}
        <div className="flex justify-center mb-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-[var(--gold)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[var(--card-2)] border-2 border-[var(--gold)] flex items-center justify-center text-3xl">
              👤
            </div>
          )}
        </div>

        {/* Upload Input */}
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
            className="hidden"
            id="avatar-upload"
          />
          <button
            onClick={() => document.getElementById('avatar-upload')?.click()}
            disabled={uploading}
            className="w-full btn btn-primary"
          >
            {uploading ? "Uploading..." : "📸 Choose Picture"}
          </button>
        </label>
        <p className="text-xs text-[var(--muted)] mt-2 text-center">
          Max 5 MB. JPG, PNG, GIF, WebP supported.
        </p>
      </div>

      {/* Display Name Section */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">👤 Display Name</h2>
        <label className="block">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name (optional)"
            className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--gold)] text-sm"
          />
        </label>
        <button
          onClick={handleSaveProfile}
          disabled={uploading}
          className="w-full btn btn-primary mt-3 justify-center"
        >
          {uploading ? "Saving..." : "💾 Save Changes"}
        </button>
      </div>
    </div>
  );
}
