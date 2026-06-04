"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  avatar_url: string | null;
};

export function ProfileIcon() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    };

    loadProfile();
  }, []);

  if (loading) return null;

  return (
    <Link href="/profile" className="focus:outline-none">
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--gold)] hover:border-[var(--crimson)] transition-colors cursor-pointer flex items-center justify-center bg-[var(--card-2)]">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg">👤</span>
        )}
      </div>
    </Link>
  );
}
