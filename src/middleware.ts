import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kas_mpk_trenggana_sumapala_secret_jwt_key_2026'
);

const COOKIE_NAME = 'mpk_session_token';

// Routes requiring BENDAHARA role
const BENDAHARA_ONLY_ROUTES = ['/iuran', '/tunggakan'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets & api routes bypass middleware auth check here (API routes handle their own auth responses)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/logo') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let session: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      session = payload;
    } catch {
      session = null;
    }
  }

  // If user is at /login and already logged in, redirect to /dashboard
  if (pathname === '/login' || pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Protected dashboard routes
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based restrictions
  if (BENDAHARA_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (session.role !== 'BENDAHARA') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
