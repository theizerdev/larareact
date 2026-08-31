<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\BioTimeSyncService;
use Illuminate\Console\Command;

class BioTimeSync extends Command
{
    protected $signature = 'biotime:sync
        {--empresa= : ID de una empresa concreta (por defecto: todas con biotime_active)}
        {--full : Backfill de marcajes desde config(biotime.backfill_from) en vez de incremental}
        {--only= : Lista separada por comas: terminals,catalogs,employees,transactions}
        {--since= : Fecha/hora ISO que fuerza el inicio de la ventana de marcajes}';

    protected $description = 'Sincroniza (solo lectura) relojes, empleados, catálogos y marcajes de BioTime PRO hacia las tablas espejo biotime_*';

    public function handle(): int
    {
        $only = array_values(array_filter(array_map('trim', explode(',', (string) $this->option('only')))));
        $invalid = array_diff($only, BioTimeSyncService::PARTS);
        if ($invalid !== []) {
            $this->error('Partes inválidas en --only: '.implode(', ', $invalid));
            $this->line('Válidas: '.implode(', ', BioTimeSyncService::PARTS));

            return self::FAILURE;
        }

        $empresas = Empresa::query()
            ->when($this->option('empresa'), fn ($q, $id) => $q->whereKey($id))
            ->when(! $this->option('empresa'), fn ($q) => $q->where('biotime_active', true))
            ->get();

        if ($empresas->isEmpty()) {
            $this->warn('No hay empresas con BioTime activo para sincronizar.');

            return self::SUCCESS;
        }

        $exit = self::SUCCESS;

        foreach ($empresas as $empresa) {
            $this->info("→ Empresa #{$empresa->id} ({$empresa->razon_social})");

            $summary = BioTimeSyncService::for($empresa)->sync(
                $empresa,
                only: $only,
                full: (bool) $this->option('full'),
                since: $this->option('since') ?: null,
            );

            foreach ($summary['parts'] as $part => $detail) {
                $this->line(sprintf('   %-13s %s', $part, json_encode($detail, JSON_UNESCAPED_UNICODE)));
            }

            foreach ($summary['errors'] as $err) {
                $this->error('   '.$err);
            }

            if (! $summary['ok']) {
                $exit = self::FAILURE;
            }
        }

        return $exit;
    }
}
