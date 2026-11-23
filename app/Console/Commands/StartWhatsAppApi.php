<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class StartWhatsAppApi extends Command
{
    protected $signature = 'whatsapp:start';

    protected $description = 'Iniciar el motor nativo de WhatsApp en Python para Fixsale';

    public function handle()
    {
        $this->info('================================================================');
        $this->info('    INICIANDO MOTOR NATIVO DE WHATSAPP (PYTHON NEONIZE)');
        $this->info('================================================================');

        $apiPath = base_path('whatsapp-service');

        if (! is_dir($apiPath)) {
            $this->error('No se encontró el directorio del microservicio en: '.$apiPath);

            return 1;
        }

        // Buscar intérprete de Python disponible
        $possiblePythons = [
            $apiPath.DIRECTORY_SEPARATOR.'venv'.DIRECTORY_SEPARATOR.'Scripts'.DIRECTORY_SEPARATOR.'python.exe',
            'C:\\laragon\\www\\sismed\\backend\\venv\\Scripts\\python.exe',
            'C:\\laragon\\bin\\python\\python-3.13\\python.exe',
            'python',
        ];

        $pythonExe = null;
        foreach ($possiblePythons as $candidate) {
            if ($candidate === 'python') {
                $check = new Process(['python', '--version']);
                $check->run();
                if ($check->isSuccessful()) {
                    $pythonExe = 'python';
                    break;
                }
            } elseif (file_exists($candidate)) {
                $pythonExe = $candidate;
                break;
            }
        }

        if (! $pythonExe) {
            $this->error('No se encontró un ejecutable de Python compatible en el sistema.');

            return 1;
        }

        $this->info('Python detectado: '.$pythonExe);
        $this->info('Servidor levantando en http://127.0.0.1:3001...');
        $this->info('Swagger / Documentación: http://127.0.0.1:3001/docs');
        $this->info('Presiona Ctrl+C para detener el servicio.');
        $this->newLine();

        $process = new Process([
            $pythonExe,
            '-m',
            'uvicorn',
            'main:app',
            '--host',
            '127.0.0.1',
            '--port',
            '3001',
            '--reload',
        ], $apiPath);

        $process->setTimeout(null);

        $process->start(function ($type, $buffer) {
            if ($type === Process::ERR) {
                $this->output->write('<comment>'.$buffer.'</comment>');
            } else {
                $this->output->write($buffer);
            }
        });

        while ($process->isRunning()) {
            sleep(1);
        }

        return $process->getExitCode();
    }
}
