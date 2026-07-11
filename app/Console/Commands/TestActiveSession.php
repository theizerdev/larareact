<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\ActiveSession;

class TestActiveSession extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:active-session';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Comando para probar la creación de una sesión activa con datos de geolocalización';

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
        
        // Crear una sesión de prueba con una IP real
        $testIp = '8.8.8.8';
        $locationData = $this->getLocationData($testIp);
        
        $sessionData = [
            'user_id' => $user->id,
            'session_id' => 'test_session_' . time(),
            'ip_address' => $testIp,
            'user_agent' => 'Test Agent',
            'last_activity' => now(),
            'is_current' => true,
            'is_active' => true,
            'login_at' => now(),
            'location' => $locationData['location'] ?? null,
            'latitude' => $locationData['latitude'] ?? null,
            'longitude' => $locationData['longitude'] ?? null,
        ];
        
        $activeSession = ActiveSession::create($sessionData);
        
        $this->info("Sesión creada con éxito:");
        $this->line("ID: {$activeSession->id}");
        $this->line("IP: {$activeSession->ip_address}");
        $this->line("Ubicación: {$activeSession->location}");
        $this->line("Latitud: {$activeSession->latitude}");
        $this->line("Longitud: {$activeSession->longitude}");
    }
    
    /**
     * Obtener información de geolocalización basada en la dirección IP
     */
    private function getLocationData($ipAddress)
    {
        // Datos por defecto
        $locationData = [
            'location' => null,
            'latitude' => null,
            'longitude' => null,
        ];
        
        // No intentar obtener ubicación para IPs locales
        if ($ipAddress === '127.0.0.1' || $ipAddress === '::1' || strpos($ipAddress, '192.168.') === 0) {
            $locationData['location'] = 'Local';
            return $locationData;
        }
        
        try {
            // Usar ip-api.com para obtener información de geolocalización (servicio gratuito)
            $url = "http://ip-api.com/json/{$ipAddress}";
            $response = file_get_contents($url);
            $data = json_decode($response, true);
            
            if ($data && $data['status'] === 'success') {
                $locationData['location'] = "{$data['city']}, {$data['regionName']}, {$data['country']}";
                $locationData['latitude'] = $data['lat'];
                $locationData['longitude'] = $data['lon'];
            }
        } catch (\Exception $e) {
            // En caso de error, simplemente devolver los datos por defecto
            $this->warn("Error obteniendo geolocalización para IP {$ipAddress}: " . $e->getMessage());
        }
        
        return $locationData;
    }
}