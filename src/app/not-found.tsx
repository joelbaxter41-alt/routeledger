import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="legal">
      <h1>We couldn’t find that page.</h1>
      <p>It may have moved, or the record may belong to another workspace.</p>
      <Link className="button primary" href="/app">
        Back to your business
      </Link>
    </main>
  );
}
