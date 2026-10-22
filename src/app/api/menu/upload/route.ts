import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { isR2Configured, sniffImageType, uploadMenuImage } from '@/lib/r2';

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access forbidden: Super Admin required' }, { status: 403 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Photo upload is not set up yet. Add the R2_* settings to the server environment.' },
        { status: 503 }
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Photo must be 2 MB or smaller' }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type) {
      return NextResponse.json({ error: 'Only JPEG, PNG or WebP photos are allowed' }, { status: 400 });
    }

    const url = await uploadMenuImage(bytes, type);
    return NextResponse.json({ success: true, url }, { status: 201 });
  } catch (error: any) {
    console.error('Menu image upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
