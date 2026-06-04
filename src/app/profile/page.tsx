"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  user_id: string;
  avatar_url: string | null;
  display_name: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
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
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
      } else {
        setProfile({
          user_id: user.id,
          avatar_url: null,
          display_name: null,
        });
      }
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file size (2-5 MB)
    const maxSize = 5 * 1024 * 1024; // 5 MB
    const minSize = 2 * 1024; // 2 KB (very small minimum)
    if (file.size > maxSize) {
      setMessage({ type: "error", text: "File size must be less than 5 MB" });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please upload an image file" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // Upload to Supabase Storage
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

      // Get public URL
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      // Update profile in database
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
      <main className="max-w-md mx-auto p-6 mt-6">
        <div className="card text-center">
          <p className="text-[var(--muted)]">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="max-w-md mx-auto p-6 mt-6">
        <div className="card text-center">
          <p className="text-[var(--muted)]">Profile not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">⚽ My Profile</h1>

        {/* Messages */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-500/10 border border-green-500/30 text-green-500"
                : "bg-[var(--crimson)]/10 border border-[var(--crimson)]/30 text-[var(--crimson)]"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Avatar Section */}
        <div className="mb-6">
          <h2 className="font-bold text-sm mb-3">Profile Picture</h2>

          {/* Avatar Preview */}
          <div className="flex justify-center mb-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-2 border-[var(--gold)]"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[var(--card-2)] border-2 border-[var(--gold)] flex items-center justify-center text-4xl font-bold text-[var(--muted)]">
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
            />
            <button
              onClick={() => document.querySelector('input[type="file"]')?.click()}
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
        <div className="mb-6">
          <label className="block">
            <p className="font-bold text-sm mb-2">Display Name (optional)</p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--gold)] text-sm"
            />
          </label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveProfile}
          disabled={uploading}
          className="w-full btn btn-primary justify-center"
        >
          {uploading ? "Saving..." : "💾 Save Profile"}
        </button>
      </div>
    </main>
  );
}
