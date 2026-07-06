<?php

namespace TheizerDev\LaraReact\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class DbCommand extends Command
{
    protected $signature = 'larareact:db';

    protected $description = 'Configure database connection and create the first user';

    public function handle(): int
    {
        $this->info('Starting database configuration...');

        if (! $this->configureDatabase()) {
            $this->error('Database configuration failed.');

            return self::FAILURE;
        }

        $this->comment('Running database migrations...');
        try {
            $this->call('migrate', ['--force' => true]);
        } catch (\Exception $e) {
            $this->error('Migrations failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Database is ready.');

        if ($this->confirm('Would you like to create the first administrator user?', true)) {
            $this->createFirstUser();
        }

        return self::SUCCESS;
    }

    protected function configureDatabase(): bool
    {
        $envPath = base_path('.env');

        if (! file_exists($envPath)) {
            if (file_exists(base_path('.env.example'))) {
                copy(base_path('.env.example'), $envPath);
                $this->info('Created .env file from .env.example.');
            } else {
                $this->error('.env file not found and .env.example is missing.');

                return false;
            }
        }

        $driver = $this->choice(
            'Which database driver would you like to use?',
            ['sqlite', 'mysql', 'pgsql'],
            'sqlite'
        );

        $host = '';
        $port = '';
        $database = '';
        $username = '';
        $password = '';

        if ($driver === 'sqlite') {
            $database = $this->ask('SQLite database file path?', 'database/database.sqlite');
            $databasePath = base_path($database);
            $dir = dirname($databasePath);
            if (! is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            if (! file_exists($databasePath)) {
                touch($databasePath);
                $this->info("Created SQLite database file: {$database}");
            }
        } else {
            $host = $this->ask('Database host?', '127.0.0.1');
            $port = $driver === 'mysql' ? $this->ask('Database port?', '3306') : $this->ask('Database port?', '5432');
            $database = $this->ask('Database name?', 'larareact');
            $username = $this->ask('Database username?', $driver === 'mysql' ? 'root' : 'postgres');
            $password = (string) $this->secret('Database password?');
        }

        // Test and create DB if it does not exist
        if (! $this->testAndCreateDatabase($driver, $host, $port, $database, $username, $password)) {
            return false;
        }

        // Save to .env
        $envContent = file_get_contents($envPath);
        $envContent = $this->setEnvValue($envContent, 'DB_CONNECTION', $driver);
        $envContent = $this->setEnvValue($envContent, 'DB_DATABASE', $driver === 'sqlite' ? $database : $database);
        $envContent = $this->setEnvValue($envContent, 'DB_HOST', $host);
        $envContent = $this->setEnvValue($envContent, 'DB_PORT', $port);
        $envContent = $this->setEnvValue($envContent, 'DB_USERNAME', $username);
        $envContent = $this->setEnvValue($envContent, 'DB_PASSWORD', $password);
        file_put_contents($envPath, $envContent);

        // Update runtime config
        config([
            'database.default' => $driver,
            "database.connections.{$driver}.host" => $host,
            "database.connections.{$driver}.port" => $port,
            "database.connections.{$driver}.database" => $driver === 'sqlite' ? base_path($database) : $database,
            "database.connections.{$driver}.username" => $username,
            "database.connections.{$driver}.password" => $password,
        ]);

        DB::purge($driver);
        DB::reconnect($driver);

        $this->info('Database configured and connected successfully.');

        return true;
    }

    protected function testAndCreateDatabase(string $driver, string $host, string $port, string $database, string $username, string $password): bool
    {
        if ($driver === 'sqlite') {
            return true;
        }

        try {
            // Temporary configure connection to test
            config([
                'database.connections.temp_test' => [
                    'driver' => $driver,
                    'host' => $host,
                    'port' => $port,
                    'database' => $database,
                    'username' => $username,
                    'password' => $password,
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix' => '',
                    'sslmode' => 'prefer',
                ],
            ]);

            DB::purge('temp_test');
            DB::connection('temp_test')->getPdo();

            return true;
        } catch (\Exception $e) {
            // If connection failed, let's see if it is because the database is missing
            $message = $e->getMessage();

            if (str_contains($message, 'Unknown database') || str_contains($message, 'does not exist')) {
                $this->comment("Database '{$database}' does not exist. Attempting to create it...");

                if ($driver === 'mysql') {
                    try {
                        $pdo = new \PDO("mysql:host={$host};port={$port}", $username, $password);
                        $pdo->exec(sprintf('CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', $database));
                        $this->info("Database '{$database}' created successfully.");

                        return true;
                    } catch (\PDOException $pdoEx) {
                        $this->error('Failed to create database: '.$pdoEx->getMessage());

                        return false;
                    }
                } elseif ($driver === 'pgsql') {
                    try {
                        $pdo = new \PDO("pgsql:host={$host};port={$port};dbname=postgres", $username, $password);
                        $pdo->exec(sprintf('CREATE DATABASE "%s";', $database));
                        $this->info("Database '{$database}' created successfully.");

                        return true;
                    } catch (\PDOException $pdoEx) {
                        if (str_contains($pdoEx->getMessage(), 'already exists')) {
                            return true;
                        }
                        $this->error('Failed to create database: '.$pdoEx->getMessage());

                        return false;
                    }
                }
            }

            $this->error('Connection failed: '.$message);

            return false;
        }
    }

    protected function createFirstUser(): void
    {
        $userClass = '\App\Models\User';
        if (! class_exists($userClass)) {
            $this->error("User model [{$userClass}] not found. Skipping user creation.");

            return;
        }

        $name = $this->ask('Administrator name?');
        $email = $this->ask('Administrator email?');
        $password = $this->secret('Administrator password?');
        $passwordConfirm = $this->secret('Confirm administrator password?');

        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $passwordConfirm,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            $this->error('Validation errors:');
            foreach ($validator->errors()->all() as $error) {
                $this->line("- {$error}");
            }
            if ($this->confirm('Would you like to try again?', true)) {
                $this->createFirstUser();
            }

            return;
        }

        try {
            $user = new $userClass;
            $user->name = $name;
            $user->email = $email;
            $user->password = Hash::make($password);
            $user->email_verified_at = now();
            $user->save();

            $this->info("User '{$name}' <{$email}> created successfully!");
        } catch (\Exception $e) {
            $this->error('Failed to create user: '.$e->getMessage());
        }
    }

    protected function setEnvValue(string $env, string $key, string $value): string
    {
        $pattern = '/^'.preg_quote($key, '/').'=.*/m';

        if (preg_match($pattern, $env)) {
            return preg_replace($pattern, $key.'='.$value, $env);
        }

        return $env."\n{$key}={$value}";
    }
}
