<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

class TestLogin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:login';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Comando para probar el inicio de sesión y registro de sesiones activas';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Obtener el primer usuario
        $user = User::first();
        
        if (!$user) {
            $this->error('No hay usuarios en la base de datos');
            return;
        }
        
        // Iniciar sesión como el usuario
        Auth::login($user);
        
        // Regenerar la sesión
        Session::regenerate();
        
        // Obtener el ID de sesión
        $sessionId = Session::getId();
        
        $this->info("Usuario autenticado: {$user->name}");
        $this->info("ID de sesión: {$sessionId}");
        
        // Verificar las sesiones activas
        $activeSessions = \App\Models\ActiveSession::all();
        $this->info("Total de sesiones activas: {$activeSessions->count()}");
        
        foreach ($activeSessions as $session) {
            $this->line("Usuario ID: {$session->user_id}, Sesión ID: {$session->session_id}, Última actividad: {$session->last_activity}");
            $this->line("Login at: {$session->login_at}, Is current: {$session->is_current}, Is active: {$session->is_active}");
        }
    }
}