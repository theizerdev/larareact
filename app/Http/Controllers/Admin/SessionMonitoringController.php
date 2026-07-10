<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Helpers\UserAgentParser;
use Carbon\Carbon;

class SessionMonitoringController extends Controller
{
    /**
     * Muestra la lista de sesiones activas en el sistema.
     */
    public function index(Request $request)
    {
        $currentSessionId = $request->session()->getId();

        // Obtener todas las sesiones de la base de datos
        $sessions = DB::table('sessions')
            ->leftJoin('users', 'sessions.user_id', '=', 'users.id')
            ->select('sessions.id', 'sessions.user_id', 'sessions.ip_address', 'sessions.user_agent', 'sessions.last_activity', 'users.name as user_name', 'users.email as user_email')
            ->orderBy('sessions.last_activity', 'desc')
            ->get();

        $formattedSessions = $sessions->map(function ($session) use ($currentSessionId) {
            $agent = UserAgentParser::parse($session->user_agent);
            
            // Determinar ubicación preliminar de la IP
            $location = 'Desconocida';
            if ($session->ip_address === '127.0.0.1' || $session->ip_address === '::1') {
                $location = 'Localhost (Desarrollo)';
            }

            return [
                'id' => $session->id,
                'user_id' => $session->user_id,
                'user_name' => $session->user_name ?? 'Invitado / Desconectado',
                'user_email' => $session->user_email,
                'ip_address' => $session->ip_address,
                'location' => $location,
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

        DB::table('sessions')->where('id', $id)->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Session revoked successfully.'),
        ]);
    }
}
