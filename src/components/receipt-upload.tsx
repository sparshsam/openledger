"use client";

import { useState, useRef } from "react";
import { uploadReceipt } from "@/lib/supabase/receipts";
import { Camera, Upload } from "lucide-react";

type ReceiptUploadProps = {
  transactionId: string;
  onUploaded: () => void;
};

export function ReceiptUpload({ transactionId, onUploaded }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | null) => {
    if (!file || uploading) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10 MB.");
      return;
    }
    setUploading(true);
    setError("");
    const result = await uploadReceipt(transactionId, file);
    if (result.ok) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      onUploaded();
    } else {
      setError(result.error);
    }
    setUploading(false);
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {/* File picker */}
      <button
        className="pill pill-secondary"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 16px" }}
      >
        <Upload size={14} />
        {uploading ? "Uploading…" : "Upload receipt"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,application/pdf"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        style={{ display: "none" }}
      />

      {/* Camera capture (mobile) */}
      <button
        className="pill pill-secondary"
        onClick={() => cameraInputRef.current?.click()}
        disabled={uploading}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 16px" }}
      >
        <Camera size={14} />
        Camera
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        style={{ display: "none" }}
      />

      {error ? <span style={{ fontSize: 12, color: "var(--negative)" }}>{error}</span> : null}
    </div>
  );
}
