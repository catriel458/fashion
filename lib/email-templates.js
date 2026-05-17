const base = (content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f5f3f0; font-family: Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 6px; border: 1px solid #e0dbd4; overflow: hidden; }
    .header { background: #0f0f0f; padding: 20px 32px; }
    .header-title { color: #fff; font-size: 1.2rem; letter-spacing: 0.08em; margin: 0; }
    .header-sub { color: #6b6560; font-size: 0.7rem; letter-spacing: 0.16em; margin: 2px 0 0; }
    .body { padding: 32px; color: #0f0f0f; }
    .btn { display: inline-block; padding: 13px 28px; background: #0f0f0f; color: #fff; text-decoration: none; border-radius: 2px; font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; margin: 20px 0; }
    .footer { background: #f5f3f0; padding: 16px 32px; text-align: center; font-size: 0.65rem; color: #aaa; border-top: 1px solid #e0dbd4; }
    h2 { font-size: 1.3rem; font-weight: 400; margin: 0 0 16px; }
    p { line-height: 1.6; color: #333; font-size: 0.875rem; margin: 8px 0; }
    .note { font-size: 0.75rem; color: #888; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">CnB</p>
      <p class="header-sub">Choose and Buy</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© CnB - Choose and Buy | cnbappstore@gmail.com</div>
  </div>
</body>
</html>`;

export function emailVerification({ username, verificationUrl, storeName }) {
  const store = storeName ? ` en <strong>${storeName}</strong>` : '';
  return {
    subject: 'Confirmá tu cuenta en CnB',
    html: base(`
      <h2>¡Hola, ${username}!</h2>
      <p>Gracias por registrarte${store}. Para activar tu cuenta y acceder a todas las funciones, confirmá tu email haciendo clic en el botón:</p>
      <div style="text-align:center;">
        <a href="${verificationUrl}" class="btn">Confirmar mi cuenta</a>
      </div>
      <p class="note">Este link expira en 24 horas. Si no creaste esta cuenta, podés ignorar este mail.</p>
    `),
  };
}

export function welcomeVerification({ username, verificationUrl }) {
  return {
    subject: '¡Bienvenido/a a CnB! Confirmá tu cuenta',
    html: base(`
      <h2>¡Bienvenido/a a CnB, ${username}!</h2>
      <p>Nos alegra que estés acá. CnB es tu espacio para descubrir tiendas, explorar outfits y usar el probador virtual de ropa.</p>
      <p>Para activar tu cuenta y acceder a todas las funciones, confirmá tu email haciendo clic en el botón:</p>
      <div style="text-align:center;">
        <a href="${verificationUrl}" class="btn">Confirmar mi cuenta</a>
      </div>
      <p class="note">Este link expira en 24 horas. Si no creaste esta cuenta, podés ignorar este mail.</p>
    `),
  };
}

export function passwordReset({ username, resetUrl }) {
  return {
    subject: 'Recuperar contraseña - CnB',
    html: base(`
      <h2>Recuperar contraseña</h2>
      <p>Hola <strong>${username}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en CnB.</p>
      <div style="text-align:center;">
        <a href="${resetUrl}" class="btn">Restablecer contraseña</a>
      </div>
      <p class="note">Este link expira en 1 hora. Si no solicitaste esto, podés ignorar este mail — tu contraseña no cambiará.</p>
    `),
  };
}

export function orderConfirmed({ username, orderId, storeName, items, total }) {
  const rows = (items || []).map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;">${i.name || i.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;text-align:right;">$${Number(i.price).toFixed(2)}</td>
    </tr>
  `).join('');

  return {
    subject: `Tu pedido #${orderId} fue confirmado`,
    html: base(`
      <h2>¡Pedido confirmado!</h2>
      <p>Hola <strong>${username}</strong>, tu pedido <strong>#${orderId}</strong> en <strong>${storeName}</strong> fue confirmado.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.8rem;">
        <thead>
          <tr style="background:#f5f3f0;">
            <th style="padding:8px 12px;text-align:left;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;">Producto</th>
            <th style="padding:8px 12px;text-align:center;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;">Cant.</th>
            <th style="padding:8px 12px;text-align:right;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;">Precio</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:10px 12px;text-align:right;font-weight:bold;font-size:0.8rem;">Total:</td>
            <td style="padding:10px 12px;text-align:right;font-weight:bold;font-size:0.9rem;">$${Number(total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <p class="note">Podés seguir el estado de tu pedido desde tu perfil.</p>
    `),
  };
}

export function birthdayCoupon({ username, couponCode, discountPercentage, storeName, expiresAt }) {
  const expDate = new Date(expiresAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  return {
    subject: `¡Feliz cumpleaños! Tu descuento especial de ${storeName}`,
    html: base(`
      <div style="text-align:center;padding:8px 0 24px;">
        <div style="font-size:3rem;">🎂</div>
        <h2 style="font-size:1.6rem;margin:8px 0 4px;">¡Feliz cumpleaños, ${username}!</h2>
        <p style="color:#6b6560;">Un regalo de <strong>${storeName}</strong> para vos</p>
      </div>
      <div style="background:#f5f3f0;border:2px dashed #e0dbd4;border-radius:6px;padding:24px;text-align:center;margin:16px 0;">
        <p style="font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#6b6560;margin:0 0 8px;">Tu cupón de descuento</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.15em;color:#0f0f0f;font-family:monospace;">${couponCode}</div>
        <p style="font-size:1.1rem;color:#0f0f0f;margin:8px 0 0;"><strong>${discountPercentage}% de descuento</strong></p>
      </div>
      <p style="text-align:center;font-size:0.78rem;color:#888;">Válido hasta el ${expDate}. Usalo al finalizar tu compra en ${storeName}.</p>
    `),
  };
}
