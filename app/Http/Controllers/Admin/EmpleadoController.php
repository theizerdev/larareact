<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmpleadoRequest;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\Departamento;
use App\Models\Responsable;
use App\Models\Cargo;
use App\Models\Pais;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\EmpleadoImportService;
use Inertia\Inertia;

class EmpleadoController extends Controller
{
    public function index(Request $request)
    {
        $query = Empleado::with(['paisTelefono', 'departamento', 'responsable', 'cargo', 'empresa', 'sucursal', 'user', 'vehiculos'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%")
                        ->orWhere('correo', 'like', "%{$search}%")
                        ->orWhere('telefono', 'like', "%{$search}%");
                });
            });

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('departamento_id')) {
            $query->where('departamento_id', $request->departamento_id);
        }

        $empleados = $query->latest()->paginate($request->perPage ?? 10)->withQueryString();

        $stats = [
            'total' => Empleado::count(),
            'activos' => Empleado::where('status', 1)->count(),
            'inactivos' => Empleado::where('status', 0)->count(),
        ];

        $user = $request->user();
        $empresa = Empresa::find($user->empresa_id) ?: Empresa::first();
        $sucursal = Sucursal::find($user->sucursal_id);

        return Inertia::render('admin/Empleados/Index', [
            'empleados' => $empleados,
            'stats' => $stats,
            'empresas' => Empresa::where('status', true)->orderBy('razon_social', 'asc')->get(['id', 'razon_social']),
            'sucursales' => Sucursal::where('status', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'empresa_id']),
            'usuarios' => User::orderBy('name', 'asc')->get(['id', 'name', 'email']),
            'departamentos' => Departamento::where('status', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'empresa_id', 'sucursal_id']),
            'responsables' => Responsable::where('status', true)->with('cargo:id,nombre')->orderBy('nombres', 'asc')->get(['id', 'nombres', 'apellidos', 'departamento_id', 'cargo_id']),
            'cargos' => Cargo::where('status', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'departamento_id']),
            'paises' => Pais::where('activo', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']),
            'filters' => $request->only('search', 'status', 'perPage', 'departamento_id'),
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

    public function carnet(Empleado $empleado)
    {
        $empleado->load(['paisTelefono', 'departamento', 'cargo', 'empresa', 'sucursal']);

        return Inertia::render('admin/Empleados/Carnet', [
            'empleado' => $empleado,
        ]);
    }

    public function store(EmpleadoRequest $request)
    {
        $data = $request->validated();

        if (empty($data['documento_identidad'])) {
            do {
                $code = (string) mt_rand(100000, 999999);
            } while (Empleado::where('documento_identidad', $code)->exists());
            $data['documento_identidad'] = $code;
        }

        $data['foto_empleado'] = $this->handleImageUpload($request->input('foto_empleado'), 'foto_empleado');
        $data['foto_empleado_2'] = $this->handleImageUpload($request->input('foto_empleado_2'), 'foto_empleado_2');
        $data['foto_documento'] = $this->handleImageUpload($request->input('foto_documento'), 'foto_documento');
        $data['foto_documento_reverso'] = $this->handleImageUpload($request->input('foto_documento_reverso'), 'foto_documento_reverso');

        $empleado = Empleado::create($data);

        $primerVehiculo = null;
        // Guardar vehículos
        if ($request->has('vehiculos') && is_array($request->input('vehiculos'))) {
            foreach ($request->input('vehiculos') as $veh) {
                $fotoFrontal = isset($veh['foto_frontal']) ? $this->handleImageUpload($veh['foto_frontal'], null) : null;
                $fotoTrasera = isset($veh['foto_trasera']) ? $this->handleImageUpload($veh['foto_trasera'], null) : null;

                $vCreated = $empleado->vehiculos()->create([
                    'tipo_vehiculo' => $veh['tipo_vehiculo'],
                    'marca' => $veh['marca'],
                    'modelo' => $veh['modelo'],
                    'year' => $veh['year'],
                    'placa' => $veh['placa'],
                    'foto_frontal' => $fotoFrontal,
                    'foto_trasera' => $fotoTrasera,
                    'empresa_id' => $empleado->empresa_id,
                    'sucursal_id' => $empleado->sucursal_id,
                ]);

                if (!$primerVehiculo) {
                    $primerVehiculo = $vCreated;
                }
            }
        }

        // Enviar Gafete / Carnet por WhatsApp al empleado automáticamente
        $this->enviarCarnetWhatsAppInternal($empleado);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Employee created successfully.'),
        ]);
    }

    public function carnetPublico(Empleado $empleado)
    {
        $empleado->load(['paisTelefono', 'departamento', 'cargo', 'empresa', 'sucursal']);

        return Inertia::render('admin/Empleados/Carnet', [
            'empleado' => $empleado,
        ]);
    }

    public function enviarCarnetWhatsApp(Empleado $empleado)
    {
        $sent = $this->enviarCarnetWhatsAppInternal($empleado);

        if ($sent) {
            return back()->with('notification', [
                'type' => 'success',
                'message' => "Carnet enviado por WhatsApp a {$empleado->nombres} {$empleado->apellidos}.",
            ]);
        }

        return back()->with('notification', [
            'type' => 'error',
            'message' => 'El empleado no cuenta con un número de teléfono válido para enviarle el WhatsApp.',
        ]);
    }

    private function enviarCarnetWhatsAppInternal(Empleado $empleado): bool
    {
        if (empty($empleado->telefono)) {
            return false;
        }

        try {
            $user = request()->user();
            $empresa = Empresa::find($empleado->empresa_id) ?: (Empresa::find($user->empresa_id ?? 1) ?: Empresa::first());

            $cleanPhone = preg_replace('/[^0-9]/', '', $empleado->telefono);
            if (strlen($cleanPhone) >= 9) {
                $pais = $empleado->paisTelefono ?: Pais::find($empleado->pais_telefono_id);
                $prefix = $pais ? preg_replace('/[^0-9]/', '', $pais->codigo_telefonico) : '51';
                $to = $prefix . $cleanPhone;

                $carnetUrl = url("/carnet-empleado/{$empleado->id}");
                $deptoNombre = $empleado->departamento->nombre ?? 'General';

                $msg  = "🪪 *¡TU GAFETE / CARNET DIGITAL DRISCOLL'S ESTÁ LISTO!*\n\n";
                $msg .= "Hola *{$empleado->nombres} {$empleado->apellidos}*,\n";
                $msg .= "Se ha generado tu Carnet de Identificación de Empleado.\n\n";
                $msg .= "📌 *Documento:* {$empleado->documento_identidad}\n";
                $msg .= "🏢 *Departamento:* {$deptoNombre}\n\n";
                $msg .= "📲 *Accede a tu carnet digital aquí:*\n";
                $msg .= "🔗 {$carnetUrl}\n\n";
                $msg .= "Presenta este carnet o código QR en garita para tu control de accesos.";

                $ws = new \App\Services\WhatsAppService($empresa);
                $carnetPath = \App\Services\CarnetGeneratorService::generarCarnetPNG($empleado);

                if ($carnetPath && file_exists($carnetPath)) {
                    $result = $ws->sendDocument($to, $carnetPath, $msg);
                    if (!$result) {
                        $result = $ws->sendImage($to, $carnetPath, $msg);
                    }
                    if (!$result) {
                        $ws->sendMessage($to, $msg, true);
                    }
                } else {
                    $ws->sendMessage($to, $msg, true);
                }
                return true;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error enviando Carnet por WhatsApp: ' . $e->getMessage());
        }

        return false;
    }

    public function update(EmpleadoRequest $request, Empleado $empleado)
    {
        $data = $request->validated();

        // Manejar Foto del Empleado
        if ($request->hasFile('foto_empleado')) {
            $newPath = $this->handleImageUpload(null, 'foto_empleado');
            if ($newPath) {
                $this->deleteOldImage($empleado->foto_empleado);
                $data['foto_empleado'] = $newPath;
            }
        } elseif ($request->exists('foto_empleado')) {
            $input = $request->input('foto_empleado');
            if ($input === '' || $input === null) {
                $this->deleteOldImage($empleado->foto_empleado);
                $data['foto_empleado'] = null;
            } else {
                $newPath = $this->handleImageUpload($input, 'foto_empleado');
                if ($newPath && $newPath !== $empleado->foto_empleado) {
                    $this->deleteOldImage($empleado->foto_empleado);
                    $data['foto_empleado'] = $newPath;
                }
            }
        }

        // Manejar Foto del Empleado 2
        if ($request->hasFile('foto_empleado_2')) {
            $newPath = $this->handleImageUpload(null, 'foto_empleado_2');
            if ($newPath) {
                $this->deleteOldImage($empleado->foto_empleado_2);
                $data['foto_empleado_2'] = $newPath;
            }
        } elseif ($request->exists('foto_empleado_2')) {
            $input = $request->input('foto_empleado_2');
            if ($input === '' || $input === null) {
                $this->deleteOldImage($empleado->foto_empleado_2);
                $data['foto_empleado_2'] = null;
            } else {
                $newPath = $this->handleImageUpload($input, 'foto_empleado_2');
                if ($newPath && $newPath !== $empleado->foto_empleado_2) {
                    $this->deleteOldImage($empleado->foto_empleado_2);
                    $data['foto_empleado_2'] = $newPath;
                }
            }
        }

        // Manejar Foto del Documento
        if ($request->hasFile('foto_documento')) {
            $newPath = $this->handleImageUpload(null, 'foto_documento');
            if ($newPath) {
                $this->deleteOldImage($empleado->foto_documento);
                $data['foto_documento'] = $newPath;
            }
        } elseif ($request->exists('foto_documento')) {
            $input = $request->input('foto_documento');
            if ($input === '' || $input === null) {
                $this->deleteOldImage($empleado->foto_documento);
                $data['foto_documento'] = null;
            } else {
                $newPath = $this->handleImageUpload($input, 'foto_documento');
                if ($newPath && $newPath !== $empleado->foto_documento) {
                    $this->deleteOldImage($empleado->foto_documento);
                    $data['foto_documento'] = $newPath;
                }
            }
        }

        // Manejar Foto del Documento (Reverso)
        if ($request->hasFile('foto_documento_reverso')) {
            $newPath = $this->handleImageUpload(null, 'foto_documento_reverso');
            if ($newPath) {
                $this->deleteOldImage($empleado->foto_documento_reverso);
                $data['foto_documento_reverso'] = $newPath;
            }
        } elseif ($request->exists('foto_documento_reverso')) {
            $input = $request->input('foto_documento_reverso');
            if ($input === '' || $input === null) {
                $this->deleteOldImage($empleado->foto_documento_reverso);
                $data['foto_documento_reverso'] = null;
            } else {
                $newPath = $this->handleImageUpload($input, 'foto_documento_reverso');
                if ($newPath && $newPath !== $empleado->foto_documento_reverso) {
                    $this->deleteOldImage($empleado->foto_documento_reverso);
                    $data['foto_documento_reverso'] = $newPath;
                }
            }
        }

        $empleado->update($data);

        // Sincronizar vehículos
        if ($request->has('vehiculos')) {
            foreach ($empleado->vehiculos as $oldVeh) {
                $this->deleteOldImage($oldVeh->foto_frontal);
                $this->deleteOldImage($oldVeh->foto_trasera);
            }
            $empleado->vehiculos()->delete();

            if (is_array($request->input('vehiculos'))) {
                foreach ($request->input('vehiculos') as $veh) {
                    $fotoFrontal = isset($veh['foto_frontal']) ? $this->handleImageUpload($veh['foto_frontal'], null) : null;
                    $fotoTrasera = isset($veh['foto_trasera']) ? $this->handleImageUpload($veh['foto_trasera'], null) : null;

                    $empleado->vehiculos()->create([
                        'tipo_vehiculo' => $veh['tipo_vehiculo'],
                        'marca' => $veh['marca'],
                        'modelo' => $veh['modelo'],
                        'year' => $veh['year'],
                        'placa' => $veh['placa'],
                        'foto_frontal' => $fotoFrontal,
                        'foto_trasera' => $fotoTrasera,
                        'empresa_id' => $empleado->empresa_id,
                        'sucursal_id' => $empleado->sucursal_id,
                    ]);
                }
            }
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Employee updated successfully.'),
        ]);
    }

    public function toggleStatus(Empleado $empleado)
    {
        $empleado->update(['status' => !$empleado->status]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Status updated successfully.'),
        ]);
    }

    public function destroy(Empleado $empleado)
    {
        $this->deleteOldImage($empleado->foto_empleado);
        $this->deleteOldImage($empleado->foto_empleado_2);
        $this->deleteOldImage($empleado->foto_documento);
        $this->deleteOldImage($empleado->foto_documento_reverso);

        foreach ($empleado->vehiculos as $oldVeh) {
            $this->deleteOldImage($oldVeh->foto_frontal);
            $this->deleteOldImage($oldVeh->foto_trasera);
        }

        $empleado->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Employee deleted successfully.'),
        ]);
    }

    public function generatePreRegistro(Request $request)
    {
        $request->validate([
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'pais_telefono_id' => 'required|exists:pais,id',
            'telefono' => 'required|string|max:20',
            'motivo_registro' => 'required|string',
            'responsable_id' => 'required|exists:responsables,id',
        ]);

        $user = auth()->user();
        $token = bin2hex(random_bytes(16));

        $responsable = \App\Models\Responsable::findOrFail($request->responsable_id);

        \App\Models\EmpleadoPreRegistro::create([
            'nombres' => $request->nombres,
            'apellidos' => $request->apellidos,
            'pais_telefono_id' => $request->pais_telefono_id,
            'telefono' => $request->telefono,
            'motivo_registro' => $request->motivo_registro,
            'responsable_id' => $request->responsable_id,
            'departamento_id' => $responsable->departamento_id,
            'cargo_id' => $responsable->cargo_id,
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

            $link = url("/preregistro-empleado/{$token}");

            $message = "Estimado Colaborador *{$request->nombres} {$request->apellidos}*, le invitamos a completar su pre-registro de datos para su alta en nuestras oficinas:\n\n"
                . "Ubicación: " . ($user->sucursal->nombre ?? $empresa->nombre) . "\n"
                . "Motivo: {$request->motivo_registro}\n"
                . "Autorizado por: {$responsable->nombres} {$responsable->apellidos}\n\n"
                . "Por favor, ingrese al siguiente enlace para completar su jornada laboral, fotografías y vehículos:\n"
                . $link;

            $whatsappService->sendMessage($to, $message, true);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de invitación a empleado: ' . $e->getMessage());
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Pre-registration invitation sent successfully.'),
        ]);
    }

    private function handleImageUpload($input, $fieldName)
    {
        // 1. Si es un archivo subido directamente por multipart form
        if ($fieldName && request()->hasFile($fieldName) && request()->file($fieldName)->isValid()) {
            $path = request()->file($fieldName)->store('empleados', 'public');
            return '/storage/' . $path;
        }

        if (!$input) {
            return null;
        }

        // 2. Si es una cadena Base64 de la webcam
        if (is_string($input) && preg_match('/^data:image\/(\w+);base64,/', $input, $type)) {
            $data = substr($input, strpos($input, ',') + 1);
            $type = strtolower($type[1]); // png, jpg, jpeg, webp

            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
                return null;
            }

            $data = str_replace(' ', '+', $data);
            $data = base64_decode($data);

            if ($data === false) {
                return null;
            }

            $fileName = Str::random(40) . '.' . $type;
            $filePath = 'empleados/' . $fileName;
            Storage::disk('public')->put($filePath, $data);
            return '/storage/' . $filePath;
        }

        // 3. Si es una ruta ya guardada anteriormente
        if (is_string($input)) {
            if (str_starts_with($input, '/storage/') || str_starts_with($input, 'http://') || str_starts_with($input, 'https://')) {
                return $input;
            }
            if (str_starts_with($input, 'storage/')) {
                return '/' . $input;
            }
            if (str_starts_with($input, 'empleados/')) {
                return '/storage/' . $input;
            }
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

    /**
     * Step 1 & 2: Parse uploaded Excel file and return preview & stats.
     */
    public function importPreview(Request $request, EmpleadoImportService $importService)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ], [
            'file.required' => 'Debe seleccionar un archivo Excel.',
            'file.mimes' => 'El archivo debe ser formato .xlsx, .xls o .csv.',
            'file.max' => 'El archivo no debe pesar más de 10 MB.',
        ]);

        $file = $request->file('file');
        $result = $importService->parsePreview($file->getPathname());

        if (!$result['success']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    /**
     * Step 3: Verify authenticated user password.
     */
    public function verifyPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ], [
            'password.required' => 'La contraseña es requerida.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña ingresada es incorrecta.',
                'errors' => [
                    'password' => ['La contraseña ingresada es incorrecta.']
                ]
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Contraseña verificada correctamente.'
        ]);
    }

    /**
     * Step 4: Execute batch import of verified records.
     */
    public function importExecute(Request $request, EmpleadoImportService $importService)
    {
        $request->validate([
            'records' => 'required|array',
            'duplicate_strategy' => 'required|string|in:update,skip',
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña ingresada es incorrecta.'
            ], 422);
        }

        $result = $importService->executeImport(
            $request->records,
            $user->empresa_id ?: 1,
            $user->sucursal_id ?: 1,
            $request->duplicate_strategy
        );

        if ($result['success']) {
            activity('empleados')
                ->causedBy($user)
                ->log("Se importaron exitosamente {$result['total_processed']} empleados desde Excel ({$result['created']} creados, {$result['updated']} actualizados).");
        }

        return response()->json($result);
    }
}

