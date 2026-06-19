import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { createNotification } from '@/lib/notify';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;
    const formData = await request.formData();

    const existing = await sql`SELECT * FROM products WHERE id = ${id}`;
    if (!existing.length) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    const prev = existing[0];

    const name        = formData.get('name')        ?? prev.name;
    const description = formData.get('description') ?? prev.description;
    const price       = formData.get('price')       != null ? parseFloat(formData.get('price'))  : prev.price;
    const stock       = formData.get('stock')       != null ? parseInt(formData.get('stock'))    : prev.stock;
    const activeRaw   = formData.get('active');
    const active      = activeRaw != null ? activeRaw === 'true' : prev.active;
    const colors      = formData.get('colors') !== null ? (formData.get('colors') || null) : prev.colors;

    const rawCatId   = formData.get('category_id');
    const categoryId = rawCatId != null
      ? (rawCatId === '' ? null : parseInt(rawCatId))
      : prev.category_id;

    // Retained images
    const retainedImagesRaw = formData.get('retained_images');
    let retainedImages = prev.image_urls || (prev.image_url ? [prev.image_url] : []);
    if (retainedImagesRaw != null) {
      try {
        retainedImages = JSON.parse(retainedImagesRaw);
      } catch {}
    }

    const oldImages = prev.image_urls || (prev.image_url ? [prev.image_url] : []);
    const imagesToDelete = oldImages.filter(url => !retainedImages.includes(url));

    // Upload new images
    const newImagesUrls = [];
    const imageFiles = formData.getAll('images');
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const blob = await put(`products/${Date.now()}-${file.name}`, file, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        newImagesUrls.push(blob.url);
      }
    }

    // Legacy file input fallback
    const legacyImage = formData.get('image');
    if (legacyImage && legacyImage.size > 0) {
      const blob = await put(`products/${Date.now()}-${legacyImage.name}`, legacyImage, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      newImagesUrls.push(blob.url);
    }

    const combinedImageUrls = [...retainedImages, ...newImagesUrls];
    const primaryImageUrl = combinedImageUrls[0] || null;

    const [product] = await sql`
      UPDATE products
      SET
        name        = ${name},
        category_id = ${categoryId},
        description = ${description},
        price       = ${price},
        stock       = ${stock},
        active      = ${active},
        image_url   = ${primaryImageUrl},
        image_urls  = ${combinedImageUrls},
        colors      = ${colors},
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Async clean up deleted images from Blob storage
    for (const imgUrl of imagesToDelete) {
      try { await del(imgUrl, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    // Notificar stock bajo al admin de la tienda
    if (stock <= 5 && prev.stock > 5 && product.store_id && session) {
      const adminId = session.user.role === 'admin' ? session.user.id : null;
      if (adminId) {
        await createNotification({
          userId:  adminId,
          storeId: product.store_id,
          type:    'low_stock',
          title:   `Stock bajo: ${name}`,
          message: `${name} tiene solo ${stock} unidad${stock === 1 ? '' : 'es'} en stock`,
          link:    '/admin/products',
        });
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const existing = await sql`SELECT image_url, image_urls FROM products WHERE id = ${id}`;
    if (!existing.length) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    const { image_url: imageUrl, image_urls: imageUrls } = existing[0];
    await sql`DELETE FROM products WHERE id = ${id}`;

    const allUrls = imageUrls && imageUrls.length > 0
      ? imageUrls
      : (imageUrl ? [imageUrl] : []);

    for (const url of allUrls) {
      if (url) {
        try { await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
