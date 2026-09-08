<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\InteractsWithTransactions;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProductorRequest;
use App\Models\Productor;
use App\Models\Pais;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProductorController extends Controller
{
    use InteractsWithTransactions;

    public function index(Request $request)
    {
        $query = Productor::with(['pais', 'paisTelefono', 'empresa', 'sucursal', 'user'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('razon_social', 'like', "%{$search}%")
                        ->orWhere('nombre_comercial', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%")
                        ->orWhere('rfc', 'like', "%{$search}%")
                        ->orWhere('razon_social_rancho', 'like', "%{$search}%")
                        ->orWhere('nombre_comercial_rancho', 'like', "%{$search}%")
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

        $productores = $query->latest()->paginate($request->perPage ?? 10)->withQueryString();

        $stats = [
            'total' => Productor::count(),
            'activos' => Productor::where('status', 'activo')->count(),
            'suspendidos' => Productor::where('status', 'suspendido')->count(),
            'en_revision' => Productor::where('status', 'en_revision')->count(),
        ];

        $user = auth()->user();
        $empresa = $user->empresa;
        $sucursal = $user->sucursal;

        return Inertia::render('admin/Productores/Index', [
            'productores' => $productores,
            'stats' => $stats,
            'paises' => Pais::where('activo', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico', 'latitud', 'longitud']),
            'empresas' => Empresa::where('status', true)->orderBy('razon_social', 'asc')->get(['id', 'razon_social']),
            'sucursales' => Sucursal::where('status', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'empresa_id', 'latitud', 'longitud', 'direccion']),
            'usuarios' => User::orderBy('name', 'asc')->get(['id', 'name', 'email']),
            'filters' => $request->only('search', 'status', 'pais_id', 'perPage'),
            'empresa' => $empresa ? [
                'id' => $empresa->id,
                'razon_social' => $empresa->razon_social,
            ] : null,
            'sucursal' => $sucursal ? [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
                'latitud' => $sucursal->latitud,
                'longitud' => $sucursal->longitud,
                'direccion' => $sucursal->direccion,
            ] : null,
        ]);
    }

    public function store(ProductorRequest $request)
    {
        $data = $request->validated();
        $user = auth()->user();

        $data['empresa_id'] = $data['empresa_id'] ?? $user->empresa_id;
        $data['sucursal_id'] = $data['sucursal_id'] ?? $user->sucursal_id;
        $data['user_id'] = $data['user_id'] ?? $user->id;

        $data['razon_social_rancho'] = $data['razon_social_rancho'] ?? $data['razon_social'];
        $data['nombre_comercial_rancho'] = $data['nombre_comercial_rancho'] ?? $data['nombre_comercial'];
        $data['documento_identidad'] = $data['documento_identidad'] ?? $data['rfc'] ?? $data['curp'] ?? ('PROD_' . uniqid());

        $productor = null;

        $response = $this->transactional(
            function () use ($data, &$productor) {
                $productor = Productor::create($data);
            },
            successMessage: __('Producer created successfully'),
            failureMessage: __('No se pudo registrar el productor. Verifique que el documento no esté duplicado e intente de nuevo.'),
            errorKey: 'documento_identidad',
            context: ['action' => 'productores.store'],
        );

        // WhatsApp SIEMPRE después del COMMIT y fuera de la transacción.
        // Es una llamada HTTP a un tercero con timeout de decenas de segundos:
        // dentro de la transacción mantendría abierto el bloqueo de escritura de
        // SQLite todo ese tiempo y cualquier otra escritura de la aplicación
        // fallaría con "database is locked". Que el envío falle no invalida el
        // alta: el productor ya está persistido.
        if ($productor !== null) {
            $this->enviarCarnetWhatsAppInternal($productor);
        }

        return $response;
    }

    public function carnet(Productor $productor)
    {
        $productor->load(['pais', 'paisTelefono', 'empresa', 'sucursal']);

        return Inertia::render('admin/Productores/Carnet', [
            'productor' => $productor,
        ]);
    }

    public function carnetPublico(Productor $productor)
    {
        $productor->load(['pais', 'paisTelefono', 'empresa', 'sucursal']);

        return Inertia::render('admin/Productores/Carnet', [
            'productor' => $productor,
        ]);
    }

    public function sendCarnetWhatsApp(Productor $productor)
    {
        $sent = $this->enviarCarnetWhatsAppInternal($productor);

        if ($sent) {
            return back()->with('notification', [
                'type' => 'success',
                'message' => "Gafete Azul enviado por WhatsApp a {$productor->nombre_comercial}.",
            ]);
        }

        return back()->with('notification', [
            'type' => 'error',
            'message' => 'El productor no cuenta con un número de teléfono válido para enviarle el WhatsApp.',
        ]);
    }

    public function enviarCarnetWhatsAppInternal(Productor $productor): bool
    {
        if (empty($productor->telefono)) {
            return false;
        }

        try {
            $user = request()->user();
            $empresa = Empresa::find($productor->empresa_id) ?: (Empresa::find($user->empresa_id ?? 1) ?: Empresa::first());

            $cleanPhone = preg_replace('/[^0-9]/', '', $productor->telefono);
            if (strlen($cleanPhone) >= 9) {
                $pais = $productor->paisTelefono ?: Pais::find($productor->pais_telefono_id);
                $prefix = $pais ? preg_replace('/[^0-9]/', '', $pais->codigo_telefonico) : '51';
                $to = $prefix . $cleanPhone;

                $carnetUrl = url("/carnet-productor/{$productor->id}");

                $msg  = "🪪 *¡SU GAFETE / CARNET AZUL DE PRODUCTOR ESTÁ LISTO!*\n\n";
                $msg .= "Estimado Productor *{$productor->nombre_comercial}*,\n";
                $msg .= "Se ha generado su Gafete Oficial de Acceso de Productor Autorizado.\n\n";
                $msg .= "📌 *Doc / RUC:* {$productor->documento_identidad}\n";
                $msg .= "👤 *Responsable:* {$productor->responsable}\n\n";
                $msg .= "📲 *Acceda a su gafete digital aquí:*\n";
                $msg .= "🔗 {$carnetUrl}\n\n";
                $msg .= "Presente este carnet o código QR en garita para su control de accesos.";

                $ws = new \App\Services\WhatsAppService($empresa);
                $carnetPath = \App\Services\CarnetGeneratorService::generarCarnetProductorPNG($productor);

                if ($carnetPath && file_exists($carnetPath)) {
                    $result = $ws->sendImage($to, $carnetPath, $msg);
                    if (!$result) {
                        $ws->sendMessage($to, $msg, true);
                    }
                } else {
                    $ws->sendMessage($to, $msg, true);
                }
                return true;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp carnet productor: ' . $e->getMessage());
        }

        return false;
    }

    public function update(ProductorRequest $request, Productor $productor)
    {
        $data = $request->validated();
        $user = auth()->user();

        $data['empresa_id'] = $data['empresa_id'] ?? $productor->empresa_id ?? $user->empresa_id;
        $data['sucursal_id'] = $data['sucursal_id'] ?? $productor->sucursal_id ?? $user->sucursal_id;
        $data['user_id'] = $data['user_id'] ?? $productor->user_id ?? $user->id;

        $data['razon_social_rancho'] = $data['razon_social_rancho'] ?? $data['razon_social'];
        $data['nombre_comercial_rancho'] = $data['nombre_comercial_rancho'] ?? $data['nombre_comercial'];
        $data['documento_identidad'] = $data['documento_identidad'] ?? $data['rfc'] ?? $data['curp'] ?? $productor->documento_identidad;

        return $this->transactional(
            function () use ($productor, $data) {
                if (! $productor->update($data)) {
                    throw new \RuntimeException("No se pudo actualizar el productor {$productor->id}.");
                }
            },
            successMessage: __('Producer updated successfully'),
            failureMessage: __('No se pudieron guardar los cambios del productor. Intente de nuevo.'),
            errorKey: 'documento_identidad',
            context: ['action' => 'productores.update', 'productor_id' => $productor->id],
        );
    }

    public function destroy(Productor $productor)
    {
        // Borrado en cascada a nivel de base de datos: al eliminar el productor
        // desaparecen sus colaboradores, sus vehículos y su historial en
        // `visitas_accesos`. Se deja constancia de lo que se destruye ANTES de
        // hacerlo, porque después ya no hay forma de reconstruir el alcance.
        $alcance = [
            'productor_id' => $productor->id,
            'documento_identidad' => $productor->documento_identidad,
            'empleados' => DB::table('productor_empleados')->where('productor_id', $productor->id)->count(),
            'vehiculos' => DB::table('productor_vehiculos')->where('productor_id', $productor->id)->count(),
            'visitas_accesos' => DB::table('visitas_accesos')->where('productor_id', $productor->id)->count(),
        ];

        Log::warning('Eliminación de productor con borrado en cascada', $alcance + [
            'user_id' => auth()->id(),
        ]);

        return $this->transactional(
            function () use ($productor) {
                if (! $productor->delete()) {
                    throw new \RuntimeException("No se pudo eliminar el productor {$productor->id}.");
                }
            },
            successMessage: __('Producer deleted successfully'),
            failureMessage: __('No se pudo eliminar el productor porque tiene registros dependientes.'),
            errorKey: 'general',
            context: ['action' => 'productores.destroy'] + $alcance,
        );
    }

    public function toggleStatus(Request $request, Productor $productor)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:activo,suspendido,en_revision',
        ]);

        return $this->transactional(
            function () use ($productor, $validated) {
                $fresh = Productor::whereKey($productor->getKey())->lockForUpdate()->firstOrFail();

                if (! $fresh->update(['status' => $validated['status']])) {
                    throw new \RuntimeException("No se pudo cambiar el estado del productor {$productor->id}.");
                }
            },
            successMessage: __('Estado actualizado correctamente'),
            failureMessage: __('No se pudo actualizar el estado. Intente de nuevo.'),
            errorKey: 'status',
            context: ['action' => 'productores.toggleStatus', 'productor_id' => $productor->id],
        );
    }

    public function generatePreRegistro(Request $request)
    {
        $request->validate([
            'razon_social_rancho' => 'required|string|max:255',
            'nombre_comercial_rancho' => 'required|string|max:255',
            'pais_telefono_id' => 'required|exists:pais,id',
            'telefono' => 'required|string|max:20',
        ]);

        $user = auth()->user();
        $token = bin2hex(random_bytes(16));

        $response = $this->transactional(
            function () use ($request, $user, $token) {
                \App\Models\ProductorPreRegistro::create([
                    'razon_social_rancho' => $request->razon_social_rancho,
                    'nombre_comercial_rancho' => $request->nombre_comercial_rancho,
                    'pais_telefono_id' => $request->pais_telefono_id,
                    'telefono' => $request->telefono,
                    'token' => $token,
                    'expires_at' => now()->addHours(12),
                    'empresa_id' => $user->empresa_id,
                    'sucursal_id' => $user->sucursal_id,
                    'status' => 'pendiente',
                ]);
            },
            successMessage: __('Producer pre-registration link sent via WhatsApp'),
            failureMessage: __('No se pudo generar la invitación de pre-registro. Intente de nuevo.'),
            errorKey: 'telefono',
            context: ['action' => 'productores.generatePreRegistro'],
        );

        // Igual que en store(): el envío va después del COMMIT para no sostener
        // el bloqueo de escritura durante una llamada HTTP externa.
        try {
            $pais = \App\Models\Pais::findOrFail($request->pais_telefono_id);
            $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
            $cleanPhone = preg_replace('/[^0-9]/', '', $request->telefono);
            $to = $prefix . $cleanPhone;

            $empresa = $user->empresa ?? \App\Models\Empresa::first();
            $whatsappService = new \App\Services\WhatsAppService($empresa);

            $link = url("/preregistro-productor/{$token}");

            $sucursalNombre = $user->sucursal?->nombre ?? ($empresa->razon_social ?? 'Instalaciones Principales');

            $message = "Estimado Productor del Rancho *{$request->nombre_comercial_rancho}*, le invitamos a completar su pre-registro de datos para su acceso a nuestras instalaciones con la siguiente información:\n\n"
                . "Ubicación: {$sucursalNombre}\n"
                . "Rancho: {$request->nombre_comercial_rancho}\n"
                . "Colaboradores: Indicar todos los que acudirán\n"
                . "Vehículos: En los que acudirán.\n\n"
                . "Será Indispensable contar con: *INE vigente* y *Chaleco de seguridad*\n\n"
                . "Ingresar a:\n"
                . $link;

            $whatsappService->sendMessage($to, $message, true);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de invitación de productor: ' . $e->getMessage());
        }

        return $response;
    }
}
