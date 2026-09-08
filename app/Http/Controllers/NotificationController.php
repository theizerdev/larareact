<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Mark one of the authenticated user's notifications as read and optionally redirect to its origin URL.
     */
    public function markAsRead(Request $request, string $notification): RedirectResponse
    {
        $notif = $request->user()->notifications()->where('id', $notification)->first();
        $notif?->markAsRead();

        $targetUrl = $request->input('redirect_to');
        if (! $targetUrl && $notif) {
            $targetUrl = $notif->data['url'] ?? match ($notif->type) {
                \App\Notifications\KycValidacionCompletadaNotification::class => '/admin/validaciones',
                \App\Notifications\DescansoExcedidoNotification::class => '/admin/asistencia/bitacora',
                \App\Notifications\VisitaAccesoRegistradaNotification::class => '/admin/visitas-accesos',
                \App\Notifications\VisitaAutorizacionSolicitadaNotification::class => '/admin/visitas-accesos',
                \App\Notifications\VisitaAutorizacionRespondidaNotification::class => '/admin/visitas-accesos',
                \App\Notifications\NuevoUsuarioNotification::class => '/admin/usuarios',
                \App\Notifications\WelcomeNotification::class => '/dashboard',
                default => null,
            };
        }

        if ($targetUrl && ! $request->boolean('no_redirect', false)) {
            return redirect($targetUrl);
        }

        return back();
    }

    /**
     * Mark all of the authenticated user's notifications as read.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }
}
