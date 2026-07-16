<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VisitaTemporal;
use App\Models\Responsable;
use App\Models\Pais;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VisitaTemporalController extends Controller
{
    public function index(Request $request)
    {
        $query = VisitaTemporal::query()
            ->with(['paisTelefono', 'empleado.departamento', 'empleado.cargo', 'responsable.departamento', 'responsable.cargo', 'empresa', 'sucursal'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%")
                        ->orWhere('telefono', 'like', "%{$search}%");
                });
            })
            ->when($request->fecha_ingreso, function ($q, $fecha) {
                $q->whereDate('fecha_ingreso', $fecha);
            });

        if ($request->filled('status') && $request->status !== 'none') {
            $query->where('status', $request->status);
        }

        $visitas = $query->latest()->paginate($request->perPage ?? 10)->withQueryString();

        $stats = [
            'total' => VisitaTemporal::count(),
            'activos' => VisitaTemporal::where('status', 'activo')->count(),
            'suspendidos' => VisitaTemporal::where('status', 'suspendido')->count(),
            'revision' => VisitaTemporal::where('status', 'en_revision')->count(),
        ];

        $user = $request->user();
        $empresa = Empresa::find($user->empresa_id) ?: Empresa::first();
        $sucursal = Sucursal::find($user->sucursal_id);

        $empleados = Empleado::where('status', 1)
            ->with(['responsable.departamento', 'responsable.cargo', 'departamento', 'cargo'])
            ->orderBy('nombres', 'asc')
            ->get(['id', 'nombres', 'apellidos', 'departamento_id', 'cargo_id', 'responsable_id']);

        $responsables = Responsable::where('status', 1)
            ->with(['departamento', 'cargo'])
            ->orderBy('nombres', 'asc')
            ->get(['id', 'nombres', 'apellidos', 'departamento_id', 'cargo_id']);

        $paises = Pais::where('activo', 1)
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']);

        return Inertia::render('admin/VisitasTemporales/Index', [
            'visitas' => $visitas,
            'stats' => $stats,
            'empleados' => $empleados,
            'responsables' => $responsables,
            'paises' => $paises,
            'filters' => $request->only('search', 'status', 'perPage', 'fecha_ingreso'),
            'empresa' => $empresa ? [
                'id' => $empresa->id,
                'razon_social' => $empresa->razon_social,
            ] : null,
            'sucursal' => $sucursal ? [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'documento_identidad' => 'required|string|max:100',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'telefono' => 'nullable|string|max:50',
            'empleado_id' => 'required|exists:empleados,id',
            'responsable_id' => 'required|exists:responsables,id',
            'motivo_visita' => 'nullable|string',
            'fecha_ingreso' => 'required|date',
            'hora_ingreso' => 'required',
            'fecha_salida' => 'required|date',
            'hora_salida' => 'required',
            'foto_carnet' => 'nullable|string',
            'foto_documento' => 'nullable|string',
            'status' => 'required|string|in:activo,suspendido,en_revision',
        ]);

        $user = $request->user();
        $validated['empresa_id'] = $user->empresa_id;
        $validated['sucursal_id'] = $user->sucursal_id;

        // Handle profile photo upload or camera base64
        $validated['foto_carnet'] = $this->handleImageUpload($request->input('foto_carnet'), 'foto_carnet');
        // Handle ID document photo upload or camera base64
        $validated['foto_documento'] = $this->handleImageUpload($request->input('foto_documento'), 'foto_documento');

        VisitaTemporal::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Temporary visit registered successfully.'),
        ]);
    }

    public function update(Request $request, VisitaTemporal $visitaTemporal)
    {
        $validated = $request->validate([
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'documento_identidad' => 'required|string|max:100',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'telefono' => 'nullable|string|max:50',
            'empleado_id' => 'required|exists:empleados,id',
            'responsable_id' => 'required|exists:responsables,id',
            'motivo_visita' => 'nullable|string',
            'fecha_ingreso' => 'required|date',
            'hora_ingreso' => 'required',
            'fecha_salida' => 'required|date',
            'hora_salida' => 'required',
            'foto_carnet' => 'nullable|string',
            'foto_documento' => 'nullable|string',
            'status' => 'required|string|in:activo,suspendido,en_revision',
        ]);

        // Clean old files if new ones are uploaded
        if ($request->filled('foto_carnet') && $request->input('foto_carnet') !== $visitaTemporal->foto_carnet) {
            $this->deleteOldImage($visitaTemporal->foto_carnet);
            $validated['foto_carnet'] = $this->handleImageUpload($request->input('foto_carnet'), 'foto_carnet');
        }

        if ($request->filled('foto_documento') && $request->input('foto_documento') !== $visitaTemporal->foto_documento) {
            $this->deleteOldImage($visitaTemporal->foto_documento);
            $validated['foto_documento'] = $this->handleImageUpload($request->input('foto_documento'), 'foto_documento');
        }

        $visitaTemporal->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Temporary visit updated successfully.'),
        ]);
    }

    public function toggleStatus(Request $request, VisitaTemporal $visitaTemporal)
    {
        if ($request->has('status')) {
            $newStatus = $request->status;
        } else {
            $newStatus = $visitaTemporal->status === 'activo' ? 'suspendido' : 'activo';
        }

        $visitaTemporal->update(['status' => $newStatus]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Status updated successfully.'),
        ]);
    }

    public function destroy(VisitaTemporal $visitaTemporal)
    {
        $this->deleteOldImage($visitaTemporal->foto_carnet);
        $this->deleteOldImage($visitaTemporal->foto_documento);
        $visitaTemporal->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Temporary visit log deleted successfully.'),
        ]);
    }

    private function handleImageUpload($input, $fieldName)
    {
        if (!$input) {
            return null;
        }

        // Direct file upload
        if (request()->hasFile($fieldName) && request()->file($fieldName)->isValid()) {
            $path = request()->file($fieldName)->store('visitas_temporales', 'public');
            return '/storage/' . $path;
        }

        // Base64 camera upload
        if (is_string($input) && preg_match('/^data:image\/(\w+);base64,/', $input, $type)) {
            $data = substr($input, strpos($input, ',') + 1);
            $type = strtolower($type[1]);

            if (!in_array($type, ['jpg', 'jpeg', 'png', 'webp'])) {
                return null;
            }

            $data = str_replace(' ', '+', $data);
            $data = base64_decode($data);

            if ($data === false) {
                return null;
            }

            $fileName = Str::random(40) . '.' . $type;
            $filePath = 'visitas_temporales/' . $fileName;
            Storage::disk('public')->put($filePath, $data);
            return '/storage/' . $filePath;
        }

        // Existing image path
        if (is_string($input) && str_starts_with($input, '/storage/')) {
            return $input;
        }

        return null;
    }

    private function deleteOldImage($path)
    {
        if ($path && str_starts_with($path, '/storage/')) {
            $relativeDiskPath = str_replace('/storage/', '', $path);
            if (Storage::disk('public')->exists($relativeDiskPath)) {
                Storage::disk('public')->delete($relativeDiskPath);
            }
        }
    }
}
