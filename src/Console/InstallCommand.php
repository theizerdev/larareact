<?php

namespace TheizerDev\LaraReact\Console;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class InstallCommand extends Command
{
    protected $signature = 'larareact:install
                            {--composer=global : Absolute path to the Composer binary which should be used to install packages}';

    protected $description = 'Install the LaraReact base interface resources';

    public function handle(): int
    {
        $this->setupEnvironment();
        $this->generateAppKey();

        $this->comment('Publishing LaraReact application files...');
        $this->ensureDirectoryExists(app_path('Providers'));
        $this->ensureDirectoryExists(app_path('Http/Middleware'));
        $this->ensureDirectoryExists(app_path('Http/Controllers/Settings'));
        $this->ensureDirectoryExists(app_path('Http/Requests/Settings'));
        $this->ensureDirectoryExists(app_path('Actions/Fortify'));
        $this->ensureDirectoryExists(app_path('Concerns'));
        $this->ensureDirectoryExists(base_path('routes'));
        $this->callSilent('vendor:publish', ['--tag' => 'larareact-app', '--force' => true]);

        $this->comment('Publishing LaraReact configuration...');
        $this->callSilent('vendor:publish', ['--tag' => 'larareact-config', '--force' => true]);

        $this->comment('Publishing LaraReact assets...');
        $this->callSilent('vendor:publish', ['--tag' => 'larareact-assets', '--force' => true]);

        $this->comment('Publishing LaraReact build files...');
        $this->callSilent('vendor:publish', ['--tag' => 'larareact-build', '--force' => true]);

        $this->comment('Configuring Laravel bootstrap files...');
        $this->registerFortifyProvider();
        $this->configureBootstrapApp();

        // Run the interactive database connection, migration, and user setup
        $this->call('larareact:db');

        $this->comment('Installing Node dependencies...');
        $this->installNodeDependencies();

        $this->comment('Building assets...');
        $this->buildAssets();

        $this->info('LaraReact installed successfully.');

        return self::SUCCESS;
    }

    protected function setupEnvironment(): void
    {
        if (file_exists(base_path('.env'))) {
            $this->info('.env file already exists. Skipping environment setup.');

            return;
        }

        $this->comment('Creating .env file...');

        if (! file_exists(base_path('.env.example'))) {
            $this->error('.env.example file not found.');

            return;
        }

        copy(base_path('.env.example'), base_path('.env'));
        $this->info('.env file created successfully.');
    }

    protected function generateAppKey(): void
    {
        $this->comment('Generating application key...');
        $this->callSilent('key:generate', ['--force' => true]);
        $this->info('Application key generated.');
    }

    protected function setEnvValue(string $env, string $key, string $value): string
    {
        $pattern = '/^'.preg_quote($key, '/').'=.*/m';

        if (preg_match($pattern, $env)) {
            return preg_replace($pattern, $key.'='.$value, $env);
        }

        return $env."\n{$key}={$value}";
    }

    protected function registerFortifyProvider(): void
    {
        $path = base_path('bootstrap/providers.php');

        if (! file_exists($path)) {
            $this->warn('bootstrap/providers.php not found. Skipping Fortify provider registration.');

            return;
        }

        $content = file_get_contents($path);

        if (str_contains($content, 'FortifyServiceProvider')) {
            $this->info('FortifyServiceProvider is already registered.');

            return;
        }

        // Insert FortifyServiceProvider before the closing bracket of the array
        $content = preg_replace(
            '/(\n)(\];)/s',
            "$1    App\\Providers\\FortifyServiceProvider::class,$1$2",
            $content,
            1
        );

        file_put_contents($path, $content);
        $this->info('FortifyServiceProvider registered in bootstrap/providers.php.');
    }

    protected function configureBootstrapApp(): void
    {
        $path = base_path('bootstrap/app.php');

        if (! file_exists($path)) {
            $this->warn('bootstrap/app.php not found. Skipping bootstrap configuration.');

            return;
        }

        $content = file_get_contents($path);

        // Add use statements if missing
        $uses = [
            'use App\\Http\\Middleware\\HandleAppearance;',
            'use App\\Http\\Middleware\\HandleInertiaRequests;',
            'use Illuminate\\Http\\Middleware\\AddLinkHeadersForPreloadedAssets;',
        ];

        foreach ($uses as $useStatement) {
            if (! str_contains($content, $useStatement)) {
                $content = $this->insertAfterLastUse($content, $useStatement);
            }
        }

        // Configure routing to include LaraReact routes
        if (! str_contains($content, 'larareact.php')) {
            $content = preg_replace(
                '/(->withRouting\(\s*web:\s*)(__DIR__\'.+?\'\s*,)/s',
                "$1[\n            __DIR__.'/../routes/web.php',\n            __DIR__.'/../routes/larareact.php',\n            __DIR__.'/../routes/larareact-settings.php',\n        ], ",
                $content
            );
        }

        // Configure middleware if not already configured
        if (! str_contains($content, 'HandleAppearance::class')) {
            $content = preg_replace(
                '/(->withMiddleware\(function\s*\(Middleware\s*\$middleware\)\s*:\s*void\s*\{)(\s*\})/s',
                "$1\n        \$middleware->encryptCookies(except: ['appearance', 'sidebar_state']);\n\n        \$middleware->web(append: [\n            HandleAppearance::class,\n            HandleInertiaRequests::class,\n            AddLinkHeadersForPreloadedAssets::class,\n        ]);\n    }$2",
                $content
            );
        }

        file_put_contents($path, $content);
        $this->info('bootstrap/app.php configured for LaraReact.');
    }

    protected function insertAfterLastUse(string $content, string $useStatement): string
    {
        // Find all use statements
        if (preg_match_all('/^use\s+.+?;\n/m', $content, $matches)) {
            $lastUse = end($matches[0]);
            $position = strrpos($content, $lastUse);

            if ($position !== false) {
                return substr_replace($content, $lastUse.$useStatement."\n", $position, strlen($lastUse));
            }
        }

        // No use statements found, insert after <?php
        return preg_replace('/(<\?php\n)/', "$1{$useStatement}\n", $content, 1);
    }

    protected function ensureDirectoryExists(string $path): void
    {
        if (! is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }

    protected function installNodeDependencies(): void
    {
        $commands = [
            $this->npmBinary().' install',
        ];

        $this->runCommands($commands);
    }

    protected function buildAssets(): void
    {
        $commands = [
            $this->npmBinary().' run build',
        ];

        $this->runCommands($commands);
    }

    protected function npmBinary(): string
    {
        return 'npm';
    }

    protected function runCommands(array $commands): void
    {
        $process = Process::fromShellCommandline(
            implode(' && ', $commands),
            base_path(),
            ['COMPOSER_MEMORY_LIMIT' => '-1'],
            null,
            null
        );

        if ('\\' !== DIRECTORY_SEPARATOR && file_exists('/dev/tty') && is_readable('/dev/tty')) {
            $process->setTty(true);
        }

        $process->run(function ($type, $line) {
            $this->output->write($line);
        });
    }
}
