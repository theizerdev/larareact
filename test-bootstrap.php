<?php

// Test registerFortifyProvider
$providers = <<<'PHP'
<?php

use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
];
PHP;

file_put_contents('test-providers.php', $providers);

$content = file_get_contents('test-providers.php');
$content = preg_replace(
    '/(\n)(\];)/s',
    "$1    App\\Providers\\FortifyServiceProvider::class,$1$2",
    $content,
    1
);
file_put_contents('test-providers.php', $content);

echo "Providers result:\n";
echo file_get_contents('test-providers.php');
echo "\n\n";

// Test configureBootstrapApp
$bootstrap = <<<'PHP'
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
PHP;

file_put_contents('test-app.php', $bootstrap);

$content = file_get_contents('test-app.php');

// Add use statements
$uses = [
    'use App\\Http\\Middleware\\HandleAppearance;',
    'use App\\Http\\Middleware\\HandleInertiaRequests;',
    'use Illuminate\\Http\\Middleware\\AddLinkHeadersForPreloadedAssets;',
];

foreach ($uses as $useStatement) {
    if (! str_contains($content, $useStatement)) {
        if (preg_match_all('/^use\s+.+?;\n/m', $content, $matches)) {
            $lastUse = end($matches[0]);
            $position = strrpos($content, $lastUse);
            if ($position !== false) {
                $content = substr_replace($content, $lastUse.$useStatement."\n", $position, strlen($lastUse));
            }
        } else {
            $content = preg_replace('/(<\?php\n)/', "$1{$useStatement}\n", $content, 1);
        }
    }
}

// Configure routing
if (! str_contains($content, 'larareact.php')) {
    $content = preg_replace(
        '/(->withRouting\(\s*web:\s*)(__DIR__\'.+?\'\s*,)/s',
        "$1[\n            __DIR__.'/../routes/web.php',\n            __DIR__.'/../routes/larareact.php',\n            __DIR__.'/../routes/larareact-settings.php',\n        ], ",
        $content
    );
}

// Configure middleware
if (! str_contains($content, 'HandleAppearance::class')) {
    $content = preg_replace(
        '/(->withMiddleware\(function\s*\(Middleware\s*\$middleware\)\s*:\s*void\s*\{)(\s*\})/s',
        "$1\n        \$middleware->encryptCookies(except: ['appearance', 'sidebar_state']);\n\n        \$middleware->web(append: [\n            HandleAppearance::class,\n            HandleInertiaRequests::class,\n            AddLinkHeadersForPreloadedAssets::class,\n        ]);\n    }$2",
        $content
    );
}

file_put_contents('test-app.php', $content);

echo "App result:\n";
echo file_get_contents('test-app.php');
echo "\n";

// Clean up
unlink('test-providers.php');
unlink('test-app.php');
