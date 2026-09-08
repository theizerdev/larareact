<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\InteractsWithTransactions;
use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmpresaController extends Controller
{
    use InteractsWithTransactions;

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Empresa::with('pais');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('razon_social', 'like', "%{$search}%")
                    ->orWhere('nombre_comercial', 'like', "%{$search}%")
                    ->orWhere('documento', 'like', "%{$search}%")
                    ->orWhere('representante_legal', 'like', "%{$search}%")
                    ->orWhere('curp_representante_legal', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $empresas = $query->orderBy('razon_social', 'asc')->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Empresa::count(),
            'activos' => Empresa::where('status', true)->count(),
            'inactivos' => Empresa::where('status', false)->count(),
        ];

        return inertia('admin/Empresas/Index', [
            'empresas' => $empresas,
            'stats' => $stats,
            'paises' => Pais::where('activo', true)
                ->orderBy('nombre', 'asc')
                ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico', 'latitud', 'longitud']),
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'nombre_comercial' => 'nullable|string|max:255',
            'documento' => 'required|string|max:255|unique:empresas,documento',
            'pais_id' => 'nullable|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'zona_horaria' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'representante_legal' => 'nullable|string|max:255',
            'curp_representante_legal' => 'nullable|string|max:18',
            'status' => 'boolean',
        ]);

        return $this->transactional(
            function () use ($validated) {
                $empresa = new Empresa($validated);
                $empresa->api_key = Str::random(32);
                $empresa->whatsapp_api_key = Str::random(32);
                $empresa->save();
            },
            successMessage: __('Company created successfully.'),
            failureMessage: __('There was an error creating the company. Please try again.'),
            errorKey: 'documento',
            context: ['action' => 'empresas.store'],
        );
    }

    public function update(Request $request, Empresa $empresa)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'nombre_comercial' => 'nullable|string|max:255',
            'documento' => 'required|string|max:255|unique:empresas,documento,'.$empresa->id,
            'pais_id' => 'nullable|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'zona_horaria' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'representante_legal' => 'nullable|string|max:255',
            'curp_representante_legal' => 'nullable|string|max:18',
            'status' => 'boolean',
        ]);

        return $this->transactional(
            function () use ($empresa, $validated) {
                // `update()` devuelve false si el modelo se marca como no
                // guardable; obligamos a que un no-guardado sea un fallo visible
                // y no una respuesta de éxito sin escritura.
                if (! $empresa->update($validated)) {
                    throw new \RuntimeException("No se pudo actualizar la empresa {$empresa->id}.");
                }
            },
            successMessage: __('Company updated successfully.'),
            failureMessage: __('There was an error updating the company. Please try again.'),
            errorKey: 'documento',
            context: ['action' => 'empresas.update', 'empresa_id' => $empresa->id],
        );
    }

    public function toggleStatus(Empresa $empresa)
    {
        return $this->transactional(
            function () use ($empresa) {
                // Relectura con bloqueo dentro de la transacción: sin esto, dos
                // peticiones simultáneas leen el mismo valor y el segundo toggle
                // se pierde (lost update).
                $fresh = Empresa::whereKey($empresa->getKey())->lockForUpdate()->firstOrFail();
                $fresh->status = ! $fresh->status;
                $fresh->save();
            },
            successMessage: __('Status updated successfully.'),
            failureMessage: __('There was an error updating the status. Please try again.'),
            errorKey: 'status',
            context: ['action' => 'empresas.toggleStatus', 'empresa_id' => $empresa->id],
        );
    }

    public function updateLogos(Request $request, Empresa $empresa)
    {
        $request->validate([
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'logo_mini' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Los ficheros se suben antes de abrir la transacción: escribir en disco
        // no es transaccional y mantener la transacción abierta durante una
        // subida alarga el bloqueo de escritura de SQLite sin necesidad.
        $logoPath = $request->hasFile('logo')
            ? '/storage/'.$request->file('logo')->store('empresas/logos', 'public')
            : null;

        $logoMiniPath = $request->hasFile('logo_mini')
            ? '/storage/'.$request->file('logo_mini')->store('empresas/logos_mini', 'public')
            : null;

        return $this->transactional(
            function () use ($empresa, $logoPath, $logoMiniPath) {
                if ($logoPath !== null) {
                    $empresa->logo = $logoPath;
                }

                if ($logoMiniPath !== null) {
                    $empresa->logo_mini = $logoMiniPath;
                }

                $empresa->save();
            },
            successMessage: __('Logos updated successfully.'),
            failureMessage: __('There was an error updating the logos. Please try again.'),
            errorKey: 'logo',
            context: ['action' => 'empresas.updateLogos', 'empresa_id' => $empresa->id],
        );
    }
}
