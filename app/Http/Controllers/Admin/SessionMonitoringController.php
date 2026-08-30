<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\UserAgentParser;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionMonitoringController extends Controller
{
    /**
     * Muestra la lista de sesiones activas en el sistema.
     */
    public function index(Request $request)
    {
        $currentSessionId = $request->session()->getId();
        $currentUser = $request->user();

        // Obtener solo las sesiones de usuarios autenticados
        $query = DB::connection('landlord')->table('sessions')
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->select(
                'sessions.id',
                'sessions.user_id',
                'sessions.ip_address',
                'sessions.user_agent',
                'sessions.last_activity',
                'users.name as user_name',
                'users.email as user_email',
                'users.empresa_id',
                'users.sucursal_id'
            );

        // Aislamiento Multitenant: Si no es Super Administrador, filtrar por empresa y sucursal
        if (! $currentUser->hasRole('Super Administrador') && ! $currentUser->hasRole('super-admin')) {
            if ($currentUser->empresa_id) {
                $query->where('users.empresa_id', $currentUser->empresa_id);
            }
            if ($currentUser->sucursal_id) {
                $query->where('users.sucursal_id', $currentUser->sucursal_id);
            }
        }

        $sessions = $query->orderBy('sessions.last_activity', 'desc')->get();

        $formattedSessions = $sessions->map(function ($session) use ($currentSessionId) {
            $agent = UserAgentParser::parse($session->user_agent);

            $latitude = null;
            $longitude = null;

            if ($session->user_id) {
                $lastActivity = DB::table('activity_log')
                    ->where('causer_type', 'App\\Models\\User')
                    ->where('causer_id', $session->user_id)
                    ->where('log_name', 'auth')
                    ->orderBy('id', 'desc')
                    ->first();

                if ($lastActivity && ! empty($lastActivity->properties)) {
                    $props = json_decode($lastActivity->properties, true);
                    $latitude = $props['latitude'] ?? null;
                    $longitude = $props['longitude'] ?? null;
                }
            }

            return [
                'id' => $session->id,
                'user_id' => $session->user_id,
                'user_name' => $session->user_name ?? 'Invitado / Desconectado',
                'user_email' => $session->user_email,
                'ip_address' => $session->ip_address,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'os' => $agent['os'],
                'browser' => $agent['browser'],
                'device' => $agent['device'],
                'last_active' => Carbon::createFromTimestamp($session->last_activity)->diffForHumans(),
                'is_current_device' => $session->id === $currentSessionId,
            ];
        });

        return inertia('admin/monitoring/sessions/index', [
            'sessions' => $formattedSessions,
        ]);
    }

    /**
     * Elimina (revoca) una sesión activa de la base de datos.
     */
    public function destroy($id, Request $request)
    {
        // Evitar que el usuario elimine su propia sesión actual desde este endpoint
        if ($id === $request->session()->getId()) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('You cannot revoke your current active session from here.'),
            ]);
        }

        DB::connection('landlord')->table('sessions')->where('id', $id)->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Session revoked successfully.'),
        ]);
    }
}
