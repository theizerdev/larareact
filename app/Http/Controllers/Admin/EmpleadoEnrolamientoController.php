<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\EnrolamientoInvitacionMail;
use App\Models\BiotimeEmpleado;
use App\Models\Empleado;
use App\Models\EmpleadoEnrolamientoCedula;
use App\Models\Empresa;
use App\Models\Pais;
use App\Services\BioTimeEmpleadoPusher;
use App\Services\CedulaEnrolamientoService;
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
                'numero' => $empleado->codigo_nuevo ?: ($empleado->documento_identidad ?: $empleado->codigo_acceso),
                'codigo_nuevo' => $empleado->codigo_nuevo ?: $empleado->documento_identidad,
                'codigo_anterior' => $empleado->codigo_anterior,
                'legacy' => $empleado->legacy,
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
        $this->guardarEnrolamiento($request, $empleado, 'admin');

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
            'codigo_nuevo' => 'nullable|string|max:50',
            'codigo_anterior' => 'nullable|string|max:50',
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
            $empleado = Empleado::when($user->empresa_id, fn ($q) => $q->where('empresa_id', $user->empresa_id))
                ->findOrFail($data['empleado_id']);
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
            $doc = trim((string) ($data['codigo_nuevo'] ?? $data['documento_identidad'] ?? ''));
            $codigoAnt = trim((string) ($data['codigo_anterior'] ?? ''));

            if ($doc !== '' || $codigoAnt !== '') {
                $empleado = Empleado::where('empresa_id', $user->empresa_id)
                    ->where(function ($q) use ($doc, $codigoAnt) {
                        if ($doc !== '') {
                            $q->where('documento_identidad', $doc)
                                ->orWhere('codigo_nuevo', $doc)
                                ->orWhere('codigo_acceso', $doc);
                        }
                        if ($codigoAnt !== '') {
                            if ($doc !== '') {
                                $q->orWhere('codigo_anterior', $codigoAnt);
                            } else {
                                $q->where('codigo_anterior', $codigoAnt);
                            }
                        }
                    })
                    ->first();

                if (! $empleado && $doc !== '' && Empleado::withoutTenant()->where('documento_identidad', $doc)->exists()) {
                    throw ValidationException::withMessages([
                        'documento_identidad' => ['Este número de empleado ya está registrado en otra empresa.'],
                    ]);
                }
            }

            if (!$empleado) {
                $empleado = new Empleado();
                $empleado->nombres = $data['nombres'];
                $empleado->apellidos = $data['apellidos'];

                if ($doc !== '') {
                    $empleado->documento_identidad = $doc;
                    $empleado->codigo_nuevo = $doc;
                } else {
                    do {
                        $code = (string) mt_rand(100000, 999999);
                    } while (
                        Empleado::withoutTenant()
                            ->where(fn ($q) => $q->where('documento_identidad', $code)->orWhere('codigo_nuevo', $code)->orWhere('codigo_acceso', $code))
                            ->exists()
                    );
                    $empleado->documento_identidad = $code;
                    $empleado->codigo_nuevo = $code;
                }

                if ($codigoAnt !== '') {
                    $empleado->codigo_anterior = $codigoAnt;
                }

                if (
                    mb_strlen($empleado->documento_identidad) <= 20
                    && ! Empleado::withoutTenant()->where('codigo_acceso', $empleado->documento_identidad)->exists()
                ) {
                    $empleado->codigo_acceso = $empleado->documento_identidad;
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

        if ($bio = BiotimeEmpleado::where('empleado_id', $empleado->id)->where('empresa_id', $empleado->empresa_id)->first()) {
            app(BioTimeEmpleadoPusher::class)->sincronizarCodigoDesdeBioTime($empleado, $bio);
            $empleado->refresh();
        }

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
                'codigo_acceso' => $empleado->codigo_acceso ?: $empleado->documento_identidad,
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
                'numero' => $empleado->codigo_nuevo ?: ($empleado->documento_identidad ?: $empleado->codigo_acceso),
                'codigo_nuevo' => $empleado->codigo_nuevo ?: $empleado->documento_identidad,
                'codigo_anterior' => $empleado->codigo_anterior,
                'legacy' => $empleado->legacy,
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

        $this->guardarEnrolamiento($request, $empleado, 'publico');

        return back();
    }

    /**
     * Lista las cédulas de enrolamiento y logs guardados en el expediente del colaborador.
     */
    public function cedulas(Empleado $empleado)
    {
        $cedulas = $empleado->cedulasEnrolamiento()
            ->with('logs')
            ->get()
            ->map(fn (\App\Models\EmpleadoEnrolamientoCedula $c) => [
                'id' => $c->id,
                'uuid' => $c->uuid,
                'origen' => $c->origen,
                'estado' => $c->estado,
                'no_empleado' => $c->no_empleado,
                'codigo_legacy' => $c->codigo_legacy,
                'nombre_completo' => $c->nombre_completo,
                'aviso_privacidad_aceptado_en' => $c->aviso_privacidad_aceptado_en?->toIso8601String(),
                'enrolado_en' => $c->enrolado_en?->toIso8601String(),
                'ip_address' => $c->ip_address,
                'sello_digital' => $c->sello_digital,
                'integridad_valida' => $c->verificarIntegridad(),
                'pdf_url' => route('admin.empleados.cedulas-enrolamiento.pdf', [$empleado->id, $c->id]),
                'logs' => $c->logs->map(fn ($l) => [
                    'id' => $l->id,
                    'uuid' => $l->uuid,
                    'accion' => $l->accion,
                    'etiqueta' => $l->etiqueta,
                    'descripcion' => $l->descripcion,
                    'ip_address' => $l->ip_address,
                    'latitud' => $l->latitud,
                    'longitud' => $l->longitud,
                    'hash_evento' => $l->hash_evento,
                    'ocurrido_en' => $l->ocurrido_en?->toIso8601String(),
                ])->values(),
            ]);

        return response()->json([
            'success' => true,
            'empleado' => [
                'id' => $empleado->id,
                'nombre_completo' => $empleado->nombre_completo,
                'codigo_nuevo' => $empleado->codigo_nuevo ?: $empleado->documento_identidad,
                'codigo_anterior' => $empleado->codigo_anterior,
                'legacy' => $empleado->legacy,
            ],
            'cedulas' => $cedulas,
        ]);
    }

    /**
     * Descarga o muestra en el navegador el PDF de la Cédula de Enrolamiento del expediente.
     */
    public function descargarCedulaPdf(
        Empleado $empleado,
        EmpleadoEnrolamientoCedula $cedula,
        CedulaEnrolamientoService $cedulaService,
    )
    {
        if ((int) $cedula->empleado_id !== (int) $empleado->id) {
            abort(404);
        }

        $pdfPath = $cedulaService->regenerarPdf($cedula, $empleado);
        $rel = preg_replace('#^/?(storage/)+#', '', ltrim($pdfPath, '/'));

        if (! $rel || ! Storage::disk('public')->exists($rel)) {
            abort(404, 'El archivo PDF de la cédula no se encuentra en el expediente.');
        }

        return response(Storage::disk('public')->get($rel), 200, [
            'Content-Type' => 'application/pdf',
            'Cache-Control' => 'no-store, private',
            'Content-Disposition' => 'inline; filename="cedula-enrolamiento-' . $cedula->uuid . '.pdf"',
        ]);
    }

    /**
     * Lógica central de guardado de datos biométricos, fotos y sincronización con BioTime.
     */
    private function guardarEnrolamiento(Request $request, Empleado $empleado, string $origen = 'admin'): void
    {
        $empleado = app(\App\Services\EmpleadoEnrolamientoService::class)->guardar($empleado, $request->all());

        app(\App\Services\CedulaEnrolamientoService::class)->completarYGenerarCedula($empleado, [
            'origen' => $origen,
            'cedula_uuid' => $request->input('cedula_uuid'),
            'user_id' => $request->user()?->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'latitud' => $request->input('latitud'),
            'longitud' => $request->input('longitud'),
        ]);
    }
}
