<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

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
            $favicon = '/image/logo/shigoto/favicon.svg';
            $ogDescription = 'Sistema integral de marcaje de jornada laboral para México: entradas, salidas, descansos, comidas y tiempos extra con biometría. Alta de proveedores y socios de negocio, ITSM, inventarios y mensajería por WhatsApp.';
        @endphp
        <link rel="icon" href="{{ $favicon }}" type="image/svg+xml">
        <link rel="alternate icon" href="/image/logo/shigoto/favicon.png" type="image/png">
        <link rel="apple-touch-icon" href="/image/logo/shigoto/apple-touch-icon.png">

        {{-- Server-rendered title/description/Open Graph so link previews on
             redes sociales y correo (que no ejecutan JS) siempre encuentren
             estas etiquetas — la app es 100% client-rendered (sin SSR), por
             lo que nada de esto puede depender de React/Inertia. --}}
        <title>Shigoto by Innovación Móvil</title>
        <meta name="description" content="{{ $ogDescription }}">
        <meta property="og:site_name" content="Shigoto">
        <meta property="og:title" content="Shigoto by Innovación Móvil">
        <meta property="og:description" content="{{ $ogDescription }}">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:image" content="{{ url('/image/logo/shigoto/og-image.png') }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="Shigoto — sistema de marcaje de jornada laboral">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="Shigoto by Innovación Móvil">
        <meta name="twitter:description" content="{{ $ogDescription }}">
        <meta name="twitter:image" content="{{ url('/image/logo/shigoto/og-image.png') }}">

        @if(request()->is('admin/reloj-checador/kiosko*'))
        {{-- PWA Kiosko --}}
        <link rel="manifest" href="/pwa/manifest.json">
        <meta name="theme-color" content="#1a5c38">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Kiosko Checador">
        @endif

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
