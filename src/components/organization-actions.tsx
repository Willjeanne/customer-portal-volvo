"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function OrganizationActions({
  kind,
  roles = [],
  unitPath = [],
  unitName,
}: {
  kind: "cost-center" | "user";
  unitPath?: string[];
  unitName?: string;
  roles?: { roleId: number; roleName: string }[];
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <form
      className="draft-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (lock.current || submitted) return;
        lock.current = true;
        setBusy(true);
        setSubmitted(true);
        setMessage("");
        const form = event.currentTarget;
        const data = new FormData(form);
        const body =
          kind === "cost-center"
            ? { value: data.get("value"), description: data.get("description") }
            : {
                unitPath,
                login: data.get("login"),
                name: data.get("name"),
                email: data.get("email"),
                roleId: Number(data.get("roleId")),
              };
        try {
          const response = await fetch(
            `/api/portal/${kind === "cost-center" ? "create-cost-center" : "create-organization-user"}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            },
          );
          const result = await response.json();
          if (!response.ok) {
            if (response.status >= 500) {
              setSubmitted(true);
              throw new Error(
                `${result.error || "The result could not be confirmed."} Refresh the list before attempting another creation.`,
              );
            }
            setSubmitted(false);
            throw new Error(result.error || "VTEX rejected the operation.");
          }
          setSubmitted(true);
          setMessage(result.message);
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "The result is unknown. Refresh the list before trying again.",
          );
          if (error instanceof TypeError) setSubmitted(true);
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy || submitted} style={{ border: 0, padding: 0 }}>
        <legend>
          {kind === "cost-center"
            ? "Create cost center"
            : `Add user to ${unitName || "current unit"}`}
        </legend>
        {kind === "cost-center" ? (
          <>
            <label>
              Code / value
              <input name="value" required maxLength={100} />
            </label>
            <label>
              Description
              <input name="description" maxLength={500} />
            </label>
          </>
        ) : (
          <>
            <label>
              Login
              <input name="login" required maxLength={100} />
            </label>
            <label>
              Name
              <input name="name" required maxLength={100} />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Role
              <select name="roleId" required defaultValue="">
                <option value="" disabled>
                  Select a role
                </option>
                {roles.map((role) => (
                  <option key={role.roleId} value={role.roleId}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <button className="button primary" type="submit">
          {busy
            ? "Saving…"
            : kind === "cost-center"
              ? "Create cost center"
              : "Create user"}
        </button>
      </fieldset>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
