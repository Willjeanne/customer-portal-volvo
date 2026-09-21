import Form from "next/form";
import Link from "next/link";
import { listStoreQuotes } from "@/server/custom-quotes";
import type { PortalSession } from "@/server/session-store";
import { PortalError } from "@/server/security";
import { quoteDate } from "@/domain/quotes";
export async function Quotes({
  session,
  page,
  status,
  label,
}: {
  session: PortalSession;
  page: number;
  status?: string;
  label: string;
}) {
  const result =
    session.context.mode === "vtex"
      ? await listStoreQuotes(session, { page, status, label })
          .then((data) => ({ data, error: null }))
          .catch((error: unknown) => ({ data: null, error }))
      : { data: null, error: null };
  const data = result.data;
  const currency = data?.currency;
  const quoteStatuses = ["pending", "expired"];
  function pageLink(value: number) {
    const params = new URLSearchParams({ page: String(value) });
    if (status) params.set("status", status);
    if (label) params.set("label", label);
    return `/quotes?${params}`;
  }
  return (
    <section className="detail-panel">
      <h2>Your quotes</h2>
      <Form className="draft-form" action="/quotes">
        <label>
          Quote name
          <input name="label" defaultValue={label} maxLength={100} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={status || ""}>
            <option value="">All statuses</option>
            {quoteStatuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary">Filter quotes</button>
        <Link href="/quotes">Clear filters</Link>
      </Form>
      {session.context.mode === "preview" ? (
        <p>Sign in with VTEX to load your quotes.</p>
      ) : !data ? (
        <div role="alert">
          <h3>Quotes unavailable</h3>
          <p>
            {result.error instanceof PortalError
              ? result.error.message
              : "Quotes could not be loaded. Please try again."}
          </p>
        </div>
      ) : (
        <>
          <p>{data.totalItems} quotes matching your filters</p>
          {!data.items.length ? (
            <p>No quotes found. Try clearing the filters.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Quote</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((quote) => (
                    <tr key={quote.id}>
                      <td>{quote.label || quote.id}</td>
                      <td>{quote.status}</td>
                      <td>{quoteDate(quote.createdAt)}</td>
                      <td>{quoteDate(quote.expiresAt)}</td>
                      <td>
                        {new Intl.NumberFormat(
                          "en-US",
                          currency
                            ? { style: "currency", currency }
                            : {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                        ).format(quote.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="form-note">
                {currency
                  ? `Amounts in ${currency}, from your VTEX session.`
                  : "Currency unavailable; amounts are shown as returned by VTEX."}
              </p>
            </div>
          )}
          <nav className="order-pagination" aria-label="Quote pages">
            {page > 1 && (
              <Link className="button secondary" href={pageLink(page - 1)}>
                Previous
              </Link>
            )}
            <span>
              Page {page} of{" "}
              {Math.max(1, Math.ceil(data.totalItems / data.pageSize))}
            </span>
            {page * data.pageSize < data.totalItems && (
              <Link className="button secondary" href={pageLink(page + 1)}>
                Next
              </Link>
            )}
          </nav>
        </>
      )}
      <p className="form-note">
        Store quote history. Amounts are item subtotals. Creation, review
        actions and conversion to cart are not connected yet.
      </p>
    </section>
  );
}
