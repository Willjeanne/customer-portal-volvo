export default function Loading(): React.JSX.Element {
  return (
    <section className="detail-panel" aria-busy="true">
      <p role="status">Loading…</p>
    </section>
  );
}
