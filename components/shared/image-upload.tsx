"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { isAcceptedImage, uploadToCloudinary } from "@/lib/cloudinary";

type Props = {
  value?: string;
  onChange: (secureUrl: string) => void;
  folder: string;
  circle?: boolean;
  label?: string;
  alt?: string;
};

export function ImageUpload({
  value,
  onChange,
  folder,
  circle = false,
  label = "Change photo",
  alt = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const displayed = preview ?? value;
  const uploading = progress !== null;

  async function handleFile(file: File) {
    const check = isAcceptedImage(file);
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setProgress(0);
    try {
      const result = await uploadToCloudinary(file, folder, setProgress);
      onChange(result.secureUrl);
    } catch (err) {
      setPreview(null);
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setProgress(null);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-busy={uploading}
        className={cn(
          "relative flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          circle
            ? "h-28 w-28 rounded-full"
            : "aspect-[4/3] w-full max-w-sm rounded-[var(--radius-md)]",
        )}
      >
        {displayed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayed} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Camera className="h-7 w-7" aria-hidden="true" />
        )}
        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/70 text-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span className="text-xs tabular-nums">{progress}%</span>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50"
      >
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
