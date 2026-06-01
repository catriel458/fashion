import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const filename = `comprobantes/user_${session.user.id}_${Date.now()}.${ext}`;
    const blob = await put(filename, file, { access: 'public' });

    return NextResponse.json({ url: blob.url, name: file.name });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
