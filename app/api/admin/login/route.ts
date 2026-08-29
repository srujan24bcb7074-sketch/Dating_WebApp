import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();

    if (!passcode) {
      return NextResponse.json(
        { success: false, error: 'Please enter staff passcode' },
        { status: 400 }
      );
    }

    const expectedPasscode = process.env.ADMIN_PASSCODE || 'admin123';

    if (passcode !== expectedPasscode) {
      return NextResponse.json(
        { success: false, error: 'Invalid staff passcode' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
