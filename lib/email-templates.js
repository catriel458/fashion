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
      <p class="header-title">TnB</p>
      <p class="header-sub">Try & Buy</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© TnB - Try & Buy | tnbappstore@gmail.com</div>
  </div>
</body>
</html>`;

export function emailVerification({ username, verificationUrl, storeName }) {
  const store = storeName ? ` en <strong>${storeName}</strong>` : '';
  return {
    subject: 'Confirmá tu cuenta en TnB',
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
    subject: '¡Bienvenido/a a TnB! Confirmá tu cuenta',
    html: base(`
      <h2>¡Bienvenido/a a TnB, ${username}!</h2>
      <p>Nos alegra que estés acá. TnB es tu espacio para descubrir tiendas, explorar outfits y usar el probador virtual de ropa.</p>
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
    subject: 'Recuperar contraseña - TnB',
    html: base(`
      <h2>Recuperar contraseña</h2>
      <p>Hola <strong>${username}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en TnB.</p>
      <div style="text-align:center;">
        <a href="${resetUrl}" class="btn">Restablecer contraseña</a>
      </div>
      <p class="note">Este link expira en 1 hora. Si no solicitaste esto, podés ignorar este mail — tu contraseña no cambiará.</p>
    `),
  };
}

export function orderConfirmed({ username, orderId, storeName, items, total, pickupPointName }) {
  const rows = (items || []).map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;">${i.name || i.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;text-align:right;">$${Number(i.price || i.price_at_purchase).toFixed(2)}</td>
    </tr>
  `).join('');

  const pickupRow = pickupPointName
    ? `<p style="margin:12px 0 0;padding:10px 12px;background:#f0fdf4;border-radius:4px;font-size:0.82rem;">
        📍 <strong>Punto de retiro:</strong> ${pickupPointName}
       </p>`
    : '';

  return {
    subject: `¡Pedido #${orderId} recibido! — ${storeName}`,
    html: base(`
      <div style="text-align:center;padding:8px 0 20px;">
        <div style="font-size:2.5rem;">🛍️</div>
        <h2 style="margin:10px 0 4px;">¡Pedido recibido!</h2>
        <p style="color:#6b6560;margin:0;">Estamos preparando tu pedido</p>
      </div>
      <p>Hola <strong>${username}</strong>, recibimos tu pedido <strong>#${orderId}</strong> en <strong>${storeName}</strong> y ya lo estamos preparando.</p>
      <p>El local se pondrá en contacto con vos a la brevedad para coordinar la entrega.</p>
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
      ${pickupRow}
      <p class="note">Podés seguir el estado de tu pedido desde tu perfil en TnB.</p>
    `),
  };
}

export function orderStatusUpdate({ username, orderId, status, storeName }) {
  const statusConfig = {
    pago_recibido:         { icon: '🎉', label: 'Pago exitoso',         msg: `Tu pago fue confirmado con éxito. ${storeName} está preparando tu pedido.` },
    preparando_pedido:     { icon: '📦', label: 'Preparando pedido',     msg: `${storeName} está preparando tu pedido.` },
    en_camino:             { icon: '🚚', label: 'En camino',             msg: `Tu pedido de ${storeName} está en camino hacia tu domicilio.` },
    listo_para_retirar:    { icon: '🛍️', label: 'Listo para retirar',    msg: `Tu pedido está listo en ${storeName}. ¡Ya podés pasar a retirarlo!` },
    entregado:             { icon: '✅', label: 'Entregado',             msg: '¡Tu pedido fue entregado! Muchas gracias por tu compra.' },
    cancelado:             { icon: '❌', label: 'Cancelado',             msg: `Tu pedido fue cancelado por ${storeName}. Si tenés dudas, contactate con la tienda.` },
    // Legacy fallbacks
    confirmed: { icon: '🎉', label: 'Confirmado',         msg: `${storeName} confirmó tu pedido. Coordiná el retiro por WhatsApp.` },
    ready:     { icon: '📦', label: 'Listo para retirar', msg: `Tu pedido está listo en ${storeName}. ¡Podés pasar a retirarlo!` },
    delivered: { icon: '✅', label: 'Vendido',            msg: '¡Gracias por tu compra! Esperamos verte pronto.' },
    cancelled: { icon: '❌', label: 'Cancelado',          msg: `Tu pedido fue cancelado por ${storeName}. Si tenés dudas, contactate con la tienda.` },
  };
  const cfg = statusConfig[status] || { icon: 'ℹ️', label: status, msg: '' };

  return {
    subject: `Tu pedido #${orderId} - ${cfg.label}`,
    html: base(`
      <div style="text-align:center;padding:8px 0 20px;">
        <div style="font-size:2.5rem;">${cfg.icon}</div>
        <h2 style="margin:12px 0 8px;">Pedido #${orderId} — ${cfg.label}</h2>
      </div>
      <p>Hola <strong>${username}</strong>,</p>
      <p>${cfg.msg}</p>
      <p class="note">Podés seguir el estado de tus pedidos desde tu perfil en TnB.</p>
    `),
  };
}

