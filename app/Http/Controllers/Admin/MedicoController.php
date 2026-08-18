<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\Pais;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MedicoController extends Controller
{
    /**
     * Muestra el listado de médicos y profesionales de salud de la clínica.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $empresa = $user->empresa;

        $query = Medico::query()->with(['especialidadPrincipal', 'especialidades', 'user', 'paisTelefono']);

        // Filtro de búsqueda general
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                    ->orWhere('apellidos', 'like', "%{$search}%")
                    ->orWhere('documento_identidad', 'like', "%{$search}%")
                    ->orWhere('licencia_medica', 'like', "%{$search}%")
                    ->orWhere('codigo_medico', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        // Filtro por Especialidad
        if ($especialidadId = $request->input('especialidad_id')) {
            $query->where(function ($q) use ($especialidadId) {
                $q->where('especialidad_principal_id', $especialidadId)
                    ->orWhereHas('especialidades', function ($q2) use ($especialidadId) {
                        $q2->where('especialidades.id', $especialidadId);
                    });
            });
        }

        // Filtro por Estado
        if ($request->has('status') && $request->input('status') !== '') {
            $query->where('status', (bool) $request->input('status'));
        }

        $perPage = (int) $request->input('perPage', $request->input('per_page', 10));

        $medicos = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // Especialidades disponibles en la clínica
        $especialidadesEmpresa = $empresa
            ? $empresa->especialidades()->where('especialidades.status', true)->get(['especialidades.id', 'especialidades.nombre', 'especialidades.icono'])
            : Especialidad::where('status', true)->get(['id', 'nombre', 'icono']);

        // Usuarios disponibles para vincular como médico
        $usersDisponibles = User::where('empresa_id', $user->empresa_id)
            ->get(['id', 'name', 'email']);

        $paises = Pais::where('activo', true)->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']);

        // Rótulo predeterminado internacional según el país de la empresa
        $paisIso = strtoupper($empresa?->pais?->codigo_iso2 ?? 'GENERIC');
        $etiquetaLicenciaPais = match ($paisIso) {
            'MX' => 'Cédula Profesional / SEP',
            'CO' => 'Registro ReTHUS / Tarjeta Prof.',
            'AR' => 'Matrícula Nac. / Prov. (MN/MP)',
            'PE' => 'Colegiatura CMP / RNE',
            'CL' => 'Registro Superintendencia de Salud',
            'ES' => 'N° de Colegiado Médico (OMC)',
            'US' => 'NPI / State Medical License',
            'EC' => 'Registro Senescyt / MSP',
            'VE' => 'N° Colegiatura / MPPS',
            default => 'N° Licencia / Colegiatura Médica',
        };

        // Correlativo sugerido
        $anio = date('Y');
        $ultimoId = (Medico::withoutTenant()->max('id') ?? 0) + 1;
        $siguienteCodigoMedico = sprintf('MED-%s-%04d', $anio, $ultimoId);

        $stats = [
            'total' => Medico::count(),
            'activos' => Medico::where('status', true)->count(),
            'inactivos' => Medico::where('status', false)->count(),
            'con_usuario' => Medico::whereNotNull('user_id')->count(),
        ];

        return Inertia::render('admin/Medicos/Index', [
            'medicos' => $medicos,
            'stats' => $stats,
            'especialidades' => $especialidadesEmpresa,
            'paises' => $paises,
            'users' => $usersDisponibles,
            'etiquetaLicenciaPais' => $etiquetaLicenciaPais,
            'siguienteCodigoMedico' => $siguienteCodigoMedico,
            'filters' => [
                'search' => $request->input('search', ''),
                'especialidad_id' => $request->input('especialidad_id', ''),
                'status' => $request->input('status', ''),
                'perPage' => (string) $perPage,
            ],
        ]);
    }

    /**
     * Registra un nuevo médico en la base de datos.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nombres' => 'required|string|max:150',
            'apellidos' => 'required|string|max:150',
            'documento_identidad' => 'nullable|string|max:50',
            'licencia_medica' => 'nullable|string|max:100',
            'tipo_licencia' => 'nullable|string|max:100',
            'especialidad_principal_id' => 'nullable|exists:especialidades,id',
            'especialidades_secundarias' => 'nullable|array',
            'especialidades_secundarias.*' => 'exists:especialidades,id',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'telefono' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:150',
            'user_id' => 'nullable|exists:users,id',
            'color_agenda' => 'nullable|string|max:10',
            'biografia' => 'nullable|string',
            'status' => 'boolean',
            'crear_usuario_acceso' => 'boolean',
            'password_acceso' => 'nullable|string|min:6',
            'enviar_whatsapp_credenciales' => 'boolean',
        ]);

        $rawPassword = null;

        // Auto-creación de Usuario de Acceso al Sistema si se activó la casilla y se especificó correo
        if ($request->boolean('crear_usuario_acceso') && ! empty($validated['email']) && empty($validated['user_id'])) {
            $rawPassword = $request->input('password_acceso') ?: Str::random(8);

            $newUser = User::create([
                'empresa_id' => $user->empresa_id,
                'name' => "Dr(a). {$validated['nombres']} {$validated['apellidos']}",
                'email' => $validated['email'],
                'password' => Hash::make($rawPassword),
                'status' => 'activo',
                'telefono' => $validated['telefono'] ?? null,
                'pais_telefono_id' => $validated['pais_telefono_id'] ?? null,
            ]);

            if (\Spatie\Permission\Models\Role::where('name', 'Médico')->exists()) {
                $newUser->assignRole('Médico');
            }

            $validated['user_id'] = $newUser->id;
        }

        if (empty($validated['codigo_medico'])) {
            $anio = date('Y');
            $ultimoId = (Medico::withoutTenant()->max('id') ?? 0) + 1;
            $validated['codigo_medico'] = sprintf('MED-%s-%04d', $anio, $ultimoId);
        }

        $validated['empresa_id'] = $user->empresa_id;

        $medico = Medico::create($validated);

        // Sincronizar especialidades secundarias si se enviaron
        if (isset($validated['especialidades_secundarias'])) {
            $medico->especialidades()->sync($validated['especialidades_secundarias']);
        }

        // Envío automático de credenciales por WhatsApp si está activado
        if ($request->boolean('enviar_whatsapp_credenciales', true) && (! empty($medico->telefono) || ! empty($medico->telefono_whatsapp))) {
            $this->sendWhatsAppCredentialsNotification($medico, $rawPassword);
        }

        return back()->with('success', 'Médico registrado con éxito.');
    }

    /**
     * Actualiza los datos del médico especificado.
     */
    public function update(Request $request, Medico $medico)
    {
        $validated = $request->validate([
            'nombres' => 'required|string|max:150',
            'apellidos' => 'required|string|max:150',
            'documento_identidad' => 'nullable|string|max:50',
            'licencia_medica' => 'nullable|string|max:100',
            'tipo_licencia' => 'nullable|string|max:100',
            'especialidad_principal_id' => 'nullable|exists:especialidades,id',
            'especialidades_secundarias' => 'nullable|array',
            'especialidades_secundarias.*' => 'exists:especialidades,id',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'telefono' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:150',
            'user_id' => 'nullable|exists:users,id',
            'color_agenda' => 'nullable|string|max:10',
            'biografia' => 'nullable|string',
            'status' => 'boolean',
        ]);

        $medico->update($validated);

        if (array_key_exists('especialidades_secundarias', $validated)) {
            $medico->especialidades()->sync($validated['especialidades_secundarias'] ?? []);
        }

        return back()->with('success', 'Datos del médico actualizados con éxito.');
    }

    /**
     * Conmuta el estado activo/inactivo del médico.
     */
    public function toggleStatus(Medico $medico)
    {
        $medico->update(['status' => ! $medico->status]);

        return back()->with('success', 'Estado del médico actualizado.');
    }

    /**
     * Elimina el expediente del médico.
     */
    public function destroy(Medico $medico)
    {
        $medico->delete();

        return back()->with('success', 'Médico eliminado con éxito.');
    }

    /**
     * Envía manualmente la notificación con credenciales de acceso por WhatsApp.
     */
    public function sendWhatsAppCredentials(Request $request, Medico $medico)
    {
        $sent = $this->sendWhatsAppCredentialsNotification($medico);

        if ($sent) {
            return back()->with('success', 'Notificación con credenciales enviada por WhatsApp vía integración.');
        }

        $phone = $medico->telefono_whatsapp ?: $medico->telefono;
        if (! $phone) {
            return back()->with('error', 'El médico no tiene un número de teléfono registrado.');
        }

        $cleanPhone = preg_replace('/\D/', '', $phone);
        $empresaNombre = $request->user()->empresa?->razon_social ?? $request->user()->empresa?->nombre_comercial ?? 'nuestro centro médico';
        $loginUrl = url('/login');
        $email = $medico->email ?: 'Registrado en sistema';

        $mensaje = "Estimado(a) Dr(a). {$medico->nombres} {$medico->apellidos} 👋,\n\nReciba un cordial saludo de parte de *{$empresaNombre}* 🏥✨.\n\nLe informamos que su expediente profesional y cuenta médica han sido registrados con éxito en nuestra plataforma empresarial.\n\n🔑 *Acceso al Portal:* {$loginUrl}\n• *Usuario / Correo:* {$email}\n\nQuedamos a su entera disposición para cualquier asistencia. ¡Bienvenido(a) a nuestro equipo médico! 👨‍⚕️👩‍⚕️";

        $encodedText = rawurlencode($mensaje);
        $waUrl = "https://wa.me/{$cleanPhone}?text={$encodedText}";

        return back()->with([
            'success' => 'Redirigiendo a WhatsApp...',
            'wa_url' => $waUrl,
        ]);
    }

    /**
     * Helper privado para formatear y despachar la notificación WhatsApp respetuosa y cordial.
     */
    private function sendWhatsAppCredentialsNotification(Medico $medico, ?string $rawPassword = null): bool
    {
        $phone = $medico->telefono_whatsapp ?: $medico->telefono;
        if (! $phone) {
            return false;
        }

        $cleanPhone = preg_replace('/\D/', '', $phone);
        $empresa = $medico->empresa;
        $empresaNombre = $empresa?->razon_social ?? $empresa?->nombre_comercial ?? 'nuestro centro médico';
        $loginUrl = url('/login');
        $email = $medico->email ?: 'Registrado en sistema';

        $credencialesTexto = "";
        if ($rawPassword) {
            $credencialesTexto = "\n\n🔑 *Credenciales de Acceso al Sistema:*\n• *Portal:* {$loginUrl}\n• *Usuario / Correo:* {$email}\n• *Contraseña Temporal:* `{$rawPassword}`\n\n_Por motivos de seguridad, le sugerimos cambiar su contraseña al ingresar por primera vez._";
        } else {
            $credencialesTexto = "\n\n🔑 *Acceso al Portal del Sistema:*\n• *Portal:* {$loginUrl}\n• *Usuario / Correo:* {$email}";
        }

        $mensaje = "Estimado(a) Dr(a). {$medico->nombres} {$medico->apellidos} 👋,\n\nReciba un cordial saludo de parte de *{$empresaNombre}* 🏥✨.\n\nLe informamos que su expediente profesional y cuenta médica han sido registrados con éxito en nuestra plataforma empresarial.{$credencialesTexto}\n\nQuedamos a su entera disposición para cualquier consulta o asistencia técnica. ¡Bienvenido(a) a nuestro equipo médico! 👨‍⚕️👩‍⚕️";

        try {
            $whatsappService = new WhatsAppService($empresa);
            $result = $whatsappService->sendMessage($cleanPhone, $mensaje, true);

            return ! empty($result);
        } catch (\Exception $e) {
            Log::warning("Error al enviar credenciales WhatsApp para médico ID {$medico->id}: {$e->getMessage()}");

            return false;
        }
    }
}
