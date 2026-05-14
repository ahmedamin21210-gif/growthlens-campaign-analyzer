import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui/Button";
import { useCampaign } from "../../state/CampaignContext";
import { cn } from "../../lib/utils";

export function FileDropzone({ onComplete }: { onComplete?: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const { pickFile, parseDroppedFile, loadSampleData } = useCampaign();

  async function handleFile(file?: File) {
    if (!file) return;
    const ok = await parseDroppedFile(file);
    if (ok) onComplete?.();
  }

  return (
    <div
      className={cn(
        "flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-executive transition",
        dragging && "border-brand-cyan bg-cyan-50"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void handleFile(event.dataTransfer.files[0]);
      }}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-brand-cyan">
        <UploadCloud size={30} />
      </div>
      <h2 className="text-xl font-semibold text-brand-navy">Upload campaign data</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Drop a CSV, XLSX, or XLS export from Meta, Google, TikTok, LinkedIn, Snapchat, or a custom ad report.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button
          onClick={async () => {
            const ok = await pickFile();
            if (ok) onComplete?.();
          }}
        >
          <FileSpreadsheet size={17} />
          Upload Campaign Data
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const ok = await loadSampleData();
            if (ok) onComplete?.();
          }}
        >
          Use sample data
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
