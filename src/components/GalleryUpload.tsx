import { useRef, useState } from "react";
import { Upload, X, Loader2, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  folder?: string;
}

const MAX_SIZE_MB = 5;
const MAX_FILES = 10;

export function GalleryUpload({
  value,
  onChange,
  bucket = "site-assets",
  folder = "products/images",
}: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    const arr = Array.from(files);
    if (value.length + arr.length > MAX_FILES) {
      toast.error(`Max ${MAX_FILES} images per product`);
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of arr) {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${MAX_SIZE_MB}MB`);
          continue;
        }
        const ext = file.name.split(".").pop() || "png";
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = `${folder}/${safeName}`;
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
        if (upErr) {
          toast.error(upErr.message);
          continue;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} image(s) uploaded`);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || value.length >= MAX_FILES}
        >
          {uploading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Upload className="me-2 h-4 w-4" />}
          Add images
        </Button>
        <p className="text-xs text-muted-foreground">
          {value.length}/{MAX_FILES} • First image is the thumbnail customers see in listings
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((src, i) => (
            <div key={src + i} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  <Star className="h-3 w-3" /> Thumbnail
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move left"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => remove(i)}
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Move right"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
        }}
      />
    </div>
  );
}
