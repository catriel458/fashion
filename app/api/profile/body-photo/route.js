import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import sql from '@/lib/db';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('body_photo');
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `body-photos/${session.user.id}.${ext}`;
    const blob = await put(filename, file, { access: 'public', allowOverwrite: true });

    await sql`
      UPDATE users SET body_photo_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${session.user.id}
    `;

    return NextResponse.json({ body_photo_url: blob.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const [user] = await sql`SELECT body_photo_url FROM users WHERE id = ${session.user.id}`;
    return NextResponse.json({ body_photo_url: user?.body_photo_url || null });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
