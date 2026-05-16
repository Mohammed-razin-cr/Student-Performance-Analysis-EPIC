// Cloudinary upload utility

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dnmnxxtck';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'epic_notes_uploads';

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
  original_filename: string;
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryResponse> {
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'epic-profiles');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload image');
  }

  return response.json();
}

// Upload raw files (PDF, DOCX, PPTX) — proxied through Next.js server to avoid client-side env/preset issues
export async function uploadRawToCloudinary(file: File): Promise<CloudinaryResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload-note-file', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload file');
  }

  return data;
}

// Get optimized image URL with transformations
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: number;
  } = {}
): string {
  if (!CLOUD_NAME) return '';

  const { width = 200, height = 200, crop = 'fill', quality = 80 } = options;

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_${crop},w_${width},h_${height},q_${quality}/epic-profiles/${publicId}`;
}
