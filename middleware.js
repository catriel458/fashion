import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const UNVERIFIED_BLOCKED = ['/profile', '/admin', '/superadmin'];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith('/superadmin') && token?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Bloquear acceso a rutas sensibles si el email no está verificado
    if (token?.email_verified === false) {
      const blocked = UNVERIFIED_BLOCKED.some(path => pathname.startsWith(path));
      if (blocked) {
        return NextResponse.redirect(new URL('/?unverified=true', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/profile/:path*'],
};
