<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\PasswordReset;

class LogAuthenticationActivity
{
    /**
     * Prevent duplicate execution within the same request lifecycle.
     */
    private static array $handledEvents = [];

    /**
     * Handle user login events.
     */
    public function handleLogin(Login $event): void
    {
        $user = $event->user;
        $key = 'login_' . ($user?->id ?? 'guest') . '_' . request()->ip();

        if (isset(self::$handledEvents[$key])) {
            return;
        }
        self::$handledEvents[$key] = true;

        if ($user) {
            activity('auth')
                ->causedBy($user)
                ->performedOn($user)
                ->withProperties([
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'url' => request()->fullUrl(),
                    'method' => request()->method(),
                    'tabla' => 'users',
                    'identificador' => $user->email ?? $user->name,
                    'evento' => 'login',
                ])
                ->event('login')
                ->log("Inicio de sesión exitoso de {$user->name}");
        }
    }

    /**
     * Handle user logout events.
     */
    public function handleLogout(Logout $event): void
    {
        $user = $event->user;
        $key = 'logout_' . ($user?->id ?? 'guest') . '_' . request()->ip();

        if (isset(self::$handledEvents[$key])) {
            return;
        }
        self::$handledEvents[$key] = true;

        if ($user) {
            activity('auth')
                ->causedBy($user)
                ->performedOn($user)
                ->withProperties([
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'url' => request()->fullUrl(),
                    'method' => request()->method(),
                    'tabla' => 'users',
                    'identificador' => $user->email ?? $user->name,
                    'evento' => 'logout',
                ])
                ->event('logout')
                ->log("Cierre de sesión de {$user->name}");
        }
    }

    /**
     * Handle failed login attempt events.
     */
    public function handleFailed(Failed $event): void
    {
        $email = $event->credentials['email'] ?? $event->credentials['username'] ?? 'Desconocido';
        $user = $event->user;
        $key = 'failed_' . $email . '_' . request()->ip();

        if (isset(self::$handledEvents[$key])) {
            return;
        }
        self::$handledEvents[$key] = true;

        $activity = activity('auth')
            ->withProperties([
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'url' => request()->fullUrl(),
                'method' => request()->method(),
                'tabla' => 'users',
                'identificador' => $email,
                'evento' => 'failed_login',
            ])
            ->event('failed_login');

        if ($user) {
            $activity->causedBy($user);
        }

        $activity->log("Intento fallido de inicio de sesión ({$email})");
    }

    /**
     * Handle user lockout events.
     */
    public function handleLockout(Lockout $event): void
    {
        $key = 'lockout_' . request()->ip();

        if (isset(self::$handledEvents[$key])) {
            return;
        }
        self::$handledEvents[$key] = true;

        activity('auth')
            ->withProperties([
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'url' => request()->fullUrl(),
                'method' => request()->method(),
                'tabla' => 'users',
                'evento' => 'lockout',
            ])
            ->event('lockout')
            ->log('Bloqueo temporal por intentos fallidos de autenticación');
    }

    /**
     * Handle password reset events.
     */
    public function handlePasswordReset(PasswordReset $event): void
    {
        $user = $event->user;
        $key = 'password_reset_' . ($user?->id ?? 'guest') . '_' . request()->ip();

        if (isset(self::$handledEvents[$key])) {
            return;
        }
        self::$handledEvents[$key] = true;

        if ($user) {
            activity('auth')
                ->causedBy($user)
                ->performedOn($user)
                ->withProperties([
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'url' => request()->fullUrl(),
                    'method' => request()->method(),
                    'tabla' => 'users',
                    'identificador' => $user->email,
                    'evento' => 'password_reset',
                ])
                ->event('password_reset')
                ->log("Restablecimiento de contraseña de {$user->name}");
        }
    }

    /**
     * Register listeners explicitly for Laravel event dispatcher.
     *
     * @param \Illuminate\Events\Dispatcher $events
     * @return array<string, string>
     */
    public function subscribe($events): array
    {
        return [
            Login::class => 'handleLogin',
            Logout::class => 'handleLogout',
            Failed::class => 'handleFailed',
            Lockout::class => 'handleLockout',
            PasswordReset::class => 'handlePasswordReset',
        ];
    }
}
