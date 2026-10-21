<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\EnrolamientoInvitacionMail;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Pais;
use App\Services\BioTimeEmpleadoPusher;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

/**
 * Enrolamiento del colaborador desde Colaboradores o mediante enlace público:
 * bienvenida con aviso de privacidad, datos (no. de empleado, nombre, área)
 * y la captura de las dos fotos frontales, el sexo y la fecha de nacimiento.
 *
 * Al guardar, se sincroniza con BioTime y se actualiza el estado en el sistema.
 */
class EmpleadoEnrolamientoController extends Controller
{
    /**
     * Vista interna de enrolamiento para administradores.
     */
    public function show(Empleado $empleado)
    {
        $empleado->load('departamento:id,nombre', 'empresa:id,razon_social,nombre_comercial');

        return Inertia::render('admin/Empleados/Enrolamiento', [
            'empleado' => [
                'id' => $empleado->id,
                'numero' => $empleado->documento_identidad,
                'nombres' => $empleado->nombres,
                'apellidos' => $empleado->apellidos,
                'area' => $empleado->departamento?->nombre,
                'genero' => $empleado->genero,
                'fecha_nacimiento' => $empleado->fecha_nacimiento?->format('Y-m-d'),
                'enrolado_en' => $empleado->enrolado_en?->toIso8601String(),
            ],
            'empresa' => $empleado->empresa?->razon_social ?? $empleado->empresa?->nombre_comercial ?? 'Smurfit Westrock',
            'isPublic' => false,
        ]);
    }

    /**
     * Guarda el enrolamiento desde la vista interna de administradores.
     */
    public function store(Request $request, Empleado $empleado)
    {
        $this->guardarEnrolamiento($request, $empleado);

        return back();
    }

