import type { ChangeEvent, ReactNode } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { cn } from "../../lib/cn";

export function UploadCard({
  title = "Upload campaign data",
  description = "Drop a CSV, XLSX, or XLS export from your ad platform, or choose a file manually.",
  buttonLabel = "Upload Campaign Data",
  accept = ".csv,.xlsx,.xls",
  onFile,
  secondaryAction,
  className
}: {
  title?: string;
  description?: string;
  buttonLabel?: string;
  accept?: string;
  onFile?: (file: File) => void;
  secondaryAction?: ReactNode;
  className?: string;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFile?.(file);
  }

  return (
    <label
      className={cn(
        "flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-executive transition hover:border-brand-cyan hover:bg-cyan-50/40",
        className
      )}
    >
      <input type="file" accept={accept} className="hidden" onChange={handleChange} />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-brand-cyan">
        <UploadCloud size={30} />
      </div>
      <h2 className="font-display text-xl font-semibold text-brand-navy">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex items-center gap-3">
        <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-navy bg-brand-navy px-4 text-sm font-semibold text-white shadow-sm">
          <FileSpreadsheet size={17} />
          {buttonLabel}
        </span>
        {secondaryAction}
      </div>
    </label>
  );
}
