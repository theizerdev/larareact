<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VisitaTemporal;
use App\Models\Responsable;
use App\Models\Pais;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\Empleado;
use App\Models\TipoServicio;
use App\Models\VisitaTemporalPreRegistro;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VisitaTemporalController extends Controller
{
    /** IDs de tipos de servicio que activan el modo entrega simplificada */
    private const ENTREGA_IDS = [1, 6];

    public function index(Request $request)
    {
        $query = VisitaTemporal::query()
            ->with(['paisTelefono', 'empleado.departamento', 'empleado.cargo', 'responsable.departamento', 'responsable.cargo', 'empresa', 'sucursal', 'tipoServicio'])
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

        $visitas  = $query->latest()->paginate($request->perPage ?? 10)->withQueryString();
        $user     = $request->user();
        $empresa  = Empresa::find($user->empresa_id) ?: Empresa::first();
        $sucursal = Sucursal::find($user->sucursal_id);

        $stats = [
            'total'       => VisitaTemporal::count(),
            'activos'     => VisitaTemporal::where('status', 'activo')->count(),
            'suspendidos' => VisitaTemporal::where('status', 'suspendido')->count(),
            'revision'    => VisitaTemporal::where('status', 'en_revision')->count(),
        ];

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

        $tipoServicios = TipoServicio::where('empresa_id', $empresa?->id ?? $user->empresa_id)
            ->where('status', 1)
            ->orderBy('id', 'asc')
            ->get(['id', 'nombre']);

        return Inertia::render('admin/VisitasTemporales/Index', [
            'visitas'       => $visitas,
            'stats'         => $stats,
            'empleados'     => $empleados,
            'responsables'  => $responsables,
            'paises'        => $paises,
            'tipoServicios' => $tipoServicios,
            'filters'       => $request->only('search', 'status', 'perPage', 'fecha_ingreso'),
            'empresa'       => $empresa ? ['id' => $empresa->id, 'razon_social' => $empresa->razon_social] : null,
            'sucursal'      => $sucursal ? ['id' => $sucursal->id, 'nombre' => $sucursal->nombre] : null,
        ]);
    }

    public function store(Request $request)
    {
        $isEntrega = in_array((int) $request->input('tipo_servicio_id'), self::ENTREGA_IDS);
        $validated = $request->validate($this->validationRules($isEntrega));

        $user                        = $request->user();
        $validated['empresa_id']     = $user->empresa_id;
        $validated['sucursal_id']    = $user->sucursal_id;
        $validated['foto_carnet']    = $this->handleImageUpload($request->input('foto_carnet'), 'foto_carnet');
        $validated['foto_documento'] = $this->handleImageUpload($request->input('foto_documento'), 'foto_documento');

        $visita = VisitaTemporal::create($validated);

        // En modo entrega: notificar al empleado visitado Y al responsable
        if ($isEntrega) {
            $this->notifyArrival($visita, $user);
        }

        return back()->with('notification', [
            'type'    => 'success',
            'message' => __('Temporary visit registered successfully.'),
        ]);
    }

    public function update(Request $request, VisitaTemporal $visitaTemporal)
    {
        $isEntrega = in_array((int) $request->input('tipo_servicio_id'), self::ENTREGA_IDS);
        $validated = $request->validate($this->validationRules($isEntrega));

        $responsableCambio = (string) $visitaTemporal->responsable_id !== (string) ($validated['responsable_id'] ?? '');
        $empleadoCambio    = (string) $visitaTemporal->empleado_id    !== (string) ($validated['empleado_id']    ?? '');

        if ($request->filled('foto_carnet') && $request->input('foto_carnet') !== $visitaTemporal->foto_carnet) {
            $this->deleteOldImage($visitaTemporal->foto_carnet);
            $validated['foto_carnet'] = $this->handleImageUpload($request->input('foto_carnet'), 'foto_carnet');
        }

        if ($request->filled('foto_documento') && $request->input('foto_documento') !== $visitaTemporal->foto_documento) {
            $this->deleteOldImage($visitaTemporal->foto_documento);
            $validated['foto_documento'] = $this->handleImageUpload($request->input('foto_documento'), 'foto_documento');
        }

        $visitaTemporal->update($validated);

        // Re-notificar si es entrega y cambio el destinatario
        if ($isEntrega && ($responsableCambio || $empleadoCambio)) {
            $this->notifyArrival($visitaTemporal->fresh(), $request->user());
        }

        return back()->with('notification', [
            'type'    => 'success',
            'message' => __('Temporary visit updated successfully.'),
        ]);
    }

    // -------------------------------------------------------------------------
    // Helpers privados
    // -------------------------------------------------------------------------

    /**
     * Reglas de validacion segun modo (entrega simplificada vs visita completa).
     */
    private function validationRules(bool $isEntrega): array
    {
        return [
            'nombres'             => 'required|string|max:255',
            'apellidos'           => 'required|string|max:255',
            'documento_identidad' => $isEntrega ? 'nullable|string|max:100' : 'required|string|max:100',
            'pais_telefono_id'    => 'nullable|exists:pais,id',
            'telefono'            => 'nullable|string|max:50',
            'empleado_id'         => 'required|exists:empleados,id',
            'responsable_id'      => 'required|exists:responsables,id',
            'tipo_servicio_id'    => 'nullable|exists:tipo_servicios,id',
            'motivo_visita'       => 'nullable|string',
            'fecha_ingreso'       => $isEntrega ? 'nullable|date' : 'required|date',
            'hora_ingreso'        => $isEntrega ? 'nullable' : 'required',
            'fecha_salida'        => $isEntrega ? 'nullable|date' : 'required|date',
            'hora_salida'         => $isEntrega ? 'nullable' : 'required',
            'foto_carnet'         => 'nullable|string',
            'foto_documento'      => 'nullable|string',
            'status'              => 'required|string|in:activo,suspendido,en_revision',
        ];
    }

    /**
     * Envía notificacion WhatsApp TANTO al empleado visitado COMO al responsable.
     * Cada uno recibe un mensaje adaptado a su rol.
     */
    private function notifyArrival(VisitaTemporal $visita, $user): void
    {
        $visita->loadMissing([
            'empleado.paisTelefono',
            'responsable.paisTelefono',
            'tipoServicio',
        ]);

        $empresa         = Empresa::find($user->empresa_id) ?? Empresa::first();
        $whatsappService = new WhatsAppService($empresa);

        // 1. Notificar al empleado (quien recibe directamente la entrega)
        $this->sendWhatsApp(
            $whatsappService,
            $visita->empleado,
            $this->buildEmpleadoMessage($visita, $visita->empleado, $empresa),
            $visita,
            'empleado'
        );

        // 2. Notificar al responsable (quien autoriza / supervisa)
        $this->sendWhatsApp(
            $whatsappService,
            $visita->responsable,
            $this->buildResponsableMessage($visita, $visita->responsable, $empresa),
            $visita,
            'responsable'
        );
    }

    /**
     * Envía un único mensaje WhatsApp con logs de éxito/error.
     */
    private function sendWhatsApp(WhatsAppService $whatsapp, $destinatario, string $message, VisitaTemporal $visita, string $rol): void
    {
        try {
            if (! $destinatario || ! $destinatario->telefono) {
                Log::info("Notificacion WhatsApp omitida: {$rol} sin telefono registrado.", [
                    'visita_id'       => $visita->id,
                    'rol'             => $rol,
                    'destinatario_id' => $destinatario?->id,
                ]);
                return;
            }

            $pais       = $destinatario->paisTelefono;
            $prefix     = $pais ? preg_replace('/[^0-9]/', '', $pais->codigo_telefonico) : '';
            $cleanPhone = preg_replace('/[^0-9]/', '', $destinatario->telefono);
            $to         = $prefix . $cleanPhone;

            if (empty($to)) {
                return;
            }

            $whatsapp->setTimeout(15)->sendMessage($to, $message, true);

            Log::info("Notificacion de llegada enviada al {$rol}.", [
                'visita_id' => $visita->id,
                'rol'       => $rol,
                'to'        => $to,
            ]);
        } catch (\Exception $e) {
            Log::error("Error al enviar notificacion WhatsApp al {$rol}: " . $e->getMessage(), [
                'visita_id' => $visita->id,
                'rol'       => $rol,
            ]);
        }
    }

    /**
     * Mensaje para el EMPLEADO: quien recibe directamente la entrega.
     * Tono informal/directo — le avisa que tiene algo en recepción.
     */
    private function buildEmpleadoMessage(VisitaTemporal $visita, $empleado, ?Empresa $empresa): string
    {
        if (! $empleado) {
            return '';
        }

        $visitante     = trim("{$visita->nombres} {$visita->apellidos}");
        $tipoServicio  = $visita->tipoServicio?->nombre ?? 'Entrega';
        $motivo        = trim($visita->motivo_visita ?? '');
        $hora          = now()->format('h:i A');
        $empresaNombre = $empresa?->razon_social ?? 'la empresa';

        $detalleLinea = ! empty($motivo) ? "Referencia: {$motivo}\n" : '';

        return "📦 Notificacion de Llegada — {$empresaNombre}\n\n"
            . "Hola {$empleado->nombres},\n\n"
            . "Le informamos que tiene una entrega pendiente en recepcion:\n\n"
            . "Tipo de servicio: {$tipoServicio}\n"
            . "Entregado por: {$visitante}\n"
            . $detalleLinea
            . "Hora de llegada: {$hora}\n\n"
            . "Por favor, dirijase a recepcion a retirar su entrega a la brevedad posible.\n\n"
            . "Mensaje generado automaticamente por el sistema de control de acceso de {$empresaNombre}.";
    }

    /**
     * Mensaje para el RESPONSABLE: quien supervisa y autoriza el acceso.
     * Tono formal — le solicita verificar y dar acceso al visitante.
     */
    private function buildResponsableMessage(VisitaTemporal $visita, $responsable, ?Empresa $empresa): string
    {
        if (! $responsable) {
            return '';
        }

        $visitante      = trim("{$visita->nombres} {$visita->apellidos}");
        $tipoServicio   = $visita->tipoServicio?->nombre ?? 'Entrega';
        $empleado       = $visita->empleado;
        $empleadoNombre = $empleado ? trim("{$empleado->nombres} {$empleado->apellidos}") : null;
        $motivo         = trim($visita->motivo_visita ?? '');
        $hora           = now()->format('h:i A');
        $empresaNombre  = $empresa?->razon_social ?? 'la empresa';

        $empleadoLinea = $empleadoNombre ? "Destinatario: {$empleadoNombre}\n" : '';
        $detalleLinea  = ! empty($motivo) ? "Referencia: {$motivo}\n"          : '';

        return "🔔 Notificacion de Llegada — {$empresaNombre}\n\n"
            . "Estimado/a {$responsable->nombres} {$responsable->apellidos},\n\n"
            . "Le informamos que el siguiente visitante se encuentra en recepcion aguardando atencion:\n\n"
            . "Tipo de servicio: {$tipoServicio}\n"
            . "Visitante: {$visitante}\n"
            . $empleadoLinea
            . $detalleLinea
            . "Hora de llegada: {$hora}\n\n"
            . "Le solicitamos amablemente verificar y autorizar el acceso del visitante a la brevedad posible.\n\n"
            . "Mensaje generado automaticamente por el sistema de control de acceso de {$empresaNombre}.";
    }

    public function toggleStatus(Request $request, VisitaTemporal $visitaTemporal)
    {
        $newStatus = $request->has('status')
            ? $request->status
            : ($visitaTemporal->status === 'activo' ? 'suspendido' : 'activo');

        $oldStatus = $visitaTemporal->status;
        $visitaTemporal->update(['status' => $newStatus]);

        // Si cambia a activo y es de tipo entrega, enviar notificacion de llegada al empleado y responsable
        $isEntrega = in_array((int) $visitaTemporal->tipo_servicio_id, self::ENTREGA_IDS);
        if ($newStatus === 'activo' && $oldStatus !== 'activo' && $isEntrega) {
            $this->notifyArrival($visitaTemporal->fresh(), $request->user());
        }

        return back()->with('notification', [
            'type'    => 'success',
            'message' => __('Status updated successfully.'),
        ]);
    }

    public function destroy(VisitaTemporal $visitaTemporal)
    {
        $this->deleteOldImage($visitaTemporal->foto_carnet);
        $this->deleteOldImage($visitaTemporal->foto_documento);
        $visitaTemporal->delete();

        return back()->with('notification', [
            'type'    => 'success',
            'message' => __('Temporary visit log deleted successfully.'),
        ]);
    }

    private function handleImageUpload($input, $fieldName)
    {
        if (! $input) {
            return null;
        }

        if (request()->hasFile($fieldName) && request()->file($fieldName)->isValid()) {
            $path = request()->file($fieldName)->store('visitas_temporales', 'public');
            return '/storage/' . $path;
        }

        if (is_string($input) && preg_match('/^data:image\/(\w+);base64,/', $input, $type)) {
            $data = substr($input, strpos($input, ',') + 1);
            $type = strtolower($type[1]);

            if (! in_array($type, ['jpg', 'jpeg', 'png', 'webp'])) {
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

    public function storeTipoServicio(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
        ]);

        $user      = $request->user();
        $empresa   = Empresa::find($user->empresa_id) ?: Empresa::first();
        $empresaId = $empresa?->id ?? $user->empresa_id;

        $validated['empresa_id']  = $empresaId;
        $validated['sucursal_id'] = $user->sucursal_id;
        $validated['user_id']     = $user->id;
        $validated['status']      = 1;

        $existing = TipoServicio::where('empresa_id', $empresaId)
            ->where('nombre', $validated['nombre'])
            ->first();

        if ($existing) {
            return response()->json(['success' => true, 'tipo_servicio' => $existing]);
        }

        $tipoServicio = TipoServicio::create($validated);

        return response()->json(['success' => true, 'tipo_servicio' => $tipoServicio]);
    }

    public function generatePreRegistro(Request $request)
    {
        $request->validate([
            'nombres'          => 'required|string|max:255',
            'apellidos'        => 'required|string|max:255',
            'pais_telefono_id' => 'required|exists:pais,id',
            'telefono'         => 'required|string|max:20',
            'motivo_registro'  => 'required|string',
            'responsable_id'   => 'required|exists:responsables,id',
            'empleado_id'      => 'required|exists:empleados,id',
        ]);

        $user  = auth()->user();
        $token = bin2hex(random_bytes(16));

        $responsable = Responsable::findOrFail($request->responsable_id);
        $empleado    = Empleado::findOrFail($request->empleado_id);

        VisitaTemporalPreRegistro::create([
            'nombres'          => $request->nombres,
            'apellidos'        => $request->apellidos,
            'pais_telefono_id' => $request->pais_telefono_id,
            'telefono'         => $request->telefono,
            'motivo_registro'  => $request->motivo_registro,
            'responsable_id'   => $request->responsable_id,
            'departamento_id'  => $responsable->departamento_id,
            'empleado_id'      => $request->empleado_id,
            'cargo_id'         => $responsable->cargo_id,
            'token'            => $token,
            'expires_at'       => now()->addHours(12),
            'empresa_id'       => $user->empresa_id,
            'sucursal_id'      => $user->sucursal_id,
            'status'           => 'pendiente',
        ]);

        try {
            $pais       = Pais::findOrFail($request->pais_telefono_id);
            $prefix     = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
            $cleanPhone = preg_replace('/[^0-9]/', '', $request->telefono);
            $to         = $prefix . $cleanPhone;

            $empresa         = $user->empresa ?? Empresa::first();
            $whatsappService = new WhatsAppService($empresa);
            $link            = url("/preregistro-visita/{$token}");

            $message = "Estimado Visitante {$request->nombres} {$request->apellidos}, "
                . "le invitamos a completar su pre-registro de datos para su acceso temporal a nuestras oficinas:\n\n"
                . "Ubicacion: " . ($user->sucursal->nombre ?? $empresa->nombre) . "\n"
                . "Motivo: {$request->motivo_registro}\n"
                . "Visita a: {$empleado->nombres} {$empleado->apellidos}\n"
                . "Autorizado por: {$responsable->nombres} {$responsable->apellidos}\n\n"
                . "Por favor, ingrese al siguiente enlace para completar sus datos:\n"
                . $link;

            $whatsappService->sendMessage($to, $message, true);
        } catch (\Exception $e) {
            Log::error('Error al enviar WhatsApp de invitacion a visitante: ' . $e->getMessage());
        }

        return back()->with('notification', [
            'type'    => 'success',
            'message' => __('Pre-registration invitation sent successfully.'),
        ]);
    }
}
