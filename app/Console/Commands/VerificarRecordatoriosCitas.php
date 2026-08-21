<?php

namespace App\Console\Commands;

use App\Models\CitaRecordatorio;
use Carbon\Carbon;
use Illuminate\Console\Command;

class VerificarRecordatoriosCitas extends Command
{
    protected $signature = 'citas:verificar-recordatorios {--empresa= : ID de la empresa}';

    protected $description = 'Verificar el estado de los recordatorios de citas';

    public function handle()
    {
        $empresaId = $this->option('empresa');

        $this->info('📊 Verificando estado de recordatorios de citas...');

        // Estadísticas generales
        $total = CitaRecordatorio::when($empresaId, function ($query) use ($empresaId) {
            $query->whereHas('cita', function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId);
            });
        })->count();

        $pendientes = CitaRecordatorio::pendientes()
            ->when($empresaId, function ($query) use ($empresaId) {
                $query->whereHas('cita', function ($q) use ($empresaId) {
                    $q->where('empresa_id', $empresaId);
                });
            })->count();

        $enviados = CitaRecordatorio::where('estado', 'enviado')
            ->when($empresaId, function ($query) use ($empresaId) {
                $query->whereHas('cita', function ($q) use ($empresaId) {
                    $q->where('empresa_id', $empresaId);
                });
            })->count();

        $fallidos = CitaRecordatorio::where('estado', 'fallido')
            ->when($empresaId, function ($query) use ($empresaId) {
                $query->whereHas('cita', function ($q) use ($empresaId) {
                    $q->where('empresa_id', $empresaId);
                });
            })->count();

        $this->info('📈 Estadísticas Generales:');
        $this->info("   📋 Total de recordatorios: {$total}");
        $this->info("   ⏰ Pendientes: {$pendientes}");
        $this->info("   ✅ Enviados: {$enviados}");
        $this->info("   ❌ Fallidos: {$fallidos}");

        // Recordatorios por tipo
        $this->info("\n📅 Por Tipo:");
        $porTipo = CitaRecordatorio::when($empresaId, function ($query) use ($empresaId) {
            $query->whereHas('cita', function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId);
            });
        })
            ->selectRaw('tipo, COUNT(*) as total')
            ->groupBy('tipo')
            ->get();

        foreach ($porTipo as $tipo) {
            $this->info("   {$tipo->tipo}: {$tipo->total}");
        }

        // Recordatorios por canal
        $this->info("\n📱 Por Canal:");
        $porCanal = CitaRecordatorio::when($empresaId, function ($query) use ($empresaId) {
            $query->whereHas('cita', function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId);
            });
        })
            ->selectRaw('canal, COUNT(*) as total')
            ->groupBy('canal')
            ->get();

        foreach ($porCanal as $canal) {
            $this->info("   {$canal->canal}: {$canal->total}");
        }

        // Recordatorios próximos a vencer (en las próximas 2 horas)
        $this->info("\n⏰ Próximos a vencer (2 horas):");
        $proximos = CitaRecordatorio::pendientes()
            ->when($empresaId, function ($query) use ($empresaId) {
                $query->whereHas('cita', function ($q) use ($empresaId) {
                    $q->where('empresa_id', $empresaId);
                });
            })
            ->where('fecha_envio_programado', '<=', Carbon::now()->addHours(2))
            ->with(['cita.paciente', 'cita.medico'])
            ->get();

        if ($proximos->isEmpty()) {
            $this->info('   No hay recordatorios próximos a vencer.');
        } else {
            foreach ($proximos as $recordatorio) {
                $cita = $recordatorio->cita;
                $this->info("   📅 Cita #{$cita->id} - {$cita->paciente->nombre_completo} con {$cita->medico->nombre_completo}");
                $this->info("      Tipo: {$recordatorio->tipo} | Programado: {$recordatorio->fecha_envio_programado->format('d/m/Y H:i')}");
            }
        }

        // Recordatorios vencidos
        $this->info("\n⚠️ Vencidos:");
        $vencidos = CitaRecordatorio::pendientes()
            ->when($empresaId, function ($query) use ($empresaId) {
                $query->whereHas('cita', function ($q) use ($empresaId) {
                    $q->where('empresa_id', $empresaId);
                });
            })
            ->where('fecha_envio_programado', '<', Carbon::now())
            ->count();

        if ($vencidos > 0) {
            $this->warn("   ⚠️  Hay {$vencidos} recordatorios vencidos que deben ser procesados.");
            $this->info('   Ejecute: php artisan citas:procesar-recordatorios');
        } else {
            $this->info('   No hay recordatorios vencidos.');
        }

        // Errores recientes
        $this->info("\n❌ Errores Recientes (últimas 24h):");
        $errores = CitaRecordatorio::where('estado', 'fallido')
            ->when($empresaId, function ($query) use ($empresaId) {
                $query->whereHas('cita', function ($q) use ($empresaId) {
                    $q->where('empresa_id', $empresaId);
                });
            })
            ->where('updated_at', '>=', Carbon::now()->subHours(24))
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        if ($errores->isEmpty()) {
            $this->info('   No hay errores recientes.');
        } else {
            foreach ($errores as $error) {
                $this->error("   Cita #{$error->cita_id} - {$error->error_mensaje}");
            }
        }

        $this->info("\n✅ Verificación completada!");

        return Command::SUCCESS;
    }
}
