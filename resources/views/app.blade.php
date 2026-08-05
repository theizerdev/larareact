<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- SEO Meta Tags -->
        <title>{{ config('app.name', 'SERVITEC') }} | Sistema de Punto de Venta, Inventario y Servicio Técnico</title>
        <meta name="title" content="{{ config('app.name', 'SERVITEC') }} | Sistema de Punto de Venta, Inventario y Servicio Técnico">
        <meta name="description" content="SERVITEC es el sistema integral de Punto de Venta (POS), Control de Inventario, Gestión de Servicio Técnico, Facturación y Automatización WhatsApp para empresas y talleres.">
        <meta name="keywords" content="SERVITEC, FixSale, punto de venta, POS, control de inventario, servicio tecnico, gestion de talleres, facturacion, automatizacion whatsapp, software de ventas, administracion de negocios">
        <meta name="author" content="SERVITEC">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
        <meta name="googlebot" content="index, follow">
        <meta name="theme-color" content="#0f172a">
        <link rel="canonical" href="{{ url()->current() }}">

        <!-- Open Graph / Facebook / WhatsApp -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:site_name" content="{{ config('app.name', 'SERVITEC') }}">
        <meta property="og:title" content="{{ config('app.name', 'SERVITEC') }} | Sistema de Punto de Venta, Inventario y Servicio Técnico">
        <meta property="og:description" content="Gestión inteligente de ventas, inventario, órdenes de servicio técnico y automatización por WhatsApp para tu empresa.">
        <meta property="og:image" content="{{ url('/image/logo/2.png') }}">
        <meta property="og:image:alt" content="SERVITEC Logo">
        <meta property="og:locale" content="{{ str_replace('_', '-', app()->getLocale()) == 'es' ? 'es_ES' : 'en_US' }}">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ url()->current() }}">
        <meta name="twitter:title" content="{{ config('app.name', 'SERVITEC') }} | Sistema de Punto de Venta, Inventario y Servicio Técnico">
        <meta name="twitter:description" content="Gestión inteligente de ventas, inventario, órdenes de servicio técnico y automatización por WhatsApp para tu empresa.">
        <meta name="twitter:image" content="{{ url('/image/logo/2.png') }}">

        <!-- Structured Data (JSON-LD) for Google -->
        <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'WebApplication',
            'name' => config('app.name', 'SERVITEC'),
            'url' => url('/'),
            'applicationCategory' => 'BusinessApplication',
            'operatingSystem' => 'All',
            'description' => 'Sistema integral de Punto de Venta, Control de Inventario, Gestión de Servicio Técnico y Automatización por WhatsApp.',
            'offers' => [
                '@type' => 'Offer',
                'price' => '0',
                'priceCurrency' => 'USD',
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) !!}
        </script>

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        @php
            $favicon = null;
            if (auth()->check() && auth()->user()->empresa && auth()->user()->empresa->logo_mini) {
                $favicon = auth()->user()->empresa->logo_mini;
            } else {
                $route = request()->route();
                if ($route && ($route->getName() === 'preregistro.wizard' || $route->getName() === 'preregistro.submit' || request()->is('preregistro/*'))) {
                    $token = $route->parameter('token') ?? request()->segment(2);
                    if ($token) {
                        $preRegistro = \App\Models\ProveedorPreRegistro::where('token', $token)->first();
                        if ($preRegistro && $preRegistro->empresa && $preRegistro->empresa->logo_mini) {
                            $favicon = $preRegistro->empresa->logo_mini;
                        }
                    }
                }
            }
            if (!$favicon) {
                $favicon = '/image/logo/2.png';
            }
        @endphp
        <link rel="icon" href="{{ $favicon }}" type="image/png">
        <link rel="apple-touch-icon" href="{{ $favicon }}">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
