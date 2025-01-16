import { NextResponse } from 'next/server';
import { pusher } from '@/lib/pusher';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const data = await req.json();
    await pusher.trigger('voting-channel', 'sync-state', data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to sync state' }, { status: 500 });
  }
}