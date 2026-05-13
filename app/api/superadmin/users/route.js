import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';

async function checkSuperadmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') return null;
  return session;
}

export async function GET(request) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { searchParams } = new URL(request.url);
    const role    = searchParams.get('role');
    const storeId = searchParams.get('store_id');
    const search  = searchParams.get('search');

    let users;
    if (role && storeId && search) {
      users = await sql`
        SELECT u.*, s.name AS store_name, s.slug AS store_slug
        FROM users u LEFT JOIN stores s ON s.id = u.store_id
        WHERE u.role = ${role} AND u.store_id = ${storeId}
          AND (u.username ILIKE ${'%'+search+'%'} OR u.email ILIKE ${'%'+search+'%'})
        ORDER BY u.created_at DESC
      `;
    } else if (role && storeId) {
      users = await sql`
        SELECT u.*, s.name AS store_name, s.slug AS store_slug
        FROM users u LEFT JOIN stores s ON s.id = u.store_id
        WHERE u.role = ${role} AND u.store_id = ${storeId}
        ORDER BY u.created_at DESC
      `;
    } else if (role) {
      users = await sql`
        SELECT u.*, s.name AS store_name, s.slug AS store_slug
        FROM users u LEFT JOIN stores s ON s.id = u.store_id
        WHERE u.role = ${role}
        ORDER BY u.created_at DESC
      `;
    } else if (search) {
      users = await sql`
        SELECT u.*, s.name AS store_name, s.slug AS store_slug
        FROM users u LEFT JOIN stores s ON s.id = u.store_id
        WHERE u.username ILIKE ${'%'+search+'%'} OR u.email ILIKE ${'%'+search+'%'}
        ORDER BY u.created_at DESC
      `;
    } else {
      users = await sql`
        SELECT u.*, s.name AS store_name, s.slug AS store_slug
        FROM users u LEFT JOIN stores s ON s.id = u.store_id
        ORDER BY u.created_at DESC
      `;
    }
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!await checkSuperadmin()) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  try {
    const { username, email, password, role, store_id } = await req.json();
    if (!username || !email || !password) return NextResponse.json({ error: 'username, email y password son requeridos' }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);
    const user = await sql`
      INSERT INTO users (username, email, password_hash, role, store_id)
      VALUES (${username}, ${email}, ${hash}, ${role || 'admin'}, ${store_id || null})
      RETURNING id, username, email, role, store_id, active, created_at
    `;
    return NextResponse.json(user[0], { status: 201 });
  } catch (error) {
    if (error.message.includes('unique')) return NextResponse.json({ error: 'Email o usuario ya existe' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
