<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\InteractsWithTransactions;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProveedorRequest;
use App\Models\Proveedor;
use App\Models\Pais;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProveedorController extends Controller
{
    use InteractsWithTransactions;

    public function index(Request $request)
    {
        $query = Proveedor::with(['pais', 'paisTelefono', 'empresa', 'sucursal', 'user'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('razon_social', 'like', "%{$search}%")
                        ->orWhere('nombre_comercial', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%")
                        ->orWhere('rfc', 'like', "%{$search}%")
                        ->orWhere('responsable', 'like', "%{$search}%")
                        ->orWhere('curp', 'like', "%{$search}%")
                        ->orWhere('telefono', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->when($request->filled('pais_id'), function ($q) use ($request) {
                $q->where('pais_id', $request->pais_id);
            });

        $proveedores = $query->latest()->paginate($request->perPage ?? 10)->withQueryString();

        $stats = [
            'total' => Proveedor::count(),
            'activos' => Proveedor::where('status', 'activo')->count(),
            'suspendidos' => Proveedor::where('status', 'suspendido')->count(),
            'en_revision' => Proveedor::where('status', 'en_revision')->count(),
        ];

        $user = auth()->user();
        $empresa = $user->empresa;
        $sucursal = $user->sucursal;

        return Inertia::render('admin/Proveedores/Index', [
            'proveedores' => $proveedores,
            'stats' => $stats,
            'paises' => Pais::where('activo', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']),
            'empresas' => Empresa::where('status', true)->orderBy('razon_social', 'asc')->get(['id', 'razon_social']),
            'sucursales' => Sucursal::where('status', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'empresa_id']),
            'usuarios' => User::orderBy('name', 'asc')->get(['id', 'name', 'email']),
            'filters' => $request->only('search', 'status', 'pais_id', 'perPage'),
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

    public function store(ProveedorRequest $request)
    {
        $data = $request->validated();
        $user = auth()->user();

        // Autocompletar con los datos del usuario logueado si no vienen especificados
        $data['empresa_id'] = $data['empresa_id'] ?? $user->empresa_id;
        $data['sucursal_id'] = $data['sucursal_id'] ?? $user->sucursal_id;
        $data['user_id'] = $data['user_id'] ?? $user->id;
        $data['documento_identidad'] = $data['documento_identidad'] ?? $data['rfc'] ?? $data['curp'] ?? ('PROV_' . uniqid());

        $proveedor = null;

        $response = $this->transactional(
            function () use ($data, &$proveedor) {
                $proveedor = Proveedor::create($data);
            },
            successMessage: __('Supplier created successfully.'),
            failureMessage: __('No se pudo registrar el proveedor. Verifique que el documento no esté duplicado e intente de nuevo.'),
            errorKey: 'documento_identidad',
            context: ['action' => 'proveedores.store'],
        );

        // Envío después del COMMIT: una llamada HTTP externa dentro de la
        // transacción sostendría el bloqueo de escritura de SQLite durante
        // decenas de segundos y bloquearía al resto de la aplicación.
        if ($proveedor !== null) {
            $this->enviarCarnetWhatsAppInternal($proveedor);
        }

        return $response;
    }

    public function update(ProveedorRequest $request, Proveedor $proveedor)
    {
        $data = $request->validated();
        $user = auth()->user();

        $data['empresa_id'] = $data['empresa_id'] ?? $proveedor->empresa_id ?? $user->empresa_id;
        $data['sucursal_id'] = $data['sucursal_id'] ?? $proveedor->sucursal_id ?? $user->sucursal_id;
        $data['user_id'] = $data['user_id'] ?? $proveedor->user_id ?? $user->id;
        $data['documento_identidad'] = $data['documento_identidad'] ?? $data['rfc'] ?? $data['curp'] ?? $proveedor->documento_identidad;

        return $this->transactional(
            function () use ($proveedor, $data) {
                if (! $proveedor->update($data)) {
                    throw new \RuntimeException("No se pudo actualizar el proveedor {$proveedor->id}.");
                }
            },
            successMessage: __('Supplier updated successfully.'),
            failureMessage: __('No se pudieron guardar los cambios del proveedor. Intente de nuevo.'),
            errorKey: 'documento_identidad',
            context: ['action' => 'proveedores.update', 'proveedor_id' => $proveedor->id],
        );
    }

    public function destroy(Proveedor $proveedor)
    {
        // Igual que en productores: la cascada de la base de datos arrastra
        // colaboradores, vehículos y el historial de `visitas_accesos`. Se deja
        // traza del alcance antes de borrar, porque después es irrecuperable.
        $alcance = [
            'proveedor_id' => $proveedor->id,
            'documento_identidad' => $proveedor->documento_identidad,
            'empleados' => DB::table('proveedor_empleados')->where('proveedor_id', $proveedor->id)->count(),
            'vehiculos' => DB::table('proveedor_vehiculos')->where('proveedor_id', $proveedor->id)->count(),
            'visitas_accesos' => DB::table('visitas_accesos')->where('proveedor_id', $proveedor->id)->count(),
        ];

        Log::warning('Eliminación de proveedor con borrado en cascada', $alcance + [
            'user_id' => auth()->id(),
        ]);

        return $this->transactional(
            function () use ($proveedor) {
                if (! $proveedor->delete()) {
                    throw new \RuntimeException("No se pudo eliminar el proveedor {$proveedor->id}.");
                }
            },
            successMessage: __('Supplier deleted successfully.'),
            failureMessage: __('No se pudo eliminar el proveedor porque tiene registros dependientes.'),
            errorKey: 'general',
            context: ['action' => 'proveedores.destroy'] + $alcance,
        );
    }

    public function toggleStatus(Request $request, Proveedor $proveedor)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:activo,suspendido,en_revision',
        ]);

        return $this->transactional(
            function () use ($proveedor, $validated) {
                $fresh = Proveedor::whereKey($proveedor->getKey())->lockForUpdate()->firstOrFail();

                if (! $fresh->update(['status' => $validated['status']])) {
                    throw new \RuntimeException("No se pudo cambiar el estado del proveedor {$proveedor->id}.");
                }
            },
            successMessage: __('Estado actualizado correctamente'),
            failureMessage: __('No se pudo actualizar el estado. Intente de nuevo.'),
            errorKey: 'status',
            context: ['action' => 'proveedores.toggleStatus', 'proveedor_id' => $proveedor->id],
        );
    }

    public function generatePreRegistro(Request $request)
    {
        $request->validate([
            'nombre_comercial' => 'required|string|max:255',
            'pais_telefono_id' => 'required|exists:pais,id',
            'telefono' => 'required|string|max:20',
        ]);

        $user = auth()->user();
        $token = bin2hex(random_bytes(16));

        \App\Models\ProveedorPreRegistro::create([
            'nombre_comercial' => $request->nombre_comercial,
            'pais_telefono_id' => $request->pais_telefono_id,
            'telefono' => $request->telefono,
            'token' => $token,
            'expires_at' => now()->addHours(12),
            'empresa_id' => $user->empresa_id,
            'sucursal_id' => $user->sucursal_id,
            'status' => 'pendiente',
        ]);

        try {
            $pais = \App\Models\Pais::findOrFail($request->pais_telefono_id);
            $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
            $cleanPhone = preg_replace('/[^0-9]/', '', $request->telefono);
            $to = $prefix . $cleanPhone;

            $empresa = $user->empresa ?? \App\Models\Empresa::first();
            $whatsappService = new \App\Services\WhatsAppService($empresa);

            $link = url("/preregistro/{$token}");
            $terminos    = url("https://www.driscolls.com/Privacy-and-Terms  ");

            $sucursalNombre = $user->sucursal?->nombre ?? ($empresa->razon_social ?? $empresa->nombre_comercial ?? 'Nuestras Instalaciones');

            $message = "Estimado Proveedor *{$request->nombre_comercial}*, le invitamos a completar su pre-registro de datos para su acceso a nuestras oficinas con la siguiente información:\n\n"
                . "Ubicación: {$sucursalNombre}\n"
                . "Colaboradores: Indicar todos los que acudirán\n"
                . "Vehículos: En el que acudirán.\n\n"
                . "Será Indispensable contar de cada colaborador con: INE vigente y Chaleco de seguridad*\n\n"
                . "Ingresar a:\n"
                . $link. "\n\n"
                . "Para cualquier duda adicional, podrá consultar el aviso de privacidad en: {$terminos}";

            $whatsappService->sendMessage($to, $message, true);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de invitación: ' . $e->getMessage());
        }

        return redirect()->back();
    }

    public function carnet(Proveedor $proveedor)
    {
        $proveedor->load(['pais', 'paisTelefono', 'empresa', 'sucursal']);

        return Inertia::render('admin/Proveedores/Carnet', [
            'proveedor' => $proveedor,
        ]);
    }

    public function carnetPublico(Proveedor $proveedor)
    {
        $proveedor->load(['pais', 'paisTelefono', 'empresa', 'sucursal']);

        return Inertia::render('admin/Proveedores/Carnet', [
            'proveedor' => $proveedor,
        ]);
    }

    public function sendCarnetWhatsApp(Proveedor $proveedor)
    {
        $sent = $this->enviarCarnetWhatsAppInternal($proveedor);

        if ($sent) {
            return back()->with('notification', [
                'type' => 'success',
                'message' => "Gafete Rojo enviado por WhatsApp a {$proveedor->nombre_comercial}.",
            ]);
        }

        return back()->with('notification', [
            'type' => 'error',
            'message' => 'El proveedor no cuenta con un número de teléfono válido para enviarle el WhatsApp.',
        ]);
    }

    public function enviarCarnetWhatsAppInternal(Proveedor $proveedor): bool
    {
        if (empty($proveedor->telefono)) {
            return false;
        }

        try {
            $user = request()->user();
            $empresa = Empresa::find($proveedor->empresa_id) ?: (Empresa::find($user->empresa_id ?? 1) ?: Empresa::first());

            $cleanPhone = preg_replace('/[^0-9]/', '', $proveedor->telefono);
            if (strlen($cleanPhone) >= 9) {
                $pais = $proveedor->paisTelefono ?: Pais::find($proveedor->pais_telefono_id);
                $prefix = $pais ? preg_replace('/[^0-9]/', '', $pais->codigo_telefonico) : '51';
                $to = $prefix . $cleanPhone;

                $carnetUrl = url("/carnet-proveedor/{$proveedor->id}");

                $msg  = "🪪 *¡SU GAFETE / CARNET ROJO DE PROVEEDOR ESTÁ LISTO!*\n\n";
                $msg .= "Estimado Proveedor *{$proveedor->nombre_comercial}*,\n";
                $msg .= "Se ha generado su Gafete Oficial de Acceso de Proveedor Autorizado.\n\n";
                $msg .= "📌 *Doc / RUC:* {$proveedor->documento_identidad}\n";
                $msg .= "👤 *Responsable:* {$proveedor->responsable}\n\n";
                $msg .= "📲 *Acceda a su gafete digital aquí:*\n";
                $msg .= "🔗 {$carnetUrl}\n\n";
                $msg .= "Presente este carnet o código QR en garita para su control de accesos.";

                $ws = new \App\Services\WhatsAppService($empresa);
                $carnetPath = \App\Services\CarnetGeneratorService::generarCarnetProveedorPNG($proveedor);

                if ($carnetPath && file_exists($carnetPath)) {
                    // Attempt to send the carnet image directly via WhatsApp
                    $result = $ws->sendImage($to, $carnetPath, $msg);
                    if (!$result) {
                        // Fallback: send as plain text message if image fails
                        $ws->sendMessage($to, $msg, true);
                    }
                } else {
                    $ws->sendMessage($to, $msg, true);
                }
                return true;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp carnet proveedor: ' . $e->getMessage());
        }

        return false;
    }
}
