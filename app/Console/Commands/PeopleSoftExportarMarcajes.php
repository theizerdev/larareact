<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Models\PeoplesoftExportacion;
use App\Services\PeopleSoft\PeopleSoftExportService;
use App\Services\PeopleSoft\PunchedTimeMessageBuilder;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

/**
 * Exporta marcajes de ZKTeco (espejo `biotime_marcajes`) a PeopleSoft Time and
 * Labor como mensajes PUNCHED_TIME_ADD.
 *
 * POR DEFECTO NO ENVÍA NADA. Sin --enviar sólo genera el payload y lo deja
 * registrado en `peoplesoft_exportaciones` para revisarlo. Y aun con --enviar,
 * hace falta que config('peoplesoft.enabled') sea true y dry_run false.
 *
 * A propósito NO está dado de alta en el scheduler: se agrega a
 * bootstrap/app.php el día que la integración esté validada contra el entorno
 * del cliente.
 */
class PeopleSoftExportarMarcajes extends Command
{
    protected $signature = 'peoplesoft:exportar-marcajes
        {--empresa= : ID de una empresa concreta (por defecto: todas con biotime_active)}
        {--desde= : Inicio de la ventana (fecha u hora ISO). Por defecto: config(peoplesoft.window_hours) hacia atrás}
        {--hasta= : Fin de la ventana (fecha u hora ISO). Por defecto: ahora}
        {--enviar : Intenta el envío real. Sin esta bandera todo queda en simulación}
        {--mostrar-xml : Imprime el XML del primer lote generado (para revisarlo o compartirlo con el cliente)}';

    protected $description = 'Traduce marcajes de ZKTeco al layout TL_PUNCH_INTFC y los entrega (o simula) a PeopleSoft Time and Labor';

    public function handle(): int
    {
        $hasta = $this->option('hasta')
            ? CarbonImmutable::parse((string) $this->option('hasta'))
            : CarbonImmutable::now();

        $desde = $this->option('desde')
            ? CarbonImmutable::parse((string) $this->option('desde'))
            : $hasta->subHours((int) config('peoplesoft.window_hours', 24));

        if ($desde->greaterThan($hasta)) {
            $this->error('La fecha --desde es posterior a --hasta.');

            return self::FAILURE;
        }

        $empresas = Empresa::query()
            ->when($this->option('empresa'), fn ($q, $id) => $q->whereKey($id))
            ->when(! $this->option('empresa'), fn ($q) => $q->where('biotime_active', true))
            ->get();

        if ($empresas->isEmpty()) {
            $this->warn('No hay empresas para exportar.');

            return self::SUCCESS;
        }

        $enviar = (bool) $this->option('enviar');

        $this->line('Ventana: '.$desde->toDateTimeString().' → '.$hasta->toDateTimeString());
        $this->line($this->modoTexto($enviar));
        $this->newLine();

        $exit = self::SUCCESS;

        foreach ($empresas as $empresa) {
            $this->info("→ Empresa #{$empresa->id} ({$empresa->razon_social})");

            $resumen = PeopleSoftExportService::make()->exportar($empresa, $desde, $hasta, $enviar);

            $this->table(
                ['Revisados', 'Mapeados', 'Omitidos', 'Ya enviados', 'Simulados', 'Enviados', 'Errores'],
                [[
                    $resumen['revisados'],
                    $resumen['mapeados'],
                    $resumen['omitidos'],
                    $resumen['ya_enviados'],
                    $resumen['simulados'],
                    $resumen['enviados'],
                    $resumen['errores'],
                ]],
            );

            foreach ($resumen['lotes'] as $lote) {
                $this->line(sprintf(
                    '   lote %s · %d marcajes · %s · %d bytes',
                    substr((string) $lote['lote'], 0, 8),
                    $lote['marcajes'],
                    $lote['resultado'],
                    $lote['bytes'],
                ));
            }

            foreach ($resumen['mensajes'] as $mensaje) {
                $this->warn('   '.$mensaje);
            }

            if (! $resumen['ok']) {
                $exit = self::FAILURE;
            }
        }

        if ($this->option('mostrar-xml')) {
            $this->mostrarXml($empresas->first(), $desde, $hasta);
        }

        return $exit;
    }

    private function modoTexto(bool $enviar): string
    {
        if (! $enviar) {
            return 'Modo: SIMULACIÓN (no se envía nada). Usa --enviar para intentar el envío real.';
        }

        if (! config('peoplesoft.enabled')) {
            return 'Modo: SIMULACIÓN forzada — la integración está desactivada (PEOPLESOFT_ENABLED=false).';
        }

        if (config('peoplesoft.dry_run')) {
            return 'Modo: SIMULACIÓN forzada — PEOPLESOFT_DRY_RUN=true.';
        }

        return 'Modo: ENVÍO REAL a PeopleSoft.';
    }

    /**
     * Reconstruye el XML de una muestra para poder inspeccionarlo. No envía.
     */
    private function mostrarXml(?Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta): void
    {
        if (! $empresa) {
            return;
        }

        $exportaciones = PeoplesoftExportacion::query()
            ->where('empresa_id', $empresa->id)
            ->whereNotNull('payload')
            ->whereNotNull('lote_uuid')
            ->orderByDesc('id')
            ->limit((int) config('peoplesoft.batch_size', 250))
            ->get()
            ->reverse()
            ->values();

        if ($exportaciones->isEmpty()) {
            $this->warn('No hay payloads generados que mostrar.');

            return;
        }

        $xml = (new PunchedTimeMessageBuilder)
            ->build($exportaciones->pluck('payload')->all());

        $this->newLine();
        $this->line('--- Mensaje PUNCHED_TIME_ADD ('.$exportaciones->count().' marcajes) ---');
        $this->line($xml);
    }
}
