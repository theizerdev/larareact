<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class StartWhatsAppApi extends Command
{
    protected $signature = 'whatsapp:start';
    protected $description = 'Iniciar la API de WhatsApp';

    public function handle()
    {
        $this->info('Iniciando API de WhatsApp...');
        
        $apiPath = base_path('../larawhatsapp/whatsapp-api-v2');
        
        if (!is_dir($apiPath)) {
            $this->error('No se encontró el directorio de la API de WhatsApp en: ' . $apiPath);
            return 1;
        }

        $this->info('Cambiando al directorio: ' . $apiPath);
        
        // Verificar si Node.js está instalado
        $nodeCheck = new Process(['node', '--version']);
        $nodeCheck->run();
        
        if (!$nodeCheck->isSuccessful()) {
            $this->error('Node.js no está instalado o no está en el PATH');
            return 1;
        }
        
        $this->info('Node.js versión: ' . trim($nodeCheck->getOutput()));
        
        // Verificar si npm está instalado
        $npmCheck = new Process(['npm', '--version']);
        $npmCheck->run();
        
        if (!$npmCheck->isSuccessful()) {
            $this->error('npm no está instalado o no está en el PATH');
            return 1;
        }
        
        // Instalar dependencias si no existen
        if (!is_dir($apiPath . '/node_modules')) {
            $this->info('Instalando dependencias...');
            $npmInstall = new Process(['npm', 'install'], $apiPath);
            $npmInstall->setTimeout(300); // 5 minutos
            $npmInstall->run();
            
            if (!$npmInstall->isSuccessful()) {
                $this->error('Error al instalar dependencias: ' . $npmInstall->getErrorOutput());
                return 1;
            }
        }
        
        // Iniciar la API
        $this->info('Iniciando servidor de WhatsApp API en puerto 3001...');
        
        $process = new Process(['npm', 'start'], $apiPath);
        $process->setTimeout(null);
        
        $process->start(function ($type, $buffer) {
            if (Process::ERR === $type) {
                $this->error($buffer);
            } else {
                $this->line($buffer);
            }
        });
        
        $this->info('API de WhatsApp iniciada. Presiona Ctrl+C para detener.');
        
        // Mantener el proceso corriendo
        while ($process->isRunning()) {
            sleep(1);
        }
        
        return $process->getExitCode();
    }
}