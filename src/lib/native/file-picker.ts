// ─── Native File Picker ────────────────────────────────────────────────────
// Uses Capacitor Filesystem for reading files in native mode.
// Falls back to HTML file input in web mode.

export type FilePickerResult = {
  name: string;
  data: string;
  mimeType: string;
  size: number;
} | null;

/**
 * Read a file path using Capacitor Filesystem (for native file access).
 */
export async function readNativeFile(path: string): Promise<string | null> {
  try {
    const { Filesystem } = await import("@capacitor/filesystem");
    const result = await Filesystem.readFile({ path });
    if (typeof result.data === "string") return result.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Pick an image for receipt uploads using Capacitor Camera.
 */
export async function pickImage(): Promise<FilePickerResult> {
  try {
    const { Camera, CameraResultType } = await import("@capacitor/camera");
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      saveToGallery: false,
    });

    // Camera plugin may return base64String from different result types
    const data = (image as unknown as { base64String?: string }).base64String;
    if (!data) return null;

    return {
      name: `receipt-${Date.now()}.jpg`,
      data,
      mimeType: "image/jpeg",
      size: Math.round((data.length * 3) / 4),
    };
  } catch {
    return null;
  }
}
