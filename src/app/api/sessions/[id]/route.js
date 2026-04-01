import { getSession, getNextMatch, processVote, undoLastMatch, deleteSession } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const session = getSession(id);
  
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Get the CURRENT match
  const match = getNextMatch(session);

  return NextResponse.json({
    session,
    currentMatch: match
  });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  
  if (body.action === 'undo') {
    const success = undoLastMatch(id);
    if (!success) {
      return NextResponse.json({ error: 'Undo not possible' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  const { winner } = body;
  if (!winner) {
    return NextResponse.json({ error: 'Winner not provided' }, { status: 400 });
  }

  const success = processVote(id, winner);

  if (!success) {
    return NextResponse.json({ error: 'Vote processing failed. Match may not exist or invalid winner.' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  deleteSession(id);
  return NextResponse.json({ success: true });
}
