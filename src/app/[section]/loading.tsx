export default function Loading(): React.JSX.Element {
  return (
    <main className="standalone-error" aria-busy="true">
      <p role="status">Loading your workspace…</p>
    </main>
  );
}
