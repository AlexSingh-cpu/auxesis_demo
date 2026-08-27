"use client";

import { useRef, useState } from "react";
import { FileTextIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { Button, IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = "image/*,application/pdf";

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  // dragenter and dragleave fire for every child element, so the raw events
  // cannot drive the highlight on their own.
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  function accept(list: FileList | null) {
    if (!list || list.length === 0) return;
    setFiles((current) => [
      ...current,
      ...Array.from(list).map((file) => file.name),
    ]);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-4">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          depth.current -= 1;
          if (depth.current <= 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          depth.current = 0;
          setDragging(false);
          accept(event.dataTransfer.files);
        }}
        className={cn(
          "grid-paper flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-control",
          "border border-dashed px-4 py-5 text-center transition-colors duration-150",
          dragging
            ? "border-accent bg-accent-soft"
            : "border-line hover:border-line-strong"
        )}
      >
        <UploadSimpleIcon
          size={20}
          className={dragging ? "text-accent" : "text-ink-3"}
        />
        <p className="text-[12px] text-ink-2">
          Drop a photo or PDF of a chapter here
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            accept(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="flex max-h-24 flex-col gap-1.5 overflow-y-auto">
          {files.map((name, index) => (
            <li
              key={`${name}-${index}`}
              className="flex items-center gap-2 rounded-control border border-line bg-surface-2 py-1.5 pl-2.5 pr-1"
            >
              <FileTextIcon size={15} className="shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">
                {name}
              </span>
              <IconButton
                label={`Remove ${name}`}
                className="size-6"
                onClick={() =>
                  setFiles((current) =>
                    current.filter((_, i) => i !== index)
                  )
                }
              >
                <XIcon size={13} />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="shrink-0 text-[11px] leading-relaxed text-ink-3">
        {files.length > 0
          ? "Saved on this device. We'll read and sort these once uploads are live."
          : "We'll read each problem and tag it by topic, type, and difficulty."}
      </p>
    </div>
  );
}