export function orderConfirmedBuyer({
  username, orderId, orderNumber, storeName, storePhone, storeAddress,
  items, subtotal, deliveryCost, total,
  deliveryMethod, pickupPointName, deliveryAddress, paymentMethod,
}) {
  const rows = (items || []).map((i, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#fff' : '#f9f8f7'};">
      <td style="padding:9px 12px;border-bottom:1px solid #f0ede8;font-size:0.8rem;">
        ${i.name || i.product_name}
        ${i.size ? `<span style="font-size:0.75rem;color:#6b6560;background:#f0ede8;padding:2px 6px;border-radius:3px;margin-left:6px">Talle: ${i.size}</span>` : ''}
        ${i.color ? `<span style="font-size:0.75rem;color:#6b6560;background:#f0ede8;padding:2px 6px;border-radius:3px;margin-left:6px">Color: ${i.color}</span>` : ''}
      </td>
      <td style="padding:9px 12px;border-bottom:1px solid #f0ede8;text-align:center;font-size:0.8rem;">${i.quantity}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #f0ede8;text-align:right;font-size:0.8rem;">$${Number(i.price || i.price_at_purchase).toFixed(2)}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #f0ede8;text-align:right;font-size:0.8rem;font-weight:600;">$${(Number(i.price || i.price_at_purchase) * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const methodLabel = paymentMethod === 'mp' ? 'Mercado Pago' : paymentMethod === 'transfer' ? 'Transferencia bancaria' : 'WhatsApp';

  const deliverySection = deliveryMethod === 'delivery'
    ? `<tr><td colspan="2" style="padding:8px 12px;font-size:0.78rem;color:#6b6560;">Envío a domicilio</td><td style="padding:8px 12px;text-align:right;font-size:0.78rem;">$${Number(deliveryCost || 0).toFixed(2)}</td></tr>`
    : '';

  const entregaCard = deliveryMethod === 'delivery'
    ? `<p style="margin:12px 0 0;padding:10px 12px;background:#e8f0fe;border-radius:4px;font-size:0.82rem;">
        🚚 <strong>Envío a domicilio:</strong> ${deliveryAddress || ''}
       </p>`
    : (pickupPointName
        ? `<p style="margin:12px 0 0;padding:10px 12px;background:#f0fdf4;border-radius:4px;font-size:0.82rem;">
            📍 <strong>Punto de retiro:</strong> ${pickupPointName}
           </p>`
        : '');

  const storeInfoRows = [
    storePhone   ? `<tr><td style="padding:3px 0;font-size:0.78rem;color:#6b6560;">Teléfono:</td><td style="padding:3px 0 3px 12px;font-size:0.78rem;">${storePhone}</td></tr>` : '',
    storeAddress ? `<tr><td style="padding:3px 0;font-size:0.78rem;color:#6b6560;">Dirección:</td><td style="padding:3px 0 3px 12px;font-size:0.78rem;">${storeAddress}</td></tr>` : '',
  ].join('');

  return {
    subject: `Pedido ${orderNumber} confirmado ✓ — ${storeName}`,
    html: base(`
      <div style="text-align:center;padding:8px 0 20px;">
        <div style="font-size:2.5rem;">✓</div>
        <h2 style="margin:10px 0 4px;color:#2e7d32;">¡Tu pedido está confirmado!</h2>
        <p style="color:#6b6560;margin:0;font-size:0.875rem;">Estamos preparando tu compra</p>
      </div>

      <p>Hola <strong>${username}</strong>, recibimos tu pedido <strong>${orderNumber}</strong> en <strong>${storeName}</strong>.</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.8rem;">
        <thead>
          <tr style="background:#f5f3f0;">
            <th style="padding:8px 12px;text-align:left;font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;font-weight:400;">Producto</th>
            <th style="padding:8px 12px;text-align:center;font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;font-weight:400;">Cant.</th>
            <th style="padding:8px 12px;text-align:right;font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;font-weight:400;">Precio</th>
            <th style="padding:8px 12px;text-align:right;font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;font-weight:400;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="3" style="padding:8px 12px;text-align:right;font-size:0.75rem;color:#6b6560;">Subtotal:</td><td style="padding:8px 12px;text-align:right;font-size:0.8rem;">$${Number(subtotal).toFixed(2)}</td></tr>
          ${deliverySection}
          <tr style="border-top:2px solid #0f0f0f;">
            <td colspan="3" style="padding:10px 12px;text-align:right;font-weight:bold;font-size:0.85rem;">Total:</td>
            <td style="padding:10px 12px;text-align:right;font-weight:bold;font-size:1rem;">$${Number(total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${entregaCard}

      <p style="margin:12px 0 0;padding:10px 12px;background:#f5f3f0;border-radius:4px;font-size:0.82rem;">
        💳 <strong>Método de pago:</strong> ${methodLabel}
      </p>

      ${storeInfoRows ? `
      <div style="margin-top:20px;padding:14px 16px;background:#f5f3f0;border-radius:4px;">
        <p style="font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;margin:0 0 8px;">Datos del local</p>
        <table><tbody>${storeInfoRows}</tbody></table>
      </div>` : ''}

      <p class="note">Podés seguir el estado de tu pedido desde tu perfil en TnB.</p>
    `),
  };
}

export function orderNotificationStore({
  orderId, orderNumber, storeName,
  buyerName, buyerEmail,
  items, subtotal, deliveryCost, total,
  deliveryMethod, pickupPointName, deliveryAddress, paymentMethod,
}) {
  const rows = (items || []).map((i, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#fff' : '#f9f8f7'};">
      <td style="padding:9px 12px;border-bottom:1px solid #f0ede8;font-size:0.8rem;">
        ${i.name || i.product_name}
        ${i.size ? `<span style="font-size:0.75rem;color:#6b6560;background:#f0ede8;padding:2px 6px;border-radius:3px;margin-left:6px">Talle: ${i.size}</span>` : ''}
        ${i.color ? `<span style="font-size:0.75rem;color:#6b6560;background:#f0ede8;padding:2px 6px;border-radius:3px;margin-left:6px">Color: ${i.color}</span>` : ''}
      </td>
      <td style="padding:9px 12px;border-bottom:1px solid #f0ede8;text-align:center;font-size:0.8rem;">${i.quantity}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #f0ede8;text-align:right;font-size:0.8rem;">$${Number(i.price || i.price_at_purchase).toFixed(2)}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #f0ede8;text-align:right;font-size:0.8rem;font-weight:600;">$${(Number(i.price || i.price_at_purchase) * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const methodLabel = paymentMethod === 'mp' ? 'Mercado Pago' : paymentMethod === 'transfer' ? 'Transferencia bancaria' : 'WhatsApp';

  const entregaText = deliveryMethod === 'delivery'
    ? `🚚 Envío a domicilio: ${deliveryAddress || ''}`
    : (pickupPointName ? `📍 Retiro en: ${pickupPointName}` : '📍 Retiro en local');

  const deliveryRow = deliveryMethod === 'delivery' && deliveryCost > 0
    ? `<tr><td colspan="2" style="padding:8px 12px;font-size:0.78rem;color:#6b6560;">Envío</td><td style="padding:8px 12px;text-align:right;font-size:0.78rem;">$${Number(deliveryCost).toFixed(2)}</td></tr>`
    : '';

  return {
    subject: `Nueva venta — Pedido ${orderNumber} | ${storeName}`,
    html: base(`
      <div style="text-align:center;padding:8px 0 20px;">
        <div style="font-size:2.5rem;">🛍️</div>
        <h2 style="margin:10px 0 4px;">¡Tenés una nueva venta!</h2>
        <p style="color:#6b6560;margin:0;font-size:0.875rem;">Pedido ${orderNumber}</p>
      </div>

      <div style="padding:14px 16px;background:#f5f3f0;border-radius:4px;margin-bottom:16px;">
        <p style="font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;margin:0 0 6px;">Comprador</p>
        <p style="font-size:0.875rem;margin:0;font-weight:500;">${buyerName}</p>
        <p style="font-size:0.8rem;color:#6b6560;margin:2px 0 0;">${buyerEmail}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:0.8rem;">
        <thead>
          <tr style="background:#f5f3f0;">
            <th style="padding:8px 12px;text-align:left;font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;font-weight:400;">Producto</th>
            <th style="padding:8px 12px;text-align:center;font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;font-weight:400;">Cant.</th>
            <th style="padding:8px 12px;text-align:right;font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;font-weight:400;">Precio</th>
            <th style="padding:8px 12px;text-align:right;font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b6560;font-weight:400;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="3" style="padding:8px 12px;text-align:right;font-size:0.75rem;color:#6b6560;">Subtotal:</td><td style="padding:8px 12px;text-align:right;font-size:0.8rem;">$${Number(subtotal).toFixed(2)}</td></tr>
          ${deliveryRow}
          <tr style="border-top:2px solid #0f0f0f;">
            <td colspan="3" style="padding:10px 12px;text-align:right;font-weight:bold;font-size:0.85rem;">Total:</td>
            <td style="padding:10px 12px;text-align:right;font-weight:bold;font-size:1rem;">$${Number(total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin:0 0 8px;padding:10px 12px;background:#f0fdf4;border-radius:4px;font-size:0.82rem;">${entregaText}</p>
      <p style="margin:0;padding:10px 12px;background:#f5f3f0;border-radius:4px;font-size:0.82rem;">💳 <strong>Método de pago:</strong> ${methodLabel}</p>

      <p class="note">Gestioná este pedido desde tu panel de administración en TnB.</p>
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

export function welcomeCoupon({ username, couponCode, storeName }) {
  return {
    subject: `Bienvenido/a a ${storeName}! Tenes 10% de descuento`,
    html: base(`
      <div style="text-align:center;padding:8px 0 24px;">
        <div style="font-size:3rem;">✨</div>
        <h2 style="font-size:1.6rem;margin:8px 0 4px;">¡Te damos la bienvenida, ${username}!</h2>
        <p style="color:#6b6560;">Gracias por registrarte en <strong>${storeName}</strong></p>
      </div>
      <div style="background:#f5f3f0;border:2px dashed #e0dbd4;border-radius:6px;padding:24px;text-align:center;margin:16px 0;">
        <p style="font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#6b6560;margin:0 0 8px;">Tu cupón de bienvenida</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.15em;color:#0f0f0f;font-family:monospace;">${couponCode}</div>
        <p style="font-size:1.1rem;color:#0f0f0f;margin:8px 0 0;"><strong>10% de descuento</strong></p>
      </div>
      <p style="text-align:center;font-size:0.78rem;color:#888;">Válido por 30 días. Usá este código al momento de pagar.</p>
      <div style="text-align:center;margin-top:20px;">
        <a href="${process.env.NEXTAUTH_URL || ''}" class="btn">Ir a la tienda</a>
      </div>
    `),
  };
}

export function referralWelcomeCoupon({ username, couponCode, discountPercentage, storeName, storeSlug, expiresAt }) {
  const expDate = new Date(expiresAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  const storeUrl = `${process.env.NEXTAUTH_URL || ''}/store/${storeSlug}`;
  return {
    subject: `¡Tu cupón de descuento está listo! — ${storeName}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; color: #f5f0eb; font-family: Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; overflow: hidden; }
    .body { padding: 32px; color: #f5f0eb; }
    .btn { display: inline-block; padding: 13px 28px; background: #8B2635; color: #ffffff !important; text-decoration: none; border-radius: 2px; font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; margin: 20px 0; font-weight: bold; }
    .coupon { font-size: 2rem; color: #8B2635; letter-spacing: 0.15em; font-weight: bold; text-align: center; margin: 24px 0; font-family: monospace; }
    .footer { background: #0a0a0a; padding: 16px 32px; text-align: center; font-size: 0.65rem; color: #6b6560; border-top: 1px solid #333; }
    h2 { font-size: 1.3rem; font-weight: 300; margin: 0 0 16px; color: #f5f0eb; }
    p { line-height: 1.6; color: #c8c3bc; font-size: 0.875rem; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="body">
      <h2>Hola ${username},</h2>
      <p>Tu cuenta fue activada. Como prometimos, acá tenés tu cupón exclusivo:</p>
      <div class="coupon">${couponCode}</div>
      <p style="text-align: center; font-size: 1.1rem; color: #f5f0eb;"><strong>${discountPercentage}% de descuento</strong> — válido hasta el ${expDate}</p>
      <div style="text-align: center;">
        <a href="${storeUrl}" class="btn">Ir a la tienda</a>
      </div>
    </div>
    <div class="footer">Cupón válido para una sola compra.</div>
  </div>
</body>
</html>
    `,
  };
}

