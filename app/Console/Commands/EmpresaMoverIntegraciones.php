<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Pasa las integraciones activas de una empresa a otra y las deja apagadas en
 * la de origen.
 *
 * Nació de separar los datos por empresa: Frigorífico Santander es la empresa
 * base y las integraciones (WhatsApp, Control de Acceso, BioTime…) estaban
 * guardadas bajo otra. Cada integración se mueve completa (URL, llaves,
 * estado) porque una mitad movida deja a las dos empresas hablando con el
 * mismo servicio.
 *
 * Por seguridad es un simulacro salvo que se pase --aplicar, y una integración
 * sólo se mueve si la empresa destino no tiene ya otra distinta configurada
 * (--forzar para pisarla). Nunca imprime ni registra llaves ni contraseñas.
 *
 * No toca las tablas espejo (biotime_*), los empleados ni los marcajes: tras
 * mover BioTime, el espejo de la empresa destino se completa con
 * `php artisan biotime:sync --empresa=<destino> --full`.
 */
class EmpresaMoverIntegraciones extends Command
{
    protected $signature = 'empresa:mover-integraciones
        {--desde= : ID de la empresa que hoy tiene las integraciones}
        {--hacia= : ID de la empresa que se queda con ellas}
        {--solo= : Lista separada por comas de integraciones a mover (por defecto: todas las activas)}
        {--forzar : Pisa la integración de la empresa destino si ya tiene otra distinta}
        {--aplicar : Escribe los cambios (sin esto sólo muestra el plan)}';

    protected $description = 'Mueve las integraciones activas (WhatsApp, Control de Acceso, BioTime…) de una empresa a otra';

    /**
     * Cada integración: bandera de activa, campo que prueba que está
     * realmente configurada, campos que la distinguen de otra configuración y
     * columnas que viajan con ella.
     *
     * @var array<string, array{activo: string, prueba: string, identidad: array<int,string>, campos: array<int,string>, secretos: array<int,string>}>
     */
    private const INTEGRACIONES = [
        'whatsapp' => [
            'activo' => 'whatsapp_active',
            'prueba' => 'whatsapp_api_url',
            'identidad' => ['whatsapp_api_url', 'whatsapp_instance', 'whatsapp_phone'],
            'campos' => ['whatsapp_api_key', 'whatsapp_api_url', 'whatsapp_rate_limit', 'whatsapp_phone', 'whatsapp_status', 'whatsapp_last_connected', 'whatsapp_instance'],
            'secretos' => ['whatsapp_api_key'],
        ],
        'control_acceso' => [
            'activo' => 'control_acceso_active',
            'prueba' => 'control_acceso_base_url',
            'identidad' => ['control_acceso_base_url'],
            'campos' => ['control_acceso_base_url', 'control_acceso_app_token', 'control_acceso_user_token'],
            'secretos' => ['control_acceso_app_token', 'control_acceso_user_token'],
        ],
        'biotime' => [
            'activo' => 'biotime_active',
            'prueba' => 'biotime_base_url',
            'identidad' => ['biotime_base_url', 'biotime_username'],
            'campos' => ['biotime_base_url', 'biotime_username', 'biotime_password'],
            'secretos' => ['biotime_password'],
        ],
        'mapbox' => [
            'activo' => 'mapbox_active',
            'prueba' => 'mapbox_api_key',
            'identidad' => ['mapbox_api_key'],
            'campos' => ['mapbox_api_key'],
            'secretos' => ['mapbox_api_key'],
        ],
        'google_maps' => [
            'activo' => 'google_maps_active',
            'prueba' => 'google_maps_api_key',
            'identidad' => ['google_maps_api_key'],
            'campos' => ['google_maps_api_key'],
            'secretos' => ['google_maps_api_key'],
        ],
        'jaak' => [
            'activo' => 'jaak_active',
            'prueba' => 'jaak_api_key',
            'identidad' => ['jaak_api_key', 'jaak_environment'],
            'campos' => ['jaak_api_key', 'jaak_environment'],
            'secretos' => ['jaak_api_key'],
        ],
    ];

