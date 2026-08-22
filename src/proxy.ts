import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/proxy-image (public proxy for images)
     * - api/contrato/firmado (public webhook/endpoint)
     * - firmar (public signature route)
     * - .*\\.(?:svg|png|jpg|jpeg|gif|webp)$ (static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/proxy-image|api/contrato/firmado|firmar|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
