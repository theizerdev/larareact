<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Dynamic Inertia Title --}}
        <title inertia>{{ config('app.name', 'Theizer dev') }}</title>

        {{-- Default SEO Tags --}}
        <meta name="description" content="Portafolio Profesional de Desarrollador Web Full Stack. Construyendo aplicaciones web de alto rendimiento, optimizadas y con un diseño estético de primer nivel." head-key="description">
        <meta name="keywords" content="Theizer Gonzalez, Desarrollador Web, Full Stack Developer, Laravel, React, PHP, JavaScript, Portafolio, Programador, SEO" head-key="keywords">
        <meta name="author" content="Theizer Gonzalez" head-key="author">
        <meta name="robots" content="index, follow" head-key="robots">
        <link rel="canonical" href="{{ url()->current() }}" head-key="canonical">

        @if(env('GOOGLE_SITE_VERIFICATION'))
        <meta name="google-site-verification" content="{{ env('GOOGLE_SITE_VERIFICATION') }}" />
        @endif

        {{-- Open Graph / Facebook --}}
        <meta property="og:type" content="website" head-key="og:type">
        <meta property="og:url" content="{{ url()->current() }}" head-key="og:url">
        <meta property="og:title" content="{{ config('app.name', 'Theizer dev') }}" head-key="og:title">
        <meta property="og:description" content="Portafolio Profesional de Desarrollador Web Full Stack. Construyendo aplicaciones web de alto rendimiento, optimizadas y con un diseño estético de primer nivel." head-key="og:description">
        <meta property="og:image" content="{{ asset('image/logo/larareact_icon.png') }}" head-key="og:image">

        {{-- Twitter --}}
        <meta name="twitter:card" content="summary_large_image" head-key="twitter:card">
        <meta name="twitter:url" content="{{ url()->current() }}" head-key="twitter:url">
        <meta name="twitter:title" content="{{ config('app.name', 'Theizer dev') }}" head-key="twitter:title">
        <meta name="twitter:description" content="Portafolio Profesional de Desarrollador Web Full Stack. Construyendo aplicaciones web de alto rendimiento, optimizadas y con un diseño estético de primer nivel." head-key="twitter:description">
        <meta name="twitter:image" content="{{ asset('image/logo/larareact_icon.png') }}" head-key="twitter:image">

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

        <link rel="icon" href="/image/logo/larareact_icon.png" type="image/png">
        <link rel="apple-touch-icon" href="/image/logo/larareact_icon.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
