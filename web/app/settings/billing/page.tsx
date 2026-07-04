"use client";

import { ArrowRight, Download } from "lucide-react";

const invoices = [
  { id: "INV-0421", date: "Apr 1, 2026", amount: "$0.00", status: "Free tier" },
  { id: "INV-0398", date: "Mar 1, 2026", amount: "$0.00", status: "Free tier" },
  { id: "INV-0312", date: "Feb 1, 2026", amount: "$0.00", status: "Free tier" },
];

export default function BillingPage() {
  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Billing
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          Plan, payment method, and invoice history.
        </p>
      </header>

      {/* Current plan */}
      <section className="rounded-2xl border border-border bg-bg-elevated p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Current plan
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
                Free
              </span>
              <span className="text-[14px] text-text-muted">forever, for tinkerers</span>
            </div>
            <ul className="mt-4 space-y-1.5 text-[13.5px] text-text-secondary">
              <li>· 1 brand · 1 market</li>
              <li>· Up to 20 ad variants per month</li>
              <li>· Email support</li>
            </ul>
          </div>
          <button className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[13.5px] font-medium text-white shadow-[0_8px_22px_-8px_rgba(0,112,243,0.45)] transition-all hover:scale-[1.02] active:scale-[0.97]">
            Upgrade to Pilot — $500
            <ArrowRight size={13} strokeWidth={2.4} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* Usage this month */}
      <section>
        <div className="mb-3 font-display text-[16px] text-text-secondary">
          This month
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-3">
          {[
            { k: "Ads generated", v: "8 / 20" },
            { k: "Campaigns shipped", v: "2" },
            { k: "Spend tracked", v: "$0" },
          ].map((m) => (
            <div key={m.k} className="bg-bg-elevated px-5 py-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                {m.k}
              </div>
              <div className="mt-1.5 text-[22px] font-medium tabular-nums text-text-primary">
                {m.v}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Invoices */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-[16px] text-text-secondary">
            Invoices
          </div>
          <button className="text-[12px] font-medium text-text-secondary hover:text-text-primary">
            Export all
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
            <span>Invoice</span>
            <span>Date</span>
            <span>Amount</span>
            <span></span>
          </div>
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 border-b border-border px-5 py-3.5 text-[13.5px] last:border-b-0 hover:bg-bg-hover"
            >
              <span className="font-mono text-text-primary">{inv.id}</span>
              <span className="text-text-secondary">{inv.date}</span>
              <span className="tabular-nums text-text-primary">{inv.amount}</span>
              <button
                aria-label="Download invoice"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-active hover:text-text-primary"
              >
                <Download size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
