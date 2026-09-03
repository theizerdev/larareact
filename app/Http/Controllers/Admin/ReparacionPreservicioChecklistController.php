<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReparacionPreservicioItem;
use App\Models\Sucursal;
use App\Services\PreservicioChecklistService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReparacionPreservicioChecklistController extends Controller
{
    public function __construct(protected PreservicioChecklistService $service) {}

    /**
     * Vista de gestión de configuración de Preservicio e Inspección Inicial.
     * GET /admin/reparaciones/preservicio-config
     */
    public function indexPage(Request $request)
    {
        $user = auth()->user();
        $empresaId = $user->empresa_id;

        // Si no se especifica en la URL, inicializar con la sucursal activa del usuario
        $sucursalId = $request->has('sucursal_id')
            ? ($request->integer('sucursal_id') ?: null)
            : ($user->sucursal_id ?: null);

        $sucursales = Sucursal::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('status', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        // Asegurar que existan ítems base para la empresa
        $hasCompanyItems = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->whereNull('sucursal_id')
            ->exists();
        if (!$hasCompanyItems) {
            $this->service->seedDefaultsForEmpresa($empresaId, null);
        }

        $isBranchCustomized = false;
        if ($sucursalId) {
            $isBranchCustomized = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('sucursal_id', $sucursalId)
                ->exists();
        }

        $grouped = $this->service->getChecklistForBranch($empresaId, $sucursalId);

        $raw = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($empresaId, $sucursalId, $isBranchCustomized) {
                if ($sucursalId && $isBranchCustomized) {
                    $q->where('sucursal_id', $sucursalId);
                } else {
                    $q->whereNull('sucursal_id');
                }
            })
            ->orderBy('seccion')
            ->orderBy('orden')
            ->get();

        return Inertia::render('admin/Reparaciones/PreservicioConfig', [
            'sucursales'         => $sucursales,
            'initialItems'       => $raw,
            'initialGrouped'     => $grouped,
            'initialSucursalId'  => $sucursalId,
            'isBranchCustomized' => $isBranchCustomized,
        ]);
    }

    /**
     * Devuelve los ítems agrupados por sección para una empresa/sucursal.
     * GET /admin/reparaciones/preservicio/checklist?sucursal_id=X
     */
    public function index(Request $request)
    {
        $user        = auth()->user();
        $empresaId   = $user->empresa_id;
        $sucursalId  = $request->integer('sucursal_id') ?: null;

        if ($sucursalId) {
            $sucursal = Sucursal::withoutGlobalScope('multitenancy')
                ->where('id', $sucursalId)
                ->where('empresa_id', $empresaId)
                ->first();
            if (!$sucursal) {
                $sucursalId = null;
            }
        }

        // Asegurar que existan ítems base para la empresa
        $hasCompanyItems = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->whereNull('sucursal_id')
            ->exists();
        if (!$hasCompanyItems) {
            $this->service->seedDefaultsForEmpresa($empresaId, null);
        }

        $isBranchCustomized = false;
        if ($sucursalId) {
            $isBranchCustomized = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('sucursal_id', $sucursalId)
                ->exists();
        }

        $grouped = $this->service->getChecklistForBranch($empresaId, $sucursalId);

        $raw = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($empresaId, $sucursalId, $isBranchCustomized) {
                if ($sucursalId && $isBranchCustomized) {
                    $q->where('sucursal_id', $sucursalId);
                } else {
                    $q->whereNull('sucursal_id');
                }
            })
            ->orderBy('seccion')
            ->orderBy('orden')
            ->get();

        $sucursales = Sucursal::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('status', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        return response()->json([
            'items'              => $raw,
            'grouped'            => $grouped,
            'sucursales'         => $sucursales,
            'isBranchCustomized' => $isBranchCustomized,
        ]);
    }

    /**
     * Crea un nuevo punto de preservicio.
     * POST /admin/reparaciones/preservicio/checklist
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'seccion'     => 'required|in:fisica,funcional,seguridad',
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'icono'       => 'nullable|string|max:50',
            'tipo_campo'  => 'nullable|string|in:estado_obs,boolean',
            'sucursal_id' => 'nullable|integer|exists:sucursales,id',
        ]);

        $user      = auth()->user();
        $empresaId = $user->empresa_id;

        // Calcular el siguiente número de orden
        $nextOrden = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('sucursal_id', $validated['sucursal_id'] ?? null)
            ->where('seccion', $validated['seccion'])
            ->max('orden') + 1;

        $item = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')->create([
            'empresa_id'  => $empresaId,
            'sucursal_id' => $validated['sucursal_id'] ?? null,
            'seccion'     => $validated['seccion'],
            'nombre'      => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'icono'       => $validated['icono'] ?? null,
            'tipo_campo'  => $validated['tipo_campo'] ?? ($validated['seccion'] === 'fisica' ? 'estado_obs' : 'boolean'),
            'orden'       => $nextOrden,
            'activo'      => true,
            'is_default'  => false,
        ]);

        return response()->json([
            'success' => true,
            'item'    => $item,
            'message' => "Punto '{$item->nombre}' agregado correctamente al Preservicio.",
        ]);
    }

    /**
     * Actualiza un punto de preservicio existente.
     * PUT /admin/reparaciones/preservicio/checklist/{item}
     */
    public function update(Request $request, $id)
    {
        $user  = auth()->user();
        $item  = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('id', $id)
            ->where('empresa_id', $user->empresa_id)
            ->firstOrFail();

        $validated = $request->validate([
            'nombre'      => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'icono'       => 'nullable|string|max:50',
            'tipo_campo'  => 'nullable|string|in:estado_obs,boolean',
            'orden'       => 'nullable|integer|min:0',
            'activo'      => 'sometimes|boolean',
        ]);

        $item->update($validated);

        return response()->json([
            'success' => true,
            'item'    => $item->fresh(),
            'message' => "Punto '{$item->nombre}' actualizado correctamente.",
        ]);
    }

    /**
     * Elimina un punto de preservicio.
     * DELETE /admin/reparaciones/preservicio/checklist/{item}
     */
    public function destroy($id)
    {
        $user = auth()->user();
        $item = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('id', $id)
            ->where('empresa_id', $user->empresa_id)
            ->firstOrFail();

        $nombre = $item->nombre;
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => "Punto '{$nombre}' eliminado correctamente.",
        ]);
    }

    /**
     * Restaura los ítems por defecto para la empresa/sucursal.
     * POST /admin/reparaciones/preservicio/checklist/reset-defaults
     */
    public function resetDefaults(Request $request)
    {
        $validated = $request->validate([
            'sucursal_id' => 'nullable|integer|exists:sucursales,id',
        ]);

        $user        = auth()->user();
        $empresaId   = $user->empresa_id;
        $sucursalId  = $validated['sucursal_id'] ?? null;

        $this->service->resetToDefaults($empresaId, $sucursalId);

        return response()->json([
            'success' => true,
            'message' => 'Plantilla de Preservicio restaurada a los valores por defecto.',
        ]);
    }

    /**
     * Copia la configuración de empresa a una sucursal específica.
     * POST /admin/reparaciones/preservicio/checklist/copy-to-branch
     */
    public function copyToBranch(Request $request)
    {
        $validated = $request->validate([
            'sucursal_id' => 'required|integer|exists:sucursales,id',
        ]);

        $user        = auth()->user();
        $empresaId   = $user->empresa_id;
        $sucursalId  = $validated['sucursal_id'];

        $sucursal = Sucursal::withoutGlobalScope('multitenancy')
            ->where('id', $sucursalId)
            ->where('empresa_id', $empresaId)
            ->firstOrFail();

        $empresaItems = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->whereNull('sucursal_id')
            ->orderBy('orden')
            ->get();

        ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('sucursal_id', $sucursalId)
            ->delete();

        foreach ($empresaItems as $item) {
            ReparacionPreservicioItem::withoutGlobalScope('multitenancy')->create([
                'empresa_id'  => $empresaId,
                'sucursal_id' => $sucursalId,
                'seccion'     => $item->seccion,
                'nombre'      => $item->nombre,
                'descripcion' => $item->descripcion,
                'icono'       => $item->icono,
                'tipo_campo'  => $item->tipo_campo,
                'orden'       => $item->orden,
                'activo'      => $item->activo,
                'is_default'  => $item->is_default,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Configuración de Preservicio copiada a '{$sucursal->nombre}' correctamente.",
        ]);
    }

    /**
     * Reordena los puntos de una sección.
     * POST /admin/reparaciones/preservicio/checklist/reorder
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'items'         => 'required|array',
            'items.*.id'    => 'required|integer',
            'items.*.orden' => 'required|integer|min:0',
        ]);

        $user = auth()->user();
        $empresaId = $user->empresa_id;

        foreach ($validated['items'] as $itemData) {
            ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
                ->where('id', $itemData['id'])
                ->where('empresa_id', $empresaId)
                ->update(['orden' => $itemData['orden']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Orden de los puntos de Preservicio actualizado.',
        ]);
    }

    /**
     * Activa o desactiva todos los puntos de una sección en lote.
     * POST /admin/reparaciones/preservicio/checklist/batch-toggle
     */
    public function batchToggle(Request $request)
    {
        $validated = $request->validate([
            'seccion'     => 'required|in:fisica,funcional,seguridad',
            'activo'      => 'required|boolean',
            'sucursal_id' => 'nullable|integer|exists:sucursales,id',
        ]);

        $user = auth()->user();
        $empresaId = $user->empresa_id;
        $sucursalId = $validated['sucursal_id'] ?? null;
        $activo = (bool) $validated['activo'];

        $isBranchCustomized = false;
        if ($sucursalId) {
            $isBranchCustomized = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('sucursal_id', $sucursalId)
                ->exists();
        }

        $query = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('seccion', $validated['seccion']);

        if ($sucursalId && $isBranchCustomized) {
            $query->where('sucursal_id', $sucursalId);
        } else {
            $query->whereNull('sucursal_id');
        }

        $query->update(['activo' => $activo]);

        $statusText = $activo ? 'activados' : 'desactivados';

        return response()->json([
            'success' => true,
            'message' => "Todos los puntos de la sección han sido {$statusText}.",
        ]);
    }

    /**
     * Duplica un punto existente.
     * POST /admin/reparaciones/preservicio/checklist/{item}/duplicate
     */
    public function duplicate($id)
    {
        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $original = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('id', $id)
            ->where('empresa_id', $empresaId)
            ->firstOrFail();

        $maxOrden = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('sucursal_id', $original->sucursal_id)
            ->where('seccion', $original->seccion)
            ->max('orden') ?? 0;

        $copy = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')->create([
            'empresa_id'  => $empresaId,
            'sucursal_id' => $original->sucursal_id,
            'seccion'     => $original->seccion,
            'nombre'      => $original->nombre . ' (Copia)',
            'descripcion' => $original->descripcion,
            'icono'       => $original->icono,
            'tipo_campo'  => $original->tipo_campo,
            'orden'       => $maxOrden + 1,
            'activo'      => true,
            'is_default'  => false,
        ]);

        return response()->json([
            'success' => true,
            'item'    => $copy,
            'message' => "Punto duplicado correctamente como '{$copy->nombre}'.",
        ]);
    }
}
