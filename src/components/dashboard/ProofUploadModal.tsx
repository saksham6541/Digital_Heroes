"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProofUploadModalProps {
  winnerId: string;
  drawPeriod?: string;
  tier: number;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export default function ProofUploadModal({
  winnerId,
  drawPeriod,
  tier,
  onClose,
  onSuccess,
}: ProofUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, or WEBP).");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("Image size must be under 5MB.");
      return;
    }

    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select an image of your scorecard.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Resolve the signed-in user so the upload path is user-scoped
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to submit proof.");

      // Derive extension from MIME type (not filename) so spoofed extensions
      // don't end up in the path. Falls back to 'bin' for unknown types.
      const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const ext = mimeToExt[file.type] ?? "bin";

      // Path is user-scoped: <userId>/<winnerId>_<ts>.<ext>
      // The proof route validates that the URL contains this prefix.
      const filePath = `${user.id}/${winnerId}_${Date.now()}.${ext}`;

      // Upload to Supabase Storage bucket 'winner-proofs'. Set upsert false so
      // repeated uploads do not overwrite an existing proof for the same user.
      const { error: uploadError } = await supabase.storage
        .from("winner-proofs")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("winner-proofs").getPublicUrl(filePath);

      // Save proof url to winner record
      const res = await fetch(`/api/winners/${winnerId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: publicUrl }),
      });

      let body: { error?: string } | null = null;
      try {
        body = (await res.json()) as { error?: string };
      } catch {
        body = null;
      }

      if (!res.ok) {
        throw new Error(body?.error || "Failed to submit verification proof");
      }

      onSuccess(publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Upload Winner Proof</h3>
            <p className="text-xs text-neutral-400">
              {tier}-match tier {drawPeriod ? `(${drawPeriod})` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
          Please upload a clear screenshot of your official golf scorecard showing your Stableford score for verification.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/15 border border-red-500/30 p-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              preview
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-neutral-700 hover:border-emerald-500/60 bg-neutral-950/50"
            }`}
          >
            {preview ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Scorecard preview"
                  className="max-h-44 mx-auto rounded-lg object-contain border border-neutral-800"
                />
                <p className="text-xs text-emerald-400">Click to choose a different image</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                  📁
                </div>
                <p className="text-sm font-medium text-neutral-300">
                  Click to select scorecard screenshot
                </p>
                <p className="text-xs text-neutral-500">PNG, JPG, or WEBP up to 5MB</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-neutral-950 transition-colors disabled:opacity-40"
            >
              {uploading ? "Uploading & Submitting…" : "Submit for Verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
