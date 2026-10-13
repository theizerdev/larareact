<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;

class LogAuthenticationActivity
{
    /**
     * Prevent duplicate execution within the same HTTP request lifecycle.
     */
    private function shouldHandle(string $key): bool
    {
        try {
            $request = request();
            $attr = '__auth_activity_' . $key;
            if ($request->attributes->has($attr)) {
                return false;
            }
            $request->attributes->set($attr, true);
            return true;
        } catch (\Throwable) {
            return true;
        }
    }

    /**
     * Handle user login events.
     */
    public function handleLogin(Login $event): void
    {
        $user = $event->user;
        if (!$user) {
            return;
        }

        $key = 'login_' . $user->id . '_' . spl_object_id($event);
        if (!$this->shouldHandle($key)) {
            return;
        }

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

    /**
     * Handle user logout events.
     */
    public function handleLogout(Logout $event): void
    {
        $user = $event->user;
        if (!$user) {
            return;
        }

        $key = 'logout_' . $user->id . '_' . spl_object_id($event);
        if (!$this->shouldHandle($key)) {
            return;
        }

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

    /**
     * Handle failed login attempt events.
     */
    public function handleFailed(Failed $event): void
    {
        $email = $event->credentials['email'] ?? $event->credentials['username'] ?? 'Desconocido';
        $user = $event->user;
        $key = 'failed_' . $email . '_' . spl_object_id($event);

        if (!$this->shouldHandle($key)) {
            return;
        }

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
        $key = 'lockout_' . spl_object_id($event);

        if (!$this->shouldHandle($key)) {
            return;
        }

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
        if (!$user) {
            return;
        }

        $key = 'password_reset_' . $user->id . '_' . spl_object_id($event);

        if (!$this->shouldHandle($key)) {
            return;
        }

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
