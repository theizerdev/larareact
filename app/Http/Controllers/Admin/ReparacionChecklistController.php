<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReparacionChecklistItem;
use App\Models\Sucursal;
use App\Services\PostServicioChecklistService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReparacionChecklistController extends Controller
{
    public function __construct(protected PostServicioChecklistService $service) {}

    /**
     * Vista de gestión de configuración de Post-reparación en el menú principal.
     * GET /admin/reparaciones/post-reparacion
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
        $hasCompanyItems = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->whereNull('sucursal_id')
            ->exists();
        if (!$hasCompanyItems) {
            $this->service->seedDefaultsForEmpresa($empresaId, null);
        }

        $isBranchCustomized = false;
        if ($sucursalId) {
            $isBranchCustomized = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('sucursal_id', $sucursalId)
                ->exists();
        }

        $grouped = $this->service->getChecklistForBranch($empresaId, $sucursalId);

        $raw = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
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

        return Inertia::render('admin/Reparaciones/PostReparacionConfig', [
            'sucursales' => $sucursales,
            'initialItems' => $raw,
            'initialGrouped' => $grouped,
            'initialSucursalId' => $sucursalId,
            'isBranchCustomized' => $isBranchCustomized,
        ]);
    }

    /**
     * Devuelve los ítems agrupados por sección para una empresa/sucursal.
     * GET /admin/reparaciones/checklist?sucursal_id=X
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
        $hasCompanyItems = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->whereNull('sucursal_id')
            ->exists();
        if (!$hasCompanyItems) {
            $this->service->seedDefaultsForEmpresa($empresaId, null);
        }

        $isBranchCustomized = false;
        if ($sucursalId) {
            $isBranchCustomized = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('sucursal_id', $sucursalId)
                ->exists();
        }

        $grouped = $this->service->getChecklistForBranch($empresaId, $sucursalId);

        $raw = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
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
     * Crea un nuevo punto de checklist.
     * POST /admin/reparaciones/checklist
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'seccion'     => 'required|in:validacion,limpieza,qc',
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'icono'       => 'nullable|string|max:50',
            'sucursal_id' => 'nullable|integer|exists:sucursales,id',
        ]);

        $user      = auth()->user();
        $empresaId = $user->empresa_id;

        // Calcular el siguiente número de orden
        $nextOrden = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('sucursal_id', $validated['sucursal_id'] ?? null)
            ->where('seccion', $validated['seccion'])
            ->max('orden') + 1;

        $item = ReparacionChecklistItem::withoutGlobalScope('multitenancy')->create([
            'empresa_id'  => $empresaId,
            'sucursal_id' => $validated['sucursal_id'] ?? null,
            'seccion'     => $validated['seccion'],
            'nombre'      => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'icono'       => $validated['icono'] ?? null,
            'orden'       => $nextOrden,
            'activo'      => true,
            'is_default'  => false,
        ]);

        return response()->json([
            'success' => true,
            'item'    => $item,
            'message' => "Punto '{$item->nombre}' agregado correctamente.",
        ]);
    }

    /**
     * Actualiza un punto de checklist existente.
     * PUT /admin/reparaciones/checklist/{item}
     */
    public function update(Request $request, $id)
    {
        $user  = auth()->user();
        $item  = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('id', $id)
            ->where('empresa_id', $user->empresa_id)
            ->firstOrFail();

        $validated = $request->validate([
            'nombre'      => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'icono'       => 'nullable|string|max:50',
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
     * Elimina un punto de checklist.
     * DELETE /admin/reparaciones/checklist/{item}
     */
    public function destroy($id)
    {
        $user = auth()->user();
        $item = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
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
     * POST /admin/reparaciones/checklist/reset-defaults
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
            'message' => 'Checklist restaurado a los valores por defecto correctamente.',
        ]);
    }

    /**
     * Copia la configuración de empresa a una sucursal específica.
     * POST /admin/reparaciones/checklist/copy-to-branch
     */
    public function copyToBranch(Request $request)
    {
        $validated = $request->validate([
            'sucursal_id' => 'required|integer|exists:sucursales,id',
        ]);

        $user        = auth()->user();
        $empresaId   = $user->empresa_id;
        $sucursalId  = $validated['sucursal_id'];

        // Verificar que la sucursal pertenece a la empresa
        $sucursal = Sucursal::withoutGlobalScope('multitenancy')
            ->where('id', $sucursalId)
            ->where('empresa_id', $empresaId)
            ->firstOrFail();

        // Obtener ítems base de la empresa (sin sucursal específica)
        $empresaItems = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->whereNull('sucursal_id')
            ->orderBy('orden')
            ->get();

        // Eliminar ítems actuales de la sucursal
        ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('sucursal_id', $sucursalId)
            ->delete();

        // Copiar los de empresa a la sucursal
        foreach ($empresaItems as $item) {
            ReparacionChecklistItem::withoutGlobalScope('multitenancy')->create([
                'empresa_id'  => $empresaId,
                'sucursal_id' => $sucursalId,
                'seccion'     => $item->seccion,
                'nombre'      => $item->nombre,
                'descripcion' => $item->descripcion,
                'icono'       => $item->icono,
                'orden'       => $item->orden,
                'activo'      => $item->activo,
                'is_default'  => $item->is_default,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Configuración copiada a la sucursal '{$sucursal->nombre}' correctamente.",
        ]);
    }

    /**
     * Reordena los puntos de una sección.
     * POST /admin/reparaciones/checklist/reorder
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
            ReparacionChecklistItem::withoutGlobalScope('multitenancy')
                ->where('id', $itemData['id'])
                ->where('empresa_id', $empresaId)
                ->update(['orden' => $itemData['orden']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Orden de los puntos actualizado correctamente.',
        ]);
    }

    /**
     * Activa o desactiva todos los puntos de una sección en lote.
     * POST /admin/reparaciones/checklist/batch-toggle
     */
    public function batchToggle(Request $request)
    {
        $validated = $request->validate([
            'seccion'     => 'required|in:validacion,limpieza,qc',
            'activo'      => 'required|boolean',
            'sucursal_id' => 'nullable|integer|exists:sucursales,id',
        ]);

        $user = auth()->user();
        $empresaId = $user->empresa_id;
        $sucursalId = $validated['sucursal_id'] ?? null;
        $activo = (bool) $validated['activo'];

        // Determinar si la sucursal tiene ítems propios
        $isBranchCustomized = false;
        if ($sucursalId) {
            $isBranchCustomized = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('sucursal_id', $sucursalId)
                ->exists();
        }

        $query = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
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
     * POST /admin/reparaciones/checklist/{item}/duplicate
     */
    public function duplicate($id)
    {
        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $original = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('id', $id)
            ->where('empresa_id', $empresaId)
            ->firstOrFail();

        $maxOrden = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('sucursal_id', $original->sucursal_id)
            ->where('seccion', $original->seccion)
            ->max('orden') ?? 0;

        $copy = ReparacionChecklistItem::withoutGlobalScope('multitenancy')->create([
            'empresa_id'  => $empresaId,
            'sucursal_id' => $original->sucursal_id,
            'seccion'     => $original->seccion,
            'nombre'      => $original->nombre . ' (Copia)',
            'descripcion' => $original->descripcion,
            'icono'       => $original->icono,
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
