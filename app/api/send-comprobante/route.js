import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import sql from '@/lib/db';
import { put } from '@vercel/blob';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('comprobante');
    const buyerEmail = formData.get('buyerEmail') || session.user.email;
    const storeSlug  = formData.get('storeSlug')  || '';
    const amount     = formData.get('amount')      || '0';

    if (!file) return NextResponse.json({ error: 'No se recibió comprobante' }, { status: 400 });
    if (!buyerEmail) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    const ext = (file.name || 'comprobante').split('.').pop();
    const filename = `comprobantes/user_${session.user.id}_${Date.now()}.${ext}`;
    const blob = await put(filename, file, { access: 'public' });

    let storeEmail = null;
    let storeName  = 'el local';
    if (storeSlug) {
      const [store] = await sql`SELECT name, contact_email FROM stores WHERE slug = ${storeSlug}`.catch(() => []);
      if (store) { storeEmail = store.contact_email; storeName = store.name; }
    }

    const username = session.user.first_name
      ? `${session.user.first_name} ${session.user.last_name || ''}`.trim()
      : (session.user.username || session.user.email);

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f3f0;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:6px;border:1px solid #e0dbd4;overflow:hidden;">
    <div style="background:#0f0f0f;padding:20px 32px;">
      <p style="color:#fff;font-size:1.2rem;letter-spacing:0.08em;margin:0;">CnB</p>
      <p style="color:#6b6560;font-size:0.7rem;letter-spacing:0.16em;margin:2px 0 0;">Choose and Buy</p>
    </div>
    <div style="padding:32px;color:#0f0f0f;">
      <h2 style="font-size:1.2rem;font-weight:400;margin:0 0 16px;">Comprobante de pago</h2>
      <p style="font-size:0.875rem;line-height:1.6;color:#333;margin:8px 0;">
        <strong>${username}</strong> envía su comprobante de transferencia por
        <strong>$${amount}</strong> en <strong>${storeName}</strong>.
      </p>
      <p style="font-size:0.875rem;line-height:1.6;color:#333;margin:8px 0;">
        El comprobante se adjunta a este correo.
      </p>
    </div>
    <div style="background:#f5f3f0;padding:16px 32px;text-align:center;font-size:0.65rem;color:#aaa;border-top:1px solid #e0dbd4;">
      © CnB - Choose and Buy | cnbappstore@gmail.com
    </div>
  </div>
</body></html>`;

    const attachments = [{ filename: file.name || `comprobante.${ext}`, path: blob.url }];
    const subject = `Comprobante de pago — ${storeName}`;

    const recipients = [buyerEmail];
    if (storeEmail && storeEmail !== buyerEmail) recipients.push(storeEmail);

    await Promise.all(recipients.map(to => sendMail({ to, subject, html, attachments })));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
