import Link from "next/link";

export default function PoolNotFound() {
  return (
    <main className="max-w-md mx-auto p-6 mt-16">
      <div className="card text-center">
        <div className="text-5xl">🔍</div>
        <h1 className="text-2xl font-bold mt-3">Pool not found</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          The invite code in the link doesn't match any active pool. It may have been deleted, or the code was mistyped.
        </p>
        <p className="text-sm text-[var(--muted)] mt-3">
          Ask the person who shared it for the correct code, or:
        </p>
        <Link href="/pools" className="btn btn-primary mt-6 justify-center w-full">
          ← Go to my pools
        </Link>
      </div>
    </main>
  );
}
