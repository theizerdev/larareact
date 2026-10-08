<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductorRequest;
use App\Models\Productor;
use App\Services\AccessCodeService;
use App\Services\ImagenService;
use App\Models\Pais;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductorController extends Controller
{
    private const IMAGENES = ['foto_empresa', 'foto_responsable', 'ine_responsable_frente', 'ine_responsable_reverso'];

    public function index(Request $request)
    {
        $query = Productor::with(['pais', 'paisTelefono', 'empresa', 'sucursal', 'user'])
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

        // Las columnas *_rancho son heredadas: se mantienen iguales a la razón social y
        // al nombre comercial para que garita y las búsquedas sigan encontrando al socio.
        $data['razon_social_rancho'] = $data['razon_social'];
        $data['nombre_comercial_rancho'] = $data['nombre_comercial'];
        $data['documento_identidad'] = $data['documento_identidad'] ?? $data['rfc'] ?? $data['curp'] ?? ('PROD_' . uniqid());

        foreach (self::IMAGENES as $campo) {
            $data[$campo] = ImagenService::guardar($data[$campo] ?? null, 'socios-comerciales');
        }

        try {
            $productor = AccessCodeService::createWithRetry(fn () => Productor::create($data));
        } catch (\Throwable $e) {
            foreach (self::IMAGENES as $campo) {
                ImagenService::borrar($data[$campo]);
            }
            throw $e;
        }
        $this->enviarCarnetWhatsAppInternal($productor);

        return redirect()->back();
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
                'message' => __('Badge sent by WhatsApp to :name.', ['name' => $productor->nombre_comercial]),
            ]);
        }

        return back()->with('notification', [
            'type' => 'error',
            'message' => __('This business partner has no valid phone number to send the WhatsApp message.'),
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

                $msg  = "🪪 *¡SU GAFETE / CARNET DE SOCIO COMERCIAL ESTÁ LISTO!*\n\n";
                $msg .= "Estimado socio comercial *{$productor->nombre_comercial}*,\n";
                $msg .= "Se ha generado su gafete oficial de acceso.\n\n";
                $msg .= "📌 *Documento:* {$productor->documento_identidad}\n";
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
            \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp carnet de socio comercial: ' . $e->getMessage());
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

        $data['razon_social_rancho'] = $data['razon_social'];
        $data['nombre_comercial_rancho'] = $data['nombre_comercial'];
        $data['documento_identidad'] = $data['documento_identidad'] ?? $data['rfc'] ?? $data['curp'] ?? $productor->documento_identidad;

        $reemplazadas = [];
        foreach (self::IMAGENES as $campo) {
            if (! array_key_exists($campo, $data) || $data[$campo] === null || $data[$campo] === '') {
                unset($data[$campo]);

                continue;
            }
            $nueva = ImagenService::guardar($data[$campo], 'socios-comerciales');
            if ($nueva !== $productor->{$campo}) {
                $reemplazadas[] = $productor->{$campo};
            }
            $data[$campo] = $nueva;
        }

        try {
            $productor->update($data);
        } catch (\Throwable $e) {
            foreach (self::IMAGENES as $campo) {
                if (isset($data[$campo]) && $data[$campo] !== $productor->getOriginal($campo)) {
                    ImagenService::borrar($data[$campo]);
                }
            }
            throw $e;
        }

        foreach ($reemplazadas as $vieja) {
            ImagenService::borrar($vieja);
        }

        return redirect()->back();
    }

    public function destroy(Productor $productor)
    {
        $archivos = array_map(fn ($c) => $productor->{$c}, self::IMAGENES);
        $productor->delete();
        array_map([ImagenService::class, 'borrar'], $archivos);

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
            'razon_social' => 'required|string|max:255',
            'nombre_comercial' => 'required|string|max:255',
            'pais_telefono_id' => 'required|exists:pais,id',
            'telefono' => 'required|string|max:20',
        ]);

        $user = auth()->user();
        $token = bin2hex(random_bytes(16));

        // Las columnas *_rancho son heredadas: guardan la razón social y el nombre comercial.
        $preRegistro = \App\Models\ProductorPreRegistro::create([
            'razon_social_rancho' => $request->razon_social,
            'nombre_comercial_rancho' => $request->nombre_comercial,
            'pais_telefono_id' => $request->pais_telefono_id,
            'telefono' => $request->telefono,
            'token' => $token,
            'expires_at' => now()->addHours(12),
            'empresa_id' => $user->empresa_id,
            'sucursal_id' => $user->sucursal_id,
            'status' => 'pendiente',
        ]);

        $enviado = null;

        try {
            $pais = \App\Models\Pais::findOrFail($request->pais_telefono_id);
            $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
            $cleanPhone = preg_replace('/[^0-9]/', '', $request->telefono);
            $to = $prefix . $cleanPhone;

            $empresa = $user->empresa ?? \App\Models\Empresa::first();
            $whatsappService = new \App\Services\WhatsAppService($empresa);

            $link = url("/preregistro-productor/{$token}");

            $sucursalNombre = $user->sucursal?->nombre ?? ($empresa->razon_social ?? 'Instalaciones Principales');

            $message = "Estimado socio comercial *{$request->nombre_comercial}*, le invitamos a completar su pre-registro de datos para su acceso a nuestras instalaciones con la siguiente información:\n\n"
                . "Ubicación: {$sucursalNombre}\n"
                . "Colaboradores: Indicar todos los que acudirán\n"
                . "Vehículos: En los que acudirán.\n\n"
                . "Será indispensable contar con una identificación oficial vigente y el equipo de seguridad que se indique en el acceso.\n\n"
                . "Ingresar a:\n"
                . $link;

            $enviado = $whatsappService->sendMessage($to, $message, true);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de invitación de socio comercial: ' . $e->getMessage());
        }

        // sendMessage() devuelve null cuando falla. Antes se ignoraba y el usuario veía
        // "enviado" sin que hubiera salido nada; ahora se quita la invitación huérfana y se
        // responde con un error de validación, que sí dispara onError en el formulario.
        if (! $enviado) {
            $preRegistro->delete();

            return back()->withErrors([
                'telefono' => __('The WhatsApp invitation could not be sent. Check the phone number and the WhatsApp integration, then try again.'),
            ]);
        }

        return redirect()->back();
    }
}
