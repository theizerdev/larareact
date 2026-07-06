<?php

namespace TheizerDev\LaraReact\Console;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class InstallCommand extends Command
{
    protected $signature = 'larareact:install
                            {--composer=global : Absolute path to the Composer binary which should be used to install packages}';

    protected $description = 'Install the LaraReact base interface resources';

    public function handle(): int
    {
        $this->comment('Publishing LaraReact configuration...');
        $this->callSilent('vendor:publish', ['--tag' => 'larareact-config', '--force' => true]);

        $this->comment('Publishing LaraReact assets...');
        $this->callSilent('vendor:publish', ['--tag' => 'larareact-assets', '--force' => true]);
        $this->callSilent('vendor:publish', ['--tag' => 'larareact-css', '--force' => true]);

        $this->comment('Installing Node dependencies...');
        $this->installNodeDependencies();

        $this->comment('Building assets...');
        $this->buildAssets();

        $this->info('LaraReact installed successfully.');

        return self::SUCCESS;
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
