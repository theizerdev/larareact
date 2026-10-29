{{--
    Vuelta a la app móvil tras el inicio de sesión con Microsoft. Un 302
    directo a com.smurfit.app:// no basta: Chrome no abre una app desde una
    redirección que no siguió a un toque de la persona y se queda en blanco.
    Se intenta volver solo y, si el navegador lo bloquea, queda el botón.
--}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Volver a la app</title>
    <style>
        :root { color-scheme: light dark; --fondo: #f8fafc; --texto: #0f172a; --tenue: #64748b; --borde: #e2e8f0; --error: #b91c1c; }
        @media (prefers-color-scheme: dark) {
            :root { --fondo: #0f172a; --texto: #f1f5f9; --tenue: #94a3b8; --borde: #334155; --error: #f87171; }
        }
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
               background: var(--fondo); color: var(--texto); font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
        main { max-width: 360px; padding: 32px 24px; text-align: center; }
        h1 { font-size: 18px; margin: 0 0 12px; }
        p { font-size: 14px; line-height: 1.5; color: var(--tenue); margin: 0 0 24px; }
        p.error { color: var(--error); }
        a.boton { display: block; padding: 14px; border-radius: 10px; background: #0f766e; color: #fff;
                  font-weight: 600; text-decoration: none; }
    </style>
</head>
<body>
    <main>
        @if ($error)
            <h1>No se pudo iniciar sesión</h1>
            <p class="error">{{ $error }}</p>
        @else
            <h1>Sesión iniciada</h1>
            <p>Regresando a la app…</p>
        @endif
        <a class="boton" href="{{ $url }}">Volver a la app</a>
    </main>
    <script>
        window.location.replace(@json($url));
    </script>
</body>
</html>
