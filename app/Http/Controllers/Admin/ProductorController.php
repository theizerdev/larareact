<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\DispatchesKycValidacion;
use App\Http\Requests\ProductorRequest;
use App\Models\Productor;
use App\Services\AccessCodeService;
use App\Models\Pais;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductorController extends Controller
{
    use DispatchesKycValidacion;

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

        $tipoDocumento = $data['tipo_documento'] ?? null;
        $data = $this->guardarImagenes($request, $data);

        $productor = AccessCodeService::createWithRetry(fn () => Productor::create($data));
        $this->enviarCarnetWhatsAppInternal($productor);

        $avisoIdentidad = $this->validarIdentidad($request, $productor, $tipoDocumento, true);
        $this->vincularPrevalidaciones($productor); // validaciones hechas desde el formulario

        return $this->respuestaConSeguimiento($request, $productor, __('Producer created successfully'), $avisoIdentidad);
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
            'message' => 'El socio comercial no cuenta con un número de teléfono válido para enviarle el WhatsApp.',
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

                $msg  = "🪪 *¡SU GAFETE / CARNET AZUL DE SOCIO COMERCIAL ESTÁ LISTO!*\n\n";
                $msg .= "Estimado Socio Comercial *{$productor->nombre_comercial}*,\n";
                $msg .= "Se ha generado su Gafete Oficial de Acceso de Socio Comercial Autorizado.\n\n";
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

        $tipoDocumento = $data['tipo_documento'] ?? null;
        $curpAntes = $productor->curp;
        $data = $this->guardarImagenes($request, $data, $productor);

        $productor->update($data);

        // Con validaciones automáticas se re-valida solo si cambió algo que la
        // validación usa (foto, documento o CURP); si no, sólo si el usuario lo pidió.
        $cambio = $request->hasFile('foto') || $request->hasFile('documento_frontal')
            || $request->hasFile('documento_reverso') || $productor->curp !== $curpAntes;
        $this->validarIdentidad($request, $productor->fresh(), $tipoDocumento, $cambio);
        $this->vincularPrevalidaciones($productor->fresh()); // validaciones hechas desde el formulario

        return redirect()->back();
    }

    public function destroy(Productor $productor)
    {
        foreach ([$productor->foto, $productor->documento_frontal, $productor->documento_reverso] as $ruta) {
            if ($ruta) {
                Storage::disk('public')->delete($ruta);
            }
        }

        $productor->delete();

        return redirect()->back();
    }

    public function toggleStatus(Request $request, Productor $productor)
    {
        $request->validate([
            'status' => 'required|string|in:activo,suspendido,en_revision',
        ]);

        $productor->update([
            'status' => $request->status,
        ]);

        return redirect()->back();
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

        try {
            $pais = \App\Models\Pais::findOrFail($request->pais_telefono_id);
            $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
            $cleanPhone = preg_replace('/[^0-9]/', '', $request->telefono);
            $to = $prefix . $cleanPhone;

            $empresa = $user->empresa ?? \App\Models\Empresa::first();
            $whatsappService = new \App\Services\WhatsAppService($empresa);

            $link = url("/preregistro-productor/{$token}");

            $sucursalNombre = $user->sucursal?->nombre ?? ($empresa->razon_social ?? 'Instalaciones Principales');

            $message = "Estimado Socio Comercial *{$request->nombre_comercial_rancho}*, le invitamos a completar su pre-registro de datos para su acceso a nuestras instalaciones con la siguiente información:\n\n"
                . "Ubicación: {$sucursalNombre}\n"
                . "Socio Comercial: {$request->nombre_comercial_rancho}\n"
                . "Colaboradores: Indicar todos los que acudirán\n"
                . "Vehículos: En los que acudirán.\n\n"
                . "Será Indispensable contar con: *INE vigente* y *Chaleco de seguridad*\n\n"
                . "Ingresar a:\n"
                . $link;

            $whatsappService->sendMessage($to, $message, true);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de invitación de productor: ' . $e->getMessage());
        }

        return redirect()->back();
    }

    /**
     * Sube, reemplaza o quita las imágenes del socio comercial (foto y documento).
     * Los campos de solo-formulario salen de $data para que no lleguen al modelo.
     */
    private function guardarImagenes(ProductorRequest $request, array $data, ?Productor $actual = null): array
    {
        unset($data['quitar_foto'], $data['tipo_documento']);

        foreach (['foto', 'documento_frontal', 'documento_reverso'] as $campo) {
            unset($data[$campo]);

            if ($request->hasFile($campo)) {
                if ($actual?->{$campo}) {
                    Storage::disk('public')->delete($actual->{$campo});
                }

                $data[$campo] = $request->file($campo)->store('productores', 'public');
            }
        }

        if ($actual && $request->boolean('quitar_foto') && ! $request->hasFile('foto')) {
            if ($actual->foto) {
                Storage::disk('public')->delete($actual->foto);
            }

            $data['foto'] = null;
        }

        return $data;
    }

    /**
     * Lanza las validaciones de identidad (JaaK / Didit / firma ZapSign, según la
     * regla de la empresa) con la foto y el documento del responsable, si el
     * usuario lo pidió en el formulario (o con validaciones automáticas, cuando
     * $correr y ya hay foto y documento frontal); nunca bloquea el guardado.
     */
    private function validarIdentidad(ProductorRequest $request, Productor $productor, ?string $tipoDocumento, bool $correr): ?string
    {
        return $this->validarIdentidadSiSePidio($request, $productor, $productor->curp, ['tipo_documento' => $tipoDocumento],
            automatico: $correr && $productor->foto && $productor->documento_frontal);
    }

    /**
     * Si al guardar quedan pasos para la persona (Didit o firma), se abre el
     * folio, donde está el QR para terminarlos en su teléfono.
     */
    private function respuestaConSeguimiento(ProductorRequest $request, Productor $productor, string $mensaje, ?string $avisoIdentidad = null)
    {
        $mensaje .= $avisoIdentidad ? ' '.$avisoIdentidad : '';

        $seguimiento = $this->seguimientoValidacion($productor);

        if (! empty($seguimiento['url']) && $request->user()?->can('validaciones.view')) {
            $operacionId = \App\Models\OperacionValidacion::withoutGlobalScopes()
                ->where('folio', $seguimiento['folio'])
                ->where('empresa_id', $productor->empresa_id)
                ->value('id');

            if ($operacionId) {
                return redirect()->route('admin.validaciones.operaciones.show', $operacionId)->with('notification', [
                    'type' => 'success',
                    'message' => $mensaje.' '.__('Folio :folio: identity and signature are pending.', ['folio' => $seguimiento['folio']]),
                ]);
            }
        }

        // Sin folio no se manda aviso: la pantalla ya muestra su propio mensaje de éxito.
        if (empty($seguimiento['folio']) && ! $avisoIdentidad) {
            return redirect()->back();
        }

        return redirect()->back()->with('notification', [
            'type' => 'success',
            'message' => $mensaje.(! empty($seguimiento['folio']) ? ' '.__('Folio: :folio', ['folio' => $seguimiento['folio']]) : ''),
        ]);
    }
}
