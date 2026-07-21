<?php

namespace App\Http\Controllers;

use App\Models\Pais;
use App\Models\Proveedor;
use App\Models\ProveedorEmpleado;
use App\Models\ProveedorVehiculo;
use App\Models\ProveedorPreRegistro;
use App\Services\WhatsAppService;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProveedorPreRegistroController extends Controller
{
    public function showWizard($token)
    {
        $preRegistro = ProveedorPreRegistro::where('token', $token)
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

        return Inertia::render('preregistro/Wizard', [
            'preRegistro' => [
                'id' => $preRegistro->id,
                'nombre_comercial' => $preRegistro->nombre_comercial,
                'pais_telefono_id' => $preRegistro->pais_telefono_id,
                'telefono' => $preRegistro->telefono,
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
        $preRegistro = ProveedorPreRegistro::where('token', $token)
            ->where('status', 'pendiente')
            ->where('expires_at', '>', now())
            ->firstOrFail();

        // Validar datos
        $request->validate([
            // Proveedor
            'razon_social' => 'required|string|max:255',
            'nombre_comercial' => 'required|string|max:255',
            'documento_identidad' => 'required|string|max:50|unique:proveedores,documento_identidad',
            'pais_telefono_id' => 'required|exists:pais,id',
            'telefono' => 'required|string|max:20',
            'responsable' => 'required|string|max:255',
            'direccion' => 'nullable|string',
            'pais_id' => 'required|exists:pais,id',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',

            // Empleados
            'empleados' => 'required|array|min:1',
            'empleados.*.nombres' => 'required|string|max:255',
            'empleados.*.apellidos' => 'required|string|max:255',
            'empleados.*.documento_identidad' => 'required|string|max:50',
            'empleados.*.genero' => 'nullable|string|max:20',
            'empleados.*.fecha_nacimiento' => 'nullable|date',
            'empleados.*.correo' => 'nullable|email|max:255',
            'empleados.*.cargo' => 'nullable|string|max:255',
            'empleados.*.foto_carnet' => 'nullable|string', 
            'empleados.*.documento_frontal' => 'nullable|string',
            'empleados.*.documento_reverso' => 'nullable|string',

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
            // 1. Crear Proveedor
            $proveedor = Proveedor::create([
                'razon_social' => $request->razon_social,
                'nombre_comercial' => $request->nombre_comercial,
                'documento_identidad' => $request->documento_identidad,
                'pais_telefono_id' => $request->pais_telefono_id,
                'telefono' => $request->telefono,
                'responsable' => $request->responsable,
                'direccion' => $request->direccion,
                'pais_id' => $request->pais_id,
                'latitud' => $request->latitud,
                'longitud' => $request->longitud,
                'status' => 'en_revision', 
                'empresa_id' => $preRegistro->empresa_id,
                'sucursal_id' => $preRegistro->sucursal_id,
                'user_id' => null, 
            ]);

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
                    return $fileName;
                }
                return null;
            };

            // 2. Crear Empleados
            foreach ($request->empleados as $emp) {
                $foto_carnet = isset($emp['foto_carnet']) ? $saveBase64Image($emp['foto_carnet'], 'proveedor_empleados') : null;
                $doc_frontal = isset($emp['documento_frontal']) ? $saveBase64Image($emp['documento_frontal'], 'proveedor_empleados') : null;
                $doc_reverso = isset($emp['documento_reverso']) ? $saveBase64Image($emp['documento_reverso'], 'proveedor_empleados') : null;

                $edad = null;
                if (!empty($emp['fecha_nacimiento'])) {
                    $edad = \Carbon\Carbon::parse($emp['fecha_nacimiento'])->age;
                }

                ProveedorEmpleado::create([
                    'proveedor_id' => $proveedor->id,
                    'nombres' => $emp['nombres'],
                    'apellidos' => $emp['apellidos'],
                    'documento_identidad' => $emp['documento_identidad'],
                    'genero' => $emp['genero'] ?? null,
                    'fecha_nacimiento' => $emp['fecha_nacimiento'] ?? null,
                    'edad' => $edad,
                    'correo' => $emp['correo'] ?? null,
                    'cargo' => $emp['cargo'] ?? null,
                    'foto_carnet' => $foto_carnet,
                    'documento_frontal' => $doc_frontal,
                    'documento_reverso' => $doc_reverso,
                    'empresa_id' => $preRegistro->empresa_id,
                    'sucursal_id' => $preRegistro->sucursal_id,
                ]);
            }

            // 3. Crear Vehículos
            if ($request->filled('vehiculos')) {
                foreach ($request->vehiculos as $veh) {
                    $foto_frontal = isset($veh['foto_frontal']) ? $saveBase64Image($veh['foto_frontal'], 'proveedor_vehiculos') : null;
                    $foto_trasera = isset($veh['foto_trasera']) ? $saveBase64Image($veh['foto_trasera'], 'proveedor_vehiculos') : null;

                    ProveedorVehiculo::create([
                        'proveedor_id' => $proveedor->id,
                        'tipo_vehiculo' => $veh['tipo_vehiculo'],
                        'marca' => $veh['marca'],
                        'modelo' => $veh['modelo'],
                        'year' => $veh['year'],
                        'placa' => $veh['placa'],
                        'foto_frontal' => $foto_frontal,
                        'foto_trasera' => $foto_trasera,
                        'empresa_id' => $preRegistro->empresa_id,
                        'sucursal_id' => $preRegistro->sucursal_id,
                    ]);
                }
            }

            // 4. Marcar pre-registro como completado
            $preRegistro->update(['status' => 'completado']);

            DB::commit();

            // 5. Enviar mensaje de WhatsApp
            try {
                $pais = Pais::find($proveedor->pais_telefono_id);
                if ($pais && $proveedor->telefono) {
                    $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
                    $cleanPhone = preg_replace('/[^0-9]/', '', $proveedor->telefono);
                    $to = $prefix . $cleanPhone;

                    $empresa = $preRegistro->empresa;
                    $whatsappService = new WhatsAppService($empresa);

                    $message = "Estimado Proveedor *{$proveedor->nombre_comercial}*, hemos recibido la información de su pre-registro satisfactoriamente.\n\n"
                        . "Su registro se encuentra en estado *En Revisión*. Le notificaremos una vez que el personal de administración valide y active su suscripción.";

                    $whatsappService->sendMessage($to, $message, true);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de pre-registro completado: ' . $e->getMessage());
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
