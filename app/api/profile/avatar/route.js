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
    const file = formData.get('avatar');
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const filename = `avatars/user_${session.user.id}_${Date.now()}.${ext}`;
    const blob = await put(filename, file, { access: 'public' });

    const [user] = await sql`
      UPDATE users SET avatar_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${session.user.id}
      RETURNING id, username, email, role, avatar_url
    `;
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
