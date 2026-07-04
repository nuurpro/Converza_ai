"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface ConfigPageShellProps {
  title: string;
  subtitle: string;
  lead: string;
  icon: React.ElementType;
  placeholder: string;
}

export default function ConfigPageShell({
  title,
  subtitle,
  lead,
  icon: Icon,
  placeholder,
}: ConfigPageShellProps) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-primary px-4 pl-14 md:pl-8 md:px-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[18px] font-medium tracking-[-0.01em] text-text-primary">
            {title}
          </h1>
          <span className="hidden text-[13.5px] text-text-muted sm:block">
            {subtitle}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-bg-primary">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl px-6 py-10 md:px-10 md:py-14"
        >
          <div className="mb-10 flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-text-secondary">
              <Icon size={16} strokeWidth={1.7} />
            </span>
            <div>
              <h2 className="text-[22px] font-medium tracking-[-0.015em] text-text-primary">
                {title}.
              </h2>
              <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-text-secondary">
                {lead}
              </p>
            </div>
          </div>

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={8}
            className="w-full resize-none rounded-2xl border border-border bg-bg-elevated p-5 text-[14.5px] leading-[1.65] text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
          />

          <div className="mt-5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              {value.length} chars · auto-saves on blur
            </span>
            <button
              onClick={save}
              className="rounded-full bg-text-primary px-5 py-2 text-[12.5px] font-medium text-bg-elevated transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
            >
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
