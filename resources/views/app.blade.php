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
                $favicon = '/image/logo/driscolls_mini_d_logo.png';
            }
        @endphp
        <link rel="icon" href="{{ $favicon }}" type="image/png">
        <link rel="apple-touch-icon" href="{{ $favicon }}">

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
