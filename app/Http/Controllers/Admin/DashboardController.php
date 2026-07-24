<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use App\Models\EmpleadoPreRegistro;
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
