import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dnmnxxtck';
    const uploadPreset = 'epic_notes_uploads'; // dedicated preset

    console.log('[Server] Cloudinary upload → cloud:', cloudName, '| preset:', uploadPreset, '| file:', file.name);

    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('upload_preset', uploadPreset);
    cloudinaryForm.append('folder', 'epic_notes');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: 'POST', body: cloudinaryForm }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[Server] Cloudinary error:', JSON.stringify(data));
      return NextResponse.json({ error: data.error?.message || 'Upload failed' }, { status: 400 });
    }

    console.log('[Server] Cloudinary upload success → url:', data.secure_url);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Server] Upload route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
