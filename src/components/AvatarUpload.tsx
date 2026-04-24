import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  /** Database table to update */
  table: "care_givers" | "care_receivers";
  /** Row id */
  recordId: string;
  /** Currently displayed avatar (placeholder image is fine) */
  currentSrc: string;
  /** Optional fallback element rendered when no image (e.g. icon). If provided, takes precedence when no real avatar set. */
  fallback?: React.ReactNode;
  /** Whether a real (uploaded) avatar exists. When false, fallback is shown. */
  hasUploadedAvatar?: boolean;
  size?: "md" | "lg";
  rounded?: "full" | "2xl";
  /** Query keys to invalidate after upload */
  invalidateKeys?: string[][];
}

export function AvatarUpload({
  table,
  recordId,
  currentSrc,
  fallback,
  hasUploadedAvatar,
  size = "lg",
  rounded = "2xl",
  invalidateKeys = [],
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const dim = size === "lg" ? "h-24 w-24" : "h-16 w-16";
  const radius = rounded === "full" ? "rounded-full" : "rounded-2xl";

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${table}/${recordId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("profile-avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      const { error: dbErr } = await supabase
        .from(table)
        .update({ avatar_url: url })
        .eq("id", recordId);
      if (dbErr) throw dbErr;

      toast({ title: "Profile picture updated" });
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const showImage = hasUploadedAvatar !== false || !fallback;

  return (
    <div className="relative group shrink-0">
      <div
        className={`${dim} ${radius} border-2 border-primary/20 overflow-hidden bg-primary/15 flex items-center justify-center`}
      >
        {showImage ? (
          <img src={currentSrc} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          fallback
        )}
      </div>
      <button
        type="button"
        onClick={onPick}
        disabled={uploading}
        className={`absolute inset-0 ${radius} bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-xs gap-1 disabled:opacity-100`}
        aria-label="Change profile picture"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Camera className="h-5 w-5" />
            <span>Change</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}

/** Compact button variant — for use in places without an avatar circle. */
export function AvatarUploadButton(props: Omit<Props, "size" | "rounded" | "fallback">) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${props.table}/${props.recordId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("profile-avatars").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from(props.table)
        .update({ avatar_url: pub.publicUrl })
        .eq("id", props.recordId);
      if (dbErr) throw dbErr;
      toast({ title: "Profile picture updated" });
      (props.invalidateKeys ?? []).forEach((k) => qc.invalidateQueries({ queryKey: k }));
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-2">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Upload Photo
      </Button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
    </>
  );
}
