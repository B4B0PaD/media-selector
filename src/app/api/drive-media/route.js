import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  const token = searchParams.get('token');

  if (!fileId || !token) {
    return NextResponse.json({ error: 'Missing fileId or token' }, { status: 400 });
  }

  const range = request.headers.get('range');
  const requestHeaders = {
    'Authorization': `Bearer ${token}`
  };

  if (range) {
    requestHeaders['Range'] = range;
  }

  try {
    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      method: 'GET',
      headers: requestHeaders
    });

    if (!driveRes.ok) {
      if (driveRes.status === 401) {
        return NextResponse.json({ error: 'Token scaduto o non valido. È necessario ri-autenticarsi.' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Errore nel recupero del file da Google Drive.' }, { status: driveRes.status });
    }

    // Forward the content type to the browser so media streaming works correctly
    const headers = new Headers();
    const contentType = driveRes.headers.get('content-type');
    const contentLength = driveRes.headers.get('content-length');
    const acceptRanges = driveRes.headers.get('accept-ranges');
    const contentRange = driveRes.headers.get('content-range');
    
    if (contentType) headers.set('Content-Type', contentType);
    if (contentLength) headers.set('Content-Length', contentLength);
    if (acceptRanges) headers.set('Accept-Ranges', acceptRanges);
    if (contentRange) headers.set('Content-Range', contentRange);
    
    // For large videos, Next.js handles readable streams out of the box
    return new Response(driveRes.body, {
      status: driveRes.status, // Can be 200 or 206 (Partial Content)
      headers
    });
    
  } catch (error) {
    console.error('Drive API Stream Error:', error);
    return NextResponse.json({ error: 'Errore interno del server durante lo streaming.' }, { status: 500 });
  }
}
