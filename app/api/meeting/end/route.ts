import { NextRequest, NextResponse } from 'next/server';

const endedMeetings = new Map<string, boolean>();

export async function POST(request: NextRequest) {
  try {
    const { channelName, role } = await request.json();
    
    if (role === 'doctor') {
      endedMeetings.set(channelName, true);
      
      // Auto-cleanup after 30 seconds
      setTimeout(() => {
        endedMeetings.delete(channelName);
      }, 30000);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to end meeting' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const channel = request.nextUrl.searchParams.get('channel');
    
    if (!channel) {
      return NextResponse.json({ error: 'Channel required' }, { status: 400 });
    }
    
    const ended = endedMeetings.get(channel) || false;
    
    return NextResponse.json({ ended });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check meeting status' }, { status: 500 });
  }
}
