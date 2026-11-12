import { NextResponse } from 'next/server';
import { getDbPool, sql } from '@/lib/db';

// ============================================================================
// STANDALONE ACTION HANDLERS (Outside GET / POST)
// ============================================================================

async function handleLogin(body: { uname?: string; auth?: string }) {
  const { uname, auth } = body;

  if (!uname || !auth) {
    return NextResponse.json(
      { success: false, message: 'Username and password are required' },
      { status: 400 }
    );
  }

  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('uname', sql.VarChar(200), uname.trim())
    .input('auth', sql.VarChar(200), auth)
    .execute('uservalids');

  const user = result.recordset?.[0];

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Invalid username or password' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    success: true,
    user,
  });

  response.cookies.set('aic_session', JSON.stringify(user), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}

async function handleLogout() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
  response.cookies.delete('aic_session');
  return response;
}

// ============================================================================
// ACTION REGISTRY MAPS
// ============================================================================

const POST_ACTIONS: Record<string, (body: any) => Promise<NextResponse>> = {
  LOGIN: handleLogin,
  LOGOUT: handleLogout,
};

// ============================================================================
// NAMED HTTP EXPORTS
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = (body?.action || '').toUpperCase();

    const handler = POST_ACTIONS[action];
    if (!handler) {
      return NextResponse.json(
        { success: false, message: `Invalid POST action: ${action}` },
        { status: 400 }
      );
    }

    return await handler(body);
  } catch (error: any) {
    console.error('POST /api/auth Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Database connection failed' },
      { status: 500 }
    );
  }
}
