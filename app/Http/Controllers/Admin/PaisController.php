<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaisController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $continente = $request->input('continente');
        $perPage = (int) $request->input('perPage', 10);
        $sortBy = $request->input('sortBy', 'nombre');
        $sortDir = strtolower($request->input('sortDir', 'asc')) === 'desc' ? 'desc' : 'asc';

        $query = Pais::withCount(['empresas']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('codigo_iso2', 'like', "%{$search}%")
                    ->orWhere('codigo_iso3', 'like', "%{$search}%")
                    ->orWhere('codigo_telefonico', 'like', "%{$search}%")
                    ->orWhere('moneda_principal', 'like', "%{$search}%")
                    ->orWhere('continente', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            if ($status === '1' || $status === '0') {
                $query->where('activo', (bool) (int) $status);
            } elseif ($status === 'con_empresas') {
                $query->has('empresas');
            } elseif ($status === 'con_telefono') {
                $query->whereNotNull('codigo_telefonico')->where('codigo_telefonico', '!=', '');
            }
        }

        if ($continente) {
            $query->where('continente', $continente);
        }

        $allowedSortColumns = [
            'nombre',
            'codigo_iso2',
            'codigo_iso3',
            'codigo_telefonico',
            'moneda_principal',
            'continente',
            'activo',
            'empresas_count',
            'created_at',
        ];

        if (in_array($sortBy, $allowedSortColumns, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('nombre', 'asc');
        }

        $paises = $query->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Pais::count(),
            'activos' => Pais::where('activo', true)->count(),
            'inactivos' => Pais::where('activo', false)->count(),
            'con_empresas' => Pais::has('empresas')->count(),
            'con_telefono' => Pais::whereNotNull('codigo_telefonico')->where('codigo_telefonico', '!=', '')->count(),
        ];

        $continentes = Pais::whereNotNull('continente')
            ->where('continente', '!=', '')
            ->distinct()
            ->orderBy('continente', 'asc')
            ->pluck('continente');

        return inertia('admin/Paises/Index', [
            'paises' => $paises,
            'stats' => $stats,
            'continentes' => $continentes,
            'filters' => $request->only(['search', 'status', 'continente', 'perPage', 'sortBy', 'sortDir']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo_iso2' => 'required|string|max:2|unique:pais,codigo_iso2',
            'codigo_iso3' => 'required|string|max:3|unique:pais,codigo_iso3',
            'codigo_telefonico' => 'nullable|string|max:10',
            'moneda_principal' => 'nullable|string|max:3',
            'idioma_principal' => 'nullable|string|max:5',
            'continente' => 'nullable|string|max:50',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'zona_horaria' => 'nullable|string|max:50',
            'formato_fecha' => 'nullable|string|max:20',
            'formato_moneda' => 'nullable|string|max:20',
            'impuesto_predeterminado' => 'nullable|numeric|min:0',
            'separador_miles' => 'nullable|string|max:1',
            'separador_decimales' => 'nullable|string|max:1',
            'decimales_moneda' => 'nullable|integer|min:0',
            'activo' => 'boolean',
        ]);

        try {
            Pais::create($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Country created successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear el país: '.$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error creating the country. Please try again.'),
            ]);
        }
    }

    public function update(Request $request, Pais $pais)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo_iso2' => 'required|string|max:2|unique:pais,codigo_iso2,'.$pais->id,
            'codigo_iso3' => 'required|string|max:3|unique:pais,codigo_iso3,'.$pais->id,
            'codigo_telefonico' => 'nullable|string|max:10',
            'moneda_principal' => 'nullable|string|max:3',
            'idioma_principal' => 'nullable|string|max:5',
            'continente' => 'nullable|string|max:50',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'zona_horaria' => 'nullable|string|max:50',
            'formato_fecha' => 'nullable|string|max:20',
            'formato_moneda' => 'nullable|string|max:20',
            'impuesto_predeterminado' => 'nullable|numeric|min:0',
            'separador_miles' => 'nullable|string|max:1',
            'separador_decimales' => 'nullable|string|max:1',
            'decimales_moneda' => 'nullable|integer|min:0',
            'activo' => 'boolean',
        ]);

        try {
            DB::transaction(function () use ($pais, $validated) {
                $pais->update($validated);
            });

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Country updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar el país {$pais->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the country. Please try again.'),
            ]);
        }
    }

    public function destroy(Pais $pais)
    {
        try {
            $isReferenced = Empresa::where('pais_id', $pais->id)->exists()
                || Empresa::where('pais_telefono_id', $pais->id)->exists()
                || Sucursal::where('pais_telefono_id', $pais->id)->exists()
                || User::where('pais_telefono_id', $pais->id)->exists();

            if ($isReferenced) {
                return back()->with('notification', [
                    'type' => 'error',
                    'message' => __('Cannot delete this country because it is referenced by companies, branches or users.'),
                ]);
            }

            $pais->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Country deleted successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar el país {$pais->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error deleting the country. Please try again.'),
            ]);
        }
    }

    public function toggleStatus(Pais $pais)
    {
        try {
            $pais->activo = ! $pais->activo;
            $pais->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Status updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar el estado del país {$pais->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the status. Please try again.'),
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:pais,id',
        ]);

        $ids = $validated['ids'];
        $referenced = [];

        foreach ($ids as $id) {
            if (
                Empresa::where('pais_id', $id)->exists()
                || Empresa::where('pais_telefono_id', $id)->exists()
                || Sucursal::where('pais_telefono_id', $id)->exists()
                || User::where('pais_telefono_id', $id)->exists()
            ) {
                $referenced[] = $id;
            }
        }

        $deletable = array_values(array_diff($ids, $referenced));

        if (empty($deletable)) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Selected countries cannot be deleted because they are referenced by existing companies, branches or users.'),
            ]);
        }

        DB::beginTransaction();

        try {
            Pais::destroy($deletable);

            DB::commit();

            $message = count($deletable) > 1
                ? __('Selected countries have been deleted successfully.')
                : __('Selected country has been deleted successfully.');

            if (! empty($referenced)) {
                $message .= ' '.count($referenced).' '.__('countries could not be deleted because they have associated records.');
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en la eliminación masiva de países: '.$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error deleting the countries. Please try again.'),
            ]);
        }
    }
}
