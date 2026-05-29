"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/pools";

  useEffect(() => {
    const checkSession = async () => {
      // Give Supabase client time to process the hash parameters
      await new Promise(resolve => setTimeout(resolve, 500));

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Session is now established, redirect to the desired page
        router.push(next);
      } else {
        // Session failed to establish, go back to login
        router.push(`/login?error=auth_failed&next=${encodeURIComponent(next)}`);
      }
    };

    checkSession();
  }, [router, next]);

  return (
    <main className="max-w-md mx-auto p-6 mt-24">
      <div className="card text-center">
        <div className="text-5xl">⚽</div>
        <p className="text-[var(--muted)] mt-4">Signing you in…</p>
      </div>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-md mx-auto p-6 mt-24">
          <div className="card text-center">
            <div className="text-5xl">⚽</div>
            <p className="text-[var(--muted)] mt-4">Loading…</p>
          </div>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
