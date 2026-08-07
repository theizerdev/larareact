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

        $isTecnicoOnly = $user && ($user->hasRole('Técnico') || $user->hasRole('tecnico') || $user->hasRole('Tecnico') || $user->hasRole('Técnico de Reparaciones'));
        $isAdmin = $user && ($user->hasRole('Administrador') || $user->hasRole('Super Administrador') || $user->hasRole('super-admin') || $user->hasRole('Admin'));

        $query = OrdenReparacion::with(['cliente', 'marca', 'modelo', 'tecnico'])
            ->where('empresa_id', $empresaId);

        // Si es exclusivamente rol Técnico (sin permisos de Administrador), mostrar ÚNICAMENTE sus órdenes asignadas
        if ($isTecnicoOnly && !$isAdmin) {
            $query->where('tecnico_id', $user->id);
        } elseif ($tecnicoId) {
            $query->where('tecnico_id', $tecnicoId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_orden', 'like', "%{$search}%")
                  ->orWhere('cliente_nombre', 'like', "%{$search}%")
                  ->orWhere('imei_serie', 'like', "%{$search}%")
                  ->orWhere('marca_nombre', 'like', "%{$search}%")
                  ->orWhere('modelo_nombre', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('estado_orden', $status);
        }

        $ordenes = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

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

        return Inertia::render('admin/Reparaciones/Index', [
            'ordenes' => $ordenes,
            'counts' => $counts,
            'tecnicos' => $tecnicos,
            'currencySymbol' => $this->getCurrencySymbol(),
            'filters' => $request->only(['search', 'status', 'tecnico_id']),
            'isTecnicoOnly' => $isTecnicoOnly && !$isAdmin,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $clientes = Cliente::where('empresa_id', $empresaId)->orderBy('nombre')->get(['id', 'nombre', 'telefono', 'email']);
        $marcas = Marca::with('modelos')->where('empresa_id', $empresaId)->orderBy('nombre')->get();
        $tecnicos = User::where('empresa_id', $empresaId)->get(['id', 'name']);
        $categorias = \App\Models\Categoria::withoutGlobalScope('multitenancy')->where('empresa_id', $empresaId)->where('estado', true)->orderBy('nombre')->get(['id', 'nombre']);
        $servicios = \App\Models\Servicio::withoutGlobalScope('multitenancy')->with(['categoria' => fn ($q) => $q->withoutGlobalScope('multitenancy')])->where('empresa_id', $empresaId)->where('estado', true)->orderBy('nombre')->get(['id', 'codigo', 'nombre', 'precio', 'categoria_id']);

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
            'nombre' => 'required|string|max:255',
            'codigo' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
        ]);

        $user = auth()->user();
        $servicio = \App\Models\Servicio::create(array_merge($validated, [
            'empresa_id' => $user->empresa_id,
            'sucursal_id' => $user->sucursal_id,
            'estado' => true,
        ]));

        $servicio->load('categoria:id,nombre');

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
            'descripcion_falla' => 'required|string',
            'observaciones_fisicas' => 'nullable|string',
            'tecnico_id' => 'nullable|exists:users,id',
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
            'costo_estimado' => $costoEstimado,
            'anticipo' => $anticipo,
            'saldo_restante' => $saldoRestante,
            'fecha_recepcion' => now(),
        ]);

        $orden = OrdenReparacion::create($ordenData);

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
                        OrdenReparacionFoto::create([
                            'orden_id' => $orden->id,
                            'angulo' => $angulo,
                            'url' => $url,
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

        return redirect()->route('admin.reparaciones.show', $orden->id)->with('notification', [
            'type' => 'success',
            'message' => "Orden de Reparación {$numeroOrden} creada exitosamente.",
        ]);
    }

    public function show($id)
    {
        $reparacion = OrdenReparacion::find($id);
        $relations = ['cliente', 'marca', 'modelo', 'tecnico', 'items.producto', 'items.servicio', 'historial.user', 'sale'];
        if (\Illuminate\Support\Facades\Schema::hasTable('orden_reparacion_fotos')) {
            $relations[] = 'fotos';
        }
        $reparacion->load($relations);

        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $productosRepuestos = Producto::where('empresa_id', $empresaId)
            ->where('tipo_producto', 'repuesto')
            ->with(['marca:id,nombre', 'modelo:id,nombre_comercial'])
            ->orderBy('nombre_variante')
            ->get(['id', 'sku', 'codigo_barras', 'nombre_variante', 'precio_venta', 'precio_compra', 'stock', 'marca_id', 'modelo_id', 'condicion', 'tipo_producto']);

        $tecnicos = User::where('empresa_id', $empresaId)->get(['id', 'name']);

        return Inertia::render('admin/Reparaciones/Show', [
            'orden' => $reparacion,
            'productosRepuestos' => $productosRepuestos,
            'tecnicos' => $tecnicos,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function updateEstado(Request $request, OrdenReparacion $reparacion)
    {
        // Auto-provisionar columnas en la base de datos si la migración no fue ejecutada manualmente
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
            'estado_orden' => 'required|in:recibido,en_diagnostico,presupuestado,en_reparacion,esperando_repuesto,reparado,entregado,cancelado',
            'comentario' => 'nullable|string',
            'tecnico_id' => 'nullable|exists:users,id',
            'observaciones_fisicas' => 'nullable|string',
            'contrasena_patron' => 'nullable|string',
            'inspeccion_json' => 'nullable',
            'post_servicio_json' => 'nullable',
        ]);

        $estadoAnterior = $reparacion->estado_orden;
        $nuevoEstado = $validated['estado_orden'];

        $updateData = ['estado_orden' => $nuevoEstado];
        if (isset($validated['tecnico_id'])) {
            $updateData['tecnico_id'] = $validated['tecnico_id'];
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

        $reparacion->update($updateData);

        OrdenReparacionHistorial::create([
            'orden_id' => $reparacion->id,
            'user_id' => auth()->id(),
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo' => $nuevoEstado,
            'comentario' => $validated['comentario'] ?? "Cambio de estado a " . ucfirst(str_replace('_', ' ', $nuevoEstado)),
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Proceso de preservicio e inspección iniciado correctamente.",
        ]);
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
        $validated = $request->validate([
            'costo_mano_obra' => 'required|numeric|min:0',
            'anticipo' => 'nullable|numeric|min:0',
        ]);

        $reparacion->costo_mano_obra = (float) $validated['costo_mano_obra'];
        if (isset($validated['anticipo'])) {
            $reparacion->anticipo = (float) $validated['anticipo'];
        }

        $this->recalcularTotales($reparacion);

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Costos actualizados correctamente.",
        ]);
    }

    private function recalcularTotales(OrdenReparacion $reparacion)
    {
        $costoRepuestos = (float) $reparacion->items()->sum('subtotal');
        $costoManoObra = (float) $reparacion->costo_mano_obra;
        $totalEstimado = $costoRepuestos + $costoManoObra;
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

        return Inertia::render('admin/Reparaciones/PostServicio', [
            'orden' => $reparacion,
            'currencySymbol' => $this->getCurrencySymbol(),
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

        return redirect()->route('admin.reparaciones.show', $reparacion->id)
            ->with('success', 'Proceso de Post-Atención y Control de Calidad guardado exitosamente.');
    }
}
