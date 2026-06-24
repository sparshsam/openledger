"use client";

import { createClient } from "@/lib/supabase/client";

export type ReceiptRecord = {
  id: string;
  user_id: string;
  transaction_id: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  storage_url: string;
  created_at: string;
};

/**
 * Upload a receipt image to Supabase Storage and create a database record.
 */
export async function uploadReceipt(
  transactionId: string,
  file: File,
): Promise<{ ok: true; receipt: ReceiptRecord } | { ok: false; error: string }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Generate a unique file path: user_id/uuid_filename
  const ext = file.name.split(".").pop() || "jpg";
  const fileId = crypto.randomUUID();
  const storagePath = `${user.id}/${fileId}.${ext}`;

  // Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from("openledger-receipts")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { ok: false, error: uploadError.message };

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("openledger-receipts")
    .getPublicUrl(storagePath);

  // Create database record
  const { data: receipt, error: dbError } = await supabase
    .from("openledger_receipts")
    .insert({
      user_id: user.id,
      transaction_id: transactionId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_url: publicUrl,
    })
    .select("*")
    .single();

  if (dbError) {
    // Clean up storage on DB failure
    await supabase.storage.from("openledger-receipts").remove([storagePath]);
    return { ok: false, error: dbError.message };
  }

  return { ok: true, receipt: receipt as ReceiptRecord };
}

/**
 * List all receipts for a transaction.
 */
export async function listReceipts(transactionId: string): Promise<ReceiptRecord[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("openledger_receipts")
    .select("*")
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ReceiptRecord[];
}

/**
 * List all receipts for the current user (across all transactions).
 */
export async function listAllReceipts(): Promise<ReceiptRecord[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("openledger_receipts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as ReceiptRecord[];
}

/**
 * Delete a receipt record and its storage file.
 */
export async function deleteReceipt(
  receiptId: string,
  storageUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();

  // Extract storage path from URL
  const urlObj = new URL(storageUrl);
  const pathParts = urlObj.pathname.split("/");
  // Path format: .../storage/v1/object/public/openledger-receipts/{userId}/{fileId}.ext
  const storagePath = pathParts.slice(pathParts.indexOf("openledger-receipts") + 1).join("/");

  // Delete from Storage
  if (storagePath) {
    await supabase.storage.from("openledger-receipts").remove([storagePath]);
  }

  // Delete database record
  const { error } = await supabase
    .from("openledger_receipts")
    .delete()
    .eq("id", receiptId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
