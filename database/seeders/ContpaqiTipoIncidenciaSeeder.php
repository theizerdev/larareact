<?php

namespace Database\Seeders;

use App\Models\ContpaqiTipoIncidencia;
use App\Models\Empresa;
use Illuminate\Database\Seeder;

/**
 * Siembra el catálogo de tipos de incidencia de CONTPAQi para cada empresa.
 *
 * La semilla es el catálogo real de Frigorífico Santander (21 renglones,
 * exportado de su CONTPAQi el 07/Abr/2026) y vive en config/contpaqi.php. Que
 * sea el catálogo de un cliente concreto y no uno genérico es a propósito: no
 * existe un catálogo estándar de CONTPAQi, cada empresa arma el suyo, así que
 * más vale arrancar de uno real y editarlo que inventar uno que no le sirva a
 * nadie.
 *
 * Usa updateOrCreate por mnemónico, así que correrlo dos veces no duplica y
 * tampoco pisa las ediciones hechas desde el panel —salvo en los campos que el
 * catálogo original define, que es justo lo que se querría al resembrar.
 */
class ContpaqiTipoIncidenciaSeeder extends Seeder
{
    public function run(): void
    {
        $semilla = config('contpaqi.catalogo_semilla', []);

        if ($semilla === []) {
            $this->command?->warn('config/contpaqi.php no trae catálogo semilla; no hay nada que sembrar.');

            return;
        }

        // Los mnemónicos que el sistema calcula solo. Se marcan como derivados
        // para que la pantalla de captura manual no los ofrezca y nadie acabe
        // capturando a mano unas horas extra que la asistencia ya exportó.
        $derivados = collect(config('contpaqi.derivacion', []))
            ->filter()
            ->values()
            ->all();

        // Número de concepto de CONTPAQi por mnemónico. Los que no se conocen
        // se quedan en null a propósito; ver el comentario en config.
        $conceptos = config('contpaqi.conceptos_por_mnemonico', []);

        $empresas = Empresa::withoutGlobalScopes()->get();

        if ($empresas->isEmpty()) {
            $this->command?->warn('No hay empresas; el catálogo de CONTPAQi se siembra por empresa.');

            return;
        }

        foreach ($empresas as $empresa) {
            foreach ($semilla as $fila) {
                ContpaqiTipoIncidencia::updateOrCreate(
                    [
                        'empresa_id' => $empresa->id,
                        'mnemonico' => $fila['mnemonico'],
                    ],
                    [
                        'descripcion' => $fila['descripcion'],
                        'unidad' => $fila['unidad'],
                        'concepto_nomipaq' => $conceptos[$fila['mnemonico']] ?? null,
                        'tipo_imss' => $fila['tipo_imss'],
                        'derecho_sueldo' => $fila['derecho_sueldo'],
                        'porcentaje_derecho' => $fila['porcentaje_derecho'],
                        'descuenta_septimo' => $fila['descuenta_septimo'],
                        'es_derivada' => in_array($fila['mnemonico'], $derivados, true),
                        'activo' => true,
                    ]
                );
            }

            $this->command?->info("Catálogo CONTPAQi sembrado para: {$empresa->razon_social}");
        }
    }
}
