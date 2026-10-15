export const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
export const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export type UploadResult = { secureUrl: string; publicId: string };

export function isAcceptedImage(file: File): { ok: true } | { ok: false; reason: string } {
  if (!file.type.startsWith("image/")) {
    return { ok: false, reason: "That file is not an image. Choose a JPG, PNG, or WebP." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: "Image is over 2 MB. Choose a smaller file." };
  }
  return { ok: true };
}

export function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
    return Promise.reject(new Error("Cloudinary is not configured."));
  }
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_PRESET);
    form.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("Cloudinary rejected the upload."));
        return;
      }
      try {
        const json = JSON.parse(xhr.responseText) as { secure_url?: string; public_id?: string };
        if (!json.secure_url || !json.public_id) {
          reject(new Error("Cloudinary returned an unexpected response."));
          return;
        }
        resolve({ secureUrl: json.secure_url, publicId: json.public_id });
      } catch {
        reject(new Error("Could not parse Cloudinary response."));
      }
    };
    xhr.send(form);
  });
}
