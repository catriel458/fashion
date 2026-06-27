import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';

export async function POST(req) {
  try {
    const { name, email, phone, company, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (Nombre, Email y Mensaje)' }, { status: 400 });
    }

    const recipient = process.env.GMAIL_USER;
    if (!recipient) {
      console.warn('GMAIL_USER no está definido en las variables de entorno.');
    }

    const subject = `[TnB Landing] Nueva consulta de ${name}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #2a2a2a; border-radius: 8px; background-color: #0d0d0d; color: #f5f0eb;">
        <h2 style="border-bottom: 2px solid #8B2635; padding-bottom: 12px; font-family: Georgia, serif; color: #f5f0eb; font-weight: normal; margin-top: 0; font-size: 1.5rem; letter-spacing: 0.04em;">
          Nueva Consulta en TnB
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #d4c5b0; width: 140px; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;">Nombre:</td>
            <td style="padding: 8px 0; color: #f5f0eb; font-size: 0.9rem;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #d4c5b0; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;">Email:</td>
            <td style="padding: 8px 0; color: #f5f0eb; font-size: 0.9rem;"><a href="mailto:${email}" style="color: #d4c5b0; text-decoration: underline;">${email}</a></td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #d4c5b0; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;">Teléfono:</td>
            <td style="padding: 8px 0; color: #f5f0eb; font-size: 0.9rem;">${phone}</td>
          </tr>
          ` : ''}
          ${company ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #d4c5b0; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;">Empresa/Tienda:</td>
            <td style="padding: 8px 0; color: #f5f0eb; font-size: 0.9rem;">${company}</td>
          </tr>
          ` : ''}
        </table>
        <div style="margin-top: 28px; padding: 18px; background-color: #161616; border-left: 3px solid #8B2635; border-radius: 4px;">
          <h3 style="margin-top: 0; font-size: 0.75rem; text-transform: uppercase; color: #d4c5b0; letter-spacing: 0.1em; margin-bottom: 8px;">Mensaje:</h3>
          <p style="margin: 0; line-height: 1.6; font-size: 0.92rem; white-space: pre-wrap; color: #f5f0eb;">${message}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #2a2a2a; margin: 28px 0;" />
        <p style="font-size: 0.7rem; color: #d4c5b0; opacity: 0.5; text-align: center; margin: 0; letter-spacing: 0.04em;">
          Este correo fue generado automáticamente desde el formulario de la Landing Page de TnB.
        </p>
      </div>
    `;

    await sendMail({
      to: recipient || 'admin@tryandbuy.com',
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in contact form API:', err);
    return NextResponse.json({ error: 'Ocurrió un error al enviar tu consulta. Inténtalo nuevamente.' }, { status: 500 });
  }
}
