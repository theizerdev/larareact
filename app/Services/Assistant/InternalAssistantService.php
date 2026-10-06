<?php

namespace App\Services\Assistant;

use App\Models\Categoria;
use App\Models\Familia;
use App\Models\Marca;
use App\Models\Modelo;
use App\Models\OrdenReparacion;
use App\Models\OrdenReparacionHistorial;
use App\Models\Pais;
use App\Models\Producto;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class InternalAssistantService
{
    /**
     * Procesa una consulta de texto y retorna una respuesta estructurada.
     */
    public function process(User $user, string $query, ?array $context = null): array
    {
        $rawQuery = trim($query);
        if ($rawQuery === '') {
            return $this->buildHelpResponse("Por favor escribe una consulta o comando.");
        }

        $normalized = $this->normalizeText($rawQuery);
        $empresaId = $user->empresa_id ?: 1;
        $sucursalId = $user->sucursal_id ?: null;

        // 1. Saludos o Ayuda
        if ($this->isGreetingOrHelp($normalized)) {
            return $this->buildHelpResponse("¡Hola {$user->name}! Soy tu copiloto interno de FixSale. ¿En qué te ayudo hoy?");
        }

        // ==========================================
        // FASE 2: CATÁLOGO RÁPIDO (Marcas, Modelos, Categorías)
        // ==========================================

        // 2. Crear Marca (ej: "crear marca Xiaomi", "nueva marca Motorola")
        if (preg_match('/^(?:crear|nueva|agregar|anadir|registrar)\s+marca\s+(.+)$/i', $rawQuery, $m)) {
            return $this->handleCreateMarca($user, $empresaId, $sucursalId, trim($m[1]));
        }

        // 3. Crear Categoría (ej: "crear categoria Pantallas", "nueva categoria Baterías")
        if (preg_match('/^(?:crear|nueva|agregar|anadir|registrar)\s+categor(?:ia|ía)\s+(.+)$/i', $rawQuery, $m)) {
            return $this->handleCreateCategoria($user, $empresaId, $sucursalId, trim($m[1]));
        }

        // 4. Crear Modelo (ej: "crear modelo Redmi Note 13 para Xiaomi", "nuevo modelo iPhone 16")
        $createModelMatch = $this->parseCreateModel($rawQuery);
        if ($createModelMatch) {
            return $this->handleCreateModel(
                $user,
                $empresaId,
                $sucursalId,
                $createModelMatch['model_name'],
                $createModelMatch['brand_name'] ?? null
            );
        }

        // 5. Listar Marcas
        if (preg_match('/^(?:ver|listar|mostrar|cuales son las)\s+marcas$/i', $normalized)) {
            return $this->handleListMarcas($user, $empresaId);
        }

        // 6. Listar Categorías
        if (preg_match('/^(?:ver|listar|mostrar|cuales son las)\s+categor(?:ias|ías)$/i', $normalized)) {
            return $this->handleListCategorias($user, $empresaId);
        }

        // 7. Listar Modelos de una Marca (ej: "modelos de samsung", "ver modelos xiaomi")
        if (preg_match('/^(?:ver|listar|mostrar)?\s*modelos\s+(?:de|para|en)\s+(.+)$/i', $normalized, $m)) {
            return $this->handleListModelosForMarca($user, $empresaId, trim($m[1]));
        }

        // ==========================================
        // FASE 1: SERVICIO TÉCNICO, ÓRDENES Y STOCK
        // ==========================================

        // 8. Resumen del taller (Hoy / Activo)
        if ($this->isWorkshopSummary($normalized)) {
            return $this->handleWorkshopSummary($user, $empresaId, $sucursalId);
        }

        // 9. Alertas de Stock
        if ($this->isStockAlerts($normalized)) {
            return $this->handleStockAlerts($user, $empresaId, $sucursalId);
        }

        // 10. Cambiar estado de orden (ej: "estado 1 listo", "pasar 1 a reparado", "entregar 1")
        $statusMatch = $this->parseChangeStatus($normalized, $rawQuery);
        if ($statusMatch) {
            return $this->handleChangeStatus(
                $user,
                $empresaId,
                $statusMatch['order_number'],
                $statusMatch['new_status'],
                $statusMatch['notify_whatsapp']
            );
        }

        // 11. Enviar WhatsApp a cliente (ej: "whatsapp 1", "notificar 1", "avisar 1")
        $waMatch = $this->parseSendWhatsApp($normalized, $rawQuery);
        if ($waMatch) {
            return $this->handleSendWhatsApp($user, $empresaId, $waMatch['order_number']);
        }

        // 12. Consultar orden específica por número o código (ej: "#1", "orden 1", "1", "REP-000001", "ver orden 1")
        $orderNumber = $this->parseOrderNumber($normalized, $rawQuery);
        if ($orderNumber !== null) {
            return $this->handleFindOrder($user, $empresaId, $orderNumber);
        }

        // 13. Consultar Stock de un producto o repuesto (ej: "stock pantalla iphone", "precio bateria")
        $stockSearch = $this->parseStockSearch($normalized, $rawQuery);
        if ($stockSearch !== null) {
            return $this->handleStockSearch($user, $empresaId, $sucursalId, $stockSearch);
        }

        // 14. Búsqueda de cliente o dispositivo
        $clientSearch = $this->parseClientOrDeviceSearch($normalized, $rawQuery);
        if ($clientSearch !== null) {
            return $this->handleSearchRepairsByText($user, $empresaId, $clientSearch);
        }

        // 15. Fallback: búsqueda general de reparaciones o productos
        $fallbackOrders = $this->searchRepairsGeneral($empresaId, $rawQuery);
        if ($fallbackOrders->isNotEmpty()) {
            return $this->handleMultipleOrdersFound($fallbackOrders, $rawQuery);
        }

        return $this->buildFallbackResponse($rawQuery);
    }

    /**
     * Ejecuta una acción rápida invocada desde un botón del chat.
     */
    public function executeAction(User $user, string $action, array $params = []): array
    {
        $empresaId = $user->empresa_id ?: 1;
        $sucursalId = $user->sucursal_id ?: null;

        switch ($action) {
            // Fase 2: Acciones de Catálogo
            case 'create_marca':
                $nombre = $params['nombre'] ?? null;
                if (!$nombre) {
                    return ['type' => 'error', 'message' => 'El nombre de la marca es obligatorio.'];
                }
                return $this->handleCreateMarca($user, $empresaId, $sucursalId, $nombre);

            case 'create_categoria':
                $nombre = $params['nombre'] ?? null;
                if (!$nombre) {
                    return ['type' => 'error', 'message' => 'El nombre de la categoría es obligatorio.'];
                }
                return $this->handleCreateCategoria($user, $empresaId, $sucursalId, $nombre);

            case 'create_modelo':
                $nombre = $params['nombre'] ?? null;
                $marcaName = $params['marca'] ?? null;
                if (!$nombre) {
                    return ['type' => 'error', 'message' => 'El nombre del modelo es obligatorio.'];
                }
                return $this->handleCreateModel($user, $empresaId, $sucursalId, $nombre, $marcaName);

            case 'list_marcas':
                return $this->handleListMarcas($user, $empresaId);

            case 'list_categorias':
                return $this->handleListCategorias($user, $empresaId);

            // Fase 1: Acciones de Órdenes y Stock
            case 'send_whatsapp':
                $orderNumber = $params['order_number'] ?? null;
                if (!$orderNumber && !empty($params['orden_id'])) {
                    $orden = $this->findOrderModel($empresaId, (string)$params['orden_id']);
                    $orderNumber = $orden?->numero_orden;
                }
                if (!$orderNumber) {
                    return [
                        'type' => 'error',
                        'message' => 'No se especificó el número de orden para notificar.',
                    ];
                }
                return $this->handleSendWhatsApp($user, $empresaId, (string)$orderNumber);

            case 'update_status':
                $orderNumber = $params['order_number'] ?? null;
                $newStatus = $params['new_status'] ?? null;
                $notify = !empty($params['notify_whatsapp']);
                if (!$orderNumber || !$newStatus) {
                    return [
                        'type' => 'error',
                        'message' => 'Faltan parámetros para actualizar el estado.',
                    ];
                }
                return $this->handleChangeStatus($user, $empresaId, (string)$orderNumber, $newStatus, $notify);

            case 'get_order':
                $orderNumber = $params['order_number'] ?? null;
                if (!$orderNumber) {
                    return ['type' => 'error', 'message' => 'Número de orden requerido.'];
                }
                return $this->handleFindOrder($user, $empresaId, (string)$orderNumber);

            case 'get_summary':
                return $this->handleWorkshopSummary($user, $empresaId, $user->sucursal_id);

            case 'get_stock_alerts':
                return $this->handleStockAlerts($user, $empresaId, $user->sucursal_id);

            default:
                return [
                    'type' => 'error',
                    'message' => "Acción desconocida: {$action}",
                ];
        }
    }

    // ==========================================
    // FASE 2: MANEJADORES DE CATÁLOGO RÁPIDO
    // ==========================================

    protected function handleCreateMarca(User $user, int $empresaId, ?int $sucursalId, string $marcaName): array
    {
        $marcaName = trim($marcaName);
        if ($marcaName === '') {
            return ['type' => 'error', 'message' => 'Por favor indica un nombre de marca válido.'];
        }

        $existente = Marca::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('nombre', 'like', $marcaName)
            ->first();

        if ($existente) {
            return [
                'type' => 'info',
                'message' => "ℹ️ La marca **\"{$existente->nombre}\"** ya existe en tu catálogo.",
                'marca' => ['id' => $existente->id, 'nombre' => $existente->nombre],
                'quick_actions' => [
                    [
                        'label' => "📱 Crear Modelo para {$existente->nombre}",
                        'text' => "crear modelo [Nombre] para {$existente->nombre}",
                    ],
                    [
                        'label' => 'Ver en Catálogo ↗',
                        'url' => '/admin/marcas?search=' . urlencode($existente->nombre),
                        'type' => 'link',
                    ],
                ],
            ];
        }

        $marca = Marca::create([
            'empresa_id' => $empresaId,
            'sucursal_id' => $sucursalId,
            'nombre' => $marcaName,
            'slug' => Str::slug($marcaName) ?: 'marca-' . time(),
            'estado' => true,
        ]);

        return [
            'type' => 'catalog_created',
            'message' => "✅ **Marca creada exitosamente:**\n\n• **Nombre:** **{$marca->nombre}**\n• **Estado:** Activo",
            'marca' => [
                'id' => $marca->id,
                'nombre' => $marca->nombre,
            ],
            'quick_actions' => [
                [
                    'label' => "📱 Crear Modelo para {$marca->nombre}",
                    'text' => "crear modelo [Nombre] para {$marca->nombre}",
                ],
                [
                    'label' => 'Ver Marcas ↗',
                    'url' => '/admin/marcas?search=' . urlencode($marca->nombre),
                    'type' => 'link',
                ],
            ],
        ];
    }

    protected function handleCreateCategoria(User $user, int $empresaId, ?int $sucursalId, string $catName): array
    {
        $catName = trim($catName);
        if ($catName === '') {
            return ['type' => 'error', 'message' => 'Por favor indica un nombre de categoría válido.'];
        }

        $existente = Categoria::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('nombre', 'like', $catName)
            ->first();

        if ($existente) {
            return [
                'type' => 'info',
                'message' => "ℹ️ La categoría **\"{$existente->nombre}\"** ya existe en tu catálogo.",
                'quick_actions' => [
                    [
                        'label' => 'Ver en Catálogo ↗',
                        'url' => '/admin/categorias?search=' . urlencode($existente->nombre),
                        'type' => 'link',
                    ],
                ],
            ];
        }

        $categoria = Categoria::create([
            'empresa_id' => $empresaId,
            'sucursal_id' => $sucursalId,
            'nombre' => $catName,
            'slug' => Str::slug($catName) ?: 'categoria-' . time(),
            'estado' => true,
        ]);

        return [
            'type' => 'catalog_created',
            'message' => "✅ **Categoría creada exitosamente:**\n\n• **Nombre:** **{$categoria->nombre}**\n• **Estado:** Activo",
            'categoria' => [
                'id' => $categoria->id,
                'nombre' => $categoria->nombre,
            ],
            'quick_actions' => [
                [
                    'label' => 'Ver Categorías ↗',
                    'url' => '/admin/categorias?search=' . urlencode($categoria->nombre),
                    'type' => 'link',
                ],
            ],
        ];
    }

    protected function handleCreateModel(User $user, int $empresaId, ?int $sucursalId, string $modeloName, ?string $brandName = null): array
    {
        $modeloName = trim($modeloName);
        if ($modeloName === '') {
            return ['type' => 'error', 'message' => 'Por favor indica el nombre del modelo.'];
        }

        $marca = null;

        // Si se indicó la marca explícitamente (ej: "para Xiaomi")
        if ($brandName) {
            $brandName = trim($brandName);
            $marca = Marca::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('nombre', 'like', $brandName)
                ->first();

            // Si la marca no existe, crearla automáticamente al vuelo
            if (!$marca) {
                $marca = Marca::create([
                    'empresa_id' => $empresaId,
                    'sucursal_id' => $sucursalId,
                    'nombre' => $brandName,
                    'slug' => Str::slug($brandName) ?: 'marca-' . time(),
                    'estado' => true,
                ]);
            }
        } else {
            // Intentar detectar si el nombre del modelo contiene el prefijo de alguna marca existente
            $marcas = Marca::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('estado', true)
                ->get();

            foreach ($marcas as $m) {
                if (stripos($modeloName, $m->nombre) !== false) {
                    $marca = $m;
                    break;
                }
            }

            // Si sigue sin marca, solicitar al usuario que elija la marca
            if (!$marca) {
                $topMarcas = $marcas->take(5);
                $quickActions = [];
                foreach ($topMarcas as $tm) {
                    $quickActions[] = [
                        'label' => $tm->nombre,
                        'text' => "crear modelo {$modeloName} para {$tm->nombre}",
                    ];
                }

                return [
                    'type' => 'need_brand',
                    'message' => "📱 ¿A qué marca pertenece el modelo **\"{$modeloName}\"**?\n\nSelecciona una de las marcas sugeridas abajo o escribe: *\"crear modelo {$modeloName} para [Marca]\"*.",
                    'quick_actions' => $quickActions,
                ];
            }
        }

        // Verificar si el modelo ya existe para esta marca
        $existente = Modelo::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('marca_id', $marca->id)
            ->where('nombre_comercial', 'like', $modeloName)
            ->first();

        if ($existente) {
            return [
                'type' => 'info',
                'message' => "ℹ️ El modelo **\"{$existente->nombre_comercial}\"** de la marca **{$marca->nombre}** ya existe en tu catálogo.",
                'quick_actions' => [
                    [
                        'label' => 'Ver Modelos ↗',
                        'url' => '/admin/modelos?search=' . urlencode($existente->nombre_comercial),
                        'type' => 'link',
                    ],
                ],
            ];
        }

        // Auto-resolver familia por defecto para esta marca
        $familia = Familia::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('marca_id', $marca->id)
            ->first();

        if (!$familia) {
            $familia = Familia::create([
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId,
                'marca_id' => $marca->id,
                'nombre' => 'General',
                'estado' => true,
            ]);
        }

        // Auto-resolver categoria
        $categoria = Categoria::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->first();

        $modelo = Modelo::create([
            'empresa_id' => $empresaId,
            'sucursal_id' => $sucursalId,
            'marca_id' => $marca->id,
            'familia_id' => $familia->id,
            'categoria_id' => $categoria?->id,
            'nombre_comercial' => $modeloName,
            'estado' => true,
        ]);

        return [
            'type' => 'catalog_created',
            'message' => "✅ **Modelo creado exitosamente:**\n\n"
                . "• **Modelo:** **{$modelo->nombre_comercial}**\n"
                . "• **Marca:** **{$marca->nombre}**\n"
                . "• **Estado:** Activo",
            'modelo' => [
                'id' => $modelo->id,
                'nombre' => $modelo->nombre_comercial,
                'marca' => $marca->nombre,
            ],
            'quick_actions' => [
                [
                    'label' => 'Ver Modelos ↗',
                    'url' => '/admin/modelos?search=' . urlencode($modelo->nombre_comercial),
                    'type' => 'link',
                ],
                [
                    'label' => "➕ Otro modelo de {$marca->nombre}",
                    'text' => "crear modelo [Nombre] para {$marca->nombre}",
                ],
            ],
        ];
    }

    protected function handleListMarcas(User $user, int $empresaId): array
    {
        $marcas = Marca::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->withCount('modelos')
            ->orderBy('nombre')
            ->get();

        if ($marcas->isEmpty()) {
            return [
                'type' => 'not_found',
                'message' => "No tienes marcas registradas aún en tu empresa.\n\nPuedes crear una escribiendo: *\"crear marca Samsung\"*.",
                'quick_actions' => [
                    ['label' => '➕ Crear Marca', 'text' => 'crear marca '],
                ],
            ];
        }

        $message = "🏷️ **Marcas en tu catálogo (" . $marcas->count() . "):**\n\n";
        $quickActions = [];

        foreach ($marcas->take(8) as $m) {
            $message .= "• **{$m->nombre}** ({$m->modelos_count} modelos)\n";
            $quickActions[] = [
                'label' => "Modelos {$m->nombre}",
                'text' => "modelos de {$m->nombre}",
            ];
        }

        $quickActions[] = [
            'label' => 'Ver Todas en Panel ↗',
            'url' => '/admin/marcas',
            'type' => 'link',
        ];

        return [
            'type' => 'catalog_list',
            'message' => $message,
            'quick_actions' => $quickActions,
        ];
    }

    protected function handleListCategorias(User $user, int $empresaId): array
    {
        $categorias = Categoria::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->withCount('modelos')
            ->orderBy('nombre')
            ->get();

        if ($categorias->isEmpty()) {
            return [
                'type' => 'not_found',
                'message' => "No tienes categorías registradas aún.\n\nPuedes crear una escribiendo: *\"crear categoria Celulares\"*.",
            ];
        }

        $message = "📁 **Categorías en tu catálogo (" . $categorias->count() . "):**\n\n";
        foreach ($categorias->take(10) as $c) {
            $message .= "• **{$c->nombre}**\n";
        }

        return [
            'type' => 'catalog_list',
            'message' => $message,
            'quick_actions' => [
                [
                    'label' => 'Ver Categorías ↗',
                    'url' => '/admin/categorias',
                    'type' => 'link',
                ],
            ],
        ];
    }

    protected function handleListModelosForMarca(User $user, int $empresaId, string $marcaName): array
    {
        $marca = Marca::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('nombre', 'like', "%{$marcaName}%")
            ->first();

        if (!$marca) {
            return [
                'type' => 'not_found',
                'message' => "No encontré la marca **\"{$marcaName}\"** en tu catálogo.",
                'quick_actions' => [
                    ['label' => "➕ Crear Marca {$marcaName}", 'text' => "crear marca {$marcaName}"],
                    ['label' => '🏷️ Ver Todas las Marcas', 'text' => 'ver marcas'],
                ],
            ];
        }

        $modelos = Modelo::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('marca_id', $marca->id)
            ->orderBy('nombre_comercial')
            ->get();

        if ($modelos->isEmpty()) {
            return [
                'type' => 'info',
                'message' => "La marca **{$marca->nombre}** no tiene modelos asociados todavía.",
                'quick_actions' => [
                    [
                        'label' => "➕ Crear Modelo para {$marca->nombre}",
                        'text' => "crear modelo [Nombre] para {$marca->nombre}",
                    ],
                ],
            ];
        }

        $message = "📱 **Modelos de {$marca->nombre} (" . $modelos->count() . "):**\n\n";
        foreach ($modelos->take(10) as $mod) {
            $message .= "• **{$mod->nombre_comercial}**\n";
        }

        return [
            'type' => 'catalog_list',
            'message' => $message,
            'quick_actions' => [
                [
                    'label' => "➕ Nuevo Modelo de {$marca->nombre}",
                    'text' => "crear modelo [Nombre] para {$marca->nombre}",
                ],
                [
                    'label' => 'Ver en Panel ↗',
                    'url' => '/admin/modelos?marca_id=' . $marca->id,
                    'type' => 'link',
                ],
            ],
        ];
    }

    protected function parseCreateModel(string $raw): ?array
    {
        // Ej: "crear modelo Redmi Note 13 para Xiaomi", "nuevo modelo Galaxy A54 de Samsung"
        if (preg_match('/^(?:crear|nuevo|agregar|anadir|registrar)\s+modelo\s+(.+?)(?:\s+(?:de|para|en)\s+(?:la\s+marca\s+)?(.+))?$/i', trim($raw), $m)) {
            return [
                'model_name' => trim($m[1]),
                'brand_name' => !empty($m[2]) ? trim($m[2]) : null,
            ];
        }
        return null;
    }

    // ==========================================
    // FASE 1: BUSCADOR INTELIGENTE DE ORDEN
    // ==========================================

    public function findOrderModel(int $empresaId, string $orderIdentifier): ?OrdenReparacion
    {
        $term = trim($orderIdentifier);
        $term = ltrim($term, '#');

        $query = OrdenReparacion::withoutGlobalScope('multitenancy')
            ->with(['cliente', 'marca', 'modelo', 'tecnico', 'sucursal'])
            ->where('empresa_id', $empresaId);

        // 1. Coincidencia exacta con numero_orden
        $exact = (clone $query)->where('numero_orden', $term)->first();
        if ($exact) {
            return $exact;
        }

        // 2. Si es sólo un número o contiene prefijo REP-
        $cleanNum = preg_replace('/^rep[-_ ]*/i', '', $term);
        if (is_numeric($cleanNum)) {
            $num = (int)$cleanNum;
            $padded = 'REP-' . str_pad((string)$num, 6, '0', STR_PAD_LEFT);
            $foundPadded = (clone $query)->where('numero_orden', $padded)->first();
            if ($foundPadded) {
                return $foundPadded;
            }

            $byId = (clone $query)->where('id', $num)->first();
            if ($byId) {
                return $byId;
            }
        }

        // 3. Like en numero_orden
        $like = (clone $query)->where('numero_orden', 'like', "%{$term}%")->first();
        if ($like) {
            return $like;
        }

        return null;
    }

    // ==========================================
    // FASE 1: HANDLERS DE SERVICIO TÉCNICO Y STOCK
    // ==========================================

    protected function handleFindOrder(User $user, int $empresaId, string $orderNumber): array
    {
        $orden = $this->findOrderModel($empresaId, $orderNumber);

        if (!$orden) {
            return [
                'type' => 'not_found',
                'message' => "No encontré ninguna orden con el número o código **#{$orderNumber}** en tu empresa.",
                'quick_actions' => [
                    ['label' => '📊 Resumen del Taller', 'action' => 'get_summary'],
                    ['label' => '⚠️ Ver Stock Bajo', 'action' => 'get_stock_alerts'],
                ],
            ];
        }

        $currency = $this->getCurrencySymbol($empresaId);
        $estados = OrdenReparacion::getEstados();
        $estadoInfo = $estados[$orden->estado_orden] ?? ['title' => ucfirst($orden->estado_orden)];

        $clienteNombre = $orden->cliente?->nombre ?: ($orden->cliente_nombre ?: 'Sin registrar');
        $clienteTelefono = $orden->cliente?->telefono ?: ($orden->cliente_telefono ?: 'Sin teléfono');
        $marcaNombre = $orden->marca?->nombre ?: ($orden->marca_nombre ?: 'Desconocida');
        $modeloNombre = $orden->modelo?->nombre_comercial ?: ($orden->modelo_nombre ?: '');
        $equipo = trim("{$marcaNombre} {$modeloNombre}");
        if ($orden->tipo_dispositivo) {
            $equipo .= " ({$orden->tipo_dispositivo})";
        }

        $trackingUrl = url("/reparacion/{$empresaId}/consultar?orden={$orden->numero_orden}");

        $saldo = (float) $orden->saldo_restante;
        $anticipo = (float) $orden->anticipo;
        $costoEstimado = (float) $orden->costo_estimado;

        $quickActions = [
            [
                'label' => 'Ver en Panel ↗',
                'url' => "/admin/reparaciones?search={$orden->numero_orden}",
                'type' => 'link',
            ],
        ];

        if ($clienteTelefono && $clienteTelefono !== 'Sin teléfono') {
            $quickActions[] = [
                'label' => '📱 Enviar WhatsApp',
                'action' => 'send_whatsapp',
                'params' => ['order_number' => $orden->numero_orden],
                'variant' => 'success',
            ];
        }

        if ($orden->estado_orden !== OrdenReparacion::ESTADO_LISTO_REPARADO && $orden->estado_orden !== OrdenReparacion::ESTADO_ENTREGADO_FINALIZADO) {
            $quickActions[] = [
                'label' => '✅ Marcar Reparado',
                'action' => 'update_status',
                'params' => [
                    'order_number' => $orden->numero_orden,
                    'new_status' => OrdenReparacion::ESTADO_LISTO_REPARADO,
                    'notify_whatsapp' => true,
                ],
                'variant' => 'primary',
            ];
        }

        if ($orden->estado_orden === OrdenReparacion::ESTADO_LISTO_REPARADO) {
            $quickActions[] = [
                'label' => '📦 Marcar Entregado',
                'action' => 'update_status',
                'params' => [
                    'order_number' => $orden->numero_orden,
                    'new_status' => OrdenReparacion::ESTADO_ENTREGADO_FINALIZADO,
                ],
                'variant' => 'primary',
            ];
        }

        return [
            'type' => 'order_detail',
            'message' => "Detalle de la orden **#{$orden->numero_orden}**",
            'order' => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'cliente_nombre' => $clienteNombre,
                'cliente_telefono' => $clienteTelefono,
                'equipo' => $equipo,
                'color' => $orden->color,
                'imei' => $orden->imei_serie,
                'falla' => $orden->descripcion_falla ?: 'No especificada',
                'estado_clave' => $orden->estado_orden,
                'estado_label' => $estadoInfo['title'],
                'tecnico' => $orden->tecnico?->name ?: 'Sin asignar',
                'costo_estimado' => "{$currency} " . number_format($costoEstimado, 2),
                'anticipo' => "{$currency} " . number_format($anticipo, 2),
                'saldo_restante' => "{$currency} " . number_format($saldo, 2),
                'sucursal' => $orden->sucursal?->nombre ?: 'Principal',
                'fecha_recepcion' => $orden->fecha_recepcion ? Carbon::parse($orden->fecha_recepcion)->format('d/m/Y H:i') : null,
                'tracking_url' => $trackingUrl,
            ],
            'quick_actions' => $quickActions,
        ];
    }

    protected function handleChangeStatus(User $user, int $empresaId, string $orderNumber, string $newStatus, bool $notifyWhatsApp = false): array
    {
        $orden = $this->findOrderModel($empresaId, $orderNumber);

        if (!$orden) {
            return [
                'type' => 'not_found',
                'message' => "No encontré la orden **#{$orderNumber}** para cambiarle el estado.",
            ];
        }

        $estados = OrdenReparacion::getEstados();
        if (!isset($estados[$newStatus])) {
            return [
                'type' => 'error',
                'message' => "El estado solicitado no es válido.",
            ];
        }

        $prevStatus = $orden->estado_orden;
        $prevTitle = $estados[$prevStatus]['title'] ?? $prevStatus;
        $newTitle = $estados[$newStatus]['title'] ?? $newStatus;

        if ($prevStatus === $newStatus) {
            return [
                'type' => 'info',
                'message' => "La orden **#{$orden->numero_orden}** ya se encuentra en estado **{$newTitle}**.",
                'quick_actions' => [
                    [
                        'label' => '📱 Enviar WhatsApp',
                        'action' => 'send_whatsapp',
                        'params' => ['order_number' => $orden->numero_orden],
                    ],
                    [
                        'label' => 'Ver Orden ↗',
                        'url' => "/admin/reparaciones?search={$orden->numero_orden}",
                        'type' => 'link',
                    ],
                ],
            ];
        }

        DB::beginTransaction();
        try {
            $orden->estado_orden = $newStatus;
            if ($newStatus === OrdenReparacion::ESTADO_ENTREGADO_FINALIZADO) {
                $orden->fecha_entrega = now();
            }
            $orden->save();

            OrdenReparacionHistorial::create([
                'orden_id' => $orden->id,
                'user_id' => $user->id,
                'estado_anterior' => $prevStatus,
                'estado_nuevo' => $newStatus,
                'comentario' => 'Actualizado por Asistente Virtual (Comando rápido)',
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error actualizando estado desde Asistente: ' . $e->getMessage());
            return [
                'type' => 'error',
                'message' => "Error al actualizar la orden: " . $e->getMessage(),
            ];
        }

        $responseMessage = "✅ Orden **#{$orden->numero_orden}** actualizada con éxito:\n\n"
            . "• **Estado anterior:** {$prevTitle}\n"
            . "• **Nuevo estado:** **{$newTitle}**\n";

        $waResult = null;
        if ($notifyWhatsApp) {
            $waResponse = $this->handleSendWhatsApp($user, $empresaId, $orden->numero_orden);
            if ($waResponse['type'] === 'whatsapp_sent') {
                $responseMessage .= "\n📲 *Se envió la notificación por WhatsApp al cliente.*";
                $waResult = $waResponse;
            } else {
                $responseMessage .= "\n⚠️ " . ($waResponse['message'] ?? 'No se pudo enviar el WhatsApp automático.');
            }
        }

        $quickActions = [
            [
                'label' => 'Ver en Panel ↗',
                'url' => "/admin/reparaciones?search={$orden->numero_orden}",
                'type' => 'link',
            ],
        ];

        if (!$notifyWhatsApp) {
            $quickActions[] = [
                'label' => '📱 Enviar WhatsApp ahora',
                'action' => 'send_whatsapp',
                'params' => ['order_number' => $orden->numero_orden],
                'variant' => 'success',
            ];
        }

        return [
            'type' => 'order_status_updated',
            'message' => $responseMessage,
            'order' => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'estado_clave' => $newStatus,
                'estado_label' => $newTitle,
                'cliente_nombre' => $orden->cliente_nombre,
            ],
            'whatsapp_result' => $waResult,
            'quick_actions' => $quickActions,
        ];
    }

    protected function handleSendWhatsApp(User $user, int $empresaId, string $orderNumber): array
    {
        $orden = $this->findOrderModel($empresaId, $orderNumber);

        if (!$orden) {
            return [
                'type' => 'not_found',
                'message' => "No encontré la orden **#{$orderNumber}** para enviar la notificación.",
            ];
        }

        $telefono = $orden->cliente?->telefono ?: $orden->cliente_telefono;
        if (empty($telefono)) {
            return [
                'type' => 'error',
                'message' => "La orden **#{$orden->numero_orden}** no tiene un teléfono de cliente registrado.",
            ];
        }

        $currency = $this->getCurrencySymbol($empresaId);
        $clienteNombre = $orden->cliente?->nombre ?: ($orden->cliente_nombre ?: 'Estimado(a) Cliente');
        $marcaNombre = $orden->marca?->nombre ?: ($orden->marca_nombre ?: 'Equipo');
        $modeloNombre = $orden->modelo?->nombre_comercial ?: ($orden->modelo_nombre ?: '');
        $saldoFmt = number_format((float)$orden->saldo_restante, 2);
        $trackingUrl = url("/reparacion/{$empresaId}/consultar?orden={$orden->numero_orden}");

        $estados = OrdenReparacion::getEstados();
        $estadoLabel = $estados[$orden->estado_orden]['title'] ?? ucfirst($orden->estado_orden);

        if ($orden->estado_orden === OrdenReparacion::ESTADO_LISTO_REPARADO) {
            $mensaje = "*¡SU EQUIPO YA ESTA LISTO PARA RETIRAR!*\n\n"
                . "Estimado(a) *{$clienteNombre}*,\n"
                . "Le informamos que la reparación de su equipo ha finalizado con éxito y ya se encuentra *DISPONIBLE PARA RETIRO*.\n\n"
                . "📋 *Orden:* #{$orden->numero_orden}\n"
                . "📱 *Equipo:* {$marcaNombre} {$modeloNombre}\n"
                . "💰 *Saldo Pendiente:* {$currency} {$saldoFmt}\n\n"
                . "🔍 *Ver detalle de su orden:*\n{$trackingUrl}\n\n"
                . "Puede pasar por nuestra sucursal. ¡Gracias por su preferencia!";
        } else {
            $mensaje = "*ACTUALIZACION DE SERVICIO TECNICO*\n\n"
                . "Estimado(a) *{$clienteNombre}*,\n"
                . "Le notificamos que el estatus de su equipo ha cambiado:\n\n"
                . "📋 *Orden:* #{$orden->numero_orden}\n"
                . "📱 *Equipo:* {$marcaNombre} {$modeloNombre}\n"
                . "🔄 *Estado actual:* *{$estadoLabel}*\n"
                . "💰 *Saldo:* {$currency} {$saldoFmt}\n\n"
                . "🔍 *Consulte el avance en vivo aquí:*\n{$trackingUrl}\n\n"
                . "Quedamos atentos ante cualquier duda.";
        }

        $phoneFormatted = preg_replace('/\D+/', '', $telefono);
        $waDirectUrl = "https://wa.me/{$phoneFormatted}?text=" . urlencode($mensaje);

        $sentViaApi = false;
        try {
            $whatsappService = (WhatsAppService::forSucursal($orden->sucursal_id ?? $user->sucursal_id ?? $empresaId))->setTimeout(5);
            $resp = $whatsappService->sendMessage($telefono, $mensaje);
            $sentViaApi = is_array($resp) || !empty($resp);
        } catch (\Throwable $e) {
            Log::warning("WhatsAppService fallo desde Asistente (fallback wa.me disponible): " . $e->getMessage());
        }

        $textResponse = "📲 **Notificación de WhatsApp preparada para la Orden #{$orden->numero_orden}**\n\n"
            . "• **Cliente:** {$clienteNombre} ({$telefono})\n"
            . "• **Estado:** {$estadoLabel}\n\n"
            . ($sentViaApi
                ? "✅ **Enviado exitosamente a través de la integración de WhatsApp.**"
                : "ℹ️ Puedes enviarlo directamente haciendo clic en el botón de WhatsApp Web abajo:");

        return [
            'type' => 'whatsapp_sent',
            'message' => $textResponse,
            'whatsapp' => [
                'telefono' => $telefono,
                'cliente' => $clienteNombre,
                'mensaje' => $mensaje,
                'wa_url' => $waDirectUrl,
                'enviado_api' => $sentViaApi,
            ],
            'quick_actions' => [
                [
                    'label' => 'Abrir WhatsApp Web ↗',
                    'url' => $waDirectUrl,
                    'type' => 'link',
                    'variant' => 'success',
                ],
                [
                    'label' => 'Ver Orden ↗',
                    'url' => "/admin/reparaciones?search={$orden->numero_orden}",
                    'type' => 'link',
                ],
            ],
        ];
    }

    protected function handleWorkshopSummary(User $user, int $empresaId, ?int $sucursalId): array
    {
        $today = Carbon::today();

        $query = OrdenReparacion::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId);

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        $recibidasHoy = (clone $query)
            ->where(function ($q) use ($today) {
                $q->whereDate('fecha_recepcion', $today)
                    ->orWhereDate('created_at', $today);
            })->count();

        $entregadasHoy = (clone $query)
            ->where('estado_orden', OrdenReparacion::ESTADO_ENTREGADO_FINALIZADO)
            ->whereDate('updated_at', $today)
            ->count();

        $enDiagnostico = (clone $query)->where('estado_orden', OrdenReparacion::ESTADO_EN_DIAGNOSTICO_PRESUPUESTO)->count();
        $esperaRepuesto = (clone $query)->where('estado_orden', OrdenReparacion::ESTADO_ESPERA_REFACCION)->count();
        $enReparacion = (clone $query)->where('estado_orden', OrdenReparacion::ESTADO_EN_REPARACION)->count();
        $listoParaRetiro = (clone $query)->where('estado_orden', OrdenReparacion::ESTADO_LISTO_REPARADO)->count();
        $totalActivas = (clone $query)->whereNotIn('estado_orden', [
            OrdenReparacion::ESTADO_ENTREGADO_FINALIZADO,
            OrdenReparacion::ESTADO_LISTO_SIN_SOLUCION,
        ])->count();

        $message = "📊 **Resumen del Taller" . ($sucursalId ? " (Tu Sucursal)" : "") . "**\n\n"
            . "• **Nuevos ingresos hoy:** {$recibidasHoy}\n"
            . "• **Entregados hoy:** {$entregadasHoy}\n"
            . "• **En reparación activa:** {$enReparacion}\n"
            . "• **En diagnóstico:** {$enDiagnostico}\n"
            . "• **En espera de repuesto:** {$esperaRepuesto}\n"
            . "• **Listos para retiro:** **{$listoParaRetiro}** 🎯\n\n"
            . "Total de órdenes en curso: **{$totalActivas}**";

        $quickActions = [
            [
                'label' => 'Ver Listos para Retiro',
                'url' => '/admin/reparaciones?status=' . OrdenReparacion::ESTADO_LISTO_REPARADO,
                'type' => 'link',
            ],
            [
                'label' => 'Ver En Reparación',
                'url' => '/admin/reparaciones?status=' . OrdenReparacion::ESTADO_EN_REPARACION,
                'type' => 'link',
            ],
            [
                'label' => 'Ir a Servicio Técnico ↗',
                'url' => '/admin/reparaciones',
                'type' => 'link',
            ],
        ];

        return [
            'type' => 'workshop_summary',
            'message' => $message,
            'summary' => [
                'recibidas_hoy' => $recibidasHoy,
                'entregadas_hoy' => $entregadasHoy,
                'en_reparacion' => $enReparacion,
                'en_diagnostico' => $enDiagnostico,
                'espera_repuesto' => $esperaRepuesto,
                'listo_para_retiro' => $listoParaRetiro,
                'total_activas' => $totalActivas,
            ],
            'quick_actions' => $quickActions,
        ];
    }

    protected function handleStockAlerts(User $user, int $empresaId, ?int $sucursalId): array
    {
        $query = Producto::withoutGlobalScope('multitenancy')
            ->with(['marca', 'categoria'])
            ->where('empresa_id', $empresaId)
            ->where('usa_inventario', true)
            ->where('estado', true)
            ->where('stock_minimo', '>', 0)
            ->whereColumn('stock', '<=', 'stock_minimo');

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        $items = $query->orderBy('stock', 'asc')->limit(8)->get();

        if ($items->isEmpty()) {
            return [
                'type' => 'stock_alerts',
                'message' => "🎉 ¡Excelente! No tienes productos con stock por debajo del mínimo.",
                'items' => [],
                'quick_actions' => [
                    ['label' => '📊 Resumen del Taller', 'action' => 'get_summary'],
                ],
            ];
        }

        $currency = $this->getCurrencySymbol($empresaId);
        $message = "⚠️ **Alertas de Stock Bajo (" . $items->count() . " más críticos):**\n\n";

        $productsData = [];
        foreach ($items as $p) {
            $nombre = $p->nombre_variante ?: ($p->marca?->nombre . ' ' . $p->sku);
            $estadoStock = $p->stock <= 0 ? '❌ Agotado' : "⚠️ {$p->stock} disp. (Mín: {$p->stock_minimo})";
            $message .= "• **{$nombre}**: {$estadoStock} — {$currency} " . number_format($p->precio_venta, 2) . "\n";

            $productsData[] = [
                'id' => $p->id,
                'nombre' => $nombre,
                'sku' => $p->sku,
                'stock' => $p->stock,
                'stock_minimo' => $p->stock_minimo,
                'precio' => "{$currency} " . number_format($p->precio_venta, 2),
                'es_agotado' => $p->stock <= 0,
            ];
        }

        return [
            'type' => 'stock_alerts',
            'message' => $message,
            'items' => $productsData,
            'quick_actions' => [
                [
                    'label' => 'Ver Todas las Alertas ↗',
                    'url' => '/admin/stock-alerts',
                    'type' => 'link',
                ],
                [
                    'label' => 'Ir a Inventario ↗',
                    'url' => '/admin/productos',
                    'type' => 'link',
                ],
            ],
        ];
    }

    protected function handleStockSearch(User $user, int $empresaId, ?int $sucursalId, string $term): array
    {
        $term = trim($term);
        $query = Producto::withoutGlobalScope('multitenancy')
            ->with(['marca', 'modelo', 'categoria'])
            ->where('empresa_id', $empresaId)
            ->where('estado', true)
            ->where(function ($q) use ($term) {
                $q->where('nombre_variante', 'like', "%{$term}%")
                    ->orWhere('sku', 'like', "%{$term}%")
                    ->orWhere('codigo_barras', 'like', "%{$term}%")
                    ->orWhereHas('marca', fn($sub) => $sub->where('nombre', 'like', "%{$term}%"))
                    ->orWhereHas('modelo', fn($sub) => $sub->where('nombre_comercial', 'like', "%{$term}%"));
            });

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        $items = $query->limit(6)->get();

        if ($items->isEmpty()) {
            return [
                'type' => 'not_found',
                'message' => "No encontré productos o repuestos que coincidan con **\"{$term}\"**.",
                'quick_actions' => [
                    ['label' => '⚠️ Ver Stock Bajo', 'action' => 'get_stock_alerts'],
                    ['label' => 'Ir a Inventario ↗', 'url' => '/admin/productos', 'type' => 'link'],
                ],
            ];
        }

        $currency = $this->getCurrencySymbol($empresaId);
        $message = "📦 **Resultados para \"{$term}\":**\n\n";

        $productsData = [];
        foreach ($items as $p) {
            $nombre = $p->nombre_variante ?: trim(($p->marca?->nombre ?? '') . ' ' . ($p->modelo?->nombre_comercial ?? '') . ' ' . $p->sku);
            $stockText = $p->usa_inventario ? "Stock: **{$p->stock}**" : "Servicio/Sin stock";
            $message .= "• **{$nombre}**: {$stockText} | {$currency} " . number_format($p->precio_venta, 2) . "\n";

            $productsData[] = [
                'id' => $p->id,
                'nombre' => $nombre,
                'sku' => $p->sku,
                'stock' => $p->stock,
                'precio' => "{$currency} " . number_format($p->precio_venta, 2),
                'usa_inventario' => $p->usa_inventario,
            ];
        }

        return [
            'type' => 'stock_search',
            'message' => $message,
            'items' => $productsData,
            'quick_actions' => [
                [
                    'label' => 'Ver en Inventario ↗',
                    'url' => "/admin/productos?search=" . urlencode($term),
                    'type' => 'link',
                ],
            ],
        ];
    }

    protected function handleSearchRepairsByText(User $user, int $empresaId, string $term): array
    {
        $orders = OrdenReparacion::withoutGlobalScope('multitenancy')
            ->with(['cliente', 'marca', 'modelo'])
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($term) {
                $q->where('cliente_nombre', 'like', "%{$term}%")
                    ->orWhere('cliente_telefono', 'like', "%{$term}%")
                    ->orWhere('imei_serie', 'like', "%{$term}%")
                    ->orWhere('marca_nombre', 'like', "%{$term}%")
                    ->orWhere('modelo_nombre', 'like', "%{$term}%")
                    ->orWhereHas('cliente', fn($sub) => $sub->where('nombre', 'like', "%{$term}%")->orWhere('telefono', 'like', "%{$term}%"));
            })
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        if ($orders->isEmpty()) {
            return [
                'type' => 'not_found',
                'message' => "No encontré órdenes relacionadas con **\"{$term}\"**.",
                'quick_actions' => [
                    ['label' => '📊 Resumen del Taller', 'action' => 'get_summary'],
                ],
            ];
        }

        if ($orders->count() === 1) {
            return $this->handleFindOrder($user, $empresaId, (string)$orders->first()->numero_orden);
        }

        return $this->handleMultipleOrdersFound($orders, $term);
    }

    protected function handleMultipleOrdersFound($orders, string $term): array
    {
        $estados = OrdenReparacion::getEstados();
        $message = "🔍 Encontré **{$orders->count()} órdenes** para **\"{$term}\"**:\n\n";

        $quickActions = [];
        foreach ($orders as $o) {
            $cliente = $o->cliente?->nombre ?: ($o->cliente_nombre ?: 'Sin nombre');
            $equipo = trim(($o->marca?->nombre ?: $o->marca_nombre) . ' ' . ($o->modelo?->nombre_comercial ?: $o->modelo_nombre));
            $estadoTitle = $estados[$o->estado_orden]['title'] ?? $o->estado_orden;
            $message .= "• **#{$o->numero_orden}**: {$cliente} — {$equipo} (*{$estadoTitle}*)\n";

            $quickActions[] = [
                'label' => "Ver #{$o->numero_orden}",
                'action' => 'get_order',
                'params' => ['order_number' => $o->numero_orden],
            ];
        }

        return [
            'type' => 'multiple_orders',
            'message' => $message,
            'quick_actions' => $quickActions,
        ];
    }

    protected function searchRepairsGeneral(int $empresaId, string $rawQuery)
    {
        return OrdenReparacion::withoutGlobalScope('multitenancy')
            ->with(['cliente', 'marca', 'modelo'])
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($rawQuery) {
                $q->where('numero_orden', 'like', "%{$rawQuery}%")
                    ->orWhere('cliente_nombre', 'like', "%{$rawQuery}%")
                    ->orWhere('imei_serie', 'like', "%{$rawQuery}%");
            })
            ->orderBy('id', 'desc')
            ->limit(3)
            ->get();
    }

    // ==========================================
    // PARSERS Y EXPRESIONES REGULARES
    // ==========================================

    protected function isGreetingOrHelp(string $text): bool
    {
        return (bool) preg_match('/^(hola|buenos dias|buenas tardes|buenas|menu|ayuda|help|comandos|que puedes hacer|que haces)\b/i', $text);
    }

    protected function isWorkshopSummary(string $text): bool
    {
        return (bool) preg_match('/\b(resumen|taller hoy|ordenes hoy|metricas|estadisticas hoy|equipos listos|pendientes hoy)\b/i', $text);
    }

    protected function isStockAlerts(string $text): bool
    {
        return (bool) preg_match('/\b(alertas stock|stock bajo|bajo stock|sin stock|agotados|quedan pocos)\b/i', $text);
    }

    protected function parseChangeStatus(string $normalized, string $raw): ?array
    {
        $notify = (bool) preg_match('/\b(notificar|notifica|whatsapp|avisar|avisa)\b/i', $normalized);

        $orderNumber = null;
        if (preg_match('/(?:orden|reparacion)?\s*#?((?:rep[-_ ]*)?\d+|rep[-_]\w+)/i', $raw, $m)) {
            $orderNumber = $m[1];
        }

        if (!$orderNumber) {
            return null;
        }

        $targetStatus = null;
        if (preg_match('/\b(listo|reparado|reparada|terminado|terminada|finalizado para retiro)\b/i', $normalized)) {
            $targetStatus = OrdenReparacion::ESTADO_LISTO_REPARADO;
        } elseif (preg_match('/\b(entregado|entregada|entregar|finalizado|cerrada)\b/i', $normalized)) {
            $targetStatus = OrdenReparacion::ESTADO_ENTREGADO_FINALIZADO;
        } elseif (preg_match('/\b(en reparacion|reparando|taller)\b/i', $normalized)) {
            $targetStatus = OrdenReparacion::ESTADO_EN_REPARACION;
        } elseif (preg_match('/\b(diagnostico|presupuesto|revisando|revision)\b/i', $normalized)) {
            $targetStatus = OrdenReparacion::ESTADO_EN_DIAGNOSTICO_PRESUPUESTO;
        } elseif (preg_match('/\b(espera refaccion|espera repuesto|repuesto|refaccion|pieza)\b/i', $normalized)) {
            $targetStatus = OrdenReparacion::ESTADO_ESPERA_REFACCION;
        } elseif (preg_match('/\b(sin solucion|irreparable|no reparable)\b/i', $normalized)) {
            $targetStatus = OrdenReparacion::ESTADO_LISTO_SIN_SOLUCION;
        } elseif (preg_match('/\b(garantia|reincidencia)\b/i', $normalized)) {
            $targetStatus = OrdenReparacion::ESTADO_REINCIDENCIA_GARANTIA;
        } elseif (preg_match('/\b(recibido|ingreso)\b/i', $normalized)) {
            $targetStatus = OrdenReparacion::ESTADO_RECIBIDO;
        }

        if (!$targetStatus) {
            return null;
        }

        return [
            'order_number' => $orderNumber,
            'new_status' => $targetStatus,
            'notify_whatsapp' => $notify,
        ];
    }

    protected function parseSendWhatsApp(string $normalized, string $raw): ?array
    {
        if (preg_match('/^(?:enviar\s*)?(?:whatsapp|notificar|notifica|avisar|avisa|ws)\s*(?:al\s*cliente\s*)?(?:de\s*la\s*)?(?:orden|reparacion)?\s*#?((?:rep[-_ ]*)?\d+|rep[-_]\w+)/i', $raw, $m)) {
            return ['order_number' => $m[1]];
        }
        return null;
    }

    protected function parseOrderNumber(string $normalized, string $raw): ?string
    {
        if (preg_match('/^#?((?:rep[-_ ]*)?\d+|rep[-_]\w+)$/i', trim($raw), $m)) {
            return $m[1];
        }

        if (preg_match('/^(?:ver|consultar|buscar|revisar)?\s*(?:la\s*)?(?:orden|reparacion|ticket|folio)\s*#?((?:rep[-_ ]*)?\d+|rep[-_]\w+)$/i', trim($raw), $m)) {
            return $m[1];
        }

        return null;
    }

    protected function parseStockSearch(string $normalized, string $raw): ?string
    {
        if (preg_match('/^(?:stock|cuanto stock|precio|buscar repuesto|buscar producto|repuesto|hay)\s+(?:de\s+)?(.+)$/i', $raw, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    protected function parseClientOrDeviceSearch(string $normalized, string $raw): ?string
    {
        if (preg_match('/^(?:buscar\s*(?:cliente|equipo|imei)|cliente|imei)\s+(.+)$/i', $raw, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    protected function normalizeText(string $text): string
    {
        $text = mb_strtolower($text, 'UTF-8');
        $accents = ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n'];
        $text = strtr($text, $accents);
        $text = preg_replace('/[¿?¡!]/u', '', $text);
        return trim($text);
    }

    protected function getCurrencySymbol(int $empresaId): string
    {
        $empresa = \App\Models\Empresa::find($empresaId);
        if ($empresa && $empresa->pais_id) {
            $pais = Pais::find($empresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }
        return '$';
    }

    protected function buildHelpResponse(string $intro): array
    {
        $message = "{$intro}\n\n"
            . "🎯 **Comandos de Servicio Técnico (Fase 1):**\n"
            . "• **#1** o **orden 1** ➔ Consulta los datos y estado de la orden.\n"
            . "• **estado 1 listo** ➔ Cambia a 'Listo para entregar'.\n"
            . "• **estado 1 listo y notificar** ➔ Actualiza y envía WhatsApp al cliente.\n"
            . "• **whatsapp 1** ➔ Envía la plantilla de WhatsApp al cliente.\n"
            . "• **resumen hoy** ➔ Muestra las órdenes del taller para hoy.\n"
            . "• **alertas stock** ➔ Muestra repuestos con existencias bajas.\n\n"
            . "🏷️ **Comandos de Catálogo Rápido (Fase 2):**\n"
            . "• **crear marca Xiaomi** ➔ Registra una nueva marca.\n"
            . "• **crear modelo Redmi Note 13 para Xiaomi** ➔ Registra un modelo.\n"
            . "• **crear categoria Baterias** ➔ Registra una nueva categoría.\n"
            . "• **ver marcas** ➔ Lista las marcas registradas.\n"
            . "• **modelos de Xiaomi** ➔ Lista los modelos de esa marca.";

        return [
            'type' => 'help',
            'message' => $message,
            'quick_actions' => [
                ['label' => '📊 Resumen del Taller', 'action' => 'get_summary'],
                ['label' => '🏷️ Ver Marcas', 'text' => 'ver marcas'],
                ['label' => '⚠️ Ver Stock Bajo', 'action' => 'get_stock_alerts'],
                ['label' => '🔧 Ver Reparaciones', 'url' => '/admin/reparaciones', 'type' => 'link'],
            ],
        ];
    }

    protected function buildFallbackResponse(string $rawQuery): array
    {
        return [
            'type' => 'unknown',
            'message' => "No comprendí exactamente la instrucción: **\"{$rawQuery}\"**.\n\n"
                . "Prueba escribiendo el **número de orden** (ej. `1`), **\"crear marca Xiaomi\"**, **\"resumen\"**, o escribe **\"ayuda\"** para ver la lista de comandos disponibles.",
            'quick_actions' => [
                ['label' => '📊 Resumen de Hoy', 'action' => 'get_summary'],
                ['label' => '🏷️ Ver Marcas', 'text' => 'ver marcas'],
                ['label' => '❓ Ver Ayuda', 'action' => 'help', 'text' => 'ayuda'],
            ],
        ];
    }
}
