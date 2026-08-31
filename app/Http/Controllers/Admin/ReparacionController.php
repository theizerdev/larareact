<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\InventoryMovement;
use App\Models\Marca;
use App\Models\Modelo;
use App\Models\OrdenReparacion;
use App\Models\OrdenReparacionHistorial;
use App\Models\OrdenReparacionItem;
use App\Models\OrdenReparacionFoto;
use App\Models\Pais;
use App\Models\Producto;
use App\Models\User;
use App\Services\PostServicioChecklistService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;


class ReparacionController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) return '$';
        $empresa = $user->empresa ?? ($user->empresa_id ? Empresa::find($user->empresa_id) : null);
        if ($empresa && $empresa->pais_id) {
            $pais = Pais::find($empresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }
        return '$';
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $search = $request->input('search');
        $status = $request->input('status');
        $tecnicoId = $request->input('tecnico_id');
        $marcaId = $request->input('marca_id');
        $modeloId = $request->input('modelo_id');
        $categoriaId = $request->input('categoria_id');

        $isTecnicoOnly = $user && ($user->hasRole('Técnico') || $user->hasRole('tecnico') || $user->hasRole('Tecnico') || $user->hasRole('Técnico de Reparaciones'));
        $isAdmin = $user && ($user->hasRole('Administrador') || $user->hasRole('Super Administrador') || $user->hasRole('super-admin') || $user->hasRole('Admin'));

        $empresa = $user->empresa ?? \App\Models\Empresa::find($empresaId);

        $query = OrdenReparacion::with([
            'cliente',
            'marca',
            'modelo',
            'tecnico',
            'empresa',
            'sucursal',
            'items.producto',
            'items.servicio',
        ])->where('empresa_id', $empresaId);

        // Si es exclusivamente rol Técnico (sin permisos de Administrador), mostrar ÚNICAMENTE sus órdenes asignadas
        if ($isTecnicoOnly && !$isAdmin) {
            $query->where('tecnico_id', $user->id);
        } elseif ($tecnicoId && $tecnicoId !== 'all') {
            $query->where('tecnico_id', $tecnicoId);
        }

        if ($search) {
            $normalizedSearch = str_replace(["'", "´", "`"], '-', $search);
            $query->where(function ($q) use ($search, $normalizedSearch) {
                $q->where('numero_orden', 'like', "%{$search}%")
                  ->orWhere('numero_orden', 'like', "%{$normalizedSearch}%")
                  ->orWhere('cliente_nombre', 'like', "%{$search}%")
                  ->orWhere('imei_serie', 'like', "%{$search}%")
                  ->orWhere('marca_nombre', 'like', "%{$search}%")
                  ->orWhere('modelo_nombre', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'all') {
            $query->where('estado_orden', $status);
        }

        if ($marcaId && $marcaId !== 'all') {
            $query->where('marca_id', $marcaId);
        }

        if ($modeloId && $modeloId !== 'all') {
            $query->where('modelo_id', $modeloId);
        }

        if ($categoriaId && $categoriaId !== 'all') {
            $categoriaObj = \App\Models\Categoria::find($categoriaId);
            $query->where(function ($q) use ($categoriaId, $categoriaObj) {
                $q->whereHas('modelo', function ($mq) use ($categoriaId) {
                    $mq->where('categoria_id', $categoriaId);
                });
                if ($categoriaObj) {
                    $q->orWhere('tipo_dispositivo', $categoriaObj->nombre);
                }
            });
        }

        $perPage = (int) $request->input('perPage', 10);
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 10;
        }

        $ordenes = $query->latest('id')->paginate($perPage)->withQueryString();

        // Conteo por Estados para Tablero / Filtros
        $countsQuery = OrdenReparacion::where('empresa_id', $empresaId);
        if ($isTecnicoOnly && !$isAdmin) {
            $countsQuery->where('tecnico_id', $user->id);
        }

        $counts = $countsQuery->select('estado_orden', DB::raw('count(*) as total'))
            ->groupBy('estado_orden')
            ->pluck('total', 'estado_orden')
            ->toArray();

        $tecnicos = User::where('empresa_id', $empresaId)->get(['id', 'name']);
        $clientes = Cliente::withoutGlobalScope('multitenancy')->where('empresa_id', $empresaId)->orderBy('nombre')->get(['id', 'nombre', 'telefono', 'email']);
        $marcas = Marca::with('modelos')->where('empresa_id', $empresaId)->orderBy('nombre')->get();
        $modelos = Modelo::withoutGlobalScope('multitenancy')
            ->where(function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId)
                  ->orWhereNull('empresa_id');
            })
            ->where('estado', true)
            ->orderBy('nombre_comercial')
            ->get(['id', 'marca_id', 'categoria_id', 'nombre_comercial', 'codigo_modelo']);

        $categorias = \App\Models\Categoria::withoutGlobalScope('multitenancy')
            ->where(function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId)
                  ->orWhereNull('empresa_id');
            })
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        $servicios = \App\Models\Servicio::withoutGlobalScope('multitenancy')
            ->with([
                'categoria' => fn ($q) => $q->withoutGlobalScope('multitenancy'),
                'marca' => fn ($q) => $q->withoutGlobalScope('multitenancy'),
                'modelo' => fn ($q) => $q->withoutGlobalScope('multitenancy'),
            ])
            ->where('empresa_id', $empresaId)
            ->where('estado', true)
            ->orderBy('nombre')
            ->get(['id', 'codigo', 'nombre', 'precio', 'categoria_id', 'marca_id', 'modelo_id']);

        return Inertia::render('admin/Reparaciones/Index', [
            'ordenes' => $ordenes,
            'counts' => $counts,
            'tecnicos' => $tecnicos,
            'clientes' => $clientes,
            'marcas' => $marcas,
            'modelos' => $modelos,
            'categorias' => $categorias,
            'servicios' => $servicios,
            'empresa' => $empresa,
            'currencySymbol' => $this->getCurrencySymbol(),
            'filters' => array_merge($request->only(['search', 'status', 'tecnico_id', 'marca_id', 'modelo_id', 'categoria_id']), ['perPage' => (string) $perPage]),
            'isTecnicoOnly' => $isTecnicoOnly && !$isAdmin,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $clientes = Cliente::withoutGlobalScope('multitenancy')->where('empresa_id', $empresaId)->orderBy('nombre')->get(['id', 'nombre', 'telefono', 'email']);
        $marcas = Marca::with('modelos')->where('empresa_id', $empresaId)->orderBy('nombre')->get();
        $tecnicos = User::where('empresa_id', $empresaId)
            ->orderBy('name')
            ->get(['id', 'name']);

        $categorias = \App\Models\Categoria::withoutGlobalScope('multitenancy')
            ->where(function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId)
                  ->orWhereNull('empresa_id');
            })
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        $servicios = \App\Models\Servicio::withoutGlobalScope('multitenancy')
            ->with([
                'categoria' => fn ($q) => $q->withoutGlobalScope('multitenancy'),
                'marca' => fn ($q) => $q->withoutGlobalScope('multitenancy'),
                'modelo' => fn ($q) => $q->withoutGlobalScope('multitenancy'),
            ])
            ->where('empresa_id', $empresaId)
            ->where('estado', true)
            ->orderBy('nombre')
            ->get(['id', 'codigo', 'nombre', 'precio', 'categoria_id', 'marca_id', 'modelo_id']);

        return Inertia::render('admin/Reparaciones/Create', [
            'clientes' => $clientes,
            'marcas' => $marcas,
            'tecnicos' => $tecnicos,
            'categorias' => $categorias,
            'servicios' => $servicios,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function storeCliente(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:500',
        ]);

        $user = auth()->user();
        $cliente = Cliente::create(array_merge($validated, [
            'empresa_id' => $user->empresa_id,
            'sucursal_id' => $user->sucursal_id,
        ]));

        return response()->json([
            'success' => true,
            'cliente' => $cliente,
            'message' => __('Cliente registrado exitosamente.')
        ]);
    }

    public function storeServicio(Request $request)
    {
        $validated = $request->validate([
            'categoria_id' => 'nullable|exists:categorias,id',
            'marca_id' => 'nullable|exists:marcas,id',
            'modelo_id' => 'nullable|exists:modelos,id',
            'nombre' => 'required|string|max:255',
            'codigo' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
            'precio' => 'nullable|numeric|min:0',
        ]);

        $validated['precio'] = $validated['precio'] ?? 0.00;

        $user = auth()->user();
        $servicio = \App\Models\Servicio::create(array_merge($validated, [
            'empresa_id' => $user->empresa_id,
            'sucursal_id' => $user->sucursal_id,
            'estado' => true,
        ]));

        $codigo = !empty($validated['codigo'])
            ? $validated['codigo']
            : 'SRV-' . str_pad($servicio->id, 8, '0', STR_PAD_LEFT);

        $descripcion = !empty($validated['descripcion'])
            ? $validated['descripcion']
            : "Servicio {$codigo} {$servicio->nombre}";

        $servicio->update([
            'codigo' => $codigo,
            'descripcion' => $descripcion,
        ]);

        $servicio->load([
            'categoria:id,nombre',
            'marca:id,nombre',
            'modelo:id,nombre_comercial,codigo_modelo'
        ]);

        return response()->json([
            'success' => true,
            'servicio' => $servicio,
            'message' => __('Servicio registrado exitosamente.')
        ]);
    }

    public function checkImei(Request $request)
    {
        $imei = trim($request->input('imei', ''));
        if (empty($imei)) {
            return response()->json(['success' => false, 'count' => 0]);
        }

        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $ordenesPrevias = OrdenReparacion::where('empresa_id', $empresaId)
            ->where('imei_serie', $imei)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'numero_orden', 'cliente_nombre', 'marca_id', 'marca_nombre', 'modelo_id', 'modelo_nombre', 'tipo_dispositivo', 'estado_orden', 'descripcion_falla', 'fecha_recepcion']);

        // Consulta de TAC por Internet / GSMA internacional
        $onlineDevice = null;
        $cleanImei = preg_replace('/\D/', '', $imei);
        if (strlen($cleanImei) >= 8) {
            $onlineDevice = $this->lookupImeiTacOnline($cleanImei, $empresaId);
        }

        return response()->json([
            'success' => true,
            'count' => $ordenesPrevias->count(),
            'ordenes' => $ordenesPrevias,
            'ultimaOrden' => $ordenesPrevias->first(),
            'onlineDevice' => $onlineDevice,
        ]);
    }

    private function lookupImeiTacOnline(string $cleanImei, int $empresaId): ?array
    {
        $tac8 = substr($cleanImei, 0, 8);

        // 1. Intentar consultas HTTP a APIs públicas de TAC con User-Agent
        $apiUrls = [
            "https://imeidb.xyz/api/tac/{$tac8}",
            "https://tac.imeidb.xyz/api/v1/tac/{$tac8}",
        ];

        foreach ($apiUrls as $url) {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(2)
                    ->withHeaders(['User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'])
                    ->get($url);
                if ($response->successful()) {
                    $data = $response->json();
                    $brand = $data['brand'] ?? $data['manufacturer'] ?? null;
                    $model = $data['model'] ?? $data['name'] ?? null;
                    if (!empty($brand) && !empty($model)) {
                        return $this->matchOrCreateDeviceBrandModel($brand, $model, $empresaId);
                    }
                }
            } catch (\Throwable $e) {
                // Continuar con siguiente proveedor o fallback
            }
        }

        // 2. Base de Datos Extendida de TACs internacionales por GSMA
        $tacMap = [
            // Apple iPhone
            '35391210' => ['brand' => 'Apple', 'model' => 'iPhone 11'],
            '35391310' => ['brand' => 'Apple', 'model' => 'iPhone 11 Pro'],
            '35391410' => ['brand' => 'Apple', 'model' => 'iPhone 11 Pro Max'],
            '35304811' => ['brand' => 'Apple', 'model' => 'iPhone 12'],
            '35304911' => ['brand' => 'Apple', 'model' => 'iPhone 12 Mini'],
            '35305011' => ['brand' => 'Apple', 'model' => 'iPhone 12 Pro'],
            '35305111' => ['brand' => 'Apple', 'model' => 'iPhone 12 Pro Max'],
            '35010667' => ['brand' => 'Apple', 'model' => 'iPhone 13'],
            '35010767' => ['brand' => 'Apple', 'model' => 'iPhone 13 Mini'],
            '35010867' => ['brand' => 'Apple', 'model' => 'iPhone 13 Pro'],
            '35010967' => ['brand' => 'Apple', 'model' => 'iPhone 13 Pro Max'],
            '35896210' => ['brand' => 'Apple', 'model' => 'iPhone 14'],
            '35896211' => ['brand' => 'Apple', 'model' => 'iPhone 14 Plus'],
            '35896311' => ['brand' => 'Apple', 'model' => 'iPhone 14 Pro'],
            '35896411' => ['brand' => 'Apple', 'model' => 'iPhone 14 Pro Max'],
            '35084964' => ['brand' => 'Apple', 'model' => 'iPhone 15'],
            '35085064' => ['brand' => 'Apple', 'model' => 'iPhone 15 Plus'],
            '35085164' => ['brand' => 'Apple', 'model' => 'iPhone 15 Pro'],
            '35085264' => ['brand' => 'Apple', 'model' => 'iPhone 15 Pro Max'],

            // Samsung Galaxy
            '35284109' => ['brand' => 'Samsung', 'model' => 'Galaxy S23 Ultra'],
            '35489111' => ['brand' => 'Samsung', 'model' => 'Galaxy A54 5G'],
            '35154811' => ['brand' => 'Samsung', 'model' => 'Galaxy A14 5G'],
            '35154911' => ['brand' => 'Samsung', 'model' => 'Galaxy A24'],
            '35155011' => ['brand' => 'Samsung', 'model' => 'Galaxy A34 5G'],
            '35284209' => ['brand' => 'Samsung', 'model' => 'Galaxy S22 Ultra'],
            '35284309' => ['brand' => 'Samsung', 'model' => 'Galaxy S21 FE'],
            '35284409' => ['brand' => 'Samsung', 'model' => 'Galaxy Z Flip 5'],
            '35284509' => ['brand' => 'Samsung', 'model' => 'Galaxy Z Fold 5'],

            // Xiaomi / Redmi / Poco
            '86942104' => ['brand' => 'Xiaomi', 'model' => 'Redmi Note 12 Pro'],
            '86421505' => ['brand' => 'Xiaomi', 'model' => 'Poco X5 Pro'],
            '86591204' => ['brand' => 'Xiaomi', 'model' => 'Redmi Note 11'],
            '86591304' => ['brand' => 'Xiaomi', 'model' => 'Poco F5 5G'],
            '86591404' => ['brand' => 'Xiaomi', 'model' => 'Xiaomi 13T Pro'],

            // Motorola
            '86392004' => ['brand' => 'Motorola', 'model' => 'Moto G84 5G'],
            '86392104' => ['brand' => 'Motorola', 'model' => 'Edge 40 Neo'],
            '86392204' => ['brand' => 'Motorola', 'model' => 'Moto G54 5G'],

            // OPPO / Vivo / Honor / Realme / Infinix / Tecno
            '35921808' => ['brand' => 'OPPO', 'model' => 'Reno 8 5G'],
            '86844606' => ['brand' => 'Honor', 'model' => 'Honor X8a (CRT-LX3)'],
            '86844605' => ['brand' => 'Honor', 'model' => 'Honor X8a'],
            '86844607' => ['brand' => 'Honor', 'model' => 'Honor X8a'],
            '86114205' => ['brand' => 'Honor', 'model' => 'Honor Magic 5 Lite'],
            '86114206' => ['brand' => 'Honor', 'model' => 'Honor X7a'],
            '86749204' => ['brand' => 'Realme', 'model' => 'Realme 11 Pro+'],
            '86241505' => ['brand' => 'Vivo', 'model' => 'Vivo V29 5G'],
            '86891204' => ['brand' => 'Infinix', 'model' => 'Infinix Note 30 Pro'],
            '86991204' => ['brand' => 'Tecno', 'model' => 'Tecno Camon 20'],
        ];

        if (isset($tacMap[$tac8])) {
            $info = $tacMap[$tac8];
            return $this->matchOrCreateDeviceBrandModel($info['brand'], $info['model'], $empresaId);
        }

        // 3. Heurística por bloque de asignación de fabricante si no está en la lista específica
        if (str_starts_with($cleanImei, '35') || str_starts_with($cleanImei, '01')) {
            return $this->matchOrCreateDeviceBrandModel('Smartphone / Apple / Samsung', 'Dispositivo Móvil', $empresaId);
        } elseif (str_starts_with($cleanImei, '86')) {
            return $this->matchOrCreateDeviceBrandModel('Android / Xiaomi / Motorola', 'Dispositivo Móvil', $empresaId);
        }

        return null;
    }

    private function matchOrCreateDeviceBrandModel(string $brandName, string $modelName, int $empresaId): array
    {
        $marca = Marca::where('empresa_id', $empresaId)
            ->where('nombre', 'like', "%{$brandName}%")
            ->first();

        $modelo = null;
        if ($marca) {
            $modelo = Modelo::where('marca_id', $marca->id)
                ->where('nombre_comercial', 'like', "%{$modelName}%")
                ->first();
        }

        return [
            'brand' => $brandName,
            'model' => $modelName,
            'marca_id' => $marca ? $marca->id : null,
            'marca_nombre' => $marca ? $marca->nombre : $brandName,
            'modelo_id' => $modelo ? $modelo->id : null,
            'modelo_nombre' => $modelo ? $modelo->nombre_comercial : $modelName,
        ];
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => 'nullable|exists:clientes,id',
            'cliente_nombre' => 'required|string|max:255',
            'cliente_telefono' => 'nullable|string|max:50',
            'tipo_dispositivo' => 'required|string|max:255',
            'marca_id' => 'nullable|exists:marcas,id',
            'marca_nombre' => 'required|string|max:255',
            'modelo_id' => 'nullable|exists:modelos,id',
            'modelo_nombre' => 'required|string|max:255',
            'color' => 'nullable|string|max:100',
            'imei_serie' => 'nullable|string|max:100',
            'contrasena_patron' => 'nullable|string|max:255',
            'descripcion_falla' => 'required|string',
            'observaciones_fisicas' => 'nullable|string',
            'tecnico_id' => 'nullable|exists:landlord.users,id',
            'comision_tecnico_pct' => 'nullable|numeric|min:0|max:100',
            'costo_estimado' => 'required|numeric|min:0',
            'anticipo' => 'nullable|numeric|min:0',
            'garantia_dias' => 'nullable|integer|min:0',
            'fecha_prometida' => 'nullable|date',
            'evidencias_fotos' => 'nullable|array',
            'servicios_seleccionados' => 'nullable|array',
        ]);

        $user = auth()->user();
        $empresaId = $user->empresa_id;

        // Generar Correlativo Folio
        $lastOrder = OrdenReparacion::where('empresa_id', $empresaId)->max('id') ?? 0;
        $numeroOrden = 'REP-' . str_pad($lastOrder + 1, 6, '0', STR_PAD_LEFT);

        $costoEstimado = (float) $validated['costo_estimado'];
        $anticipo = (float) ($validated['anticipo'] ?? 0);
        $saldoRestante = max(0, $costoEstimado - $anticipo);

        // Remover campos que se guardan en tablas secundarias antes de crear la orden
        $serviciosSeleccionados = $validated['servicios_seleccionados'] ?? [];
        $evidenciasFotos = $validated['evidencias_fotos'] ?? [];
        unset($validated['servicios_seleccionados']);
        unset($validated['evidencias_fotos']);

        $ordenData = array_merge($validated, [
            'empresa_id' => $empresaId,
            'sucursal_id' => $user->sucursal_id,
            'numero_orden' => $numeroOrden,
            'estado_orden' => 'recibido',
            'comision_tecnico_pct' => (float) ($validated['comision_tecnico_pct'] ?? 0),
            'costo_estimado' => $costoEstimado,
            'anticipo' => $anticipo,
            'saldo_restante' => $saldoRestante,
            'fecha_recepcion' => now(),
        ]);

        $orden = OrdenReparacion::create($ordenData);

        // Registrar ingreso a la Caja Chica abierta si se especificó un anticipo de recepción
        if ($anticipo > 0) {
            try {
                $activeRegister = \App\Models\CashRegister::getActiveRegister($user);
                if ($activeRegister) {
                    $metodoPago = $request->input('metodo_pago_anticipo', 'efectivo');
                    app(\App\Services\CashRegisterService::class)->addMovement(
                        $activeRegister,
                        'inflow',
                        'anticipo_reparacion',
                        $metodoPago,
                        $anticipo,
                        "Anticipo a la orden {$numeroOrden} - Cliente: {$orden->cliente_nombre}",
                        $user->id
                    );
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Error registrando anticipo inicial en caja: ' . $e->getMessage());
            }
        }

        // Guardar servicios agregados desde el carrito como items de la orden
        if (!empty($serviciosSeleccionados)) {
            $totalServicios = 0;
            $hasServicioIdCol = \Illuminate\Support\Facades\Schema::hasColumn('orden_reparacion_items', 'servicio_id');

            foreach ($serviciosSeleccionados as $item) {
                $cant = (int) ($item['cantidad'] ?? 1);
                $precio = (float) ($item['precio'] ?? 0);
                $subtotal = $cant * $precio;
                $totalServicios += $subtotal;

                $itemData = [
                    'orden_id' => $orden->id,
                    'descripcion' => $item['nombre'] ?? 'Servicio de Reparación',
                    'cantidad' => $cant,
                    'precio_costo' => 0,
                    'precio_venta' => $precio,
                    'subtotal' => $subtotal,
                ];

                if ($hasServicioIdCol) {
                    $itemData['servicio_id'] = $item['servicio_id'] ?? null;
                }

                OrdenReparacionItem::create($itemData);
            }

            if ($totalServicios > 0) {
                $costoFinal = max($costoEstimado, $totalServicios);
                $orden->update([
                    'costo_mano_obra' => $totalServicios,
                    'costo_estimado' => $costoFinal,
                    'saldo_restante' => max(0, $costoFinal - $anticipo),
                ]);
            }
        }

        // Guardar evidencias fotográficas en la tabla orden_reparacion_fotos
        if (!empty($evidenciasFotos)) {
            $hasFotosTable = \Illuminate\Support\Facades\Schema::hasTable('orden_reparacion_fotos');
            if ($hasFotosTable) {
                foreach ($evidenciasFotos as $angulo => $url) {
                    if (!empty($url)) {
                        $storedUrl = $url;
                        if (str_starts_with($url, 'data:image')) {
                            try {
                                preg_match('/data:image\/(?<type>.*?);base64,(?<data>.*)/', $url, $matches);
                                $imageType = isset($matches['type']) && in_array($matches['type'], ['png', 'webp', 'jpeg', 'jpg']) ? $matches['type'] : 'jpeg';
                                $imageData = base64_decode($matches['data'] ?? '');

                                $filename = 'reparaciones/' . $orden->id . '/recepcion_' . $angulo . '_' . time() . '.' . $imageType;
                                \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $imageData);
                                $storedUrl = \Illuminate\Support\Facades\Storage::url($filename);
                            } catch (\Throwable $e) {
                                \Illuminate\Support\Facades\Log::error('Error guardando evidencia fotográfica de recepción: ' . $e->getMessage());
                            }
                        }

                        OrdenReparacionFoto::create([
                            'orden_id' => $orden->id,
                            'angulo' => $angulo,
                            'url' => $storedUrl,
                            'descripcion' => "Fotografía de recepción - " . ucfirst(str_replace('_', ' ', $angulo)),
                        ]);
                    }
                }
            }
        }

        // Registro de Historial inicial
        OrdenReparacionHistorial::create([
            'orden_id' => $orden->id,
            'user_id' => $user->id,
            'estado_anterior' => null,
            'estado_nuevo' => 'recibido',
            'comentario' => 'Orden de recepción registrada.',
        ]);

        // Enviar notificaciones por WhatsApp al cliente y al técnico asociado
        $waUrl = $this->sendWhatsAppNotificationsOnOrderCreation($orden);

        $redirect = redirect()->route('admin.reparaciones.show', $orden->id)->with('notification', [
            'type' => 'success',
            'message' => "Orden de Reparación {$numeroOrden} creada exitosamente.",
        ]);

        if ($waUrl) {
            $redirect->with('whatsapp_url', $waUrl);
        }

        return $redirect;
    }

    public function show($id)
    {
        $reparacion = OrdenReparacion::findOrFail($id);
        $relations = ['empresa', 'sucursal', 'cliente', 'marca', 'modelo', 'tecnico', 'items.producto', 'items.servicio', 'historial.user', 'sale'];
        if (\Illuminate\Support\Facades\Schema::hasTable('orden_reparacion_fotos')) {
            $relations[] = 'fotos';
        }
        $reparacion->load($relations);


        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $empresa = \App\Models\Empresa::find($empresaId)
            ?? $reparacion->empresa
            ?? \App\Models\Empresa::find($reparacion->empresa_id);

        $productosRepuestos = Producto::where('empresa_id', $empresaId)
            ->where('tipo_producto', 'repuesto')
            ->with(['marca:id,nombre', 'modelo:id,nombre_comercial'])
            ->orderBy('nombre_variante')
            ->get(['id', 'sku', 'codigo_barras', 'nombre_variante', 'precio_venta', 'precio_compra', 'stock', 'marca_id', 'modelo_id', 'condicion', 'tipo_producto']);

        $tecnicos = User::where('empresa_id', $empresaId)->get(['id', 'name']);
        $clientes = \App\Models\Cliente::where('empresa_id', $empresaId)->orderBy('nombre')->get(['id', 'nombre', 'telefono', 'email']);
        $marcas = Marca::with('modelos')->where('empresa_id', $empresaId)->orderBy('nombre')->get();
        $categorias = \App\Models\Categoria::withoutGlobalScope('multitenancy')
            ->where(function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId)
                  ->orWhereNull('empresa_id');
            })
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        // Sucursales para el modal de configuración del checklist
        $sucursales = \App\Models\Sucursal::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('status', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        // Checklist dinámico de post-atención para esta empresa/sucursal
        $sucursalId = $reparacion->sucursal_id ?? $user->sucursal_id;
        $checklistService = app(PostServicioChecklistService::class);

        $checklistItems = [];
        if (\Illuminate\Support\Facades\Schema::hasTable('reparacion_checklist_items')) {
            $checklistItems = $checklistService->getChecklistForBranch($empresaId, $sucursalId);
        }

        return Inertia::render('admin/Reparaciones/Show', [
            'orden'              => $reparacion,
            'empresa'            => $empresa,
            'productosRepuestos' => $productosRepuestos,
            'tecnicos'           => $tecnicos,
            'clientes'           => $clientes,
            'marcas'             => $marcas,
            'categorias'         => $categorias,
            'currencySymbol'     => $this->getCurrencySymbol(),
            'sucursales'         => $sucursales,
            'checklist_items'    => $checklistItems,
        ]);
    }


    public function reportePdf(OrdenReparacion $reparacion)
    {
        $relations = ['empresa', 'sucursal', 'cliente', 'marca', 'modelo', 'tecnico', 'items.producto', 'items.servicio'];
        if (\Illuminate\Support\Facades\Schema::hasTable('orden_reparacion_fotos')) {
            $relations[] = 'fotos';
        }
        $reparacion->load($relations);

        $empresa = $reparacion->empresa 
            ?? \App\Models\Empresa::find($reparacion->empresa_id) 
            ?? \App\Models\Empresa::find(auth()->user()->empresa_id);

        $sucursal = $reparacion->sucursal 
            ?? \App\Models\Sucursal::find($reparacion->sucursal_id) 
            ?? \App\Models\Sucursal::where('empresa_id', $empresa?->id)->first();

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.reparacion_reporte', [
                'orden' => $reparacion,
                'empresa' => $empresa,
                'sucursal' => $sucursal,
                'currencySymbol' => $this->getCurrencySymbol(),
            ])->setPaper('a4', 'portrait');

            return $pdf->stream("Reporte_Reparacion_{$reparacion->numero_orden}.pdf");
        }

        return view('pdf.reparacion_reporte', [
            'orden' => $reparacion,
            'empresa' => $empresa,
            'sucursal' => $sucursal,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function updateDatos(Request $request, OrdenReparacion $reparacion)
    {
        $validated = $request->validate([
            'cliente_id' => 'nullable|exists:clientes,id',
            'cliente_nombre' => 'required|string|max:255',
            'cliente_telefono' => 'nullable|string|max:50',
            'tipo_dispositivo' => 'required|string|max:255',
            'marca_id' => 'nullable|exists:marcas,id',
            'marca_nombre' => 'required|string|max:255',
            'modelo_id' => 'nullable|exists:modelos,id',
            'modelo_nombre' => 'required|string|max:255',
            'color' => 'nullable|string|max:100',
            'imei_serie' => 'nullable|string|max:100',
            'contrasena_patron' => 'nullable|string|max:255',
            'descripcion_falla' => 'required|string',
            'observaciones_fisicas' => 'nullable|string',
            'tecnico_id' => 'nullable|exists:landlord.users,id',
        ]);

        $oldMarca = $reparacion->marca_nombre;
        $oldModelo = $reparacion->modelo_nombre;
        $oldCliente = $reparacion->cliente_nombre;

        $reparacion->update($validated);

        $cambios = [];
        if ($oldMarca !== $validated['marca_nombre']) {
            $cambios[] = "Marca: '{$oldMarca}' ➔ '{$validated['marca_nombre']}'";
        }
        if ($oldModelo !== $validated['modelo_nombre']) {
            $cambios[] = "Modelo: '{$oldModelo}' ➔ '{$validated['modelo_nombre']}'";
        }
        if ($oldCliente !== $validated['cliente_nombre']) {
            $cambios[] = "Cliente: '{$oldCliente}' ➔ '{$validated['cliente_nombre']}'";
        }

        $mensajeHistorial = !empty($cambios)
            ? "Se editaron los datos de la orden (" . implode(', ', $cambios) . ")"
            : "Se actualizaron los datos generales de la orden de reparación.";

        \App\Models\OrdenReparacionHistorial::create([
            'orden_id' => $reparacion->id,
            'user_id' => auth()->id(),
            'estado_anterior' => $reparacion->estado_orden,
            'estado_nuevo' => $reparacion->estado_orden,
            'comentario' => $mensajeHistorial,
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Datos de la orden actualizados correctamente.'),
        ]);
    }

    public function uploadFotoProceso(Request $request, OrdenReparacion $reparacion)
    {
        $request->validate([
            'foto' => 'required|string',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $fotoData = $request->input('foto');
        $descripcion = $request->input('descripcion') ?: 'Evidencia de proceso de reparación en taller';

        $url = $fotoData;
        if (str_starts_with($fotoData, 'data:image')) {
            try {
                preg_match('/data:image\/(?<type>.*?);base64,(?<data>.*)/', $fotoData, $matches);
                $imageType = isset($matches['type']) && in_array($matches['type'], ['png', 'webp', 'jpeg', 'jpg']) ? $matches['type'] : 'jpeg';
                $imageData = base64_decode($matches['data'] ?? '');

                $filename = 'reparaciones/' . $reparacion->id . '/proceso_' . time() . '_' . uniqid() . '.' . $imageType;
                \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $imageData);
                $url = \Illuminate\Support\Facades\Storage::url($filename);
            } catch (\Throwable $e) {
                $url = $fotoData;
            }
        }

        if (\Illuminate\Support\Facades\Schema::hasTable('orden_reparacion_fotos')) {
            OrdenReparacionFoto::create([
                'orden_id' => $reparacion->id,
                'angulo' => 'proceso_' . time(),
                'url' => $url,
                'descripcion' => $descripcion,
            ]);
        }

        OrdenReparacionHistorial::create([
            'orden_id' => $reparacion->id,
            'user_id' => auth()->id(),
            'estado_anterior' => $reparacion->estado_orden,
            'estado_nuevo' => $reparacion->estado_orden,
            'comentario' => "Se agregó evidencia fotográfica de reparación: '{$descripcion}'",
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Evidencia de reparación guardada correctamente.'),
        ]);
    }

    public function deleteFoto(Request $request, OrdenReparacion $reparacion, OrdenReparacionFoto $foto)
    {
        if ($foto->orden_id === $reparacion->id) {
            $foto->delete();
            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Fotografía eliminada correctamente.'),
            ]);
        }
        return back()->withErrors(['message' => __('Acceso denegado.')]);
    }

    public function savePreservicio(Request $request, $reparacion)
        $reparacion = $reparacion instanceof OrdenReparacion ? $reparacion : OrdenReparacion::findOrFail($reparacion);
        if (!\Illuminate\Support\Facades\Schema::hasColumn('ordenes_reparacion', 'contrasena_patron')) {
            \Illuminate\Support\Facades\Schema::table('ordenes_reparacion', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->string('contrasena_patron')->nullable()->after('observaciones_fisicas');
            });
        }
        if (!\Illuminate\Support\Facades\Schema::hasColumn('ordenes_reparacion', 'inspeccion_json')) {
            \Illuminate\Support\Facades\Schema::table('ordenes_reparacion', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->json('inspeccion_json')->nullable()->after('contrasena_patron');
            });
        }
        if (!\Illuminate\Support\Facades\Schema::hasColumn('ordenes_reparacion', 'post_servicio_json')) {
            \Illuminate\Support\Facades\Schema::table('ordenes_reparacion', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->json('post_servicio_json')->nullable()->after('inspeccion_json');
            });
        }

        $validated = $request->validate([
            'estado_orden' => 'nullable|string|in:recibido,en_diagnostico,presupuestado,reincidencia,en_reparacion,esperando_repuesto,reparado,entregado,cancelado',
            'comentario' => 'nullable|string',
            'tecnico_id' => 'nullable',
            'observaciones_fisicas' => 'nullable|string',
            'contrasena_patron' => 'nullable|string',
            'inspeccion_json' => 'nullable',
            'post_servicio_json' => 'nullable',
        ]);

        $estadoAnterior = $reparacion->estado_orden;
        $nuevoEstado = !empty($validated['estado_orden']) ? $validated['estado_orden'] : $estadoAnterior;

        $updateData = [];
        if (!empty($validated['estado_orden'])) {
            $updateData['estado_orden'] = $nuevoEstado;
        }

        if (array_key_exists('tecnico_id', $validated)) {
            $updateData['tecnico_id'] = !empty($validated['tecnico_id']) ? $validated['tecnico_id'] : null;
        }

        if ($request->has('observaciones_fisicas')) {
            $updateData['observaciones_fisicas'] = $request->input('observaciones_fisicas');
        }
        if ($request->has('contrasena_patron')) {
            $updateData['contrasena_patron'] = $request->input('contrasena_patron');
        }
        if ($request->has('inspeccion_json')) {
            $inspeccionVal = $request->input('inspeccion_json');
            $updateData['inspeccion_json'] = is_array($inspeccionVal) ? $inspeccionVal : json_decode($inspeccionVal, true);
        }
        if ($request->has('post_servicio_json')) {
            $postVal = $request->input('post_servicio_json');
            $postArray = is_array($postVal) ? $postVal : json_decode($postVal, true);
            $updateData['post_servicio_json'] = $postArray;

            if (!empty($postArray['fotos_post']) && is_array($postArray['fotos_post']) && \Illuminate\Support\Facades\Schema::hasTable('orden_reparacion_fotos')) {
                foreach ($postArray['fotos_post'] as $key => $fotoItem) {
                    $url = is_array($fotoItem) ? ($fotoItem['url'] ?? null) : $fotoItem;
                    if (!empty($url)) {
                        $anguloKey = is_array($fotoItem) ? ($fotoItem['angulo'] ?? "post_{$key}") : "post_{$key}";
                        OrdenReparacionFoto::create([
                            'orden_id' => $reparacion->id,
                            'angulo' => $anguloKey,
                            'url' => $url,
                            'descripcion' => "Fotografía Post-Reparación (" . ucfirst(str_replace('_', ' ', $anguloKey)) . ")",
                        ]);
                    }
                }
            }
        }

        if ($nuevoEstado === 'entregado' && !$reparacion->fecha_entrega) {
            $updateData['fecha_entrega'] = now();
        }

        if (!empty($updateData)) {
            $reparacion->update($updateData);
        }

        // Registrar en historial si cambió el estado o si se incluyó un comentario
        if ($nuevoEstado !== $estadoAnterior || !empty($validated['comentario'])) {
            OrdenReparacionHistorial::create([
                'orden_id' => $reparacion->id,
                'user_id' => auth()->id(),
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => $nuevoEstado,
                'comentario' => $validated['comentario'] ?? "Cambio de estado a " . ucfirst(str_replace('_', ' ', $nuevoEstado)),
            ]);
        }

        // Si el estado cambia a reparado, enviar notificación de WhatsApp al cliente
        $waUrl = null;
        if ($nuevoEstado === 'reparado' && $estadoAnterior !== 'reparado') {
            $waUrl = $this->sendWhatsAppNotificationOnPostServicioCompleted($reparacion);
        }

        $message = $nuevoEstado === 'reparado'
            ? "Estado actualizado a Listo / Reparado. Notificación de retiro enviada al cliente."
            : "Estado actualizado exitosamente.";

        $redirect = redirect()->route('admin.reparaciones.show', $reparacion->id)->with('notification', [
            'type' => 'success',
            'message' => $message,
        ]);

        if ($waUrl) {
            $redirect->with('whatsapp_url', $waUrl);
        }

        return $redirect;
    }

    public function addItem(Request $request, OrdenReparacion $reparacion)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'cantidad' => 'required|integer|min:1',
        ]);

        $producto = Producto::find($validated['producto_id']);

        if ($producto->stock < $validated['cantidad']) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => "Stock insuficiente del repuesto {$producto->nombre}. Disponible: {$producto->stock}.",
            ]);
        }

        $precioVenta = (float) $producto->precio_venta;
        $precioCosto = (float) ($producto->precio_compra ?? 0);
        $cant = (int) $validated['cantidad'];
        $subtotal = $precioVenta * $cant;

        $item =OrdenReparacionItem::where('orden_id', $reparacion->id)->first();

        if($item != null)

        {
            $item->update([
                'producto_id' => $producto->id,
            ]);
        }

        // Descontar inventario
        $producto->decrement('stock', $cant);

        // Recalcular Totales
        $this->recalcularTotales($reparacion);

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Repuesto {$producto->nombre} asignado a la reparación.",
        ]);
    }

    public function removeItem(OrdenReparacion $reparacion, OrdenReparacionItem $item)
    {
        if ($item->producto_id) {
            $producto = Producto::find($item->producto_id);
            if ($producto) {
                $producto->increment('stock', $item->cantidad);
            }
        }

        $item->delete();

        $this->recalcularTotales($reparacion);

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Repuesto eliminado de la reparación.",
        ]);
    }

    public function updateCostos(Request $request, OrdenReparacion $reparacion)
    {
        $request->merge([
            'costo_mano_obra' => str_replace(',', '.', (string) $request->input('costo_mano_obra', '0')),
            'anticipo' => str_replace(',', '.', (string) $request->input('anticipo', '0')),
        ]);

        $validated = $request->validate([
            'costo_mano_obra' => 'required|numeric|min:0',
            'anticipo' => 'nullable|numeric|min:0',
        ]);

        $reparacion->update([
            'costo_mano_obra' => (float) $validated['costo_mano_obra'],
            'anticipo' => isset($validated['anticipo']) ? (float) $validated['anticipo'] : (float) $reparacion->anticipo,
        ]);

        $reparacion->refresh();

        $this->recalcularTotales($reparacion);

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Costos actualizados correctamente.",
        ]);
    }

    public function update(Request $request, OrdenReparacion $reparacion)
    {
        return $this->updateCostos($request, $reparacion);
    }

    private function recalcularTotales(OrdenReparacion $reparacion)
    {
        $costoRepuestos = (float) $reparacion->items()->whereNotNull('producto_id')->sum('subtotal');
        $costoManoObra = (float) $reparacion->costo_mano_obra;
        // El total de la orden se cobra por servicio/mano de obra; los repuestos se registran aparte.
        $totalEstimado = $costoManoObra;
        $anticipo = (float) $reparacion->anticipo;
        $saldo = max(0, $totalEstimado - $anticipo);

        $reparacion->update([
            'costo_repuestos' => $costoRepuestos,
            'costo_estimado' => $totalEstimado,
            'saldo_restante' => $saldo,
        ]);
    }

    public function storeMarca(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
        ]);

        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $marca = \App\Models\Marca::create([
            'empresa_id' => $empresaId,
            'sucursal_id' => $user->sucursal_id,
            'nombre' => $validated['nombre'],
            'slug' => \Illuminate\Support\Str::slug($validated['nombre']),
            'estado' => true,
        ]);

        $marca->setRelation('modelos', collect([]));

        return response()->json([
            'success' => true,
            'marca' => $marca,
            'message' => "Marca '{$marca->nombre}' registrada exitosamente.",
        ]);
    }

    public function storeModelo(Request $request)
    {
        $validated = $request->validate([
            'marca_id' => 'required|exists:marcas,id',
            'nombre_comercial' => 'required|string|max:255',
            'codigo_modelo' => 'nullable|string|max:255',
        ]);

        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $familia = \App\Models\Familia::where('empresa_id', $empresaId)
            ->where('marca_id', $validated['marca_id'])
            ->first();

        if (!$familia) {
            $familia = \App\Models\Familia::create([
                'nombre' => 'General',
                'marca_id' => $validated['marca_id'],
                'empresa_id' => $empresaId,
                'sucursal_id' => $user->sucursal_id,
                'estado' => true,
            ]);
        }

        $categoria = \App\Models\Categoria::where('empresa_id', $empresaId)->first();
        if (!$categoria) {
            $categoria = \App\Models\Categoria::create([
                'nombre' => 'General',
                'empresa_id' => $empresaId,
                'estado' => true,
            ]);
        }

        $modelo = \App\Models\Modelo::create([
            'empresa_id' => $empresaId,
            'sucursal_id' => $user->sucursal_id,
            'marca_id' => $validated['marca_id'],
            'familia_id' => $familia->id,
            'categoria_id' => $categoria->id,
            'nombre_comercial' => $validated['nombre_comercial'],
            'codigo_modelo' => $validated['codigo_modelo'] ?? null,
            'estado' => true,
        ]);

        return response()->json([
            'success' => true,
            'modelo' => $modelo,
            'message' => "Modelo '{$modelo->nombre_comercial}' registrado exitosamente.",
        ]);
    }

    public function postServicioForm(OrdenReparacion $reparacion)
    {
        $relations = ['cliente', 'marca', 'modelo', 'tecnico'];
        if (\Illuminate\Support\Facades\Schema::hasTable('orden_reparacion_fotos')) {
            $relations[] = 'fotos';
        }
        $reparacion->load($relations);

        $user       = auth()->user();
        $empresaId  = $reparacion->empresa_id ?? $user->empresa_id;
        $sucursalId = $reparacion->sucursal_id ?? $user->sucursal_id;

        $sucursales = \App\Models\Sucursal::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('status', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        $checklistItems = [];
        if (\Illuminate\Support\Facades\Schema::hasTable('reparacion_checklist_items')) {
            $checklistService = app(PostServicioChecklistService::class);
            $checklistItems   = $checklistService->getChecklistForBranch($empresaId, $sucursalId);
        }

        return Inertia::render('admin/Reparaciones/PostServicio', [
            'orden'           => $reparacion,
            'currencySymbol'  => $this->getCurrencySymbol(),
            'sucursales'      => $sucursales,
            'checklist_items' => $checklistItems,
        ]);
    }


    public function savePostServicio(Request $request, OrdenReparacion $reparacion)
    {
        if (!\Illuminate\Support\Facades\Schema::hasColumn('ordenes_reparacion', 'post_servicio_json')) {
            \Illuminate\Support\Facades\Schema::table('ordenes_reparacion', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->json('post_servicio_json')->nullable()->after('inspeccion_json');
            });
        }

        $validated = $request->validate([
            'post_servicio_json' => 'required',
            'estado_orden' => 'nullable|string',
        ]);

        $postVal = $validated['post_servicio_json'];
        $postArray = is_array($postVal) ? $postVal : json_decode($postVal, true);

        $updateData = [
            'post_servicio_json' => $postArray,
        ];

        if ($request->filled('estado_orden')) {
            $updateData['estado_orden'] = $request->input('estado_orden');
        } else if ($reparacion->estado_orden !== 'entregado') {
            $updateData['estado_orden'] = 'reparado';
        }

        $reparacion->update($updateData);

        if (!empty($postArray['fotos_post']) && is_array($postArray['fotos_post']) && \Illuminate\Support\Facades\Schema::hasTable('orden_reparacion_fotos')) {
            foreach ($postArray['fotos_post'] as $key => $fotoItem) {
                $url = is_array($fotoItem) ? ($fotoItem['url'] ?? null) : $fotoItem;
                if (!empty($url)) {
                    $anguloKey = is_array($fotoItem) ? ($fotoItem['angulo'] ?? "post_{$key}") : "post_{$key}";
                    OrdenReparacionFoto::create([
                        'orden_id' => $reparacion->id,
                        'angulo' => $anguloKey,
                        'url' => $url,
                        'descripcion' => "Fotografía Post-Reparación (" . ucfirst(str_replace('_', ' ', $anguloKey)) . ")",
                    ]);
                }
            }
        }

        OrdenReparacionHistorial::create([
            'orden_id' => $reparacion->id,
            'user_id' => auth()->id(),
            'estado_anterior' => $reparacion->estado_orden,
            'estado_nuevo' => $updateData['estado_orden'] ?? $reparacion->estado_orden,
            'comentario' => 'Validación Final, Limpieza & Control de Calidad Post-Atención registrado.',
        ]);

        // Enviar notificación de WhatsApp informando que el equipo está listo para retirar
        $waUrl = $this->sendWhatsAppNotificationOnPostServicioCompleted($reparacion);

        $redirect = redirect()->route('admin.reparaciones.show', $reparacion->id)
            ->with('success', 'Proceso de Post-Atención guardado exitosamente. Notificación de retiro enviada al cliente.');

        if ($waUrl) {
            $redirect->with('whatsapp_url', $waUrl);
        }

        return $redirect;
    }

    private function sendWhatsAppNotificationOnPostServicioCompleted(OrdenReparacion $orden): ?string
    {
        try {
            $user = auth()->user();
            $empresaId = $orden->empresa_id ?? ($user ? $user->empresa_id : 1);
            $whatsappService = (new \App\Services\WhatsAppService($empresaId))->setTimeout(3);
            $currencySymbol = $this->getCurrencySymbol();

            $orden->loadMissing(['cliente', 'marca', 'modelo', 'tecnico']);

            $clientePhone = $this->formatPhoneNumber($orden->cliente_telefono, $empresaId);
            if (!$clientePhone && $orden->cliente_id) {
                $clienteModel = \App\Models\Cliente::find($orden->cliente_id);
                if ($clienteModel && !empty($clienteModel->telefono)) {
                    $clientePhone = $this->formatPhoneNumber($clienteModel->telefono, $empresaId);
                }
            }

            if ($clientePhone) {
                $clienteNombre = $orden->cliente ? $orden->cliente->nombre : ($orden->cliente_nombre ?? 'Estimado(a) Cliente');
                $tecnicoNombre = $orden->tecnico ? $orden->tecnico->name : 'Servicio Técnico';
                $marcaNombre = $orden->marca ? $orden->marca->nombre : ($orden->marca_nombre ?? 'Dispositivo');
                $modeloNombre = $orden->modelo ? $orden->modelo->nombre_comercial : ($orden->modelo_nombre ?? '');
                $saldoFmt = number_format((float) $orden->saldo_restante, 2);
                $empresaId = $orden->empresa_id ?? 1;
                $trackingUrl = url("/reparacion/{$empresaId}/consultar?orden={$orden->numero_orden}");

                $mensajeCliente = "*¡SU EQUIPO YA ESTA LISTO PARA RETIRAR!*\n\n"
                    . "Estimado(a) *{$clienteNombre}*,\n"
                    . "Le informamos que la reparacion de su equipo ha finalizado exitosamente y ya se encuentra *DISPONIBLE PARA SU RETIRO* en nuestra sucursal.\n\n"
                    . "*DATOS DE LA ORDEN:*\n"
                    . "• *Orden:* #{$orden->numero_orden}\n"
                    . "• *Equipo:* {$marcaNombre} {$modeloNombre} ({$orden->tipo_dispositivo})\n"
                    . (!empty($orden->imei_serie) ? "• *IMEI/Serie:* {$orden->imei_serie}\n" : "")
                    . "• *Saldo Pendiente:* {$currencySymbol}{$saldoFmt}\n\n"
                    . "*TECNICO A CARGO:*\n"
                    . "• *Nombre:* {$tecnicoNombre}\n\n"
                    . "*Ver detalle de la orden:*\n"
                    . "{$trackingUrl}\n\n"
                    . "Puede pasar por nuestra sucursal en nuestros horarios de atencion. Agradecemos su confianza.";

                $whatsappService->sendMessage($clientePhone, $mensajeCliente);

                return "https://wa.me/{$clientePhone}?text=" . urlencode($mensajeCliente);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error enviando notificación de WhatsApp Post-Servicio: ' . $e->getMessage());
        }
        return null;
    }

    private function sendWhatsAppNotificationsOnOrderCreation(OrdenReparacion $orden): ?string
    {
        try {
            $user = auth()->user();
            $empresaId = $orden->empresa_id ?? ($user ? $user->empresa_id : 1);
            $whatsappService = (new \App\Services\WhatsAppService($empresaId))->setTimeout(3);
            $currencySymbol = $this->getCurrencySymbol();

            $waUrlCliente = null;

            // 1. Notificación al Cliente
            $clientePhone = $this->formatPhoneNumber($orden->cliente_telefono, $empresaId);
            if (!$clientePhone && $orden->cliente_id) {
                $clienteModel = \App\Models\Cliente::find($orden->cliente_id);
                if ($clienteModel && !empty($clienteModel->telefono)) {
                    $clientePhone = $this->formatPhoneNumber($clienteModel->telefono, $empresaId);
                }
            }

            if ($clientePhone) {
                $costoFmt = number_format((float) $orden->costo_estimado, 2);
                $anticipoFmt = number_format((float) $orden->anticipo, 2);
                $saldoFmt = number_format((float) $orden->saldo_restante, 2);
                $trackingUrl = url("/reparacion/{$empresaId}/consultar?orden={$orden->numero_orden}");

                $mensajeCliente = "*CONFIRMACION DE ORDEN DE REPARACION*\n\n"
                    . "*Orden:* #{$orden->numero_orden}\n"
                    . "*Cliente:* {$orden->cliente_nombre}\n"
                    . "*Equipo:* {$orden->marca_nombre} {$orden->modelo_nombre} ({$orden->tipo_dispositivo})\n"
                    . (!empty($orden->imei_serie) ? "*IMEI/Serie:* {$orden->imei_serie}\n" : "")
                    . "*Falla Reportada:* {$orden->descripcion_falla}\n"
                    . "*Costo Estimado:* {$currencySymbol}{$costoFmt}\n"
                    . "*Anticipo:* {$currencySymbol}{$anticipoFmt}\n"
                    . "*Saldo Restante:* {$currencySymbol}{$saldoFmt}\n\n"
                    . "*Consulte el estado en vivo o apruebe su presupuesto aqui:*\n"
                    . "{$trackingUrl}\n\n"
                    . "Estimado(a) *{$orden->cliente_nombre}*, su equipo ha sido recibido exitosamente en nuestro taller. Le mantendremos informado sobre el estatus de su reparacion. Gracias por su confianza.";

                $whatsappService->sendMessage($clientePhone, $mensajeCliente);
                $waUrlCliente = "https://wa.me/{$clientePhone}?text=" . urlencode($mensajeCliente);
            }

            // 2. Notificación al Técnico Asignado (si aplica)
            if ($orden->tecnico_id) {
                $tecnico = \App\Models\User::find($orden->tecnico_id);
                if ($tecnico && !empty($tecnico->telefono)) {
                    $tecnicoPhone = $this->formatPhoneNumber($tecnico->telefono, $empresaId);
                    if ($tecnicoPhone) {
                        $mensajeTecnico = "*NUEVA ORDEN DE REPARACION ASIGNADA*\n\n"
                            . "*Orden:* #{$orden->numero_orden}\n"
                            . "*Tecnico:* {$tecnico->name}\n"
                            . "*Equipo:* {$orden->marca_nombre} {$orden->modelo_nombre} ({$orden->tipo_dispositivo})\n"
                            . (!empty($orden->imei_serie) ? "*IMEI/Serie:* {$orden->imei_serie}\n" : "")
                            . "*Cliente:* {$orden->cliente_nombre}\n"
                            . "*Falla Reportada:* {$orden->descripcion_falla}\n"
                            . (!empty($orden->observaciones_fisicas) ? "*Observaciones:* {$orden->observaciones_fisicas}\n" : "")
                            . "\nHola *{$tecnico->name}*, se te ha asignado una nueva orden de servicio tecnico. Por favor ingresa al sistema para iniciar el diagnostico.";

                        $whatsappService->sendMessage($tecnicoPhone, $mensajeTecnico);
                    }
                }
            }

            return $waUrlCliente;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error enviando notificaciones de WhatsApp en creación de orden: ' . $e->getMessage());
        }
        return null;
    }

    private function formatPhoneNumber(?string $phone, ?int $empresaId = null): ?string
    {
        if (empty($phone)) {
            return null;
        }

        // 1. Eliminar cualquier carácter que no sea un número (elimina el signo +, espacios, guiones, etc.)
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (empty($cleanPhone)) {
            return null;
        }

        // 2. Obtener el prefijo telefónico del país de la empresa
        $codigoPais = null;
        if ($empresaId) {
            $empresa = \App\Models\Empresa::with('paisTelefono')->find($empresaId);
            if ($empresa) {
                if ($empresa->paisTelefono && !empty($empresa->paisTelefono->codigo_telefonico)) {
                    $codigoPais = preg_replace('/[^0-9]/', '', $empresa->paisTelefono->codigo_telefonico);
                } elseif ($empresa->pais_telefono_id) {
                    $pais = \App\Models\Pais::find($empresa->pais_telefono_id);
                    if ($pais && !empty($pais->codigo_telefonico)) {
                        $codigoPais = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
                    }
                }
            }
        }

        // Fallback si no se especificó o no se encontró empresa: buscar país predeterminado activo
        if (!$codigoPais) {
            $paisDefault = \App\Models\Pais::where('activo', true)->first();
            if ($paisDefault && !empty($paisDefault->codigo_telefonico)) {
                $codigoPais = preg_replace('/[^0-9]/', '', $paisDefault->codigo_telefonico);
            }
        }

        // 3. Formatear el número agregando el código de país si aún no lo tiene
        if ($codigoPais) {
            $phoneWithoutZero = ltrim($cleanPhone, '0');

            if (!str_starts_with($cleanPhone, $codigoPais) && !str_starts_with($phoneWithoutZero, $codigoPais)) {
                $cleanPhone = $codigoPais . $phoneWithoutZero;
            }
        }

        // Retornar número limpio de sólo dígitos sin el signo +
        return $cleanPhone;
    }

    public function apiFind(\Illuminate\Http\Request $request)
    {
        $rawQuery = trim(urldecode($request->input('code', $request->input('query', ''))));
        if (!$rawQuery) {
            return response()->json(['error' => 'Código o URL no proporcionado.'], 400);
        }

        // Normalizar comillas y apóstrofes típicos de lectores de código de barras con teclado en español (REP'000001 -> REP-000001)
        $rawQuery = str_replace(["'", "´", "`"], '-', $rawQuery);

        $user = auth()->user();
        $empresaId = $user ? $user->empresa_id : null;

        // 1. Extraer ID directo de cualquier formato (ej: REP-000006, reparaciones/6, o 6)
        $extractedId = null;
        if (preg_match('/reparaciones\/(\d+)/i', $rawQuery, $matches)) {
            $extractedId = (int)$matches[1];
        } elseif (preg_match('/REP[-_\'´`]0*(\d+)/i', $rawQuery, $matches)) {
            $extractedId = (int)$matches[1];
        } elseif (is_numeric($rawQuery)) {
            $extractedId = (int)$rawQuery;
        } elseif (preg_match('/(\d+)/', $rawQuery, $matches)) {
            $extractedId = (int)$matches[1];
        }

        // 2. Consulta por código de reparación (numero_orden), IMEI o ID
        $queryBuilder = OrdenReparacion::with(['cliente', 'marca', 'modelo', 'tecnico', 'items.producto', 'items.servicio']);

        if ($empresaId) {
            $queryBuilder->where('empresa_id', $empresaId);
        }

        $reparacion = $queryBuilder->where(function ($q) use ($rawQuery, $extractedId) {
            $q->where('numero_orden', $rawQuery)
                ->orWhere('numero_orden', 'like', "%{$rawQuery}%")
                ->orWhere('imei_serie', 'like', "%{$rawQuery}%");
            if ($extractedId) {
                $q->orWhere('id', $extractedId);
            }
        })->first();

        // 3. Fallback directo por ID si existe $extractedId
        if (!$reparacion && $extractedId) {
            $qFallback = OrdenReparacion::with(['cliente', 'marca', 'modelo', 'tecnico', 'items.producto', 'items.servicio']);
            if ($empresaId) {
                $qFallback->where('empresa_id', $empresaId);
            }
            $reparacion = $qFallback->find($extractedId);
        }

        // 4. Fallback final: Buscar por los dígitos extraídos
        if (!$reparacion) {
            $cleanCode = preg_replace('/[^0-9]/', '', $rawQuery);
            if ($cleanCode) {
                $qClean = OrdenReparacion::with(['cliente', 'marca', 'modelo', 'tecnico', 'items.producto', 'items.servicio']);
                if ($empresaId) {
                    $qClean->where('empresa_id', $empresaId);
                }
                $reparacion = $qClean->where('id', (int)$cleanCode)
                    ->orWhere('numero_orden', 'like', "%{$cleanCode}%")
                    ->first();
            }
        }

        if (!$reparacion) {
            return response()->json(['error' => "No se encontró ninguna orden de reparación con el código '{$rawQuery}'."], 404);
        }

        return response()->json([
            'success' => true,
            'orden' => [
                'id' => $reparacion->id,
                'numero_orden' => $reparacion->numero_orden,
                'cliente_nombre' => $reparacion->cliente ? $reparacion->cliente->nombre : ($reparacion->cliente_nombre ?? 'Cliente General'),
                'cliente_telefono' => $reparacion->cliente ? $reparacion->cliente->telefono : ($reparacion->cliente_telefono ?? ''),
                'tipo_dispositivo' => $reparacion->tipo_dispositivo,
                'marca_nombre' => $reparacion->marca ? $reparacion->marca->nombre : ($reparacion->marca_nombre ?? 'Dispositivo'),
                'modelo_nombre' => $reparacion->modelo ? $reparacion->modelo->nombre_comercial : ($reparacion->modelo_nombre ?? ''),
                'color' => $reparacion->color,
                'imei_serie' => $reparacion->imei_serie,
                'descripcion_falla' => $reparacion->descripcion_falla,
                'observaciones_fisicas' => $reparacion->observaciones_fisicas,
                'estado_orden' => $reparacion->estado_orden,
                'costo_estimado' => (float)$reparacion->costo_estimado,
                'anticipo' => (float)$reparacion->anticipo,
                'saldo_restante' => (float)$reparacion->saldo_restante,
                'fecha_recepcion' => (string)$reparacion->fecha_recepcion,
                'fecha_estimada_entrega' => (string)$reparacion->fecha_estimada_entrega,
                'contrasena_patron' => $reparacion->contrasena_patron,
                'tecnico' => $reparacion->tecnico ? ['id' => $reparacion->tecnico->id, 'name' => $reparacion->tecnico->name] : null,
            ],
        ]);
    }
}
