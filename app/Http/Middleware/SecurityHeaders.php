<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request and attach OWASP ASVS / NIST compliant security headers.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevenir clickjacking
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Prevenir MIME confusion / sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Filtro XSS para navegadores compatibles
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Política de referrers para evitar fuga de tokens en URL
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Restricción de APIs del navegador invasivas
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

        // Content-Security-Policy restrictivo para embebidos
        $response->headers->set('Content-Security-Policy', "frame-ancestors 'self'");

        // HSTS solo cuando la conexión viaja sobre HTTPS
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }
}
