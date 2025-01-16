import { NextResponse } from 'next/server';
import { pusher } from '@/lib/pusher';

export async function POST(): Promise<NextResponse> {
  try {
    await pusher.trigger('voting-channel', 'session-start', {});
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
  }
}