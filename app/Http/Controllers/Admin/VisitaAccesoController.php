<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VisitaAcceso;
use App\Models\Empleado;
use App\Models\Proveedor;
use App\Models\ProveedorEmpleado;
use App\Models\Productor;
use App\Models\ProductorEmpleado;
use App\Models\EmpleadoVehiculo;
use App\Models\ProveedorVehiculo;
use App\Models\ProductorVehiculo;
use App\Models\Responsable;
use App\Models\VisitaAccesoAutorizacion;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VisitaAccesoController extends Controller
{
    public function index(Request $request)
    {
        $query = VisitaAcceso::query()
            ->with([
                'empleado.departamento',
                'empleado.cargo',
                'proveedor.paisTelefono',
                'proveedor.pais',
                'proveedorEmpleado',
                'productor.paisTelefono',
                'productor.pais',
                'productorEmpleado',
                'empleadoVehiculo',
                'proveedorVehiculo',
                'productorVehiculo',
                'responsable',
                'empresa',
                'sucursal'
            ])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('codigo_visitante', 'like', "%{$search}%")
                        ->orWhereHas('empleado', function ($eQuery) use ($search) {
                            $eQuery->where('nombres', 'like', "%{$search}%")
                                ->orWhere('apellidos', 'like', "%{$search}%")
                                ->orWhere('documento_identidad', 'like', "%{$search}%");
                        })
                        ->orWhereHas('proveedor', function ($pQuery) use ($search) {
                            $pQuery->where('razon_social', 'like', "%{$search}%")
                                ->orWhere('nombre_comercial', 'like', "%{$search}%")
                                ->orWhere('documento_identidad', 'like', "%{$search}%");
                        })
                        ->orWhereHas('proveedorEmpleado', function ($peQuery) use ($search) {
                            $peQuery->where('nombres', 'like', "%{$search}%")
                                ->orWhere('apellidos', 'like', "%{$search}%")
                                ->orWhere('documento_identidad', 'like', "%{$search}%");
                        })
                        ->orWhereHas('productor', function ($prQuery) use ($search) {
                            $prQuery->where('razon_social', 'like', "%{$search}%")
                                ->orWhere('nombre_comercial', 'like', "%{$search}%")
                                ->orWhere('razon_social_rancho', 'like', "%{$search}%")
                                ->orWhere('nombre_comercial_rancho', 'like', "%{$search}%")
                                ->orWhere('documento_identidad', 'like', "%{$search}%");
                        })
                        ->orWhereHas('productorEmpleado', function ($preQuery) use ($search) {
                            $preQuery->where('nombres', 'like', "%{$search}%")
                                ->orWhere('apellidos', 'like', "%{$search}%")
                                ->orWhere('documento_identidad', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->tipo_acceso, function ($q, $tipo) {
                $q->where('tipo_acceso', $tipo);
            })
            ->when($request->medio_acceso, function ($q, $medio) {
                $q->where('medio_acceso', $medio);
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('status', $request->status);
            });

        $accesos = $query->latest('id')->paginate($request->perPage ?? 10)->withQueryString();

        $stats = [
            'total'            => VisitaAcceso::count(),
            'en_instalaciones' => VisitaAcceso::where('status', 1)->count(),
            'finalizados'      => VisitaAcceso::where('status', 2)->count(),
            'empleados'        => VisitaAcceso::where('tipo_acceso', 'empleado')->count(),
            'proveedores'      => VisitaAcceso::where('tipo_acceso', 'proveedor')->count(),
            'productores'      => VisitaAcceso::where('tipo_acceso', 'productor')->count(),
        ];

        $responsables = Responsable::where('status', 1)
            ->with(['departamento', 'cargo'])
            ->orderBy('nombres', 'asc')
            ->get(['id', 'nombres', 'apellidos', 'departamento_id', 'cargo_id']);

        $user     = $request->user();
        $empresa  = Empresa::find($user->empresa_id) ?: Empresa::first();
        $sucursal = Sucursal::find($user->sucursal_id);

        $siguienteCodigo = VisitaAcceso::generarSiguienteCodigoVisitante();

        return Inertia::render('admin/VisitasAccesos/Index', [
            'accesos'         => $accesos,
            'stats'           => $stats,
            'responsables'    => $responsables,
            'siguienteCodigo' => $siguienteCodigo,
            'filters'         => $request->only('search', 'tipo_acceso', 'medio_acceso', 'status', 'perPage'),
            'empresa'         => $empresa ? ['id' => $empresa->id, 'razon_social' => $empresa->razon_social] : null,
            'sucursal'        => $sucursal ? ['id' => $sucursal->id, 'nombre' => $sucursal->nombre] : null,
        ]);
    }

    /**
     * Búsqueda dinámica de empleados, proveedores o productores para el formulario de registro de acceso
     */
    public function buscarEntidades(Request $request)
    {
        $tipo = $request->input('tipo_acceso', 'empleado');
        $query = $request->input('query', '');

        if ($tipo === 'empleado') {
            $empleados = Empleado::query()
                ->where('status', 1)
                ->where(function ($q) use ($query) {
                    if (!empty($query)) {
                        $q->where('nombres', 'like', "%{$query}%")
                          ->orWhere('apellidos', 'like', "%{$query}%")
                          ->orWhere('documento_identidad', 'like', "%{$query}%");
                    }
                })
                ->with(['departamento', 'cargo', 'responsable', 'vehiculos'])
                ->limit(20)
                ->get();

            return response()->json($empleados);
        }

        if ($tipo === 'proveedor') {
            $proveedores = Proveedor::query()
                ->where('status', 'activo')
                ->where(function ($q) use ($query) {
                    if (!empty($query)) {
                        $q->where('razon_social', 'like', "%{$query}%")
                          ->orWhere('nombre_comercial', 'like', "%{$query}%")
                          ->orWhere('documento_identidad', 'like', "%{$query}%");
                    }
                })
                ->with(['user'])
                ->limit(20)
                ->get();

            // Adjuntar empleados y vehículos para cada proveedor
            $result = $proveedores->map(function ($prov) {
                $empleados = ProveedorEmpleado::where('proveedor_id', $prov->id)->get();
                $vehiculos = ProveedorVehiculo::where('proveedor_id', $prov->id)->get();
                return array_merge($prov->toArray(), [
                    'empleados_proveedor' => $empleados,
                    'vehiculos_proveedor' => $vehiculos,
                ]);
            });

            return response()->json($result);
        }

        if ($tipo === 'productor') {
            $productores = Productor::query()
                ->where('status', 'activo')
                ->where(function ($q) use ($query) {
                    if (!empty($query)) {
                        $q->where('razon_social', 'like', "%{$query}%")
                          ->orWhere('nombre_comercial', 'like', "%{$query}%")
                          ->orWhere('razon_social_rancho', 'like', "%{$query}%")
                          ->orWhere('nombre_comercial_rancho', 'like', "%{$query}%")
                          ->orWhere('documento_identidad', 'like', "%{$query}%");
                    }
                })
                ->with(['user'])
                ->limit(20)
                ->get();

            // Adjuntar empleados y vehículos para cada productor
            $result = $productores->map(function ($prod) {
                $empleados = ProductorEmpleado::where('productor_id', $prod->id)->get();
                $vehiculos = ProductorVehiculo::where('productor_id', $prod->id)->get();
                return array_merge($prod->toArray(), [
                    'empleados_productor' => $empleados,
                    'vehiculos_productor' => $vehiculos,
                ]);
            });

            return response()->json($result);
        }

        return response()->json([]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo_acceso'           => 'required|in:empleado,proveedor,productor',
            'empleado_id'           => 'nullable|required_if:tipo_acceso,empleado|exists:empleados,id',
            'proveedor_id'          => 'nullable|required_if:tipo_acceso,proveedor|exists:proveedores,id',
            'proveedor_empleado_id' => 'nullable|exists:proveedor_empleados,id',
            'productor_id'          => 'nullable|required_if:tipo_acceso,productor|exists:productores,id',
            'productor_empleado_id' => 'nullable|exists:productor_empleados,id',
            'medio_acceso'          => 'required|in:peatonal,vehicular',
            'empleado_vehiculo_id'  => 'nullable|exists:empleado_vehiculos,id',
            'proveedor_vehiculo_id' => 'nullable|exists:proveedor_vehiculos,id',
            'productor_vehiculo_id' => 'nullable|exists:productor_vehiculos,id',
            'vehiculo_tipo'         => 'nullable|string|max:100',
            'vehiculo_marca'        => 'nullable|string|max:100',
            'vehiculo_modelo'       => 'nullable|string|max:100',
            'vehiculo_placa'        => 'nullable|string|max:50',
            'vehiculo_foto_frontal' => 'nullable|string',
            'vehiculo_foto_trasera' => 'nullable|string',
            'responsable_id'        => 'nullable|exists:responsables,id',
            'observaciones'         => 'nullable|string',
            'acompanantes'          => 'nullable|array',
        ]);

        $user = $request->user();

        // Generar código de visitante único 80000001+
        $validated['codigo_visitante'] = VisitaAcceso::generarSiguienteCodigoVisitante();
        $validated['fecha_ingreso']    = now()->toDateString();
        $validated['hora_ingreso']     = now()->toTimeString();
        $validated['empresa_id']      = $user->empresa_id ?? 1;
        $validated['sucursal_id']     = $user->sucursal_id ?? 1;
        $validated['status']          = 1; // En Instalaciones

        if ($validated['medio_acceso'] === 'vehicular') {
            if (!empty($validated['productor_vehiculo_id'])) {
                $prVehiculo = \App\Models\ProductorVehiculo::find($validated['productor_vehiculo_id']);
                if ($prVehiculo) {
                    $validated['vehiculo_marca'] = $validated['vehiculo_marca'] ?? $prVehiculo->marca;
                    $validated['vehiculo_modelo'] = $validated['vehiculo_modelo'] ?? $prVehiculo->modelo;
                    $validated['vehiculo_placa'] = $validated['vehiculo_placa'] ?? $prVehiculo->placa;
                    $validated['vehiculo_tipo'] = $validated['vehiculo_tipo'] ?? ($prVehiculo->tipo_vehiculo ?? 'Auto');
                    $validated['vehiculo_foto_frontal'] = $validated['vehiculo_foto_frontal'] ?? $prVehiculo->foto_frontal;
                    $validated['vehiculo_foto_trasera'] = $validated['vehiculo_foto_trasera'] ?? $prVehiculo->foto_trasera;
                }
            } elseif (!empty($validated['proveedor_vehiculo_id'])) {
                $pVehiculo = \App\Models\ProveedorVehiculo::find($validated['proveedor_vehiculo_id']);
                if ($pVehiculo) {
                    $validated['vehiculo_marca'] = $validated['vehiculo_marca'] ?? $pVehiculo->marca;
                    $validated['vehiculo_modelo'] = $validated['vehiculo_modelo'] ?? $pVehiculo->modelo;
                    $validated['vehiculo_placa'] = $validated['vehiculo_placa'] ?? $pVehiculo->placa;
                    $validated['vehiculo_tipo'] = $validated['vehiculo_tipo'] ?? ($pVehiculo->tipo_vehiculo ?? 'Auto');
                    $validated['vehiculo_foto_frontal'] = $validated['vehiculo_foto_frontal'] ?? $pVehiculo->foto_frontal;
                    $validated['vehiculo_foto_trasera'] = $validated['vehiculo_foto_trasera'] ?? $pVehiculo->foto_trasera;
                }
            } elseif (!empty($validated['empleado_vehiculo_id'])) {
                $eVehiculo = \App\Models\EmpleadoVehiculo::find($validated['empleado_vehiculo_id']);
                if ($eVehiculo) {
                    $validated['vehiculo_marca'] = $validated['vehiculo_marca'] ?? $eVehiculo->marca;
                    $validated['vehiculo_modelo'] = $validated['vehiculo_modelo'] ?? $eVehiculo->modelo;
                    $validated['vehiculo_placa'] = $validated['vehiculo_placa'] ?? $eVehiculo->placa;
                    $validated['vehiculo_tipo'] = $validated['vehiculo_tipo'] ?? ($eVehiculo->tipo_vehiculo ?? 'Auto');
                    $validated['vehiculo_foto_frontal'] = $validated['vehiculo_foto_frontal'] ?? $eVehiculo->foto_frontal;
                    $validated['vehiculo_foto_trasera'] = $validated['vehiculo_foto_trasera'] ?? $eVehiculo->foto_trasera;
                }
            }
        }

        // Procesar fotos de vehículos si son subidas ad-hoc o base64
        if ($request->filled('vehiculo_foto_frontal')) {
            $validated['vehiculo_foto_frontal'] = $this->handleImageUpload($request->input('vehiculo_foto_frontal'), 'foto_vehiculo_frontal');
        }
        if ($request->filled('vehiculo_foto_trasera')) {
            $validated['vehiculo_foto_trasera'] = $this->handleImageUpload($request->input('vehiculo_foto_trasera'), 'foto_vehiculo_trasera');
        }

        $acceso = VisitaAcceso::create($validated);

        return redirect()->back()->with('success', "Acceso a instalaciones registrado correctamente con Código de Visitante N° {$acceso->codigo_visitante}.");
    }

    public function marcarSalida(VisitaAcceso $visitaAcceso)
    {
        $visitaAcceso->update([
            'fecha_salida' => now()->toDateString(),
            'hora_salida'  => now()->toTimeString(),
            'status'       => 2, // Finalizado
        ]);

        return redirect()->back()->with('success', "Salida marcada correctamente para el Código de Visitante N° {$visitaAcceso->codigo_visitante}.");
    }

    private function handleImageUpload(?string $base64Data, string $prefix): ?string
    {
        if (!$base64Data) {
            return null;
        }

        if (str_starts_with($base64Data, 'http://') || str_starts_with($base64Data, 'https://') || str_starts_with($base64Data, '/storage/')) {
            return $base64Data;
        }
        if (str_starts_with($base64Data, 'storage/')) {
            return '/' . $base64Data;
        }
        if (str_starts_with($base64Data, 'empleados/')) {
            return '/storage/' . $base64Data;
        }

        if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
            $data = substr($base64Data, strpos($base64Data, ',') + 1);
            $type = strtolower($type[1]);
            $data = base64_decode($data);
            if ($data === false) {
                return null;
            }
        } else {
            return null;
        }

        $filename = 'visitas_accesos/' . $prefix . '_' . Str::uuid() . '.' . $type;
        Storage::disk('public')->put($filename, $data);

        return Storage::url($filename);
    }

    public function solicitarAutorizacionWhatsapp(Request $request)
    {
        $request->validate([
            'responsable_id'     => 'required|exists:responsables,id',
            'empleado_nombre'    => 'required|string',
            'empleado_documento' => 'nullable|string',
            'es_acompanante'     => 'nullable|boolean',
        ]);

        $responsable = Responsable::with('paisTelefono')->findOrFail($request->responsable_id);
        $user        = $request->user();
        $empresa     = Empresa::find($user->empresa_id) ?: Empresa::first();

        $empleadoNombre = $request->empleado_nombre;
        $empleadoDoc    = $request->empleado_documento ?: 'N/A';
        $rolTexto       = $request->es_acompanante ? 'empleado acompañante' : 'empleado (conductor principal)';
        $fecha          = now()->format('d/m/Y H:i');

        // Generar registro de autorización tokenizado
        $token = VisitaAccesoAutorizacion::generarToken();
        $autorizacionRec = VisitaAccesoAutorizacion::create([
            'token'          => $token,
            'responsable_id' => $responsable->id,
            'empleado_id'    => $request->empleado_id ?: null,
            'solicitante_id' => $user->id ?? null,
            'tipo_acceso'    => $request->es_acompanante ? 'acompanante' : 'empleado',
            'datos_solicitud'=> [
                'empleado_nombre'    => $empleadoNombre,
                'empleado_documento' => $empleadoDoc,
                'fecha_solicitud'    => $fecha,
            ],
            'empresa_id'     => $empresa->id ?? 1,
            'sucursal_id'    => $user->sucursal_id ?? 1,
        ]);

        $publicUrl = route('autorizar-acceso.show', ['token' => $token]);

        $mensaje  = "Estimado(a) *{$responsable->nombres} {$responsable->apellidos}*,\n\n";
        $mensaje .= "El agente de seguridad en garita de *{$empresa->razon_social}* solicita su *AUTORIZACIÓN DE ACCESO FUERA DE HORARIO* para el {$rolTexto}:\n";
        $mensaje .= "👤 *Nombre:* {$empleadoNombre}\n";
        $mensaje .= "🪪 *Documento:* {$empleadoDoc}\n";
        $mensaje .= "📅 *Fecha y Hora:* {$fecha}\n\n";
        $mensaje .= "👉 *Haga clic en el siguiente enlace para revisar la foto, datos y AUTORIZAR el ingreso directamente:*\n";
        $mensaje .= "🔗 {$publicUrl}";

        $whatsappUrl = null;
        $phone       = null;

        if ($responsable->telefono) {
            $prefix     = $responsable->paisTelefono ? preg_replace('/[^0-9]/', '', $responsable->paisTelefono->codigo_telefonico) : '51';
            $cleanPhone = preg_replace('/[^0-9]/', '', $responsable->telefono);
            $fullPhone  = $prefix . $cleanPhone;
            $phone      = $fullPhone;

            $whatsappUrl = "https://wa.me/{$fullPhone}?text=" . urlencode($mensaje);

            try {
                $ws = new WhatsAppService($empresa);
                $ws->sendMessage($fullPhone, $mensaje, true);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de autorización: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success'            => true,
            'token'              => $token,
            'message'            => 'Solicitud enviada al Responsable con enlace de autorización.',
            'whatsapp_url'       => $whatsappUrl,
            'responsable_nombre' => "{$responsable->nombres} {$responsable->apellidos}",
            'telefono'           => $phone,
        ]);
    }
}
