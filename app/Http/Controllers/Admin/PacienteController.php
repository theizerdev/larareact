<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Paciente;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PacienteController extends Controller
{
    /**
     * Display a listing of patients.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $empresa = $user->empresa;

        $query = Paciente::query()->with(['paisTelefono', 'paisTelefonoTutor']);

        // Filtro de búsqueda por nombre, cédula, código o mascota/tutor
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                    ->orWhere('apellidos', 'like', "%{$search}%")
                    ->orWhere('documento_identidad', 'like', "%{$search}%")
                    ->orWhere('codigo_paciente', 'like', "%{$search}%")
                    ->orWhere('nombre_mascota', 'like', "%{$search}%")
                    ->orWhere('microchip', 'like', "%{$search}%")
                    ->orWhere('tutor_nombre', 'like', "%{$search}%")
                    ->orWhere('tutor_documento', 'like', "%{$search}%");
            });
        }

        // Filtro por tipo de paciente (humano / animal)
        if ($tipo = $request->input('tipo_paciente')) {
            $query->where('tipo_paciente', $tipo);
        }

        // Filtro por estado
        if ($request->has('status') && $request->input('status') !== '') {
            $query->where('status', (bool) $request->input('status'));
        }

        $perPage = $request->input('perPage', $request->input('per_page', 10));

        $pacientes = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // Especialidades activas de la clínica para personalizar UI
        $especialidadesEmpresa = $empresa ? $empresa->especialidades()->with('ramaMedica')->get() : collect();
        $tieneVeterinaria = $especialidadesEmpresa->contains(fn ($e) => $e->ramaMedica?->slug === 'veterinaria');
        $tieneHumano = $especialidadesEmpresa->contains(fn ($e) => $e->ramaMedica?->slug !== 'veterinaria') || $especialidadesEmpresa->isEmpty();

        // Siguiente código correlativo sugerido
        $anio = date('Y');
        $ultimoId = (Paciente::withoutTenant()->max('id') ?? 0) + 1;
        $siguienteCodigoHumano = sprintf('PAC-%s-%04d', $anio, $ultimoId);
        $siguienteCodigoAnimal = sprintf('VET-%s-%04d', $anio, $ultimoId);

        $stats = [
            'total' => Paciente::count(),
            'humanos' => Paciente::where('tipo_paciente', 'humano')->count(),
            'mascotas' => Paciente::where('tipo_paciente', 'animal')->count(),
            'activos' => Paciente::where('status', true)->count(),
        ];

        $paises = \App\Models\Pais::where('activo', true)
            ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']);

        return Inertia::render('admin/Pacientes/Index', [
            'pacientes' => $pacientes,
            'stats' => $stats,
            'paises' => $paises,
            'empresaNombre' => $empresa?->razon_social ?? $empresa?->nombre_comercial ?? 'nuestro centro médico',
            'filters' => [
                'search' => $request->input('search', ''),
                'tipo_paciente' => $request->input('tipo_paciente', ''),
                'status' => $request->input('status', ''),
                'perPage' => (string) $perPage,
            ],
            'tieneVeterinaria' => $tieneVeterinaria,
            'tieneHumano' => $tieneHumano,
            'siguienteCodigoHumano' => $siguienteCodigoHumano,
            'siguienteCodigoAnimal' => $siguienteCodigoAnimal,
        ]);
    }

    /**
     * Store a newly created patient.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $tipoPaciente = $request->input('tipo_paciente', 'humano');

        $rules = [
            'tipo_paciente' => 'required|in:humano,animal',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'status' => 'boolean',
        ];

        if ($tipoPaciente === 'humano') {
            $rules = array_merge($rules, [
                'nombres' => 'required|string|max:150',
                'apellidos' => 'required|string|max:150',
                'documento_identidad' => 'nullable|string|max:50',
                'fecha_nacimiento' => 'nullable|date',
                'genero' => 'nullable|in:masculino,femenino,otro',
                'pais_telefono_id' => 'nullable|exists:pais,id',
                'telefono' => 'nullable|string|max:30',
                'email' => 'nullable|email|max:150',
                'direccion' => 'nullable|string|max:500',
                'tipo_sangre' => 'nullable|string|max:10',
                'alergias' => 'nullable|string',
                'antecedentes_medicos' => 'nullable|string',
            ]);
        } else {
            $rules = array_merge($rules, [
                'nombre_mascota' => 'required|string|max:150',
                'especie' => 'required|string|max:50',
                'raza' => 'nullable|string|max:100',
                'color_marcas' => 'nullable|string|max:150',
                'microchip' => 'nullable|string|max:100',
                'esterilizado' => 'boolean',
                'tutor_nombre' => 'required|string|max:150',
                'tutor_documento' => 'nullable|string|max:50',
                'pais_telefono_tutor_id' => 'nullable|exists:pais,id',
                'tutor_telefono' => 'nullable|string|max:30',
                'tutor_email' => 'nullable|email|max:150',
            ]);
        }

        $validated = $request->validate($rules);

        // Auto-generar código correlativo si no viene explícito
        if (empty($validated['codigo_paciente'])) {
            $prefix = $tipoPaciente === 'animal' ? 'VET' : 'PAC';
            $anio = date('Y');
            $ultimoId = (Paciente::withoutTenant()->max('id') ?? 0) + 1;
            $validated['codigo_paciente'] = sprintf('%s-%s-%04d', $prefix, $anio, $ultimoId);
        }

        $validated['empresa_id'] = $user->empresa_id;

        Paciente::create($validated);

        return back()->with('success', 'Paciente registrado con éxito.');
    }

    /**
     * Update the specified patient.
     */
    public function update(Request $request, Paciente $paciente)
    {
        $tipoPaciente = $request->input('tipo_paciente', $paciente->tipo_paciente);

        $rules = [
            'tipo_paciente' => 'required|in:humano,animal',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'status' => 'boolean',
        ];

        if ($tipoPaciente === 'humano') {
            $rules = array_merge($rules, [
                'nombres' => 'required|string|max:150',
                'apellidos' => 'required|string|max:150',
                'documento_identidad' => 'nullable|string|max:50',
                'fecha_nacimiento' => 'nullable|date',
                'genero' => 'nullable|in:masculino,femenino,otro',
                'pais_telefono_id' => 'nullable|exists:pais,id',
                'telefono' => 'nullable|string|max:30',
                'email' => 'nullable|email|max:150',
                'direccion' => 'nullable|string|max:500',
                'tipo_sangre' => 'nullable|string|max:10',
                'alergias' => 'nullable|string',
                'antecedentes_medicos' => 'nullable|string',
            ]);
        } else {
            $rules = array_merge($rules, [
                'nombre_mascota' => 'required|string|max:150',
                'especie' => 'required|string|max:50',
                'raza' => 'nullable|string|max:100',
                'color_marcas' => 'nullable|string|max:150',
                'microchip' => 'nullable|string|max:100',
                'esterilizado' => 'boolean',
                'tutor_nombre' => 'required|string|max:150',
                'tutor_documento' => 'nullable|string|max:50',
                'pais_telefono_tutor_id' => 'nullable|exists:pais,id',
                'tutor_telefono' => 'nullable|string|max:30',
                'tutor_email' => 'nullable|email|max:150',
            ]);
        }

        $validated = $request->validate($rules);

        $paciente->update($validated);

        return back()->with('success', 'Datos del paciente actualizados con éxito.');
    }

    /**
     * Toggle status of specified patient.
     */
    public function toggleStatus(Paciente $paciente)
    {
        $paciente->update(['status' => ! $paciente->status]);

        return back()->with('success', 'Estado del paciente actualizado.');
    }

    /**
     * Remove the specified patient.
     */
    public function destroy(Paciente $paciente)
    {
        $paciente->delete();

        return back()->with('success', 'Paciente eliminado con éxito.');
    }

    /**
     * Envía mensaje de bienvenida por WhatsApp al paciente o tutor usando la integración oficial de WhatsAppService.
     */
    public function sendWhatsAppWelcome(Request $request, Paciente $paciente)
    {
        $user = $request->user();
        $empresa = $user->empresa;
        $empresaNombre = $empresa?->razon_social ?? $empresa?->nombre_comercial ?? 'nuestro centro médico';

        $isAnimal = $paciente->tipo_paciente === 'animal';
        $phone = $isAnimal
            ? ($paciente->telefono_tutor_whatsapp ?: $paciente->tutor_telefono)
            : ($paciente->telefono_whatsapp ?: $paciente->telefono);

        if (! $phone) {
            return back()->with('error', 'Este paciente no tiene un número de teléfono registrado.');
        }

        $cleanPhone = preg_replace('/\D/', '', $phone);

        if ($isAnimal) {
            $tutor = $paciente->tutor_nombre ?: 'Estimado(a) tutor(a)';
            $mascota = $paciente->nombre_mascota ?: 'su mascota';
            $mensaje = "Hola {$tutor} 👋, te damos la bienvenida a {$empresaNombre} 🐾✨. Nos alegra enormemente registrar a {$mascota} en nuestro centro médico. Estamos a tu entera disposición para cuidar con el mayor cariño de su salud y bienestar.";
        } else {
            $persona = $paciente->nombres ?: $paciente->nombre_completo;
            $mensaje = "Hola {$persona} 👋, te damos la bienvenida a {$empresaNombre} 🏥✨. Es un verdadero gusto saludarte. Estamos a tu entera disposición para agendar tus consultas, responder tus inquietudes o brindarte la mejor atención médica.";
        }

        try {
            $whatsappService = new WhatsAppService($empresa);
            $result = $whatsappService->sendMessage($cleanPhone, $mensaje, true);

            if ($result) {
                return back()->with('success', 'Mensaje de bienvenida enviado por WhatsApp vía integración exitosamente.');
            }

            // Si la instancia local no respondió exitosamente, enviamos el enlace wa.me como respaldo
            $encodedText = rawurlencode($mensaje);
            $waUrl = "https://wa.me/{$cleanPhone}?text={$encodedText}";

            return back()->with([
                'success' => 'Redirigiendo a WhatsApp...',
                'wa_url' => $waUrl,
            ]);
        } catch (\Exception $e) {
            $encodedText = rawurlencode($mensaje);
            $waUrl = "https://wa.me/{$cleanPhone}?text={$encodedText}";

            return back()->with([
                'error' => 'No se pudo contactar directamente el API de WhatsApp. Abriendo WhatsApp...',
                'wa_url' => $waUrl,
            ]);
        }
    }
}
