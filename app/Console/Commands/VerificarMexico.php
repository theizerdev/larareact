<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pais;

class VerificarMexico extends Command
{
    protected $signature = 'verificar:mexico';
    protected $description = 'Verificar datos de México en la base de datos';

    public function handle()
    {
        $pais = Pais::where('nombre', 'México')->first();

        if ($pais) {
            $this->info("País: " . $pais->nombre);
            $this->info("Moneda Principal: " . $pais->moneda_principal);
            $this->info("Símbolo de Moneda: " . $pais->simbolo_moneda);
            $this->info("Formato de Moneda: " . $pais->formato_moneda);
            $this->info("Idioma Principal: " . $pais->idioma_principal);
            
            $this->line("---");
            $this->info("Todos los países disponibles:");
            $paises = Pais::where('activo', true)->orderBy('nombre')->get();
            foreach ($paises as $p) {
                $this->line($p->nombre . " - " . $p->moneda_principal . " (" . $p->simbolo_moneda . ")");
            }
        } else {
            $this->error("México no encontrado en la base de datos.");
        }
    }
}