    public function handle(): int
    {
        $origen = $this->empresa('desde');
        $destino = $this->empresa('hacia');

        if ($origen === null || $destino === null) {
            return self::FAILURE;
        }

        if ($origen->is($destino)) {
            $this->error('La empresa de origen y la de destino son la misma.');

            return self::FAILURE;
        }

        $solo = array_values(array_filter(array_map('trim', explode(',', (string) $this->option('solo')))));
        $desconocidas = array_diff($solo, array_keys(self::INTEGRACIONES));
        if ($desconocidas !== []) {
            $this->error('Integraciones desconocidas: '.implode(', ', $desconocidas).'. Válidas: '.implode(', ', array_keys(self::INTEGRACIONES)));

            return self::FAILURE;
        }

        $aplicar = (bool) $this->option('aplicar');
        $this->info(($aplicar ? 'APLICANDO' : 'SIMULACRO').": #{$origen->id} {$origen->razon_social}  →  #{$destino->id} {$destino->razon_social}");

        $plan = [];
        foreach (self::INTEGRACIONES as $nombre => $def) {
            if ($solo !== [] && ! in_array($nombre, $solo, true)) {
                continue;
            }

            $plan[$nombre] = $this->planear($nombre, $def, $origen, $destino);
            $this->line(sprintf('  %-15s %s', $nombre, $plan[$nombre]['mensaje']));
        }

        $acciones = array_filter($plan, fn ($p) => $p['accion'] !== 'nada' && $p['accion'] !== 'conflicto');
        $conflictos = array_filter($plan, fn ($p) => $p['accion'] === 'conflicto');

        if ($conflictos !== []) {
            $this->warn('Hay integraciones en conflicto: no se tocan. Usa --solo para excluirlas o --forzar para pisar la del destino.');
        }

        if (! $aplicar) {
            $this->line('Simulacro: no se escribió nada. Repite con --aplicar para ejecutar.');

            return $conflictos === [] ? self::SUCCESS : self::FAILURE;
        }

        if ($acciones === []) {
            $this->info('No hay nada que mover.');

            return $conflictos === [] ? self::SUCCESS : self::FAILURE;
        }

        $columnas = collect(Schema::getColumns('empresas'))->keyBy('name');

        DB::transaction(function () use ($acciones, $origen, $destino, $columnas) {
            foreach ($acciones as $nombre => $p) {
                $def = self::INTEGRACIONES[$nombre];

                if ($p['accion'] === 'mover') {
                    foreach ($def['campos'] as $campo) {
                        $destino->setAttribute($campo, $origen->getAttribute($campo));
                    }
                    $destino->setAttribute($def['activo'], true);
                }

                // En el origen queda apagada y sin credenciales. Las columnas
                // que no admiten NULL (llave propia de la empresa) se
                // regeneran, así la llave vieja deja de servir.
                $origen->setAttribute($def['activo'], false);
                foreach ($def['campos'] as $campo) {
                    $origen->setAttribute($campo, $this->vacio($campo, $columnas->get($campo)));
                }
            }

            $destino->save();
            $origen->save();
        });

        foreach ($acciones as $nombre => $p) {
            Log::info("empresa:mover-integraciones {$nombre} {$p['accion']}", ['desde' => $origen->id, 'hacia' => $destino->id]);
        }

        $this->info(count($acciones).' integraciones procesadas.');

        if (isset($acciones['biotime'])) {
            $this->line("Siguiente paso: php artisan biotime:sync --empresa={$destino->id} --full");
        }

        return $conflictos === [] ? self::SUCCESS : self::FAILURE;
    }

    /**
     * @return array{accion: string, mensaje: string}  accion: mover | apagar-origen | nada | conflicto
     */
    private function planear(string $nombre, array $def, Empresa $origen, Empresa $destino): array
    {
        $configurada = fn (Empresa $e) => filled($e->getAttribute($def['prueba']));

        if (! $origen->getAttribute($def['activo']) || ! $configurada($origen)) {
            return ['accion' => 'nada', 'mensaje' => 'el origen no la tiene activa y configurada; no se toca'];
        }

        if ($configurada($destino)) {
            $igual = collect($def['identidad'])->every(
                fn ($c) => (string) $origen->getAttribute($c) === (string) $destino->getAttribute($c)
            );

            if ($igual) {
                return ['accion' => 'apagar-origen', 'mensaje' => 'el destino ya usa la misma conexión; sólo se apaga en el origen'];
            }

            if (! $this->option('forzar')) {
                return ['accion' => 'conflicto', 'mensaje' => 'el destino ya tiene OTRA configuración distinta'];
            }
        }

        return ['accion' => 'mover', 'mensaje' => 'se pasa al destino y se apaga/limpia en el origen'];
    }

    private function vacio(string $campo, ?array $columna): mixed
    {
        if ($campo === 'whatsapp_api_key') {
            return Str::random(32);
        }

        if ($columna !== null && ! ($columna['nullable'] ?? true)) {
            return $columna['default'] ?? '';
        }

        return null;
    }

    private function empresa(string $opcion): ?Empresa
    {
        $id = $this->option($opcion);

        if (! ctype_digit((string) $id)) {
            $this->error("Falta --{$opcion}=<id de empresa>.");

            return null;
        }

        $empresa = Empresa::withoutTenant()->find((int) $id);

        if ($empresa === null) {
            $this->error("No existe la empresa #{$id}.");
        }

        return $empresa;
    }
}
