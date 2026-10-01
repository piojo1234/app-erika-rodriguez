import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('URL requerida', { status: 400 });
  }

  try {
    // 1. Resolver firma de Erika localmente si coincide con la firma oficial
    if (imageUrl.includes('Diseno-sin-titulo') || imageUrl.includes('firma-erika')) {
      const filePath = path.join(process.cwd(), 'public', 'firma-erika.png');
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const dataUri = `data:image/png;base64,${fileBuffer.toString('base64')}`;
        return NextResponse.json({ dataUri });
      }
    }

    // 2. Resolver logo oficial de Erika localmente
    if (imageUrl.includes('logo-erika')) {
      const filePath = path.join(process.cwd(), 'public', 'logo-erika.png');
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const dataUri = `data:image/png;base64,${fileBuffer.toString('base64')}`;
        return NextResponse.json({ dataUri });
      }
    }

    // 3. Si es una ruta relativa local en /public/
    if (imageUrl.startsWith('/')) {
      const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      const filePath = path.join(process.cwd(), 'public', cleanPath);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).replace('.', '') || 'png';
        const dataUri = `data:image/${ext};base64,${fileBuffer.toString('base64')}`;
        return NextResponse.json({ dataUri });
      }
    }

    if (imageUrl.includes('firmas-contratos')) {
      const parts = imageUrl.split('firmas-contratos/');
      const nombreArchivo = parts[parts.length - 1];

      const { data, error } = await supabaseServer.storage
        .from('firmas-contratos')
        .download(nombreArchivo);

      if (error || !data) {
        throw new Error(error?.message || 'Error al descargar el archivo con Supabase SDK');
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const contentType = data.type || 'image/png';
      const dataUri = `data:${contentType};base64,${base64}`;

      return NextResponse.json({ dataUri });
    } else {
      const response = await fetch(imageUrl);
      const contentType = response.headers.get('content-type') || 'image/png';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUri = `data:${contentType};base64,${base64}`;

      return NextResponse.json({ dataUri });
    }
  } catch (error) {
    console.error('Error in proxy-image:', error);
    return new NextResponse('Error al obtener la imagen', { status: 500 });
  }
}
