<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\ContpaqiExportacion;
use App\Models\Empleado;
use App\Models\EmpleadoPreRegistro;
use App\Models\IncidenciaEmpleado;
use App\Models\Productor;
use App\Models\Proveedor;
use App\Models\VisitaAcceso;
use App\Models\VisitaTemporal;
use App\Models\User;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\Departamento;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $moduleStats = $this->getModuleOverview();

        return Inertia::render('dashboard', [
            'moduleStats' => $moduleStats,
        ]);
    }

    private function getModuleOverview(): array
    {
        return [
            'garita' => [
                'total_accesos' => VisitaAcceso::count(),
                'accesos_hoy' => VisitaAcceso::where(function ($query) {
                    $query->whereDate('created_at', now()->today())
                        ->orWhereDate('fecha_ingreso', now()->today());
                })->count(),
                'activos_dentro' => VisitaAcceso::whereNull('fecha_salida')->count(),
            ],
            'empleados' => [
                'total' => Empleado::count(),
                'preregistros_pendientes' => EmpleadoPreRegistro::where('status', 'pendiente')->count(),
            ],
            'proveedores' => [
                'total' => Proveedor::count(),
            ],
            'productores' => [
                'total' => Productor::count(),
            ],
            'visitas_temporales' => [
                'total' => VisitaTemporal::count(),
                'visitas_hoy' => VisitaTemporal::where(function ($query) {
                    $query->whereDate('created_at', now()->today())
                        ->orWhereDate('fecha_ingreso', now()->today());
                })->count(),
            ],
            'organizacion' => [
                'empresas' => Empresa::count(),
                'sucursales' => Sucursal::count(),
                'departamentos' => Departamento::count(),
                'usuarios' => User::count(),
            ],
            'nomina' => $this->resumenNomina(),
        ];
    }

    /**
     * Lo que alguien de nómina necesita ver al entrar: cuántas incidencias
     * esperan aprobación, cuántos empleados no saldrían en el archivo por no
     * tener código de CONTPAQi, y qué pasó con la última exportación.
     *
     * Null cuando el módulo no está publicado, para que el dashboard no
     * anuncie una sección que el menú esconde.
     *
     * @return array{pendientes: int, sin_mapeo: int, ultima: array{periodo_inicio: string, periodo_fin: string, estado: string, empleados_exportados: int}|null}|null
     */
    private function resumenNomina(): ?array
    {
        if (! config('contpaqi.modulo_visible', false)) {
            return null;
        }

        $empresaId = auth()->user()?->empresa_id;

        $ultima = ContpaqiExportacion::query()
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->orderByDesc('created_at')
            ->first(['periodo_inicio', 'periodo_fin', 'estado', 'empleados_exportados']);

        return [
            'pendientes' => IncidenciaEmpleado::query()
                ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
                ->whereIn('estado', [IncidenciaEmpleado::ESTADO_BORRADOR, IncidenciaEmpleado::ESTADO_PENDIENTE])
                ->count(),
            'sin_mapeo' => Empleado::query()
                ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
                ->where('status', true)
                ->whereNotIn('id', ContpaqiEmpleadoMapeo::query()
                    ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
                    ->select('empleado_id'))
                ->count(),
            'ultima' => $ultima === null ? null : [
                'periodo_inicio' => $ultima->periodo_inicio->toDateString(),
                'periodo_fin' => $ultima->periodo_fin->toDateString(),
                'estado' => $ultima->estado,
                'empleados_exportados' => (int) $ultima->empleados_exportados,
            ],
        ];
    }

    public function stats(Request $request)
    {
        $start = $request->query('start', now()->subDays(7)->toDateString());
        $end   = $request->query('end', now()->toDateString());

        $dates = [];
        $accesos = [];
        $visitasTemporales = [];

        try {
            $startDate = new \DateTime($start);
            $endDate   = new \DateTime($end);
            $period    = new \DatePeriod(
                $startDate,
                new \DateInterval('P1D'),
                (clone $endDate)->modify('+1 day')
            );

            foreach ($period as $dt) {
                $dateStr = $dt->format('Y-m-d');
                $dates[] = $dateStr;

                // Exact database query for VisitaAcceso per day
                $cAccesos = VisitaAcceso::where(function ($query) use ($dateStr) {
                    $query->whereDate('created_at', $dateStr)
                        ->orWhereDate('fecha_ingreso', $dateStr);
                })->count();

                // Exact database query for VisitaTemporal per day
                $cTemporales = VisitaTemporal::where(function ($query) use ($dateStr) {
                    $query->whereDate('created_at', $dateStr)
                        ->orWhereDate('fecha_ingreso', $dateStr);
                })->count();

                $accesos[] = $cAccesos;
                $visitasTemporales[] = $cTemporales;
            }
        } catch (\Exception $e) {
            for ($i = 6; $i >= 0; $i--) {
                $dateStr = now()->subDays($i)->format('Y-m-d');
                $dates[] = $dateStr;
                $accesos[] = 0;
                $visitasTemporales[] = 0;
            }
        }

        return response()->json([
            'dates' => $dates,
            'accesos' => $accesos,
            'visitas_temporales' => $visitasTemporales,
            'overview' => $this->getModuleOverview(),
        ]);
    }
}
