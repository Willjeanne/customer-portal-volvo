import Link from "next/link";
export default function NotFound(): React.JSX.Element {
  return (
    <main className="standalone-error">
      <h1>Page not found</h1>
      <Link href="/home">Back to your workspace</Link>
    </main>
  );
}
