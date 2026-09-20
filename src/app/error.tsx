"use client";
export default function ErrorPage({
  reset,
}: {
  reset: () => void;
}): React.JSX.Element {
  return (
    <main className="standalone-error">
      <h1>Your workspace could not be loaded</h1>
      <p>No sample data has been substituted for a failed service.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
