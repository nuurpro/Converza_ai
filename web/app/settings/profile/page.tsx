"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export default function ProfilePage() {
  const [name, setName] = useState("Nodir Ergashxojaev");
  const [email] = useState("nodir@converza.ai");
  const [role, setRole] = useState("Founder · Operator");

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Profile
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          How you appear inside the workspace and on agent attribution.
        </p>
      </header>

      {/* Avatar block */}
      <section className="flex items-center gap-5 border-b border-border pb-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D6FE5] to-[#0070F3] text-[20px] font-medium text-white">
          NE
        </div>
        <div className="space-y-1">
          <div className="text-[15px] font-medium text-text-primary">{name}</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
            {email}
          </div>
          <div className="flex gap-3 pt-2">
            <button className="rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-[12px] font-medium text-text-primary transition-colors hover:border-border-hover">
              Upload photo
            </button>
            <button className="text-[12px] font-medium text-text-muted hover:text-text-primary">
              Remove
            </button>
          </div>
        </div>
      </section>

      <Field label="Full name" hint="As it appears on agent threads.">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
        />
      </Field>

      <Field label="Role" hint="What you do at the company.">
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
        />
      </Field>

      <Field label="Email" hint="Used for billing and login. Cannot be changed here.">
        <input
          value={email}
          readOnly
          className="w-full rounded-lg border border-border bg-bg-secondary px-3.5 py-2.5 text-[14px] text-text-muted"
        />
      </Field>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          Last saved 12 minutes ago
        </span>
        <button className="group inline-flex items-center gap-2 rounded-full bg-text-primary px-5 py-2.5 text-[13.5px] font-medium text-bg-elevated transition-all hover:scale-[1.02] active:scale-[0.97]">
          <Save size={13} strokeWidth={2.2} />
          Save changes
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.6fr] md:gap-10">
      <div>
        <div className="text-[14px] font-medium text-text-primary">{label}</div>
        {hint && (
          <div className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