    /**
     * Genera y envía el link de enrolamiento por WhatsApp y/o Correo electrónico.
     */
    public function invitar(Request $request)
    {
        $data = $request->validate([
            'empleado_id' => 'nullable|exists:empleados,id',
            'nombres' => 'required_without:empleado_id|nullable|string|max:255',
            'apellidos' => 'required_without:empleado_id|nullable|string|max:255',
            'documento_identidad' => 'nullable|string|max:50',
            'departamento_id' => 'nullable|exists:departamentos,id',
            'canal' => 'required|in:whatsapp,correo,ambos',
            'pais_telefono_id' => 'required_if:canal,whatsapp,ambos|nullable|exists:pais,id',
            'telefono' => 'required_if:canal,whatsapp,ambos|nullable|string|max:30',
            'correo' => 'required_if:canal,correo,ambos|nullable|email|max:255',
        ], [
            'nombres.required_without' => 'El nombre es requerido.',
            'apellidos.required_without' => 'El apellido es requerido.',
            'pais_telefono_id.required_if' => 'Seleccione el país para el número telefónico.',
            'telefono.required_if' => 'Ingrese el número telefónico para WhatsApp.',
            'correo.required_if' => 'Ingrese el correo electrónico.',
            'correo.email' => 'El correo electrónico no es válido.',
        ]);

        $user = auth()->user();

        if (!empty($data['empleado_id'])) {
            $empleado = Empleado::findOrFail($data['empleado_id']);
            if (!empty($data['telefono'])) {
                $empleado->telefono = $data['telefono'];
            }
            if (!empty($data['pais_telefono_id'])) {
                $empleado->pais_telefono_id = $data['pais_telefono_id'];
            }
            if (!empty($data['correo'])) {
                $empleado->correo = $data['correo'];
            }
        } else {
            $empleado = null;
            if (!empty($data['documento_identidad'])) {
                $empleado = Empleado::where('documento_identidad', $data['documento_identidad'])
                    ->where('empresa_id', $user->empresa_id)
                    ->first();
            }

            if (!$empleado) {
                $empleado = new Empleado();
                $empleado->nombres = $data['nombres'];
                $empleado->apellidos = $data['apellidos'];

                if (!empty($data['documento_identidad'])) {
                    $empleado->documento_identidad = $data['documento_identidad'];
                } else {
                    do {
                        $code = (string) mt_rand(100000, 999999);
                    } while (Empleado::where('documento_identidad', $code)->exists());
                    $empleado->documento_identidad = $code;
                }

                $empleado->departamento_id = $data['departamento_id'] ?? null;
                $empleado->pais_telefono_id = $data['pais_telefono_id'] ?? null;
                $empleado->telefono = $data['telefono'] ?? null;
                $empleado->correo = $data['correo'] ?? null;
                $empleado->empresa_id = $user->empresa_id;
                $empleado->sucursal_id = $user->sucursal_id;
                $empleado->status = true;
            } else {
                if (!empty($data['telefono'])) {
                    $empleado->telefono = $data['telefono'];
                }
                if (!empty($data['pais_telefono_id'])) {
                    $empleado->pais_telefono_id = $data['pais_telefono_id'];
                }
                if (!empty($data['correo'])) {
                    $empleado->correo = $data['correo'];
                }
            }
        }

        // Token seguro de 48 caracteres con validez de 72 horas
        $token = Str::random(48);
        $empleado->enrolamiento_token = $token;
        $empleado->enrolamiento_token_expires_at = now()->addHours(72);
        $empleado->save();

        $enrolamientoUrl = url("/enrolamiento/{$token}");
        $empresa = $user->empresa ?? Empresa::first();
        $empresaNombre = $empresa?->razon_social ?? $empresa?->nombre_comercial ?? 'Smurfit Westrock';

        $notificacionesEnviadas = [];

        // Envío por WhatsApp
        if (in_array($data['canal'], ['whatsapp', 'ambos']) && $empleado->telefono) {
            try {
                $pais = Pais::find($empleado->pais_telefono_id);
                $prefix = preg_replace('/[^0-9]/', '', $pais?->codigo_telefonico ?? '52');
                $cleanPhone = preg_replace('/[^0-9]/', '', $empleado->telefono);
                $to = $prefix . $cleanPhone;

                $mensaje = "Estimado(a) *{$empleado->nombres} {$empleado->apellidos}*,\n\n"
                    . "Le invitamos a realizar su *enrolamiento biométrico facial* para el sistema de control de asistencia y acceso de *{$empresaNombre}*.\n\n"
                    . "🔗 Ingrese al siguiente enlace para iniciar (solo toma 2 minutos):\n"
                    . "{$enrolamientoUrl}\n\n"
                    . "📸 _Recomendaciones: ubíquese en un lugar con buena luz frontal y sin lentes oscuros, gorra ni cubrebocas._";

                $whatsappService = new WhatsAppService($empresa);
                $wsResult = $whatsappService->sendMessage($to, $mensaje, true);
                if ($wsResult['success'] ?? false) {
                    $notificacionesEnviadas[] = 'WhatsApp';
                }
            } catch (Throwable $e) {
                Log::error('Error enviando link de enrolamiento por WhatsApp', [
                    'empleado_id' => $empleado->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Envío por Correo Electrónico
        if (in_array($data['canal'], ['correo', 'ambos']) && $empleado->correo) {
            try {
                Mail::to($empleado->correo)->send(new EnrolamientoInvitacionMail($empleado, $enrolamientoUrl, $empresaNombre));
                $notificacionesEnviadas[] = 'Correo electrónico';
            } catch (Throwable $e) {
                Log::error('Error enviando link de enrolamiento por Correo', [
                    'empleado_id' => $empleado->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        activity('empleados')
            ->causedBy($user)
            ->performedOn($empleado)
            ->log("Se generó invitación de enrolamiento para {$empleado->nombres} {$empleado->apellidos} vía {$data['canal']}.");

        $canalesTexto = !empty($notificacionesEnviadas)
            ? 'enviada vía ' . implode(' y ', $notificacionesEnviadas)
            : 'generada';

        return response()->json([
            'success' => true,
            'message' => "Invitación de enrolamiento {$canalesTexto} correctamente.",
            'link' => $enrolamientoUrl,
            'empleado' => [
                'id' => $empleado->id,
                'nombres' => $empleado->nombres,
                'apellidos' => $empleado->apellidos,
                'documento_identidad' => $empleado->documento_identidad,
            ],
        ]);
    }

    /**
     * Muestra la pantalla pública de enrolamiento a través del token.
     */
    public function showPublic(string $token)
    {
        $empleado = Empleado::withoutTenant()
            ->where('enrolamiento_token', $token)
            ->with(['departamento:id,nombre', 'empresa:id,razon_social,nombre_comercial'])
            ->first();

        if (!$empleado) {
            abort(404, 'El enlace de enrolamiento no existe o es inválido.');
        }

        $expirado = $empleado->enrolamiento_token_expires_at && $empleado->enrolamiento_token_expires_at->isPast();

        return Inertia::render('admin/Empleados/Enrolamiento', [
            'empleado' => [
                'id' => $empleado->id,
                'numero' => $empleado->documento_identidad,
                'nombres' => $empleado->nombres,
                'apellidos' => $empleado->apellidos,
                'area' => $empleado->departamento?->nombre,
                'genero' => $empleado->genero,
                'fecha_nacimiento' => $empleado->fecha_nacimiento?->format('Y-m-d'),
                'enrolado_en' => $empleado->enrolado_en?->toIso8601String(),
            ],
            'empresa' => $empleado->empresa?->razon_social ?? $empleado->empresa?->nombre_comercial ?? 'Smurfit Westrock',
            'isPublic' => true,
            'token' => $token,
            'expirado' => $expirado,
        ]);
    }

    /**
     * Procesa la captura de fotos y datos biométricos del colaborador vía token público.
     */
    public function storePublic(Request $request, string $token)
    {
        $empleado = Empleado::withoutTenant()
            ->where('enrolamiento_token', $token)
            ->first();

        if (!$empleado) {
            abort(404, 'El enlace de enrolamiento no es válido.');
        }

        if ($empleado->enrolamiento_token_expires_at && $empleado->enrolamiento_token_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'aviso_privacidad' => 'Este enlace de enrolamiento ha expirado. Solicite uno nuevo a Recursos Humanos.',
            ]);
        }

        $this->guardarEnrolamiento($request, $empleado);

        return back();
    }

    /**
     * Lógica central de guardado de datos biométricos, fotos y sincronización con BioTime.
     */
    private function guardarEnrolamiento(Request $request, Empleado $empleado): void
    {
        $data = $request->validate([
            'aviso_privacidad' => 'accepted',
            'foto_empleado' => 'required|string',
            'foto_empleado_2' => 'required|string',
            'genero' => 'required|in:M,F',
            'fecha_nacimiento' => 'required|date|before:-14 years|after:1900-01-01',
        ], [
            'aviso_privacidad.accepted' => 'Debe aceptar el aviso de privacidad.',
            'foto_empleado.required' => 'Falta la primera foto frontal.',
            'foto_empleado_2.required' => 'Falta la segunda foto frontal.',
            'genero.required' => 'Seleccione el sexo.',
            'fecha_nacimiento.required' => 'Capture la fecha de nacimiento.',
            'fecha_nacimiento.before' => 'La fecha de nacimiento no es válida.',
            'fecha_nacimiento.after' => 'La fecha de nacimiento no es válida.',
        ]);

        $fotos = [];
        foreach (['foto_empleado', 'foto_empleado_2'] as $campo) {
            $fotos[$campo] = $this->leerFoto($campo, $data[$campo]);
        }

        $anteriores = array_filter([$empleado->foto_empleado, $empleado->foto_empleado_2]);

        foreach ($fotos as $campo => $foto) {
            $ruta = 'empleados/' . Str::random(40) . '.' . $foto['ext'];
            Storage::disk('public')->put($ruta, $foto['binario']);
            $fotos[$campo] = '/storage/' . $ruta;
        }

        $empleado->update($fotos + [
            'genero' => $data['genero'],
            'fecha_nacimiento' => $data['fecha_nacimiento'],
            'enrolado_en' => now(),
        ]);

        foreach ($anteriores as $ruta) {
            if (str_starts_with($ruta, '/storage/')) {
                Storage::disk('public')->delete(Str::after($ruta, '/storage/'));
            }
        }

        // Propagar inmediatamente a BioTime (empleado + foto frontal de enrolamiento)
        try {
            $pusher = app(BioTimeEmpleadoPusher::class);
            $res = $pusher->enviar($empleado->fresh());
            Log::info('Resultado de sincronización BioTime en enrolamiento', [
                'empleado_id' => $empleado->id,
                'resultado' => $res,
            ]);
        } catch (Throwable $e) {
            Log::warning('No se pudo enviar empleado a BioTime en enrolamiento: ' . $e->getMessage(), [
                'empleado_id' => $empleado->id,
            ]);
        }
    }

    /**
     * Foto de la cámara o del archivo elegido, como data URI.
     *
     * @return array{binario: string, ext: string}
     */
    private function leerFoto(string $campo, string $valor): array
    {
        if (preg_match('#^data:image/(jpe?g|png|webp);base64,#i', $valor, $m)) {
            $binario = base64_decode(substr($valor, strpos($valor, ',') + 1), true);

            if ($binario !== false && @imagecreatefromstring($binario) !== false) {
                $ext = strtolower($m[1]);

                return ['binario' => $binario, 'ext' => $ext === 'jpeg' ? 'jpg' : $ext];
            }
        }

        throw ValidationException::withMessages([$campo => 'La foto no es una imagen válida; tómela de nuevo.']);
    }
}
