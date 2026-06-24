"use client";

import { useState, useEffect } from "react";
import { listReceipts, deleteReceipt, type ReceiptRecord } from "@/lib/supabase/receipts";
import { ReceiptUpload } from "@/components/receipt-upload";
import { Trash2, Eye, FileText } from "lucide-react";
import { ReceiptPreview } from "@/components/receipt-preview";

type ReceiptGalleryProps = {
  transactionId: string;
};

export function ReceiptGallery({ transactionId }: ReceiptGalleryProps) {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    const data = await listReceipts(transactionId);
    setReceipts(data);
  };

  useEffect(() => { load(); }, [transactionId]); // eslint-disable-line

  const handleDelete = async (r: ReceiptRecord) => {
    if (!confirm("Delete this receipt?")) return;
    setDeleting(r.id);
    await deleteReceipt(r.id, r.storage_url);
    setReceipts((prev) => prev.filter((p) => p.id !== r.id));
    setDeleting(null);
  };

  // Render a single receipt thumbnail
  const renderThumb = (r: ReceiptRecord) => {
    const isImage = r.mime_type?.startsWith("image/");
    return (
      <div
        key={r.id}
        style={{
          position: "relative",
          width: 80,
          height: 80,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--surface-secondary)",
          flexShrink: 0,
          cursor: "pointer",
        }}
        onClick={() => setPreviewUrl(r.storage_url)}
      >
        {isImage ? (
          <img
            src={r.storage_url}
            alt={r.file_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <FileText size={24} style={{ color: "var(--text-tertiary)" }} />
          </div>
        )}
        {/* Hover actions overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: 0,
            transition: "opacity 0.15s",
          }}
          className="receipt-hover-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewUrl(r.storage_url); }}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}
            title="Preview"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
            disabled={deleting === r.id}
            style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", padding: 4 }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 8 }}>
      {/* Receipt thumbnails */}
      {receipts.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {receipts.map(renderThumb)}
        </div>
      ) : null}

      {/* Upload area */}
      <ReceiptUpload transactionId={transactionId} onUploaded={load} />

      {/* Preview modal */}
      {previewUrl ? (
        <ReceiptPreview url={previewUrl} onClose={() => setPreviewUrl(null)} />
      ) : null}
    </div>
  );
}
