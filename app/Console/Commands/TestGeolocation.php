<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

class TestGeolocation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:geolocation {ip?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Comando para probar la funcionalidad de geolocalización en sesiones activas';

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
        
        // Usar IP proporcionada o una IP de prueba
        $testIp = $this->argument('ip') ?? '8.8.8.8'; // IP de Google DNS - para prueba
        
        $this->info("Probando geolocalización para IP: {$testIp}");
        
        // Probar la función de geolocalización
        $locationData = $this->getLocationData($testIp);
        
        $this->info("Datos de ubicación obtenidos:");
        $this->line("Ubicación: " . ($locationData['location'] ?? 'No disponible'));
        $this->line("Latitud: " . ($locationData['latitude'] ?? 'No disponible'));
        $this->line("Longitud: " . ($locationData['longitude'] ?? 'No disponible'));
        
        // Mostrar las sesiones activas con información de geolocalización
        $activeSessions = \App\Models\ActiveSession::all();
        $this->info("Total de sesiones activas: {$activeSessions->count()}");
        
        foreach ($activeSessions as $session) {
            $this->line("Usuario ID: {$session->user_id}");
            $this->line("IP: {$session->ip_address}");
            $this->line("Ubicación: {$session->location}");
            $this->line("Latitud: {$session->latitude}");
            $this->line("Longitud: {$session->longitude}");
            $this->line("---");
        }
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