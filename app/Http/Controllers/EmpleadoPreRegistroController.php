<?php

namespace App\Http\Controllers;

use App\Models\Pais;
use App\Models\Empleado;
use App\Models\EmpleadoVehiculo;
use App\Models\EmpleadoPreRegistro;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EmpleadoPreRegistroController extends Controller
{
    public function showWizard($token)
    {
        $preRegistro = EmpleadoPreRegistro::where('token', $token)
            ->where('status', 'pendiente')
            ->where('expires_at', '>', now())
            ->first();

        if (!$preRegistro) {
            return Inertia::render('preregistro/InvalidToken', [
                'error' => __('The pre-registration link is invalid, has already been used, or has expired (12-hour validity).')
            ]);
        }

        $paises = Pais::where('activo', true)
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico', 'latitud', 'longitud']);

        $empresa = $preRegistro->empresa;

        return Inertia::render('preregistro-empleado/Wizard', [
            'preRegistro' => [
                'id' => $preRegistro->id,
                'nombres' => $preRegistro->nombres,
                'apellidos' => $preRegistro->apellidos,
                'pais_telefono_id' => $preRegistro->pais_telefono_id,
                'telefono' => $preRegistro->telefono,
                'motivo_registro' => $preRegistro->motivo_registro,
                'token' => $preRegistro->token,
                'empresa_id' => $preRegistro->empresa_id,
                'sucursal_id' => $preRegistro->sucursal_id,
            ],
            'paises' => $paises,
            'mapbox_api_key' => $empresa?->mapbox_api_key,
            'mapbox_active' => (bool) ($empresa?->mapbox_active ?? false),
        ]);
    }

    public function submitWizard(Request $request, $token)
    {
        $preRegistro = EmpleadoPreRegistro::where('token', $token)
            ->where('status', 'pendiente')
            ->where('expires_at', '>', now())
            ->firstOrFail();

        $request->validate([
            'documento_identidad' => 'required|string|max:50|unique:empleados,documento_identidad',
            'correo' => 'nullable|email|max:255',
            'genero' => 'nullable|string|in:M,F,Otro',
            'jornada_laboral' => 'nullable|array',
            'foto_empleado' => 'required|string', 
            'foto_empleado_2' => 'required|string', 
            'foto_documento' => 'required|string',
            'foto_documento_reverso' => 'required|string',

            // Vehículos
            'vehiculos' => 'nullable|array',
            'vehiculos.*.tipo_vehiculo' => 'required|string|max:255',
            'vehiculos.*.marca' => 'required|string|max:255',
            'vehiculos.*.modelo' => 'required|string|max:255',
            'vehiculos.*.year' => 'required|integer|min:1900|max:' . (date('Y') + 2),
            'vehiculos.*.placa' => 'required|string|max:50',
            'vehiculos.*.foto_frontal' => 'nullable|string',
            'vehiculos.*.foto_trasera' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Helper to save base64 images
            $saveBase64Image = function ($base64Data, $folder) {
                if (empty($base64Data)) return null;
                if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                    $data = substr($base64Data, strpos($base64Data, ',') + 1);
                    $type = strtolower($type[1]); // png, jpg, jpeg, webp
                    if (!in_array($type, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                        return null;
                    }
                    $data = base64_decode($data);
                    if ($data === false) {
                        return null;
                    }
                    $fileName = $folder . '/' . uniqid() . '.' . $type;
                    Storage::disk('public')->put($fileName, $data);
                    return '/storage/' . $fileName;
                }

                if (is_string($base64Data)) {
                    if (str_starts_with($base64Data, '/storage/') || str_starts_with($base64Data, 'http://') || str_starts_with($base64Data, 'https://')) {
                        return $base64Data;
                    }
                    if (str_starts_with($base64Data, 'storage/')) {
                        return '/' . $base64Data;
                    }
                    if (str_starts_with($base64Data, 'empleados/')) {
                        return '/storage/' . $base64Data;
                    }
                }
                return null;
            };

            $fotoEmpleado = $saveBase64Image($request->foto_empleado, 'empleados');
            $fotoEmpleado2 = $saveBase64Image($request->foto_empleado_2, 'empleados');
            $fotoDoc = $saveBase64Image($request->foto_documento, 'empleados');
            $fotoDocReverso = $saveBase64Image($request->foto_documento_reverso, 'empleados');

            // 1. Crear Empleado
            $empleado = Empleado::create([
                'nombres' => $preRegistro->nombres,
                'apellidos' => $preRegistro->apellidos,
                'documento_identidad' => $request->documento_identidad,
                'pais_telefono_id' => $preRegistro->pais_telefono_id,
                'telefono' => $preRegistro->telefono,
                'correo' => $request->correo,
                'genero' => $request->genero,
                'departamento_id' => $preRegistro->departamento_id,
                'responsable_id' => $preRegistro->responsable_id,
                'cargo_id' => $preRegistro->cargo_id,
                'motivo_registro' => $preRegistro->motivo_registro,
                'jornada_laboral' => $request->jornada_laboral,
                'foto_empleado' => $fotoEmpleado,
                'foto_empleado_2' => $fotoEmpleado2,
                'foto_documento' => $fotoDoc,
                'foto_documento_reverso' => $fotoDocReverso,
                'status' => 0, // Inactivo / Bajo revisión
                'empresa_id' => $preRegistro->empresa_id,
                'sucursal_id' => $preRegistro->sucursal_id,
                'user_id' => null,
            ]);

            // 2. Crear Vehículos
            if ($request->filled('vehiculos')) {
                foreach ($request->vehiculos as $veh) {
                    $fotoFrontal = isset($veh['foto_frontal']) ? $saveBase64Image($veh['foto_frontal'], 'empleados') : null;
                    $fotoTrasera = isset($veh['foto_trasera']) ? $saveBase64Image($veh['foto_trasera'], 'empleados') : null;

                    EmpleadoVehiculo::create([
                        'empleado_id' => $empleado->id,
                        'tipo_vehiculo' => $veh['tipo_vehiculo'],
                        'marca' => $veh['marca'],
                        'modelo' => $veh['modelo'],
                        'year' => $veh['year'],
                        'placa' => $veh['placa'],
                        'foto_frontal' => $fotoFrontal,
                        'foto_trasera' => $fotoTrasera,
                        'empresa_id' => $preRegistro->empresa_id,
                        'sucursal_id' => $preRegistro->sucursal_id,
                    ]);
                }
            }

            // 3. Marcar pre-registro como completado
            $preRegistro->update(['status' => 'completado']);

            DB::commit();

            // 4. Enviar mensaje de WhatsApp
            try {
                $pais = Pais::find($preRegistro->pais_telefono_id);
                if ($pais && $preRegistro->telefono) {
                    $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
                    $cleanPhone = preg_replace('/[^0-9]/', '', $preRegistro->telefono);
                    $to = $prefix . $cleanPhone;

                    $empresa = $preRegistro->empresa;
                    $whatsappService = new WhatsAppService($empresa);

                    $message = "Estimado Colaborador *{$preRegistro->nombres} {$preRegistro->apellidos}*, hemos recibido la información de su pre-registro satisfactoriamente.\n\n"
                        . "Su registro se encuentra en revisión. Le notificaremos una vez que sea activado por el área correspondiente.";

                    $whatsappService->sendMessage($to, $message, true);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de pre-registro de empleado completado: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Pre-registro completado con éxito. Su información está bajo revisión.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al procesar el registro: ' . $e->getMessage()
            ], 500);
        }
    }
}
