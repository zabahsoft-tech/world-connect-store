import { useRef, useState } from "react";
import { Upload, X, Loader2, Film } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  /** "image" | "video" — what to accept and how big to allow */
  kind?: "image" | "video";
}

const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 50;

export function MediaUpload({
  value,
  onChange,
  bucket = "site-assets",
  folder = "",
  kind = "video",
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const accept =
    kind === "video"
      ? "video/mp4,video/webm,video/quicktime"
      : "image/png,image/jpeg,image/jpg,image/webp";
  const maxMB = kind === "video" ? MAX_VIDEO_MB : MAX_IMAGE_MB;

  const handleFile = async (file: File) => {
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxMB}MB.`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || (kind === "video" ? "mp4" : "png");
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = folder ? `${folder}/${safeName}` : safeName;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success(`${kind === "video" ? "Video" : "Image"} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {value && kind === "video" ? (
            value.match(/\.(mp4|webm|mov)$/i) ? (
              <video src={value} className="h-full w-full object-cover" muted />
            ) : (
              <Film className="h-6 w-6 text-muted-foreground" />
            )
          ) : value && kind === "image" ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <Film className="h-6 w-6 text-muted-foreground" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="me-2 h-4 w-4" />
              {value ? "Replace" : "Upload"}
            </Button>
            {value && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange("")}
                disabled={uploading}
              >
                <X className="me-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={kind === "video" ? "https://... (mp4 / YouTube / Vimeo)" : "https://..."}
            className="text-xs"
          />
          <p className="text-xs text-muted-foreground">
            {kind === "video" ? `MP4, WEBM, MOV. Max ${maxMB}MB.` : `PNG, JPG, WEBP. Max ${maxMB}MB.`}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
