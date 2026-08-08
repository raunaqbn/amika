import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { persistImageBytes } from '@/lib/media-storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/upload - Store an image in the project's private Vercel Blob store.
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 4MB to stay within Vercel limits)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `Image is too large (${sizeMB}MB). Please use an image smaller than 4MB.` },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const reference = await persistImageBytes(Buffer.from(bytes), file.type, {
      ownerId: userId,
      kind: 'upload',
    });

    return NextResponse.json(
      { url: reference },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    );
  }
}
