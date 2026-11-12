"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="card">
      <h1>We couldn’t load your workspace.</h1>
      <p className="muted">
        Try again. If this is a new installation, confirm your Supabase settings
        and database migrations.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
