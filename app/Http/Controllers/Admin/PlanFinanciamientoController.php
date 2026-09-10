<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlanFinanciamiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PlanFinanciamientoController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $frecuencia = $request->input('frecuencia');
        $perPage = $request->input('perPage', 10);

        $query = PlanFinanciamiento::query()->withCount('creditos');

        if ($search) {
            $query->where('nombre', 'like', "%{$search}%")
                ->orWhere('descripcion', 'like', "%{$search}%");
        }

        if ($frecuencia) {
            $query->where('frecuencia', $frecuencia);
        }

        $planes = $query->latest()->paginate($perPage)->withQueryString();

        $stats = [
            'total' => PlanFinanciamiento::count(),
            'activos' => PlanFinanciamiento::where('activo', true)->count(),
        ];

        return inertia('admin/Planes/Index', [
            'planes' => $planes,
            'stats' => $stats,
            'filters' => $request->only(['search', 'frecuencia', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'frecuencia' => 'required|in:semanal,quincenal,mensual',
            'numero_cuotas' => 'required|integer|min:1|max:60',
            'porcentaje_inicial_minimo' => 'required|numeric|min:0|max:99',
            'porcentaje_interes_total' => 'required|numeric|min:0|max:100',
            'dias_gracia' => 'required|integer|min:0|max:30',
            'mora_diaria_porcentaje' => 'required|numeric|min:0|max:10',
            'activo' => 'boolean',
        ]);

        try {
            PlanFinanciamiento::create($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Plan de financiamiento creado correctamente.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al crear plan de financiamiento: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Ocurrió un error al crear el plan de financiamiento.'),
            ]);
        }
    }

    public function update(Request $request, PlanFinanciamiento $plan)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'frecuencia' => 'required|in:semanal,quincenal,mensual',
            'numero_cuotas' => 'required|integer|min:1|max:60',
            'porcentaje_inicial_minimo' => 'required|numeric|min:0|max:99',
            'porcentaje_interes_total' => 'required|numeric|min:0|max:100',
            'dias_gracia' => 'required|integer|min:0|max:30',
            'mora_diaria_porcentaje' => 'required|numeric|min:0|max:10',
            'activo' => 'boolean',
        ]);

        try {
            $plan->update($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Plan de financiamiento actualizado correctamente.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar plan {$plan->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al actualizar el plan.'),
            ]);
        }
    }

    public function toggleStatus(PlanFinanciamiento $plan)
    {
        try {
            $plan->activo = !$plan->activo;
            $plan->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Estado del plan actualizado correctamente.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado del plan {$plan->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al cambiar el estado del plan.'),
            ]);
        }
    }

    public function destroy(PlanFinanciamiento $plan)
    {
        if ($plan->creditos()->exists()) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No se puede eliminar un plan con créditos asociados. Puedes desactivarlo en su lugar.'),
            ]);
        }

        try {
            $plan->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Plan de financiamiento eliminado.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar plan {$plan->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al eliminar el plan.'),
            ]);
        }
    }
}

