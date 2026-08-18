<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Especialidad;
use App\Models\RamaMedica;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmpresaEspecialidadController extends Controller
{
    /**
     * Display specialty configuration for the active or given empresa.
     */
    public function edit(Request $request, ?Empresa $empresa = null): Response
    {
        $user = $request->user();

        // Si no se especifica empresa, tomar la del usuario autenticado
        $targetEmpresa = $empresa && $empresa->exists ? $empresa : $user->empresa;

        if (! $targetEmpresa) {
            abort(404, 'Empresa no encontrada.');
        }

        // Cargar todas las ramas con sus especialidades activas y plantillas
        $ramas = RamaMedica::with(['especialidades' => function ($query) {
            $query->where('status', true)->with('plantillas');
        }])->where('status', true)->get();

        // Especialidades asignadas a esta empresa
        $empresaEspecialidades = $targetEmpresa->especialidades()
            ->get(['especialidades.id', 'empresa_especialidades.es_principal']);

        $especialidadesSeleccionadas = array_map('intval', $empresaEspecialidades->pluck('id')->toArray());
        $principalItem = $empresaEspecialidades->first(fn ($item) => (bool) $item->pivot->es_principal);
        $principalId = $principalItem ? (int) $principalItem->id : ($especialidadesSeleccionadas[0] ?? null);

        return Inertia::render('admin/Empresas/EspecialidadesConfig', [
            'empresa' => $targetEmpresa,
            'ramas' => $ramas,
            'especialidadesSeleccionadas' => $especialidadesSeleccionadas,
            'principalId' => $principalId,
        ]);
    }

    /**
     * Update specialty configuration for the empresa.
     */
    public function update(Request $request, Empresa $empresa)
    {
        $request->validate([
            'especialidades' => 'required|array|min:1',
            'especialidades.*' => 'exists:especialidades,id',
            'especialidad_principal_id' => 'required|exists:especialidades,id',
        ]);

        $especialidadesIds = $request->input('especialidades', []);
        $principalId = (int) $request->input('especialidad_principal_id');

        if (! in_array($principalId, $especialidadesIds)) {
            $especialidadesIds[] = $principalId;
        }

        // Preparar sincronización pivot
        $syncData = [];
        foreach ($especialidadesIds as $espId) {
            $syncData[$espId] = [
                'es_principal' => $espId === $principalId,
                'status' => true,
            ];
        }

        $empresa->especialidades()->sync($syncData);

        return back()->with('success', 'Configuración de especialidades médicas actualizada con éxito.');
    }
}
