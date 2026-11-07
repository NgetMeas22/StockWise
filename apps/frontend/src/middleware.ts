import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname starts with supported locale prefixes (/en or /kh)
  if (pathname.startsWith('/en') || pathname.startsWith('/kh')) {
    const isEnglish = pathname.startsWith('/en');
    const lang = isEnglish ? 'en' : 'kh';
    
    // Calculate rewritten path without locale prefix
    let targetPath = pathname.replace(/^\/(en|kh)/, '');
    if (!targetPath || targetPath === '') {
      targetPath = '/';
    }

    const rewriteUrl = new URL(targetPath + request.nextUrl.search, request.url);
    const response = NextResponse.rewrite(rewriteUrl);
    
    // Attach language cookie and header
    response.cookies.set('stockwise_lang', lang, { path: '/' });
    response.headers.set('x-stockwise-lang', lang);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match /en, /kh, and any subpaths except static files and api
    '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
  ],
};
