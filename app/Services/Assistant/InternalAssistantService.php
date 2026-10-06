<?php

namespace App\Services\Assistant;

use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\Categoria;
use App\Models\Cliente;
use App\Models\Compra;
use App\Models\CreditPayment;
use App\Models\Empresa;
use App\Models\Familia;
use App\Models\InventoryMovement;
use App\Models\Marca;
use App\Models\Modelo;
use App\Models\OrdenReparacion;
use App\Models\OrdenReparacionHistorial;
use App\Models\Pais;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Sale;
use App\Models\SalesGoal;
use App\Models\Servicio;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\CashRegisterService;
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
            return $this->buildHelpResponse("¡Hola {$user->name}! Soy Fixy, tu copilot de FixSale. ¿En qué te ayudo hoy?");
        }

        // ==========================================
        // FASE 3: INVENTARIO, AJUSTES DE STOCK Y KARDEX
        // ==========================================

        // Ajuste de stock (ej: "ajustar stock [prod] a 10", "sumar 5 stock [prod]", "restar 2 stock [prod]")
        $adjustStockMatch = $this->parseStockAdjustmentCommand($rawQuery);
        if ($adjustStockMatch) {
            return $this->handleStockAdjustment(
                $user,
                $empresaId,
                $sucursalId,
                $adjustStockMatch['product'],
                $adjustStockMatch['mode'],
                $adjustStockMatch['quantity'],
                $adjustStockMatch['reason'] ?? null
            );
        }

        // Consulta de Kardex / Movimientos (ej: "kardex bateria iphone", "ver kardex", "movimientos pantalla")
        $kardexMatch = $this->parseKardexCommand($rawQuery);
        if ($kardexMatch !== null) {
            return $this->handleProductKardex($user, $empresaId, $kardexMatch['product'] ?? null);
        }

        // Crear Producto Rápido (ej: "crear producto Bateria iPhone 11 precio 25 stock 10")
        $createProdMatch = $this->parseCreateProductCommand($rawQuery);
        if ($createProdMatch) {
            return $this->handleQuickProductCreate(
                $user,
                $empresaId,
                $sucursalId,
                $createProdMatch['name'],
                $createProdMatch['price'] ?? null,
                $createProdMatch['stock'] ?? null
            );
        }

        // ==========================================
        // FASE 4: POS, METAS, FONDO DE MES, PROVEEDORES Y COMPRAS
        // ==========================================

        // Ventas de Hoy / Facturación Diaria (ej: "ventas hoy", "cuanto vendimos hoy", "facturacion hoy")
        if ($this->isTodaySalesQuery($normalized)) {
            return $this->handleTodaySales($user, $empresaId, $sucursalId);
        }

        // Metas de Ventas (ej: "meta de ventas", "metas del mes", "como van las ventas")
        if ($this->isSalesGoalQuery($normalized)) {
            return $this->handleSalesGoals($user, $empresaId, $sucursalId);
        }

        // Fondo de Mes (ej: "fondo de mes", "fondo mensual", "como va el fondo", "gastos de fondo")
        if ($this->isMonthlyFundQuery($normalized)) {
            return $this->handleMonthlyFund($user, $empresaId, $sucursalId);
        }

        // Proveedores (crear o listar)
        $providerMatch = $this->parseProviderCommand($rawQuery, $normalized);
        if ($providerMatch) {
            if ($providerMatch['action'] === 'create') {
                return $this->handleCreateProveedor(
                    $user,
                    $empresaId,
                    $sucursalId,
                    $providerMatch['name'],
                    $providerMatch['phone'] ?? null,
                    $providerMatch['rif'] ?? null
                );
            }
            if ($providerMatch['action'] === 'list') {
                return $this->handleListProveedores($user, $empresaId);
            }
        }

        // Compras de Insumos (ej: "ver compras", "compras recientes", "compras del mes")
        if ($this->isPurchasesQuery($normalized)) {
            return $this->handleListCompras($user, $empresaId);
        }

        // Movimientos de Caja: Gasto / Egreso / Ingreso (ej: "gasto 10 almuerzo", "ingreso caja 50 fondo")
        $cashMovementMatch = $this->parseCashMovementCommand($rawQuery, $normalized);
        if ($cashMovementMatch) {
            return $this->handleAddCashMovement(
                $user,
                $cashMovementMatch['type'],
                $cashMovementMatch['amount'],
                $cashMovementMatch['reason']
            );
        }

        // Abrir Caja (ej: "abrir caja 50", "apertura caja con 100")
        $openCashMatch = $this->parseOpenCashCommand($rawQuery, $normalized);
        if ($openCashMatch !== null) {
            return $this->handleOpenCashRegister(
                $user,
                $empresaId,
                $sucursalId,
                $openCashMatch['amount']
            );
        }

        // Cerrar Caja (ej: "cerrar caja 250", "cierre de caja")
        $closeCashMatch = $this->parseCloseCashCommand($rawQuery, $normalized);
        if ($closeCashMatch !== null) {
            return $this->handleCloseCashRegister(
                $user,
                $empresaId,
                $sucursalId,
                $closeCashMatch['counted_amount']
            );
        }

        // Estado de Caja (ej: "estado de caja", "ver caja", "caja chica", "como esta la caja")
        if ($this->isCashRegisterStatusQuery($normalized)) {
            return $this->handleCashRegisterStatus($user, $empresaId, $sucursalId);
        }

        // Abonar a Cliente (ej: "abonar 20 a Juan Perez", "abono 15 Pedro", "pagar credito 30 Maria")
        $creditPaymentMatch = $this->parseCreditPaymentCommand($rawQuery, $normalized);
        if ($creditPaymentMatch) {
            return $this->handleClientCreditPayment(
                $user,
                $empresaId,
                $sucursalId,
                $creditPaymentMatch['client'],
                $creditPaymentMatch['amount'],
                $creditPaymentMatch['method'] ?? 'efectivo',
                $creditPaymentMatch['note'] ?? null
            );
        }

        // Deuda de Cliente (ej: "deuda de Juan", "saldo de Carlos", "cuanto debe Pedro")
        $clientDebtMatch = $this->parseClientDebtCommand($rawQuery, $normalized);
        if ($clientDebtMatch) {
            return $this->handleClientDebt($user, $empresaId, $clientDebtMatch['client']);
        }

        // Cartera de Clientes con Deuda (ej: "clientes con deuda", "deudas pendientes", "morosos", "cuentas por cobrar")
        if ($this->isDebtorsQuery($normalized)) {
            return $this->handleListDebtors($user, $empresaId);
        }

        // Clientes (crear, listar o buscar clientes)
        $clientCmd = $this->parseClientCommand($rawQuery, $normalized);
        if ($clientCmd) {
            if ($clientCmd['action'] === 'create') {
                return $this->handleCreateCliente(
                    $user,
                    $empresaId,
                    $sucursalId,
                    $clientCmd['name'],
                    $clientCmd['phone'] ?? null,
                    $clientCmd['email'] ?? null,
                    $clientCmd['address'] ?? null
                );
            }
            if ($clientCmd['action'] === 'list') {
                return $this->handleListClientes($user, $empresaId);
            }
            if ($clientCmd['action'] === 'search') {
                return $this->handleSearchCliente($user, $empresaId, $clientCmd['term']);
            }
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

        // 6b. Listar Servicios Técnicos
        if (preg_match('/^(?:ver|listar|mostrar|catalogo de)\s+servicios(?:\s+tecnicos|\s+disponibles)?$/i', $normalized) || $normalized === 'servicios') {
            return $this->handleListServicios($user, $empresaId);
        }

        // 7. Listar Modelos de una Marca (ej: "modelos de samsung", "ver modelos xiaomi")
        if (preg_match('/^(?:ver|listar|mostrar)?\s*modelos\s+(?:de|para|en)\s+(.+)$/i', $normalized, $m)) {
            return $this->handleListModelosForMarca($user, $empresaId, trim($m[1]));
        }

        // ==========================================
        // FASE 1: SERVICIO TÉCNICO, ÓRDENES Y STOCK
        // ==========================================

        // Crear Orden de Reparación (ej: "crear orden cliente Juan Perez telefono 04141234567 equipo iPhone 11 falla pantalla rota costo 45")
        $createRepairMatch = $this->parseCreateRepairCommand($rawQuery, $normalized);
        if ($createRepairMatch) {
            return $this->handleCreateRepairOrder(
                $user,
                $empresaId,
                $sucursalId,
                $createRepairMatch
            );
        }

        // Eliminar Orden de Servicio / Reparación (ej: "eliminar orden 1", "borrar orden REP-000001", "eliminar orden #5")
        $deleteOrderMatch = $this->parseDeleteOrderCommand($rawQuery, $normalized);
        if ($deleteOrderMatch) {
            if (!empty($deleteOrderMatch['missing_order'])) {
                return [
                    'type' => 'info',
                    'message' => "🗑️ **Eliminar Orden de Servicio**\n\n"
                        . "Por favor especifica el número o folio de la orden que deseas eliminar.\n\n"
                        . "👉 **Ejemplos:**\n"
                        . "• `eliminar orden 1`\n"
                        . "• `borrar orden REP-000001`\n"
                        . "• `eliminar orden de servicio #5`",
                    'quick_actions' => [
                        ['label' => '📋 Ir a Lista de Órdenes ↗', 'url' => '/admin/reparaciones', 'type' => 'link'],
                        ['label' => '📊 Resumen de Hoy', 'action' => 'get_summary'],
                    ],
                ];
            }
            return $this->handleDeleteRepairOrder($user, $empresaId, $deleteOrderMatch['order_number']);
        }

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

        // Cotizador / Presupuesto Rápido (ej: "cotizar pantalla iphone 13", "presupuesto bateria samsung a14")
        if (preg_match('/^(?:cotizar|cotizacion|presupuesto)\s+(?:de\s+|para\s+)?(.+)$/i', $normalized, $m)) {
            return $this->handleQuickQuote($user, $empresaId, $sucursalId, trim($m[1]));
        }

        // Repuestos Agotados (ej: "repuestos agotados", "repuestos sin stock", "sin stock repuestos")
        if (preg_match('/^(?:repuestos?\s+agotados?|repuestos?\s+sin\s+stock|sin\s+stock\s+repuestos?)$/i', $normalized)) {
            return $this->handleRepuestosAgotados($user, $empresaId, $sucursalId);
        }

        // 13. Consulta específica de Precio (ej: "precio pantalla iphone 11", "cuanto cuesta cargador samsung", "cuanto vale el display")
        $priceTerm = $this->parsePriceQuery($rawQuery, $normalized);
        if ($priceTerm !== null) {
            return $this->handlePriceCheck($user, $empresaId, $sucursalId, $priceTerm);
        }

        // 14. Consultar Stock de un producto o repuesto (ej: "stock pantalla iphone", "existencias bateria")
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

            case 'list_servicios':
                return $this->handleListServicios($user, $empresaId);

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

            case 'delete_order':
                $orderNumber = $params['order_number'] ?? null;
                if (!$orderNumber && !empty($params['orden_id'])) {
                    $orden = $this->findOrderModel($empresaId, (string)$params['orden_id']);
                    $orderNumber = $orden?->numero_orden;
                }
                if (!$orderNumber) {
                    return ['type' => 'error', 'message' => 'No se especificó la orden que deseas eliminar.'];
                }
                if (empty($params['confirmed'])) {
                    return $this->buildDeleteConfirmation($empresaId, (string)$orderNumber);
                }
                return $this->handleDeleteRepairOrder($user, $empresaId, (string)$orderNumber);

            case 'cancel_action':
                return [
                    'type' => 'info',
                    'message' => '👍 Operación cancelada. No se realizó ningún cambio.',
                ];

            case 'get_summary':
                return $this->handleWorkshopSummary($user, $empresaId, $user->sucursal_id);

            case 'get_stock_alerts':
                return $this->handleStockAlerts($user, $empresaId, $user->sucursal_id);

            // Fase 3: Acciones de Inventario
            case 'adjust_stock':
                $prodId = $params['producto_id'] ?? null;
                $mode = $params['mode'] ?? 'set';
                $qty = isset($params['quantity']) ? (float)$params['quantity'] : null;
                $reason = $params['motivo'] ?? 'Ajuste asistido por Copiloto';
                if (!$prodId || $qty === null) {
                    return ['type' => 'error', 'message' => 'Faltan parámetros para ajustar stock.'];
                }
                return $this->handleStockAdjustmentById($user, $empresaId, $sucursalId, (int)$prodId, $mode, $qty, $reason);

            case 'get_kardex':
                $prodId = $params['producto_id'] ?? null;
                return $this->handleProductKardexById($user, $empresaId, $prodId ? (int)$prodId : null);

            case 'create_product':
                $name = $params['name'] ?? null;
                $price = isset($params['price']) ? (float)$params['price'] : null;
                $stock = isset($params['stock']) ? (float)$params['stock'] : null;
                if (!$name) {
                    return ['type' => 'error', 'message' => 'El nombre del producto es obligatorio.'];
                }
                return $this->handleQuickProductCreate($user, $empresaId, $sucursalId, $name, $price, $stock);

            case 'get_price':
                $term = $params['term'] ?? $params['query'] ?? null;
                if (!$term) {
                    return ['type' => 'error', 'message' => 'Por favor indica el producto para consultar su precio.'];
                }
                return $this->handlePriceCheck($user, $empresaId, $sucursalId, (string)$term);

            // Fase 4: Acciones Financieras y Proveedores
            case 'get_sales_goals':
                return $this->handleSalesGoals($user, $empresaId, $sucursalId);

            case 'get_monthly_fund':
                return $this->handleMonthlyFund($user, $empresaId, $sucursalId);

            case 'list_proveedores':
                return $this->handleListProveedores($user, $empresaId);

            case 'list_compras':
                return $this->handleListCompras($user, $empresaId);

            case 'create_cliente':
                $name = $params['nombre'] ?? null;
                $phone = $params['telefono'] ?? null;
                $email = $params['email'] ?? null;
                $address = $params['direccion'] ?? null;
                if (!$name) {
                    return ['type' => 'error', 'message' => 'El nombre del cliente es obligatorio.'];
                }
                return $this->handleCreateCliente($user, $empresaId, $sucursalId, $name, $phone, $email, $address);

            case 'list_clientes':
                return $this->handleListClientes($user, $empresaId);

            case 'get_cash_status':
                return $this->handleCashRegisterStatus($user, $empresaId, $sucursalId);

            case 'open_cash_register':
                $amount = (float)($params['opening_amount'] ?? 0);
                return $this->handleOpenCashRegister($user, $empresaId, $sucursalId, $amount);

            case 'close_cash_register':
                $counted = isset($params['counted_amount']) ? (float)$params['counted_amount'] : null;
                return $this->handleCloseCashRegister($user, $empresaId, $sucursalId, $counted);

            case 'list_debtors':
                return $this->handleListDebtors($user, $empresaId);

            case 'get_today_sales':
                return $this->handleTodaySales($user, $empresaId, $sucursalId);

            case 'list_repuestos_agotados':
                return $this->handleRepuestosAgotados($user, $empresaId, $sucursalId);

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

    public function handleListServicios(User $user, int $empresaId): array
    {
        $servicios = Servicio::withoutGlobalScope('multitenancy')
            ->with(['categoria', 'marca'])
            ->where('empresa_id', $empresaId)
            ->where('estado', true)
            ->orderBy('nombre')
            ->limit(10)
            ->get();

        if ($servicios->isEmpty()) {
            return [
                'type' => 'not_found',
                'message' => "No tienes servicios técnicos registrados en tu catálogo aún.",
                'quick_actions' => [
                    ['label' => 'Catálogo de Servicios ↗', 'url' => '/admin/servicios', 'type' => 'link'],
                ],
            ];
        }

        $currency = $this->getCurrencySymbol($empresaId);
        $total = Servicio::withoutGlobalScope('multitenancy')->where('empresa_id', $empresaId)->where('estado', true)->count();
        $message = "⚙️ **Catálogo de Servicios Técnicos ({$total} registrados):**\n";
        $message .= "*Nota: Los servicios representan mano de obra y diagnósticos técnicos (no manejan stock físico).*\n\n";

        foreach ($servicios as $s) {
            $cat = $s->categoria?->nombre ?? 'General';
            $code = $s->codigo ? " (`{$s->codigo}`)" : "";
            $message .= "• **{$s->nombre}**{$code}\n";
            $message .= "  📁 Categoría: *{$cat}* | 🛠️ *Mano de obra* | 💰 Tarifa: {$currency} " . number_format($s->precio, 2) . "\n";
        }

        return [
            'type' => 'services_list',
            'message' => $message,
            'quick_actions' => [
                ['label' => 'Ver Servicios ↗', 'url' => '/admin/servicios', 'type' => 'link'],
                ['label' => '🛠️ Ver Repuestos', 'text' => 'repuestos'],
                ['label' => '📁 Ver Categorías', 'text' => 'ver categorias'],
                ['label' => '⚠️ Alertas Stock', 'action' => 'get_stock_alerts'],
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
    // FASE 3: MANEJADORES DE INVENTARIO, AJUSTES Y KARDEX
    // ==========================================

    protected function findProduct(int $empresaId, string $identifier): array
    {
        $clean = trim($identifier);

        // 1. Coincidencia exacta por SKU o código de barras
        $exact = Producto::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($clean) {
                $q->where('sku', $clean)
                  ->orWhere('codigo_barras', $clean);
            })
            ->first();

        if ($exact) {
            return ['exact' => $exact, 'multiple' => collect([$exact])];
        }

        // 2. Búsqueda por similitud en SKU, código de barras, variante o modelo
        $results = Producto::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($clean) {
                $q->where('sku', 'like', "%{$clean}%")
                  ->orWhere('codigo_barras', 'like', "%{$clean}%")
                  ->orWhere('nombre_variante', 'like', "%{$clean}%")
                  ->orWhereHas('modelo', function ($m) use ($clean) {
                      $m->withoutGlobalScope('multitenancy')
                        ->where('nombre_comercial', 'like', "%{$clean}%")
                        ->orWhere('codigo_modelo', 'like', "%{$clean}%");
                  });
            })
            ->with(['marca', 'modelo', 'categoria'])
            ->take(5)
            ->get();

        if ($results->count() === 1) {
            return ['exact' => $results->first(), 'multiple' => $results];
        }

        return ['exact' => null, 'multiple' => $results];
    }

    public function handleStockAdjustment(
        User $user,
        int $empresaId,
        ?int $sucursalId,
        string $productIdentifier,
        string $mode,
        float $quantity,
        ?string $reason = null
    ): array {
        $found = $this->findProduct($empresaId, $productIdentifier);
        if (!$found['exact']) {
            if ($found['multiple']->isNotEmpty()) {
                $actions = [];
                foreach ($found['multiple'] as $p) {
                    $label = $p->nombre_variante ?: ($p->modelo?->nombre_comercial ?? "SKU: {$p->sku}");
                    $actions[] = [
                        'label' => "{$label} (Disp: " . (float)$p->stock . ")",
                        'action' => 'adjust_stock',
                        'params' => [
                            'producto_id' => $p->id,
                            'mode' => $mode,
                            'quantity' => $quantity,
                            'motivo' => $reason,
                        ],
                    ];
                }
                return [
                    'type' => 'product_selection',
                    'message' => "Encontré varios productos que coinciden con **\"{$productIdentifier}\"**. ¿Cuál deseas ajustar?",
                    'quick_actions' => $actions,
                ];
            }

            return [
                'type' => 'not_found',
                'message' => "❌ No se encontró ningún producto con la referencia **\"{$productIdentifier}\"** para realizar el ajuste de inventario.",
                'quick_actions' => [
                    ['label' => '📦 Ver Inventario ↗', 'url' => '/admin/productos', 'type' => 'link'],
                    ['label' => '➕ Crear Producto', 'text' => "crear producto {$productIdentifier}"],
                ],
            ];
        }

        return $this->handleStockAdjustmentById(
            $user,
            $empresaId,
            $sucursalId,
            $found['exact']->id,
            $mode,
            $quantity,
            $reason
        );
    }

    public function handleStockAdjustmentById(
        User $user,
        int $empresaId,
        ?int $sucursalId,
        int $productoId,
        string $mode,
        float $quantity,
        ?string $reason = null
    ): array {
        $result = DB::transaction(function () use ($user, $empresaId, $sucursalId, $productoId, $mode, $quantity, $reason) {
            $producto = Producto::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->lockForUpdate()
                ->find($productoId);

            if (!$producto) {
                return null;
            }

            $stockAnterior = (float) $producto->stock;

            if ($mode === 'set') {
                $stockNuevo = max(0, $quantity);
                $tipo = $stockNuevo >= $stockAnterior ? 'entrada' : 'salida';
                $diff = abs($stockNuevo - $stockAnterior);
                $motivoFinal = $reason ?: 'Ajuste de inventario físico (fijado)';
            } elseif ($mode === 'add') {
                $stockNuevo = $stockAnterior + $quantity;
                $tipo = 'entrada';
                $diff = $quantity;
                $motivoFinal = $reason ?: 'Entrada / Adición manual de stock';
            } else { // 'sub'
                $stockNuevo = max(0, $stockAnterior - $quantity);
                $tipo = 'salida';
                $diff = min($quantity, $stockAnterior);
                $motivoFinal = $reason ?: 'Salida / Merma manual de stock';
            }

            $producto->update(['stock' => $stockNuevo]);

            InventoryMovement::create([
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId ?: $producto->sucursal_id,
                'producto_id' => $producto->id,
                'user_id' => $user->id,
                'tipo' => $tipo,
                'motivo' => $motivoFinal,
                'cantidad' => $diff,
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'costo_unitario' => (float) $producto->precio_compra,
                'referencia' => 'COPILOTO-AJUSTE',
                'notas' => "Ajuste ejecutado vía Copiloto FixSale por {$user->name}",
            ]);

            return [
                'producto' => $producto->fresh(['marca', 'modelo']),
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'diff' => $diff,
                'tipo' => $tipo,
                'motivo' => $motivoFinal,
            ];
        });

        if (!$result) {
            return ['type' => 'error', 'message' => 'El producto no fue encontrado en la base de datos.'];
        }

        $prod = $result['producto'];
        $nombreProd = $prod->nombre_variante ?: ($prod->modelo?->nombre_comercial ?? "SKU: {$prod->sku}");
        $simbolo = $result['tipo'] === 'entrada' ? '📈 +' : '📉 -';

        $msg = "✅ **Ajuste de Stock registrado con éxito**\n\n"
            . "📦 **Producto:** {$nombreProd}\n"
            . "🏷️ **SKU:** `{$prod->sku}`\n"
            . "🔢 **Stock anterior:** {$result['stock_anterior']} unidades\n"
            . "📊 **Nuevo Stock:** **{$result['stock_nuevo']}** unidades ({$simbolo}{$result['diff']})\n"
            . "📝 **Motivo:** {$result['motivo']}\n"
            . "👤 **Registrado por:** {$user->name}";

        return [
            'type' => 'stock_adjusted',
            'message' => $msg,
            'quick_actions' => [
                [
                    'label' => '📜 Ver en Kardex ↗',
                    'url' => "/admin/inventario/kardex?producto_id={$prod->id}",
                    'type' => 'link',
                ],
                [
                    'label' => '⚙️ Historial Ajustes ↗',
                    'url' => '/admin/inventario/ajustes',
                    'type' => 'link',
                ],
                [
                    'label' => '📦 Ver en Catálogo ↗',
                    'url' => "/admin/productos?search=" . urlencode($prod->sku),
                    'type' => 'link',
                ],
            ],
        ];
    }

    public function handleProductKardex(User $user, int $empresaId, ?string $productIdentifier): array
    {
        if (!empty($productIdentifier)) {
            $found = $this->findProduct($empresaId, $productIdentifier);
            if (!$found['exact']) {
                if ($found['multiple']->isNotEmpty()) {
                    $actions = [];
                    foreach ($found['multiple'] as $p) {
                        $label = $p->nombre_variante ?: ($p->modelo?->nombre_comercial ?? "SKU: {$p->sku}");
                        $actions[] = [
                            'label' => "Kardex de {$p->sku}",
                            'action' => 'get_kardex',
                            'params' => ['producto_id' => $p->id],
                        ];
                    }
                    return [
                        'type' => 'product_selection',
                        'message' => "Encontré varios productos coincidentes con **\"{$productIdentifier}\"**. ¿De cuál deseas ver el Kardex?",
                        'quick_actions' => $actions,
                    ];
                }

                return [
                    'type' => 'not_found',
                    'message' => "❌ No encontré ningún producto con la referencia **\"{$productIdentifier}\"** para consultar su Kardex.",
                    'quick_actions' => [
                        ['label' => '📜 Ver Kardex Global ↗', 'url' => '/admin/inventario/kardex', 'type' => 'link'],
                        ['label' => '📦 Catálogo de Productos ↗', 'url' => '/admin/productos', 'type' => 'link'],
                    ],
                ];
            }

            return $this->handleProductKardexById($user, $empresaId, $found['exact']->id);
        }

        // Kardex Global de la empresa
        return $this->handleProductKardexById($user, $empresaId, null);
    }

    public function handleProductKardexById(User $user, int $empresaId, ?int $productoId): array
    {
        if ($productoId) {
            $producto = Producto::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->with(['marca', 'modelo'])
                ->find($productoId);

            if (!$producto) {
                return ['type' => 'error', 'message' => 'Producto no encontrado.'];
            }

            $movements = InventoryMovement::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('producto_id', $producto->id)
                ->with('user')
                ->latest()
                ->take(6)
                ->get();

            $nombreProd = $producto->nombre_variante ?: ($producto->modelo?->nombre_comercial ?? "SKU: {$producto->sku}");

            if ($movements->isEmpty()) {
                $msg = "📦 **Kardex:** {$nombreProd} (`{$producto->sku}`)\n"
                    . "📊 **Stock actual:** **{$producto->stock}** unidades\n\n"
                    . "ℹ️ No se registran movimientos de inventario aún para este producto.";

                return [
                    'type' => 'kardex',
                    'message' => $msg,
                    'quick_actions' => [
                        [
                            'label' => '➕ Ajustar Stock',
                            'text' => "ajustar stock {$producto->sku} a " . (int)$producto->stock,
                        ],
                        [
                            'label' => '📜 Ver en Kardex ↗',
                            'url' => "/admin/inventario/kardex?producto_id={$producto->id}",
                            'type' => 'link',
                        ],
                    ],
                ];
            }

            $lines = ["📦 **Kardex:** {$nombreProd} (`{$producto->sku}`)"];
            $lines[] = "📊 **Stock Actual:** **{$producto->stock}** unidades\n";
            $lines[] = "📋 **Últimos movimientos:**";

            foreach ($movements as $m) {
                $fecha = $m->created_at ? $m->created_at->format('d/m H:i') : '--';
                $badge = match ($m->tipo) {
                    'entrada' => '🟢 +' . (float)$m->cantidad,
                    'salida' => '🔴 -' . (float)$m->cantidad,
                    default => '🟡 ' . (float)$m->cantidad,
                };
                $userStr = $m->user?->name ? "({$m->user->name})" : '';
                $motivo = $m->motivo ?: 'Sin motivo';
                $lines[] = "• **{$fecha}** | {$badge} ➔ **{$m->stock_nuevo}** disp. | _{$motivo}_ {$userStr}";
            }

            return [
                'type' => 'kardex',
                'message' => implode("\n", $lines),
                'quick_actions' => [
                    [
                        'label' => '📜 Kardex Completo ↗',
                        'url' => "/admin/inventario/kardex?producto_id={$producto->id}",
                        'type' => 'link',
                    ],
                    [
                        'label' => '⚙️ Ajustar Stock',
                        'text' => "ajustar stock {$producto->sku} a " . (int)$producto->stock,
                    ],
                    [
                        'label' => '📦 Ver en Catálogo ↗',
                        'url' => "/admin/productos?search=" . urlencode($producto->sku),
                        'type' => 'link',
                    ],
                ],
            ];
        }

        // Global Kardex
        $movements = InventoryMovement::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->with(['producto', 'user'])
            ->latest()
            ->take(6)
            ->get();

        if ($movements->isEmpty()) {
            return [
                'type' => 'kardex',
                'message' => "📋 **Kardex General del Negocio**\n\nNo hay movimientos registrados en el inventario aún.",
                'quick_actions' => [
                    ['label' => '📦 Ir a Inventario ↗', 'url' => '/admin/productos', 'type' => 'link'],
                ],
            ];
        }

        $lines = ["📋 **Últimos Movimientos del Kardex General:**\n"];
        foreach ($movements as $m) {
            $fecha = $m->created_at ? $m->created_at->format('d/m H:i') : '--';
            $badge = match ($m->tipo) {
                'entrada' => '🟢 +' . (float)$m->cantidad,
                'salida' => '🔴 -' . (float)$m->cantidad,
                default => '🟡 ' . (float)$m->cantidad,
            };
            $prodName = $m->producto?->nombre_variante ?: ($m->producto?->sku ?? 'Producto');
            $userStr = $m->user?->name ? "👤 {$m->user->name}" : '';
            $lines[] = "• **{$fecha}** | {$badge} **{$prodName}** (Saldo: {$m->stock_nuevo}) | _{$m->motivo}_ {$userStr}";
        }

        return [
            'type' => 'kardex',
            'message' => implode("\n", $lines),
            'quick_actions' => [
                ['label' => '📜 Ver Kardex Completo ↗', 'url' => '/admin/inventario/kardex', 'type' => 'link'],
                ['label' => '⚙️ Registro de Ajustes ↗', 'url' => '/admin/inventario/ajustes', 'type' => 'link'],
            ],
        ];
    }

    public function handleQuickProductCreate(
        User $user,
        int $empresaId,
        ?int $sucursalId,
        string $name,
        ?float $price = null,
        ?float $stock = null
    ): array {
        $name = trim($name);
        if ($name === '') {
            return ['type' => 'error', 'message' => 'Por favor indica un nombre para el producto.'];
        }

        $existente = Producto::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('nombre_variante', 'like', $name)
            ->first();

        if ($existente) {
            return [
                'type' => 'product_exists',
                'message' => "ℹ️ Ya existe un producto con nombre similar: **\"{$existente->nombre_variante}\"**\n"
                    . "🏷️ SKU: `{$existente->sku}` | Stock: **{$existente->stock}** | Precio: **{$this->getCurrencySymbol($empresaId)}" . number_format($existente->precio_venta, 2) . "**",
                'quick_actions' => [
                    ['label' => '📦 Ver en Catálogo ↗', 'url' => "/admin/productos?search=" . urlencode($existente->sku), 'type' => 'link'],
                    ['label' => '📜 Ver Kardex ↗', 'url' => "/admin/inventario/kardex?producto_id={$existente->id}", 'type' => 'link'],
                ],
            ];
        }

        $sku = 'PROD-' . strtoupper(Str::random(6));
        $precioVenta = $price ?: 0.0;
        $stockInicial = $stock ?: 0.0;

        $producto = Producto::create([
            'empresa_id' => $empresaId,
            'sucursal_id' => $sucursalId,
            'sku' => $sku,
            'nombre_variante' => $name,
            'precio_venta' => $precioVenta,
            'precio_compra' => 0.0,
            'stock' => $stockInicial,
            'stock_minimo' => 2.0,
            'usa_inventario' => true,
            'estado' => true,
        ]);

        if ($stockInicial > 0) {
            InventoryMovement::create([
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId,
                'producto_id' => $producto->id,
                'user_id' => $user->id,
                'tipo' => 'entrada',
                'motivo' => 'Stock inicial de registro rápido',
                'cantidad' => $stockInicial,
                'stock_anterior' => 0,
                'stock_nuevo' => $stockInicial,
                'costo_unitario' => 0.0,
                'referencia' => 'ALTA-' . $producto->sku,
                'notas' => 'Alta rápida asistida por Copiloto FixSale',
            ]);
        }

        $currency = $this->getCurrencySymbol($empresaId);
        $msg = "✨ **¡Producto creado exitosamente!**\n\n"
            . "📦 **Nombre:** {$producto->nombre_variante}\n"
            . "🏷️ **SKU generado:** `{$producto->sku}`\n"
            . "💰 **Precio de venta:** {$currency}" . number_format($precioVenta, 2) . "\n"
            . "📊 **Stock inicial:** {$stockInicial} unidades\n\n"
            . "Puedes editar marca, modelo, fotos o precio de costo desde el catálogo.";

        return [
            'type' => 'product_created',
            'message' => $msg,
            'quick_actions' => [
                ['label' => '📦 Ver en Catálogo ↗', 'url' => "/admin/productos?search=" . urlencode($producto->sku), 'type' => 'link'],
                ['label' => '⚙️ Ajustar Stock', 'text' => "ajustar stock {$producto->sku} a " . (int)$stockInicial],
                ['label' => '📜 Ver Kardex ↗', 'url' => "/admin/inventario/kardex?producto_id={$producto->id}", 'type' => 'link'],
            ],
        ];
    }

    // ==========================================
    // FASE 4: MANEJADORES DE POS, FINANZAS, PROVEEDORES Y COMPRAS
    // ==========================================

    public function handleSalesGoals(User $user, int $empresaId, ?int $sucursalId): array
    {
        $empresa = Empresa::find($empresaId);
        $timezone = $empresa?->getTimezone() ?? $user->getTimezone() ?? 'America/Mexico_City';
        $nowInTz = Carbon::now($timezone);
        $year = (int) $nowInTz->format('Y');
        $month = (int) $nowInTz->format('n');
        $currency = $this->getCurrencySymbol($empresaId);

        $startOfMonthUtc = Carbon::createFromDate($year, $month, 1, $timezone)->startOfMonth()->setTimezone('UTC');
        $endOfMonthUtc = Carbon::createFromDate($year, $month, 1, $timezone)->endOfMonth()->setTimezone('UTC');

        $salesMonth = (float) Sale::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->whereBetween('created_at', [$startOfMonthUtc, $endOfMonthUtc])
            ->whereNotIn('estado', ['anulada', 'cancelada'])
            ->sum('total');

        $startOfDayUtc = $nowInTz->copy()->startOfDay()->setTimezone('UTC');
        $endOfDayUtc = $nowInTz->copy()->endOfDay()->setTimezone('UTC');

        $salesToday = (float) Sale::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->whereBetween('created_at', [$startOfDayUtc, $endOfDayUtc])
            ->whereNotIn('estado', ['anulada', 'cancelada'])
            ->sum('total');

        $goal = SalesGoal::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('year', $year)
            ->where('month', $month)
            ->first();

        $target = $goal ? (float) $goal->target_amount : 0.0;
        $mesesNom = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
        ];
        $nombreMes = $mesesNom[$month] ?? "Mes {$month}";

        $lines = ["🎯 **Progreso de Ventas y Metas ({$nombreMes} {$year})**\n"];
        $lines[] = "💵 **Ventas de Hoy:** **{$currency}" . number_format($salesToday, 2) . "**";
        $lines[] = "📈 **Vendido este mes:** **{$currency}" . number_format($salesMonth, 2) . "**";

        if ($target > 0) {
            $pct = round(($salesMonth / $target) * 100, 1);
            $faltante = max(0, $target - $salesMonth);
            $diasMes = $nowInTz->daysInMonth;
            $diaActual = (int) $nowInTz->format('j');
            $diasRestantes = max(1, $diasMes - $diaActual);
            $promedioRequerido = round($faltante / $diasRestantes, 2);

            $barraProgreso = $this->buildProgressBar($pct);

            $lines[] = "🎯 **Meta del Mes:** **{$currency}" . number_format($target, 2) . "**";
            $lines[] = "📊 **Cumplimiento:** {$pct}% {$barraProgreso}";
            if ($faltante > 0) {
                $lines[] = "⏳ **Faltante para cumplir:** {$currency}" . number_format($faltante, 2) . " (~{$currency}" . number_format($promedioRequerido, 2) . "/día en los {$diasRestantes} días restantes)";
            } else {
                $lines[] = "🎉 **¡Meta superada en un " . round($pct - 100, 1) . "%! Excelente trabajo.**";
            }
        } else {
            $lines[] = "ℹ️ _No hay una meta configurada aún para este mes._ Puedes definirla en Metas POS.";
        }

        return [
            'type' => 'sales_goal',
            'message' => implode("\n", $lines),
            'quick_actions' => [
                ['label' => '🎯 Ver Metas POS ↗', 'url' => '/admin/pos/metas', 'type' => 'link'],
                ['label' => '💵 Cajas Registradoras ↗', 'url' => '/admin/cajas', 'type' => 'link'],
            ],
        ];
    }

    public function handleTodaySales(User $user, int $empresaId, ?int $sucursalId): array
    {
        $empresa = Empresa::find($empresaId);
        $timezone = $empresa?->getTimezone() ?? $user->getTimezone() ?? 'America/Mexico_City';
        $nowInTz = Carbon::now($timezone);
        $currency = $this->getCurrencySymbol($empresaId);

        $startOfDayUtc = $nowInTz->copy()->startOfDay()->setTimezone('UTC');
        $endOfDayUtc = $nowInTz->copy()->endOfDay()->setTimezone('UTC');

        $salesQuery = Sale::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->whereBetween('created_at', [$startOfDayUtc, $endOfDayUtc])
            ->whereNotIn('estado', ['anulada', 'cancelada']);

        if ($sucursalId) {
            $salesQuery->where('sucursal_id', $sucursalId);
        }

        $totalVentas = (float) $salesQuery->sum('total');
        $cantidadVentas = $salesQuery->count();

        // Desglose por método de pago
        $desgloseRaw = (clone $salesQuery)
            ->select('metodo_pago', DB::raw('SUM(total) as monto'), DB::raw('COUNT(*) as total_ops'))
            ->groupBy('metodo_pago')
            ->get();

        $desglose = [];
        foreach ($desgloseRaw as $d) {
            $metodo = ucfirst(str_replace('_', ' ', $d->metodo_pago ?: 'otro'));
            $desglose[] = [
                'metodo' => $metodo,
                'monto' => (float)$d->monto,
                'formateado' => "{$currency} " . number_format((float)$d->monto, 2),
                'operaciones' => (int)$d->total_ops,
            ];
        }

        // Órdenes de taller entregadas hoy
        $ordenesEntregadasQuery = OrdenReparacion::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('estado_orden', OrdenReparacion::ESTADO_ENTREGADO_FINALIZADO)
            ->whereBetween('updated_at', [$startOfDayUtc, $endOfDayUtc]);

        if ($sucursalId) {
            $ordenesEntregadasQuery->where('sucursal_id', $sucursalId);
        }
        $ordenesEntregadas = $ordenesEntregadasQuery->count();

        $ticketPromedio = $cantidadVentas > 0 ? ($totalVentas / $cantidadVentas) : 0.0;
        $fechaHoy = $nowInTz->translatedFormat('d \d\e F, Y');

        $message = "📊 **Resumen Financiero y Ventas de Hoy ({$fechaHoy}):**\n\n";
        $message .= "💰 **Total Facturado:** **{$currency} " . number_format($totalVentas, 2) . "**\n";
        $message .= "🧾 **Transacciones:** **{$cantidadVentas}** ventas cerradas\n";
        $message .= "📱 **Órdenes Entregadas:** **{$ordenesEntregadas}** reparaciones finalizadas\n";
        $message .= "🎯 **Ticket Promedio:** {$currency} " . number_format($ticketPromedio, 2) . "\n\n";

        if (!empty($desglose)) {
            $message .= "💳 **Desglose por Método de Pago:**\n";
            foreach ($desglose as $m) {
                $message .= "• **{$m['metodo']}:** {$m['formateado']} ({$m['operaciones']} ops)\n";
            }
        }

        return [
            'type' => 'today_sales',
            'message' => trim($message),
            'today_sales' => [
                'fecha' => $fechaHoy,
                'total' => $totalVentas,
                'total_formateado' => "{$currency} " . number_format($totalVentas, 2),
                'cantidad' => $cantidadVentas,
                'ordenes_entregadas' => $ordenesEntregadas,
                'ticket_promedio' => "{$currency} " . number_format($ticketPromedio, 2),
                'desglose' => $desglose,
            ],
            'quick_actions' => [
                ['label' => '💰 Estado de Caja', 'action' => 'get_cash_status'],
                ['label' => '🎯 Metas de Ventas', 'action' => 'get_sales_goals'],
                ['label' => '📊 Resumen Taller', 'action' => 'get_summary'],
                ['label' => 'Ir a Ventas ↗', 'url' => '/admin/ventas', 'type' => 'link'],
            ],
        ];
    }

    public function handleMonthlyFund(User $user, int $empresaId, ?int $sucursalId): array
    {
        $empresa = Empresa::find($empresaId);
        $timezone = $empresa?->getTimezone() ?? $user->getTimezone() ?? 'America/Mexico_City';
        $nowInTz = Carbon::now($timezone);
        $year = (int) $nowInTz->format('Y');
        $month = (int) $nowInTz->format('n');
        $currency = $this->getCurrencySymbol($empresaId);

        $startOfMonthUtc = Carbon::createFromDate($year, $month, 1, $timezone)->startOfMonth()->setTimezone('UTC');
        $endOfMonthUtc = Carbon::createFromDate($year, $month, 1, $timezone)->endOfMonth()->setTimezone('UTC');

        $cajasCerradas = CashRegister::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('status', 'closed')
            ->whereBetween('closed_at', [$startOfMonthUtc, $endOfMonthUtc])
            ->get();

        $totalCajas = (float) $cajasCerradas->sum('closing_amount');
        $numCajas = $cajasCerradas->count();

        $comprasFondo = Compra::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('usar_fondo_mes', true)
            ->whereBetween('created_at', [$startOfMonthUtc, $endOfMonthUtc])
            ->get();

        $totalCompras = (float) $comprasFondo->sum('total');
        $numCompras = $comprasFondo->count();
        $balance = $totalCajas - $totalCompras;

        $mesesNom = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
        ];
        $nombreMes = $mesesNom[$month] ?? "Mes {$month}";

        $lines = ["🏦 **Estado del Fondo Mensual ({$nombreMes} {$year})**\n"];
        $lines[] = "📥 **Ingresos de Cajas Cerradas:** **{$currency}" . number_format($totalCajas, 2) . "** ({$numCajas} cajas)";
        $lines[] = "📤 **Compras pagadas con Fondo:** **{$currency}" . number_format($totalCompras, 2) . "** ({$numCompras} compras)";
        $lines[] = "💰 **Balance Estimado del Mes:** **{$currency}" . number_format($balance, 2) . "**";

        return [
            'type' => 'monthly_fund',
            'message' => implode("\n", $lines),
            'quick_actions' => [
                ['label' => '🏦 Ver Fondo Mensual ↗', 'url' => '/admin/fondo-mensual', 'type' => 'link'],
                ['label' => '🛍️ Ver Compras ↗', 'url' => '/admin/compras', 'type' => 'link'],
            ],
        ];
    }

    public function handleCreateProveedor(
        User $user,
        int $empresaId,
        ?int $sucursalId,
        string $name,
        ?string $phone = null,
        ?string $rif = null
    ): array {
        $name = trim($name);
        if ($name === '') {
            return ['type' => 'error', 'message' => 'Por favor indica la razón social o nombre del proveedor.'];
        }

        $existente = Proveedor::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($name, $rif) {
                $q->where('razon_social', 'like', $name)
                  ->orWhere('nombre_comercial', 'like', $name);
                if ($rif) {
                    $q->orWhere('rif_documento', $rif);
                }
            })
            ->first();

        if ($existente) {
            return [
                'type' => 'provider_exists',
                'message' => "ℹ️ El proveedor **\"{$existente->razon_social}\"** ya está registrado.\n"
                    . "📞 Teléfono: " . ($existente->telefono ?: 'No especificado') . "\n"
                    . "📄 RIF / Doc: " . ($existente->rif_documento ?: 'No especificado'),
                'quick_actions' => [
                    ['label' => '🏢 Directorio Proveedores ↗', 'url' => '/admin/proveedores', 'type' => 'link'],
                    ['label' => '🛍️ Registrar Compra ↗', 'url' => '/admin/compras/crear', 'type' => 'link'],
                ],
            ];
        }

        $proveedor = Proveedor::create([
            'empresa_id' => $empresaId,
            'sucursal_id' => $sucursalId,
            'razon_social' => $name,
            'nombre_comercial' => $name,
            'telefono' => $phone,
            'rif_documento' => $rif,
            'estado' => true,
        ]);

        $msg = "🏢 **¡Proveedor registrado con éxito!**\n\n"
            . "• **Razón Social:** {$proveedor->razon_social}\n"
            . ($phone ? "• **Teléfono:** {$phone}\n" : '')
            . ($rif ? "• **RIF / Documento:** {$rif}\n" : '')
            . "• **Estado:** Activo";

        return [
            'type' => 'provider_created',
            'message' => $msg,
            'quick_actions' => [
                ['label' => '🏢 Directorio Proveedores ↗', 'url' => '/admin/proveedores', 'type' => 'link'],
                ['label' => '🛍️ Nueva Compra ↗', 'url' => '/admin/compras/crear', 'type' => 'link'],
            ],
        ];
    }

    public function handleListProveedores(User $user, int $empresaId): array
    {
        $proveedores = Proveedor::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->latest()
            ->take(6)
            ->get();

        if ($proveedores->isEmpty()) {
            return [
                'type' => 'providers',
                'message' => "🏢 **Proveedores:** No tienes proveedores registrados todavía.",
                'quick_actions' => [
                    ['label' => '➕ Crear Proveedor', 'text' => 'crear proveedor Insumos Global'],
                    ['label' => '🏢 Directorio ↗', 'url' => '/admin/proveedores', 'type' => 'link'],
                ],
            ];
        }

        $lines = ["🏢 **Proveedores Registrados Recientes:**\n"];
        foreach ($proveedores as $p) {
            $tel = $p->telefono ? "📞 {$p->telefono}" : '';
            $rif = $p->rif_documento ? "📄 {$p->rif_documento}" : '';
            $extra = array_filter([$tel, $rif]);
            $extraStr = $extra ? ' (' . implode(' | ', $extra) . ')' : '';
            $lines[] = "• **{$p->razon_social}**{$extraStr}";
        }

        return [
            'type' => 'providers',
            'message' => implode("\n", $lines),
            'quick_actions' => [
                ['label' => '🏢 Directorio Completo ↗', 'url' => '/admin/proveedores', 'type' => 'link'],
                ['label' => '🛍️ Registrar Compra ↗', 'url' => '/admin/compras/crear', 'type' => 'link'],
            ],
        ];
    }

    public function handleListCompras(User $user, int $empresaId): array
    {
        $compras = Compra::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->with('proveedor')
            ->latest()
            ->take(5)
            ->get();

        $currency = $this->getCurrencySymbol($empresaId);

        if ($compras->isEmpty()) {
            return [
                'type' => 'purchases',
                'message' => "🛍️ **Compras de Insumos:** No hay compras registradas recientemente.",
                'quick_actions' => [
                    ['label' => '➕ Nueva Compra ↗', 'url' => '/admin/compras/crear', 'type' => 'link'],
                    ['label' => '🛍️ Ver Compras ↗', 'url' => '/admin/compras', 'type' => 'link'],
                ],
            ];
        }

        $lines = ["🛍️ **Últimas Compras de Insumos:**\n"];
        foreach ($compras as $c) {
            $prov = $c->proveedor?->razon_social ?: 'Sin proveedor';
            $fecha = $c->created_at ? $c->created_at->format('d/m') : '--';
            $estado = match ($c->status) {
                'completada', 'pagada' => '✅ Pagada',
                'pendiente', 'parcial' => '⏳ Pendiente',
                default => ucfirst($c->status ?? 'Registrada'),
            };
            $lines[] = "• **#{$c->codigo_compra}** ({$fecha}) | **{$prov}** | **{$currency}" . number_format($c->total, 2) . "** | {$estado}";
        }

        return [
            'type' => 'purchases',
            'message' => implode("\n", $lines),
            'quick_actions' => [
                ['label' => '➕ Nueva Compra ↗', 'url' => '/admin/compras/crear', 'type' => 'link'],
                ['label' => '🛍️ Ver Todas ↗', 'url' => '/admin/compras', 'type' => 'link'],
                ['label' => '🏦 Fondo Mensual ↗', 'url' => '/admin/fondo-mensual', 'type' => 'link'],
            ],
        ];
    }

    // ==========================================
    // MANEJADORES DE CLIENTES
    // ==========================================

    public function handleCreateCliente(
        User $user,
        int $empresaId,
        ?int $sucursalId,
        string $name,
        ?string $phone = null,
        ?string $email = null,
        ?string $address = null
    ): array {
        $name = trim($name);
        if ($name === '') {
            return ['type' => 'error', 'message' => 'Por favor indica el nombre del cliente.'];
        }

        // Buscar si ya existe
        $existente = Cliente::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($name, $phone, $email) {
                $q->where('nombre', 'like', $name);
                if ($phone) {
                    $cleanPhone = preg_replace('/\D/', '', $phone);
                    if (strlen($cleanPhone) >= 7) {
                        $q->orWhere('telefono', 'like', "%{$cleanPhone}%");
                    }
                }
                if ($email) {
                    $q->orWhere('email', 'like', $email);
                }
            })
            ->first();

        if ($existente) {
            $currency = $this->getCurrencySymbol($empresaId);
            $msg = "ℹ️ Ya existe un cliente registrado con datos coincidentes:\n\n"
                . "👤 **{$existente->nombre}**\n"
                . "📞 Teléfono: " . ($existente->telefono ?: 'No asignado') . "\n"
                . "✉️ Email: " . ($existente->email ?: 'No asignado') . "\n"
                . "💰 Saldo Pendiente: {$currency}" . number_format((float)$existente->saldo_pendiente, 2);

            return [
                'type' => 'client_exists',
                'message' => $msg,
                'quick_actions' => [
                    [
                        'label' => '👤 Ver en Directorio ↗',
                        'url' => "/admin/clientes?search=" . urlencode($existente->nombre),
                        'type' => 'link',
                    ],
                    [
                        'label' => '🔧 Nueva Reparación ↗',
                        'url' => '/admin/reparaciones/create',
                        'type' => 'link',
                    ],
                ],
            ];
        }

        $cliente = Cliente::create([
            'empresa_id' => $empresaId,
            'sucursal_id' => $sucursalId ?: $user->sucursal_id,
            'nombre' => $name,
            'telefono' => $phone,
            'email' => $email,
            'direccion' => $address,
            'limite_credito' => 0.0,
            'saldo_pendiente' => 0.0,
            'estado' => true,
        ]);

        $msg = "👤 **¡Cliente registrado exitosamente!**\n\n"
            . "• **Nombre:** {$cliente->nombre}\n"
            . ($phone ? "• **Teléfono:** {$phone}\n" : '')
            . ($email ? "• **Email:** {$email}\n" : '')
            . ($address ? "• **Dirección:** {$address}\n" : '')
            . "• **Estado:** Activo";

        $actions = [
            [
                'label' => '👤 Ver en Directorio ↗',
                'url' => "/admin/clientes?search=" . urlencode($cliente->nombre),
                'type' => 'link',
            ],
            [
                'label' => '🔧 Crear Reparación ↗',
                'url' => '/admin/reparaciones/create',
                'type' => 'link',
            ],
        ];

        if ($phone) {
            $cleanWa = preg_replace('/\D/', '', $phone);
            if (strlen($cleanWa) >= 10) {
                $actions[] = [
                    'label' => '💬 Abrir WhatsApp',
                    'url' => "https://wa.me/{$cleanWa}",
                    'type' => 'link',
                ];
            }
        }

        return [
            'type' => 'client_created',
            'message' => $msg,
            'quick_actions' => $actions,
        ];
    }

    public function handleListClientes(User $user, int $empresaId): array
    {
        $clientes = Cliente::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->latest()
            ->take(6)
            ->get();

        if ($clientes->isEmpty()) {
            return [
                'type' => 'clients',
                'message' => "👤 **Clientes:** No tienes clientes registrados todavía.",
                'quick_actions' => [
                    ['label' => '➕ Crear Cliente', 'text' => 'crear cliente Juan Perez 04121234567'],
                    ['label' => 'Directorio ↗', 'url' => '/admin/clientes', 'type' => 'link'],
                ],
            ];
        }

        $lines = ["👤 **Clientes Registrados Recientes:**\n"];
        foreach ($clientes as $c) {
            $tel = $c->telefono ? "📞 {$c->telefono}" : '';
            $mail = $c->email ? "✉️ {$c->email}" : '';
            $extra = array_filter([$tel, $mail]);
            $extraStr = $extra ? ' (' . implode(' | ', $extra) . ')' : '';
            $lines[] = "• **{$c->nombre}**{$extraStr}";
        }

        return [
            'type' => 'clients',
            'message' => implode("\n", $lines),
            'quick_actions' => [
                ['label' => '👤 Directorio Completo ↗', 'url' => '/admin/clientes', 'type' => 'link'],
                ['label' => '➕ Nuevo Cliente', 'text' => 'crear cliente [Nombre] [Telefono]'],
                ['label' => '🔧 Nueva Reparación ↗', 'url' => '/admin/reparaciones/create', 'type' => 'link'],
            ],
        ];
    }

    public function handleSearchCliente(User $user, int $empresaId, string $term): array
    {
        $clean = trim($term);
        $clientes = Cliente::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($clean) {
                $q->where('nombre', 'like', "%{$clean}%")
                  ->orWhere('telefono', 'like', "%{$clean}%")
                  ->orWhere('email', 'like', "%{$clean}%");
            })
            ->take(5)
            ->get();

        if ($clientes->isEmpty()) {
            return [
                'type' => 'not_found',
                'message' => "❌ No se encontró ningún cliente que coincida con **\"{$clean}\"**.",
                'quick_actions' => [
                    ['label' => "➕ Crear Cliente {$clean}", 'text' => "crear cliente {$clean}"],
                    ['label' => '👤 Directorio ↗', 'url' => '/admin/clientes', 'type' => 'link'],
                ],
            ];
        }

        if ($clientes->count() === 1) {
            $c = $clientes->first();
            $currency = $this->getCurrencySymbol($empresaId);
            $msg = "👤 **Cliente Encontrado:**\n\n"
                . "• **Nombre:** **{$c->nombre}**\n"
                . "• **Teléfono:** " . ($c->telefono ?: 'No asignado') . "\n"
                . "• **Email:** " . ($c->email ?: 'No asignado') . "\n"
                . "• **Dirección:** " . ($c->direccion ?: 'No asignada') . "\n"
                . "• **Saldo Pendiente:** {$currency}" . number_format((float)$c->saldo_pendiente, 2);

            $actions = [
                ['label' => '👤 Ver Ficha ↗', 'url' => "/admin/clientes?search=" . urlencode($c->nombre), 'type' => 'link'],
                ['label' => '🔧 Nueva Reparación ↗', 'url' => '/admin/reparaciones/create', 'type' => 'link'],
            ];
            if ($c->telefono) {
                $cleanWa = preg_replace('/\D/', '', $c->telefono);
                if (strlen($cleanWa) >= 10) {
                    $actions[] = ['label' => '💬 WhatsApp', 'url' => "https://wa.me/{$cleanWa}", 'type' => 'link'];
                }
            }

            return [
                'type' => 'client_found',
                'message' => $msg,
                'quick_actions' => $actions,
            ];
        }

        $lines = ["👤 **Clientes encontrados con \"{$clean}\":**\n"];
        foreach ($clientes as $c) {
            $tel = $c->telefono ? "📞 {$c->telefono}" : '';
            $lines[] = "• **{$c->nombre}** {$tel}";
        }

        return [
            'type' => 'clients',
            'message' => implode("\n", $lines),
            'quick_actions' => [
                ['label' => '👤 Ver en Directorio ↗', 'url' => "/admin/clientes?search=" . urlencode($clean), 'type' => 'link'],
            ],
        ];
    }

    // ==========================================
    // MANEJADORES DE CAJA CHICA Y TURNO
    // ==========================================

    public function handleCashRegisterStatus(User $user, int $empresaId, ?int $sucursalId): array
    {
        $register = CashRegister::getActiveRegister($user);
        $currency = $this->getCurrencySymbol($empresaId);

        if (!$register) {
            return [
                'type' => 'cash_closed',
                'message' => "🔒 **Caja Cerrada**\n\nNo tienes ninguna caja o turno abierto actualmente en esta sucursal.\n\nPuedes abrir tu caja escribiendo `abrir caja [monto]` o con los botones rápidos.",
                'quick_actions' => [
                    ['label' => '🟢 Abrir Caja con $0', 'text' => 'abrir caja 0'],
                    ['label' => '🟢 Abrir Caja con $50', 'text' => 'abrir caja 50'],
                    ['label' => '🛒 Ir al POS ↗', 'url' => '/admin/pos', 'type' => 'link'],
                ],
            ];
        }

        $cashService = app(CashRegisterService::class);
        $summary = $cashService->getRegisterFinancialSummary($register);

        $openedAt = $register->opened_at ? Carbon::parse($register->opened_at)->format('h:i A') : 'Hoy';
        $userName = $register->user?->name ?: $user->name;

        $msg = "💰 **Turno de Caja Activo (#{$register->id})**\n\n"
            . "• **Cajero:** {$userName}\n"
            . "• **Hora de Apertura:** {$openedAt}\n"
            . "• **Monto de Apertura:** {$currency}" . number_format($summary['opening_amount'], 2) . "\n"
            . "• **Ingresos del Turno:** {$currency}" . number_format($summary['inflows'], 2) . "\n"
            . "• **Gastos / Egresos:** {$currency}" . number_format($summary['outflows'], 2) . "\n"
            . "• **Efectivo en Gaveta:** {$currency}" . number_format($summary['expected_cash_balance'], 2) . "\n"
            . "• **Cobros Electrónicos:** {$currency}" . number_format($summary['electronic_inflows'], 2) . "\n"
            . "• **Balance Total Turno:** {$currency}" . number_format($summary['total_turn_balance'], 2);

        return [
            'type' => 'cash_status',
            'message' => $msg,
            'quick_actions' => [
                ['label' => '➕ Registrar Gasto', 'text' => 'gasto 10 motivo '],
                ['label' => '➕ Ingreso Dinero', 'text' => 'ingreso caja 20 motivo '],
                ['label' => '🔒 Cerrar Caja', 'text' => 'cerrar caja ' . number_format($summary['expected_cash_balance'], 2, '.', '')],
                ['label' => '🛒 Ver en POS ↗', 'url' => '/admin/pos', 'type' => 'link'],
            ],
        ];
    }

    public function handleOpenCashRegister(User $user, int $empresaId, ?int $sucursalId, float $openingAmount): array
    {
        $existing = CashRegister::getActiveRegister($user);
        $currency = $this->getCurrencySymbol($empresaId);

        if ($existing) {
            return [
                'type' => 'warning',
                'message' => "⚠️ Ya tienes una caja abierta actualmente (**Caja #{$existing->id}** abierta con {$currency}" . number_format((float)$existing->opening_amount, 2) . ").\n\nDebes cerrar la caja actual antes de iniciar una nueva.",
                'quick_actions' => [
                    ['label' => '💰 Ver Estado de Caja', 'action' => 'get_cash_status'],
                    ['label' => '🔒 Cerrar Caja Actual', 'text' => 'cerrar caja'],
                ],
            ];
        }

        $cashService = app(CashRegisterService::class);
        $register = $cashService->openRegister($user->id, max(0, $openingAmount));

        return [
            'type' => 'cash_opened',
            'message' => "🟢 **¡Caja Abierta Exitosamente!**\n\n"
                . "• **Número de Caja:** #{$register->id}\n"
                . "• **Monto Inicial:** {$currency}" . number_format($openingAmount, 2) . "\n"
                . "• **Hora de Apertura:** " . Carbon::now()->format('h:i A') . "\n"
                . "• **Responsable:** {$user->name}",
            'quick_actions' => [
                ['label' => '💰 Ver Estado', 'action' => 'get_cash_status'],
                ['label' => '➕ Registrar Gasto', 'text' => 'gasto 10 motivo '],
                ['label' => '🛒 Ir al POS ↗', 'url' => '/admin/pos', 'type' => 'link'],
            ],
        ];
    }

    public function handleCloseCashRegister(User $user, int $empresaId, ?int $sucursalId, ?float $countedAmount): array
    {
        $register = CashRegister::getActiveRegister($user);
        $currency = $this->getCurrencySymbol($empresaId);

        if (!$register) {
            return [
                'type' => 'warning',
                'message' => "⚠️ No hay ninguna caja abierta en este momento para cerrar.",
                'quick_actions' => [
                    ['label' => '🟢 Abrir Caja con $0', 'text' => 'abrir caja 0'],
                ],
            ];
        }

        $cashService = app(CashRegisterService::class);
        $summary = $cashService->getRegisterFinancialSummary($register);
        $expectedCash = (float)$summary['expected_cash_balance'];

        $counted = $countedAmount !== null ? $countedAmount : $expectedCash;
        $closedRegister = $cashService->closeRegister($register, $counted);

        $diff = (float)$closedRegister->difference;
        $diffText = $diff == 0
            ? "Exacto (sin diferencia)"
            : ($diff > 0 ? "Sobrante de {$currency}" . number_format($diff, 2) : "Faltante de {$currency}" . number_format(abs($diff), 2));

        return [
            'type' => 'cash_closed',
            'message' => "🔒 **¡Caja #{$closedRegister->id} Cerrada!**\n\n"
                . "• **Total Ventas / Ingresos:** {$currency}" . number_format($summary['inflows'], 2) . "\n"
                . "• **Total Gastos:** {$currency}" . number_format($summary['outflows'], 2) . "\n"
                . "• **Efectivo Esperado:** {$currency}" . number_format($expectedCash, 2) . "\n"
                . "• **Efectivo Contado:** {$currency}" . number_format($counted, 2) . "\n"
                . "• **Diferencia:** {$diffText}\n"
                . "• **Hora de Cierre:** " . Carbon::now()->format('h:i A'),
            'quick_actions' => [
                ['label' => '🟢 Abrir Nueva Caja', 'text' => 'abrir caja 0'],
                ['label' => '🏦 Ver Fondo de Mes', 'action' => 'get_monthly_fund'],
            ],
        ];
    }

    public function handleAddCashMovement(User $user, string $type, float $amount, string $reason): array
    {
        $register = CashRegister::getActiveRegister($user);
        $currency = $this->getCurrencySymbol($user->empresa_id ?: 1);

        if (!$register) {
            return [
                'type' => 'warning',
                'message' => "⚠️ No tienes una caja abierta. Para registrar un " . ($type === 'outflow' ? 'gasto' : 'ingreso') . ", primero abre la caja.",
                'quick_actions' => [
                    ['label' => '🟢 Abrir Caja con $0', 'text' => 'abrir caja 0'],
                ],
            ];
        }

        if ($amount <= 0) {
            return ['type' => 'error', 'message' => 'El monto debe ser mayor a cero.'];
        }

        $cashService = app(CashRegisterService::class);
        $concepto = $type === 'outflow' ? 'gasto' : 'ingreso_manual';
        $movement = $cashService->addMovement(
            $register,
            $type,
            $concepto,
            'efectivo',
            $amount,
            $reason,
            $user->id
        );

        $summary = $cashService->getRegisterFinancialSummary($register);
        $typeLabel = $type === 'outflow' ? '🔴 Gasto registrado' : '🟢 Ingreso registrado';

        return [
            'type' => 'cash_movement',
            'message' => "{$typeLabel} en **Caja #{$register->id}**:\n\n"
                . "• **Monto:** {$currency}" . number_format($amount, 2) . "\n"
                . "• **Motivo:** {$reason}\n"
                . "• **Efectivo en Gaveta:** {$currency}" . number_format($summary['expected_cash_balance'], 2),
            'quick_actions' => [
                ['label' => '💰 Estado de Caja', 'action' => 'get_cash_status'],
                ['label' => '➕ Otro Gasto', 'text' => 'gasto '],
            ],
        ];
    }

    // ==========================================
    // MANEJADORES DE CRÉDITO Y COBRANZAS
    // ==========================================

    public function handleListDebtors(User $user, int $empresaId): array
    {
        $currency = $this->getCurrencySymbol($empresaId);
        $deudores = Cliente::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('saldo_pendiente', '>', 0)
            ->orderByDesc('saldo_pendiente')
            ->take(10)
            ->get();

        if ($deudores->isEmpty()) {
            return [
                'type' => 'info',
                'message' => "🎉 **Cuentas al Día:** No tienes clientes con saldos pendientes por cobrar en este momento.",
                'quick_actions' => [
                    ['label' => '👤 Ver Clientes', 'action' => 'list_clientes'],
                    ['label' => '🎯 Metas Ventas', 'action' => 'get_sales_goals'],
                ],
            ];
        }

        $totalCartera = (float) Cliente::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where('saldo_pendiente', '>', 0)
            ->sum('saldo_pendiente');

        $lines = ["📋 **Cartera de Cuentas por Cobrar**\n", "• **Total por Cobrar:** {$currency}" . number_format($totalCartera, 2) . "\n"];
        $actions = [];

        foreach ($deudores as $c) {
            $tel = $c->telefono ? " (📞 {$c->telefono})" : "";
            $lines[] = "• **{$c->nombre}**: {$currency}" . number_format((float)$c->saldo_pendiente, 2) . "{$tel}";
            if (count($actions) < 4) {
                $actions[] = [
                    'label' => "💵 Cobrar a " . Str::limit($c->nombre, 12),
                    'text' => "abonar " . number_format((float)$c->saldo_pendiente, 0, '', '') . " a {$c->nombre}",
                ];
            }
        }

        $actions[] = [
            'label' => '👤 Directorio Clientes ↗',
            'url' => '/admin/clientes',
            'type' => 'link',
        ];

        return [
            'type' => 'debtors',
            'message' => implode("\n", $lines),
            'quick_actions' => $actions,
        ];
    }

    public function handleClientDebt(User $user, int $empresaId, string $clientTerm): array
    {
        $clean = trim($clientTerm);
        $currency = $this->getCurrencySymbol($empresaId);

        $cliente = Cliente::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($clean) {
                $q->where('nombre', 'like', "%{$clean}%")
                  ->orWhere('telefono', 'like', "%{$clean}%");
            })
            ->first();

        if (!$cliente) {
            return [
                'type' => 'not_found',
                'message' => "❌ No se encontró ningún cliente coincidente con **\"{$clean}\"**.",
                'quick_actions' => [
                    ['label' => '📋 Clientes con Deuda', 'action' => 'list_debtors'],
                    ['label' => '👤 Ver Clientes', 'action' => 'list_clientes'],
                ],
            ];
        }

        $saldo = (float) $cliente->saldo_pendiente;
        $limite = (float) $cliente->limite_credito;

        $msg = "💳 **Estado de Crédito de {$cliente->nombre}**\n\n"
            . "• **Saldo Pendiente:** {$currency}" . number_format($saldo, 2) . "\n"
            . "• **Límite de Crédito:** {$currency}" . number_format($limite, 2) . "\n"
            . "• **Teléfono:** " . ($cliente->telefono ?: 'No asignado') . "\n"
            . "• **Email:** " . ($cliente->email ?: 'No asignado');

        $actions = [];
        if ($saldo > 0) {
            $actions[] = [
                'label' => '💵 Abonar Total',
                'text' => "abonar " . number_format($saldo, 2, '.', '') . " a {$cliente->nombre}",
            ];
            $actions[] = [
                'label' => '💵 Abonar Parcial',
                'text' => "abonar  a {$cliente->nombre}",
            ];
        } else {
            $msg .= "\n\n✅ Este cliente se encuentra al día con sus pagos.";
        }

        $actions[] = [
            'label' => '👤 Ver Ficha ↗',
            'url' => "/admin/clientes?search=" . urlencode($cliente->nombre),
            'type' => 'link',
        ];

        return [
            'type' => 'client_debt',
            'message' => $msg,
            'quick_actions' => $actions,
        ];
    }

    public function handleClientCreditPayment(
        User $user,
        int $empresaId,
        ?int $sucursalId,
        string $clientTerm,
        float $amount,
        string $method = 'efectivo',
        ?string $note = null
    ): array {
        $currency = $this->getCurrencySymbol($empresaId);
        $clean = trim($clientTerm);

        $cliente = Cliente::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($clean) {
                $q->where('nombre', 'like', "%{$clean}%")
                  ->orWhere('telefono', 'like', "%{$clean}%");
            })
            ->first();

        if (!$cliente) {
            return [
                'type' => 'not_found',
                'message' => "❌ No se encontró ningún cliente coincidente con **\"{$clean}\"**.",
            ];
        }

        if ($amount <= 0) {
            return ['type' => 'error', 'message' => 'El monto del abono debe ser mayor a cero.'];
        }

        $saldoActual = (float) $cliente->saldo_pendiente;
        if ($saldoActual <= 0) {
            return [
                'type' => 'info',
                'message' => "ℹ️ El cliente **{$cliente->nombre}** ya está al día (saldo pendiente: {$currency}0.00). No es necesario realizar abonos.",
            ];
        }

        $montoPagar = min($amount, $saldoActual);

        // Buscar ventas a crédito pendientes
        $sales = Sale::withoutGlobalScope('multitenancy')
            ->where('cliente_id', $cliente->id)
            ->where('saldo_credito', '>', 0)
            ->orderBy('id')
            ->get();

        $restanteParaVentas = $montoPagar;
        $salesUpdated = 0;

        foreach ($sales as $sale) {
            if ($restanteParaVentas <= 0) break;
            $payForSale = min($restanteParaVentas, (float)$sale->saldo_credito);
            $sale->decrement('saldo_credito', $payForSale);
            $restanteParaVentas -= $payForSale;
            $salesUpdated++;

            try {
                CreditPayment::create([
                    'sale_id' => $sale->id,
                    'cliente_id' => $cliente->id,
                    'metodo_pago' => $method,
                    'monto' => $payForSale,
                    'nota' => $note ?: "Abono recibido vía Copiloto FixSale",
                    'received_by' => $user->id,
                ]);
            } catch (\Throwable $e) {
                Log::warning("No se pudo crear CreditPayment para venta {$sale->id}: " . $e->getMessage());
            }
        }

        if ($salesUpdated === 0) {
            $lastSale = Sale::withoutGlobalScope('multitenancy')
                ->where('cliente_id', $cliente->id)
                ->latest('id')
                ->first();

            if ($lastSale) {
                try {
                    CreditPayment::create([
                        'sale_id' => $lastSale->id,
                        'cliente_id' => $cliente->id,
                        'metodo_pago' => $method,
                        'monto' => $montoPagar,
                        'nota' => $note ?: "Abono general a cuenta cliente vía Copiloto FixSale",
                        'received_by' => $user->id,
                    ]);
                } catch (\Throwable $e) {
                    // Silencioso
                }
            }
        }

        $cliente->decrement('saldo_pendiente', $montoPagar);
        $nuevoSaldo = max(0, $saldoActual - $montoPagar);

        $cashRegister = CashRegister::getActiveRegister($user);
        if ($cashRegister && $montoPagar > 0) {
            try {
                app(CashRegisterService::class)->addMovement(
                    $cashRegister,
                    'inflow',
                    'venta',
                    $method,
                    $montoPagar,
                    "Abono crédito de {$cliente->nombre}",
                    $user->id
                );
            } catch (\Throwable $e) {
                Log::warning("Error ingresando abono a caja: " . $e->getMessage());
            }
        }

        $msg = "💵 **¡Abono Registrado Exitosamente!**\n\n"
            . "• **Cliente:** {$cliente->nombre}\n"
            . "• **Monto Abonado:** {$currency}" . number_format($montoPagar, 2) . "\n"
            . "• **Método de Pago:** " . ucfirst($method) . "\n"
            . "• **Saldo Anterior:** {$currency}" . number_format($saldoActual, 2) . "\n"
            . "• **Saldo Restante:** {$currency}" . number_format($nuevoSaldo, 2) . "\n"
            . ($cashRegister ? "• **Caja Activa:** Ingreso registrado en Caja #{$cashRegister->id}\n" : "");

        $actions = [
            ['label' => '💳 Ver Deuda Cliente', 'text' => "deuda de {$cliente->nombre}"],
            ['label' => '📋 Cartera de Deudas', 'action' => 'list_debtors'],
            ['label' => '👤 Ver Ficha ↗', 'url' => "/admin/clientes?search=" . urlencode($cliente->nombre), 'type' => 'link'],
        ];

        return [
            'type' => 'credit_payment',
            'message' => $msg,
            'quick_actions' => $actions,
        ];
    }

    // ==========================================
    // CREACIÓN RÁPIDA DE ORDEN DE REPARACIÓN
    // ==========================================

    public function handleCreateRepairOrder(
        User $user,
        int $empresaId,
        ?int $sucursalId,
        array $data
    ): array {
        $currency = $this->getCurrencySymbol($empresaId);
        $clientName = trim($data['cliente'] ?? '');
        $phone = trim($data['telefono'] ?? '');
        $device = trim($data['equipo'] ?? '');
        $falla = trim($data['falla'] ?? '');
        $costo = (float)($data['costo'] ?? 0);

        // 1. Validación de comando vacío o sin datos mínimos
        if (!empty($data['missing_required'])) {
            return [
                'type' => 'error',
                'message' => "⚠️ **Datos requeridos para crear orden de servicio**\n\n"
                    . "Para registrar una nueva orden en el taller, es obligatorio indicar el **Nombre** y el **Teléfono** del cliente.\n\n"
                    . "👉 **Formato requerido:**\n"
                    . "`crear orden cliente [Nombre] telefono [Teléfono] equipo [Dispositivo] falla [Problema] costo [Monto]`\n\n"
                    . "💡 **Ejemplo real:**\n"
                    . "`crear orden cliente Carlos Mendoza telefono 04141234567 equipo iPhone 11 falla pantalla rota costo 45`\n\n"
                    . "🔍 *Si el cliente ya existe en el sistema se asociará automáticamente por su teléfono o nombre (Cliente ID); si no existe, se creará su ficha al instante.*",
                'quick_actions' => [
                    [
                        'label' => '➕ Usar formato de ejemplo',
                        'text' => 'crear orden cliente Carlos Mendoza telefono 04141234567 equipo iPhone 11 falla pantalla rota costo 45',
                    ],
                    [
                        'label' => '📋 Ir a Taller ↗',
                        'url' => '/admin/reparaciones',
                        'type' => 'link',
                    ],
                ],
            ];
        }

        // 2. Obligatoriedad estricta de Nombre y Teléfono del cliente
        if ($clientName === '' || $phone === '') {
            $missing = [];
            if ($clientName === '') {
                $missing[] = 'el **Nombre**';
            }
            if ($phone === '') {
                $missing[] = 'el **Teléfono**';
            }
            $missingText = implode(' y ', $missing);

            return [
                'type' => 'error',
                'message' => "⚠️ **Datos obligatorios incompletos**\n\n"
                    . "Para registrar una orden de servicio es obligatorio indicar {$missingText} del cliente.\n\n"
                    . "👉 **Formato requerido:**\n"
                    . "`crear orden cliente [Nombre] telefono [Teléfono] equipo [Dispositivo] falla [Problema] costo [Monto]`\n\n"
                    . "💡 **Ejemplo:**\n"
                    . "`crear orden cliente " . ($clientName ?: 'Carlos Mendoza') . " telefono 04141234567 equipo " . ($device ?: 'iPhone 11') . " falla " . ($falla ?: 'pantalla rota') . " costo " . ($costo > 0 ? $costo : '45') . "`\n\n"
                    . "🔍 *Si el cliente ya existe en el sistema se asociará su ficha (`cliente_id`); si no existe, se registrará como nuevo automáticamente.*",
            ];
        }

        $cleanPhoneDigits = preg_replace('/\D/', '', $phone);
        if (strlen($cleanPhoneDigits) < 7) {
            return [
                'type' => 'error',
                'message' => "⚠️ **Teléfono de cliente inválido**\n\n"
                    . "El teléfono indicado (`{$phone}`) debe tener al menos 7 dígitos para poder contactar al cliente o enviarle el tracking de su orden.\n\n"
                    . "👉 **Ejemplo:** `crear orden cliente {$clientName} telefono 04141234567 equipo " . ($device ?: 'iPhone 11') . " falla " . ($falla ?: 'pantalla rota') . "`",
            ];
        }

        if ($falla === '') {
            $falla = 'Revisión técnica general';
        }
        if ($device === '') {
            $device = 'Dispositivo móvil';
        }

        // 3. Buscar si el cliente ya existe (primero por teléfono, luego por nombre)
        $cliente = null;
        if (strlen($cleanPhoneDigits) >= 7) {
            $last7Digits = substr($cleanPhoneDigits, -7);
            $cliente = Cliente::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where(function ($q) use ($phone, $cleanPhoneDigits, $last7Digits) {
                    $q->where('telefono', $phone)
                      ->orWhere('telefono', 'like', "%{$cleanPhoneDigits}%")
                      ->orWhere('telefono', 'like', "%{$last7Digits}%");
                })
                ->first();
        }

        if (!$cliente && $clientName !== '') {
            $cliente = Cliente::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where(function ($q) use ($clientName) {
                    $q->whereRaw('LOWER(TRIM(nombre)) = ?', [strtolower(trim($clientName))])
                      ->orWhere('nombre', 'like', $clientName);
                })
                ->first();
        }

        // 4. Si no existe se crea; si existe se asocia su cliente_id
        $isNewClient = false;
        if (!$cliente) {
            $cliente = Cliente::create([
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId ?: $user->sucursal_id,
                'nombre' => $clientName,
                'telefono' => $phone,
                'estado' => true,
            ]);
            $isNewClient = true;
        } else {
            // Cliente existente: si no tenía teléfono, se lo actualizamos
            if (empty($cliente->telefono) && !empty($phone)) {
                $cliente->update(['telefono' => $phone]);
            }
        }

        // 5. Resolver marca y modelo a partir de $device
        $marcaId = null;
        $marcaNombre = 'General';
        $modeloId = null;
        $modeloNombre = $device;

        $marcas = Marca::withoutGlobalScope('multitenancy')->where('empresa_id', $empresaId)->get();
        foreach ($marcas as $m) {
            if (stripos($device, $m->nombre) !== false) {
                $marcaId = $m->id;
                $marcaNombre = $m->nombre;
                $remaining = trim(str_ireplace($m->nombre, '', $device));
                if ($remaining !== '') {
                    $modeloNombre = $remaining;
                }
                break;
            }
        }

        // 6. Correlativo folio REP-XXXXXX
        $lastOrder = OrdenReparacion::withoutGlobalScopes()
            ->where('empresa_id', $empresaId)
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId))
            ->orderByDesc('id')
            ->first();

        $nextNum = 1;
        if ($lastOrder && preg_match('/(\d+)$/', $lastOrder->numero_orden, $matches)) {
            $nextNum = ((int) $matches[1]) + 1;
        }

        while (OrdenReparacion::withoutGlobalScopes()->where('empresa_id', $empresaId)->where('numero_orden', 'REP-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT))->exists()) {
            $nextNum++;
        }

        $numeroOrden = 'REP-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);

        // 7. Crear la orden de servicio vinculando cliente_id
        $orden = OrdenReparacion::create([
            'empresa_id' => $empresaId,
            'sucursal_id' => $sucursalId ?: $user->sucursal_id,
            'numero_orden' => $numeroOrden,
            'cliente_id' => $cliente->id, // <<-- Asociado cliente_id
            'cliente_nombre' => $cliente->nombre,
            'cliente_telefono' => $cliente->telefono ?: $phone,
            'tipo_dispositivo' => 'Smartphone',
            'marca_id' => $marcaId,
            'marca_nombre' => $marcaNombre,
            'modelo_id' => $modeloId,
            'modelo_nombre' => $modeloNombre,
            'descripcion_falla' => $falla,
            'costo_estimado' => $costo,
            'anticipo' => 0.00,
            'saldo_restante' => $costo,
            'estado_orden' => 'recibido',
            'fecha_recepcion' => Carbon::now(),
        ]);

        OrdenReparacionHistorial::create([
            'orden_id' => $orden->id,
            'user_id' => $user->id,
            'estado_anterior' => null,
            'estado_nuevo' => 'recibido',
            'comentario' => 'Orden de recepción creada desde Fixy (Copilot FixSale).',
        ]);

        $trackingUrl = url("/reparacion/{$empresaId}/consultar?orden={$orden->numero_orden}");

        $clientStatusBadge = $isNewClient
            ? "*(Nuevo cliente registrado #{$cliente->id})*"
            : "*(Cliente existente vinculado #{$cliente->id})*";

        $msg = "🔧 **¡Orden de Servicio Creada Exitosamente!**\n\n"
            . "• **Número de Orden:** **{$orden->numero_orden}**\n"
            . "• **Cliente:** {$cliente->nombre} (📞 {$cliente->telefono}) {$clientStatusBadge}\n"
            . "• **Cliente ID:** #{$cliente->id}\n"
            . "• **Equipo:** {$marcaNombre} {$modeloNombre}\n"
            . "• **Falla reportada:** {$falla}\n"
            . "• **Costo estimado:** {$currency}" . number_format($costo, 2) . "\n"
            . "• **Estado inicial:** Recibido";

        $actions = [
            [
                'label' => "🔍 Ver Orden {$orden->numero_orden} ↗",
                'url' => "/admin/reparaciones/{$orden->id}",
                'type' => 'link',
            ],
            [
                'label' => '📋 Ir a Taller ↗',
                'url' => '/admin/reparaciones',
                'type' => 'link',
            ],
        ];

        if ($cliente->telefono) {
            $cleanWa = preg_replace('/\D/', '', $cliente->telefono);
            if (strlen($cleanWa) >= 10) {
                $waMsg = "Hola {$cliente->nombre}, hemos recibido su equipo {$marcaNombre} {$modeloNombre} (Orden {$orden->numero_orden}). Puede consultar el estado en vivo aquí: {$trackingUrl}";
                $actions[] = [
                    'label' => '💬 Notificar por WhatsApp',
                    'url' => "https://wa.me/{$cleanWa}?text=" . urlencode($waMsg),
                    'type' => 'link',
                ];
            }
        }

        $actions[] = [
            'label' => '🗑️ Eliminar Orden',
            'action' => 'delete_order',
            'params' => ['order_number' => $orden->numero_orden],
            'variant' => 'danger',
        ];

        return [
            'type' => 'repair_created',
            'message' => $msg,
            'order' => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'cliente_id' => $cliente->id,
                'cliente_nombre' => $cliente->nombre,
                'cliente_telefono' => $cliente->telefono ?: 'Sin teléfono',
                'cliente_es_nuevo' => $isNewClient,
                'equipo' => "{$marcaNombre} {$modeloNombre}",
                'falla' => $falla,
                'estado_clave' => 'recibido',
                'estado_label' => 'Recibido',
                'tecnico' => 'Sin asignar',
                'saldo_restante' => "{$currency}" . number_format($costo, 2),
            ],
            'quick_actions' => $actions,
        ];
    }

    // ==========================================
    // ELIMINACIÓN DE ORDEN DE REPARACIÓN / SERVICIO
    // ==========================================

    protected function buildDeleteConfirmation(int $empresaId, string $orderIdentifier): array
    {
        $orden = $this->findOrderModel($empresaId, $orderIdentifier);

        if (!$orden) {
            return [
                'type' => 'error',
                'message' => "❌ No se encontró ninguna orden de reparación con el código o número **#{$orderIdentifier}**.",
            ];
        }

        $clienteNombre = $orden->cliente?->nombre ?: ($orden->cliente_nombre ?: 'Cliente');
        $equipo = trim(($orden->marca_nombre ?? '') . ' ' . ($orden->modelo_nombre ?? '')) ?: 'Dispositivo';

        return [
            'type' => 'confirm_delete',
            'message' => "⚠️ **¿Eliminar la orden {$orden->numero_orden}?**\n\n"
                . "• **Cliente:** {$clienteNombre}\n"
                . "• **Equipo:** {$equipo}\n\n"
                . "Esta acción no se puede deshacer. Se eliminarán también su historial, fotos y repuestos asignados (el stock se devolverá al inventario).",
            'quick_actions' => [
                [
                    'label' => '🗑️ Sí, eliminar',
                    'action' => 'delete_order',
                    'params' => ['order_number' => $orden->numero_orden, 'confirmed' => true],
                    'variant' => 'danger',
                ],
                [
                    'label' => 'Cancelar',
                    'action' => 'cancel_action',
                ],
            ],
        ];
    }

    public function handleDeleteRepairOrder(
        User $user,
        int $empresaId,
        string $orderIdentifier
    ): array {
        $orden = $this->findOrderModel($empresaId, $orderIdentifier);

        if (!$orden) {
            return [
                'type' => 'error',
                'message' => "❌ No se encontró ninguna orden de reparación con el código o número **#{$orderIdentifier}**.",
                'quick_actions' => [
                    ['label' => '📋 Ir al Taller ↗', 'url' => '/admin/reparaciones', 'type' => 'link'],
                    ['label' => '📊 Resumen de Hoy', 'action' => 'get_summary'],
                ],
            ];
        }

        // Si la orden ya está facturada o cobrada en Caja/POS
        if ($orden->sale_id) {
            return [
                'type' => 'error',
                'message' => "⚠️ La orden **{$orden->numero_orden}** no puede eliminarse porque está vinculada a una venta o cobro registrado en caja (Ticket/Venta #{$orden->sale_id}).\n\n"
                    . "💡 Para preservar la coherencia contable y de caja, primero gestiona o cancela el cobro asociado antes de eliminar la orden.",
                'quick_actions' => [
                    ['label' => "🔍 Ver Venta #{$orden->sale_id} ↗", 'url' => "/admin/pos?sale_id={$orden->sale_id}", 'type' => 'link'],
                    ['label' => "🔍 Ver Orden {$orden->numero_orden} ↗", 'url' => "/admin/reparaciones/{$orden->id}", 'type' => 'link'],
                ],
            ];
        }

        $numeroOrden = $orden->numero_orden;
        $clienteNombre = $orden->cliente?->nombre ?: ($orden->cliente_nombre ?: 'Cliente');
        $clienteTelefono = $orden->cliente?->telefono ?: ($orden->cliente_telefono ?: '');
        $equipo = trim(($orden->marca_nombre ?? '') . ' ' . ($orden->modelo_nombre ?? ''));
        if ($equipo === '') {
            $equipo = $orden->tipo_dispositivo ?? 'Dispositivo';
        }
        $falla = $orden->descripcion_falla ?: 'Revisión técnica';
        $estadoPrevio = $orden->estado_orden ?? 'recibido';
        $itemsCount = $orden->items()->count();

        DB::transaction(function () use ($orden) {
            // 1. Restaurar stock de repuestos del inventario si habían sido descontados
            foreach ($orden->items as $item) {
                if ($item->producto_id && $item->cantidad > 0) {
                    $producto = Producto::withoutGlobalScope('multitenancy')->find($item->producto_id);
                    if ($producto) {
                        $producto->increment('stock', $item->cantidad);
                    }
                }
            }

            // 2. Eliminar relaciones dependientes
            $orden->items()->delete();
            $orden->historial()->delete();
            $orden->fotos()->delete();

            // 3. Eliminar la orden
            $orden->delete();
        });

        $msg = "🗑️ **¡Orden de Servicio Eliminada Exitosamente!**\n\n"
            . "• **Número de Orden:** **{$numeroOrden}**\n"
            . "• **Cliente:** {$clienteNombre}" . ($clienteTelefono ? " (📞 {$clienteTelefono})" : "") . "\n"
            . "• **Equipo:** {$equipo}\n"
            . "• **Falla:** {$falla}\n"
            . "• **Estado que tenía:** " . ucfirst(str_replace('_', ' ', $estadoPrevio)) . "\n\n"
            . "✅ Se liberaron del sistema los registros, el historial" . ($itemsCount > 0 ? " y el stock de repuestos asignados" : "") . ".";

        return [
            'type' => 'repair_deleted',
            'message' => $msg,
            'deleted_order' => [
                'numero_orden' => $numeroOrden,
                'cliente' => $clienteNombre,
                'equipo' => $equipo,
            ],
            'quick_actions' => [
                [
                    'label' => '📋 Ir a Lista de Órdenes ↗',
                    'url' => '/admin/reparaciones',
                    'type' => 'link',
                ],
                [
                    'label' => '➕ Crear Nueva Orden',
                    'text' => 'crear orden ',
                ],
                [
                    'label' => '📊 Resumen del Taller',
                    'action' => 'get_summary',
                ],
            ],
        ];
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

        $quickActions[] = [
            'label' => '🗑️ Eliminar Orden',
            'action' => 'delete_order',
            'params' => ['order_number' => $orden->numero_orden],
            'variant' => 'danger',
        ];

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

    /**
     * Consulta el stock y existencias de productos, repuestos, categorías y servicios.
     *
     * @param User $user
     * @param int $empresaId
     * @param int|null $sucursalId
     * @param array|string $queryData
     * @return array
     */
    protected function handleStockSearch(User $user, int $empresaId, ?int $sucursalId, $queryData): array
    {
        if (is_string($queryData)) {
            $term = trim($queryData);
            $filter = 'all';
        } else {
            $term = trim($queryData['term'] ?? '');
            $filter = $queryData['filter'] ?? 'all';
        }

        // 1. Caso de explicación conceptual entre repuesto y servicio
        if ($filter === 'concept') {
            return [
                'type' => 'concept_info',
                'message' => "💡 **Diferencias entre Repuestos y Servicios en FixSale:**\n\n" .
                    "🛠️ **Repuestos (Inventario Físico):**\n" .
                    "• Son piezas físicas y componentes de recambio (ej: pantallas OLED, baterías, pines de carga, flex, tapas traseras).\n" .
                    "• **Sí manejan existencia física (`stock`)**: se descuentan de bodega automáticamente al usarse en órdenes de reparación o ventas de mostrador.\n" .
                    "• Tienen categoría asociada (ej: *DISPLAY, BATERIAS RECARGABLES*), código SKU, costo y precio de venta.\n\n" .
                    "⚙️ **Servicios Técnicos (Mano de Obra):**\n" .
                    "• Son trabajos técnicos, diagnósticos y mano de obra realizados por el personal (ej: *Cambio de Pantalla, Mantenimiento preventivo, Formateo*).\n" .
                    "• **NO manejan stock físico**: no ocupan espacio en bodega porque representan el valor de la labor técnica realizada.\n" .
                    "• Tienen código (`SERV-...`), tarifa sugerida de mano de obra y categoría de equipo (*Smartphone, Laptop*).\n\n" .
                    "📦 **Productos de Venta y Accesorios:**\n" .
                    "• Artículos comerciales para cliente final (cargadores, cables, audífonos, fundas) que también controlan stock físico en inventario.",
                'quick_actions' => [
                    ['label' => '🛠️ Ver Repuestos', 'text' => 'repuestos'],
                    ['label' => '⚙️ Ver Servicios', 'text' => 'servicios'],
                    ['label' => '📁 Ver Categorías', 'text' => 'ver categorias'],
                    ['label' => '⚠️ Stock Bajo', 'action' => 'get_stock_alerts'],
                ],
            ];
        }

        // 2. Si es solicitud directa de listado de servicios
        if ($filter === 'servicios_list') {
            return $this->handleListServicios($user, $empresaId);
        }

        $currency = $this->getCurrencySymbol($empresaId);
        $isRepuestoOnly = ($filter === 'repuesto');
        $isServicioOnly = ($filter === 'servicio');
        $isCategoriaOnly = ($filter === 'categoria');

        // 3. Consultar Productos / Repuestos
        $products = collect();
        if (!$isServicioOnly) {
            $prodQuery = Producto::withoutGlobalScope('multitenancy')
                ->with(['marca', 'modelo', 'categoria'])
                ->where('empresa_id', $empresaId)
                ->where('estado', true);

            if ($sucursalId) {
                $prodQuery->where('sucursal_id', $sucursalId);
            }

            if ($isRepuestoOnly) {
                $prodQuery->where('tipo_producto', 'repuesto');
            } elseif ($filter === 'producto') {
                $prodQuery->where('tipo_producto', '!=', 'repuesto');
            }

            if (!empty($term)) {
                if ($isCategoriaOnly) {
                    $prodQuery->whereHas('categoria', fn($c) => $c->where('nombre', 'like', "%{$term}%"));
                } else {
                    $prodQuery->where(function ($q) use ($term) {
                        $q->where('nombre_variante', 'like', "%{$term}%")
                            ->orWhere('sku', 'like', "%{$term}%")
                            ->orWhere('codigo_barras', 'like', "%{$term}%")
                            ->orWhereHas('categoria', fn($sub) => $sub->where('nombre', 'like', "%{$term}%"))
                            ->orWhereHas('marca', fn($sub) => $sub->where('nombre', 'like', "%{$term}%"))
                            ->orWhereHas('modelo', fn($sub) => $sub->where('nombre_comercial', 'like', "%{$term}%"));
                    });
                }
            }

            $products = $prodQuery->limit(8)->get();
        }

        // 4. Consultar Servicios Técnicos (Mano de Obra)
        $servicios = collect();
        if (!$isRepuestoOnly && $filter !== 'producto') {
            $servQuery = Servicio::withoutGlobalScope('multitenancy')
                ->with(['marca', 'modelo', 'categoria'])
                ->where('empresa_id', $empresaId)
                ->where('estado', true);

            if (!empty($term)) {
                if ($isCategoriaOnly) {
                    $servQuery->whereHas('categoria', fn($c) => $c->where('nombre', 'like', "%{$term}%"));
                } else {
                    $servQuery->where(function ($q) use ($term) {
                        $q->where('nombre', 'like', "%{$term}%")
                            ->orWhere('codigo', 'like', "%{$term}%")
                            ->orWhere('descripcion', 'like', "%{$term}%")
                            ->orWhereHas('categoria', fn($sub) => $sub->where('nombre', 'like', "%{$term}%"))
                            ->orWhereHas('marca', fn($sub) => $sub->where('nombre', 'like', "%{$term}%"))
                            ->orWhereHas('modelo', fn($sub) => $sub->where('nombre_comercial', 'like', "%{$term}%"));
                    });
                }
            }

            $servicios = $servQuery->limit(6)->get();
        }

        // 5. Si no se encontró nada
        if ($products->isEmpty() && $servicios->isEmpty()) {
            $labelTerm = !empty($term) ? "\"{$term}\"" : "tu consulta";
            return [
                'type' => 'not_found',
                'message' => "No encontré productos, repuestos ni servicios que coincidan con **{$labelTerm}**.\n\n" .
                    "💡 *Tip: Puedes buscar por pieza (ej: `stock pantalla`), por categoría (`categoria display`), por repuestos (`repuestos bateria`) o consultar servicios (`servicio cambio de pantalla`).*",
                'quick_actions' => [
                    ['label' => '⚠️ Ver Stock Bajo', 'action' => 'get_stock_alerts'],
                    ['label' => '📁 Ver Categorías', 'text' => 'ver categorias'],
                    ['label' => '⚙️ Ver Servicios', 'text' => 'servicios'],
                    ['label' => 'Ir a Inventario ↗', 'url' => '/admin/productos', 'type' => 'link'],
                ],
            ];
        }

        // Separar productos en Repuestos y Venta Comercial
        $repuestos = $products->filter(fn($p) => $p->tipo_producto === 'repuesto');
        $articulosVenta = $products->filter(fn($p) => $p->tipo_producto !== 'repuesto');

        $displayTitle = !empty($term) ? "para \"{$term}\"" : "";
        $message = "🔍 **Resultados de inventario y catálogo {$displayTitle}:**\n\n";

        $productsData = [];

        // 1. Repuestos
        if ($repuestos->isNotEmpty()) {
            $message .= "🛠️ **Repuestos de Taller (Inventario Físico):**\n";
            foreach ($repuestos as $p) {
                $nombre = $p->nombre_variante ?: trim(($p->marca?->nombre ?? '') . ' ' . ($p->modelo?->nombre_comercial ?? '') . ' ' . $p->sku);
                $cat = $p->categoria?->nombre ?? 'Sin categoría';

                $stockStatus = 'ok';
                if ($p->usa_inventario) {
                    if ($p->stock <= 0) {
                        $stockBadge = "🔴 **Agotado (0 uds)**";
                        $stockStatus = 'out_of_stock';
                    } elseif ($p->stock_minimo > 0 && $p->stock <= $p->stock_minimo) {
                        $stockBadge = "⚠️ **Stock bajo: {$p->stock} uds** (Mín: {$p->stock_minimo})";
                        $stockStatus = 'low';
                    } else {
                        $stockBadge = "🟢 **Existencia: {$p->stock} uds**";
                        $stockStatus = 'ok';
                    }
                } else {
                    $stockBadge = "ℹ️ Sin control de existencias";
                    $stockStatus = 'service';
                }

                $message .= "• **{$nombre}**\n";
                $message .= "  📁 Categoría: *{$cat}* | {$stockBadge} | 💰 {$currency} " . number_format($p->precio_venta, 2) . "\n";

                $productsData[] = [
                    'id' => $p->id,
                    'nombre' => $nombre,
                    'sku' => $p->sku,
                    'stock' => (float)$p->stock,
                    'stock_minimo' => (float)$p->stock_minimo,
                    'stock_status' => $stockStatus,
                    'tipo' => 'repuesto',
                    'categoria' => $cat,
                    'precio' => "{$currency} " . number_format($p->precio_venta, 2),
                    'precio_num' => (float)$p->precio_venta,
                    'usa_inventario' => $p->usa_inventario,
                ];
            }
            $message .= "\n";
        }

        // 2. Artículos de Venta y Accesorios
        if ($articulosVenta->isNotEmpty()) {
            $message .= "📦 **Productos de Venta y Accesorios:**\n";
            foreach ($articulosVenta as $p) {
                $nombre = $p->nombre_variante ?: trim(($p->marca?->nombre ?? '') . ' ' . ($p->modelo?->nombre_comercial ?? '') . ' ' . $p->sku);
                $cat = $p->categoria?->nombre ?? 'Sin categoría';

                $stockStatus = 'ok';
                if ($p->usa_inventario) {
                    if ($p->stock <= 0) {
                        $stockBadge = "🔴 **Agotado (0 uds)**";
                        $stockStatus = 'out_of_stock';
                    } elseif ($p->stock_minimo > 0 && $p->stock <= $p->stock_minimo) {
                        $stockBadge = "⚠️ **Stock bajo: {$p->stock} uds** (Mín: {$p->stock_minimo})";
                        $stockStatus = 'low';
                    } else {
                        $stockBadge = "🟢 **Existencia: {$p->stock} uds**";
                        $stockStatus = 'ok';
                    }
                } else {
                    $stockBadge = "ℹ️ Sin control de existencias";
                    $stockStatus = 'service';
                }

                $message .= "• **{$nombre}**\n";
                $message .= "  📁 Categoría: *{$cat}* | {$stockBadge} | 💰 {$currency} " . number_format($p->precio_venta, 2) . "\n";

                $productsData[] = [
                    'id' => $p->id,
                    'nombre' => $nombre,
                    'sku' => $p->sku,
                    'stock' => (float)$p->stock,
                    'stock_minimo' => (float)$p->stock_minimo,
                    'stock_status' => $stockStatus,
                    'tipo' => 'producto',
                    'categoria' => $cat,
                    'precio' => "{$currency} " . number_format($p->precio_venta, 2),
                    'precio_num' => (float)$p->precio_venta,
                    'usa_inventario' => $p->usa_inventario,
                ];
            }
            $message .= "\n";
        }

        // 3. Servicios Técnicos (Mano de Obra)
        if ($servicios->isNotEmpty()) {
            $message .= "⚙️ **Servicios Técnicos (Mano de Obra - Sin inventario físico):**\n";
            foreach ($servicios as $s) {
                $cat = $s->categoria?->nombre ?? 'General';
                $code = $s->codigo ? " (`{$s->codigo}`)" : "";
                $message .= "• **{$s->nombre}**{$code}\n";
                $message .= "  📁 Categoría: *{$cat}* | 🛠️ *Mano de obra* | 💰 Tarifa: {$currency} " . number_format($s->precio, 2) . "\n";

                $productsData[] = [
                    'id' => $s->id,
                    'nombre' => $s->nombre,
                    'codigo' => $s->codigo,
                    'sku' => $s->codigo,
                    'stock' => null,
                    'stock_status' => 'service',
                    'tipo' => 'servicio',
                    'categoria' => $cat,
                    'precio' => "{$currency} " . number_format($s->precio, 2),
                    'precio_num' => (float)$s->precio,
                    'usa_inventario' => false,
                ];
            }
        }

        $quickActions = [];
        if (!empty($term)) {
            $quickActions[] = [
                'label' => 'Ver en Inventario ↗',
                'url' => "/admin/productos?search=" . urlencode($term),
                'type' => 'link',
            ];
        } else {
            $quickActions[] = [
                'label' => 'Ir a Inventario ↗',
                'url' => '/admin/productos',
                'type' => 'link',
            ];
        }

        if ($servicios->isNotEmpty()) {
            $quickActions[] = [
                'label' => 'Ver Servicios ↗',
                'url' => '/admin/servicios',
                'type' => 'link',
            ];
        }

        if ($products->isNotEmpty()) {
            $firstProd = $products->first();
            $quickActions[] = [
                'label' => "📊 Kardex {$firstProd->sku}",
                'text' => "kardex {$firstProd->sku}",
            ];
        }

        $quickActions[] = [
            'label' => '⚠️ Ver Stock Bajo',
            'action' => 'get_stock_alerts',
        ];

        return [
            'type' => 'stock_search',
            'message' => trim($message),
            'items' => $productsData,
            'quick_actions' => $quickActions,
        ];
    }

    public function handleQuickQuote(User $user, int $empresaId, ?int $sucursalId, string $query): array
    {
        $term = trim($query);
        $currency = $this->getCurrencySymbol($empresaId);

        // 1. Buscar repuesto físico
        $prodQuery = Producto::withoutGlobalScope('multitenancy')
            ->with(['categoria', 'marca', 'modelo'])
            ->where('empresa_id', $empresaId)
            ->where('estado', true);

        if ($sucursalId) {
            $prodQuery->where('sucursal_id', $sucursalId);
        }

        // Buscar primero repuestos específicos
        $repuesto = (clone $prodQuery)
            ->where('tipo_producto', 'repuesto')
            ->where(function ($q) use ($term) {
                $q->where('nombre_variante', 'like', "%{$term}%")
                    ->orWhere('sku', 'like', "%{$term}%")
                    ->orWhereHas('categoria', fn($c) => $c->where('nombre', 'like', "%{$term}%"))
                    ->orWhereHas('marca', fn($m) => $m->where('nombre', 'like', "%{$term}%"))
                    ->orWhereHas('modelo', fn($m) => $m->where('nombre_comercial', 'like', "%{$term}%"));
            })
            ->first();

        // Si no encontró marcado como repuesto, buscar en productos generales
        if (!$repuesto) {
            $repuesto = (clone $prodQuery)
                ->where(function ($q) use ($term) {
                    $q->where('nombre_variante', 'like', "%{$term}%")
                        ->orWhere('sku', 'like', "%{$term}%")
                        ->orWhereHas('categoria', fn($c) => $c->where('nombre', 'like', "%{$term}%"));
                })
                ->first();
        }

        // 2. Buscar servicio técnico de mano de obra
        $servQuery = Servicio::withoutGlobalScope('multitenancy')
            ->with(['categoria', 'marca', 'modelo'])
            ->where('empresa_id', $empresaId)
            ->where('estado', true);

        $serviceSearchTerm = $term;
        if (preg_match('/\b(pantalla|display|modulo|cristal)\b/i', $term, $match)) {
            $serviceSearchTerm = $match[1];
        } elseif (preg_match('/\b(bateria|pila)\b/i', $term, $match)) {
            $serviceSearchTerm = 'bateria';
        } elseif (preg_match('/\b(carga|pin|puerto)\b/i', $term, $match)) {
            $serviceSearchTerm = 'carga';
        }

        $servicio = (clone $servQuery)
            ->where(function ($q) use ($serviceSearchTerm) {
                $q->where('nombre', 'like', "%{$serviceSearchTerm}%")
                    ->orWhere('descripcion', 'like', "%{$serviceSearchTerm}%");
            })
            ->first();

        if (!$repuesto && !$servicio) {
            return [
                'type' => 'not_found',
                'message' => "No encontré repuestos ni servicios para cotizar **\"{$term}\"**.\n\n" .
                    "💡 *Prueba con: `cotizar pantalla iphone 13`, `presupuesto bateria samsung`, o `cotizar pin de carga`.*",
                'quick_actions' => [
                    ['label' => '🛠️ Ver Repuestos', 'text' => 'repuestos'],
                    ['label' => '⚙️ Ver Servicios', 'text' => 'servicios'],
                    ['label' => '📦 Ir a Inventario ↗', 'url' => '/admin/productos', 'type' => 'link'],
                ],
            ];
        }

        $costoRepuesto = $repuesto ? (float)$repuesto->precio_venta : 0.0;
        $costoServicio = $servicio ? (float)$servicio->precio : 0.0;
        $totalCotizacion = $costoRepuesto + $costoServicio;

        $repuestoNombre = $repuesto ? ($repuesto->nombre_variante ?: $repuesto->sku) : 'No especificado (cliente trae pieza o no requerida)';
        $repuestoStock = $repuesto ? ($repuesto->usa_inventario ? (int)$repuesto->stock : 'Sin control') : 0;
        $servicioNombre = $servicio ? $servicio->nombre : 'Mano de obra estándar';

        $stockBadge = '';
        if ($repuesto && $repuesto->usa_inventario) {
            if ($repuesto->stock <= 0) {
                $stockBadge = "🔴 **Pieza agotada en bodega**";
            } elseif ($repuesto->stock <= $repuesto->stock_minimo) {
                $stockBadge = "⚠️ **Quedan {$repuesto->stock} uds (Stock bajo)**";
            } else {
                $stockBadge = "🟢 **Stock disponible: {$repuesto->stock} uds**";
            }
        }

        $message = "💡 **Cotización / Presupuesto Rápido para \"{$term}\":**\n\n";
        if ($repuesto) {
            $message .= "🛠️ **Repuesto Físico:** {$repuestoNombre}\n";
            $message .= "   {$stockBadge} | Precio: **{$currency} " . number_format($costoRepuesto, 2) . "**\n\n";
        }
        if ($servicio) {
            $message .= "⚙️ **Mano de Obra:** {$servicioNombre}\n";
            $message .= "   Tarifa: **{$currency} " . number_format($costoServicio, 2) . "**\n\n";
        }
        $message .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $message .= "💵 **TOTAL ESTIMADO AL CLIENTE:** **{$currency} " . number_format($totalCotizacion, 2) . "**\n\n";
        $message .= "*(Puedes crear una orden técnica inmediatamente con este costo estimado)*";

        $createRepairPrefill = "crear orden cliente [Nombre] telefono [Telefono] equipo {$term} falla reparacion costo " . number_format($totalCotizacion, 2, '.', '');

        return [
            'type' => 'quick_quote',
            'message' => trim($message),
            'quote' => [
                'query' => $term,
                'repuesto_nombre' => $repuestoNombre,
                'repuesto_precio' => "{$currency} " . number_format($costoRepuesto, 2),
                'repuesto_stock' => $repuestoStock,
                'repuesto_stock_badge' => $stockBadge,
                'servicio_nombre' => $servicioNombre,
                'servicio_precio' => "{$currency} " . number_format($costoServicio, 2),
                'total' => $totalCotizacion,
                'total_formateado' => "{$currency} " . number_format($totalCotizacion, 2),
            ],
            'quick_actions' => [
                [
                    'label' => "➕ Crear Orden ({$currency}" . number_format($totalCotizacion, 2) . ")",
                    'text' => $createRepairPrefill,
                ],
                [
                    'label' => 'Ver Repuesto ↗',
                    'url' => $repuesto ? "/admin/productos?search=" . urlencode($repuesto->sku) : '/admin/productos',
                    'type' => 'link',
                ],
                [
                    'label' => 'Ver Servicios ↗',
                    'url' => '/admin/servicios',
                    'type' => 'link',
                ],
            ],
        ];
    }

    public function handleRepuestosAgotados(User $user, int $empresaId, ?int $sucursalId): array
    {
        $currency = $this->getCurrencySymbol($empresaId);
        $query = Producto::withoutGlobalScope('multitenancy')
            ->with(['categoria', 'marca', 'modelo'])
            ->where('empresa_id', $empresaId)
            ->where('estado', true)
            ->where('tipo_producto', 'repuesto')
            ->where('usa_inventario', true)
            ->where('stock', '<=', 0);

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        $items = $query->limit(10)->get();
        $totalAgotados = (clone $query)->count();

        if ($items->isEmpty()) {
            return [
                'type' => 'success',
                'message' => "🎉 **¡Excelente noticia!** No tienes repuestos de taller agotados en este momento. Todas las piezas cuentan con existencias registradas.",
                'quick_actions' => [
                    ['label' => '⚠️ Ver Stock Bajo', 'action' => 'get_stock_alerts'],
                    ['label' => '📦 Ir a Inventario ↗', 'url' => '/admin/productos', 'type' => 'link'],
                ],
            ];
        }

        $message = "🔴 **Repuestos Agotados en Taller ({$totalAgotados} piezas sin stock):**\n";
        $message .= "*Piezas que requieren reabastecimiento o pedido a proveedores:*\n\n";

        $productsData = [];
        foreach ($items as $p) {
            $nombre = $p->nombre_variante ?: trim(($p->marca?->nombre ?? '') . ' ' . ($p->modelo?->nombre_comercial ?? '') . ' ' . $p->sku);
            $cat = $p->categoria?->nombre ?? 'Sin categoría';

            $message .= "• **{$nombre}** (`{$p->sku}`)\n";
            $message .= "  📁 Categoría: *{$cat}* | 🔴 **Stock: 0** | Precio Venta: {$currency} " . number_format($p->precio_venta, 2) . "\n";

            $productsData[] = [
                'id' => $p->id,
                'nombre' => $nombre,
                'sku' => $p->sku,
                'stock' => 0,
                'stock_status' => 'out_of_stock',
                'tipo' => 'repuesto',
                'categoria' => $cat,
                'precio' => "{$currency} " . number_format($p->precio_venta, 2),
                'precio_num' => (float)$p->precio_venta,
                'usa_inventario' => true,
            ];
        }

        return [
            'type' => 'stock_search',
            'message' => trim($message),
            'items' => $productsData,
            'quick_actions' => [
                ['label' => '📦 Directorio Proveedores', 'action' => 'list_proveedores'],
                ['label' => '⚠️ Alertas Stock Bajo', 'action' => 'get_stock_alerts'],
                ['label' => 'Ir a Inventario ↗', 'url' => '/admin/productos', 'type' => 'link'],
            ],
        ];
    }

    /**
     * Consulta y verifica el precio de venta de un producto, repuesto o servicio técnico.
     */
    public function handlePriceCheck(User $user, int $empresaId, ?int $sucursalId, string $term): array
    {
        $term = trim($term);
        // Limpiar preposiciones y artículos iniciales
        $cleanTerm = preg_replace('/^(?:de\s+|del\s+)?(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?/i', '', $term);
        $cleanTerm = trim($cleanTerm);

        if ($cleanTerm === '') {
            return [
                'type' => 'info',
                'message' => "💡 **Verificar Precio de Producto**\n\n"
                    . "Por favor indica qué producto, repuesto o servicio deseas consultar.\n\n"
                    . "👉 **Ejemplos:**\n"
                    . "• `precio pantalla iphone 11`\n"
                    . "• `cuanto cuesta cargador samsung`\n"
                    . "• `cuanto vale bateria redmi note 10`\n"
                    . "• `precio display samsung a14`",
                'quick_actions' => [
                    ['label' => '📦 Ver Catálogo ↗', 'url' => '/admin/productos', 'type' => 'link'],
                    ['label' => '💡 Cotizar Reparación', 'text' => 'cotizar pantalla', 'prefill' => true],
                    ['label' => '⚠️ Alertas de Stock', 'action' => 'get_stock_alerts'],
                ],
            ];
        }

        $currency = $this->getCurrencySymbol($empresaId);

        // 1. Buscar en Productos / Repuestos de la empresa
        $prodQuery = Producto::withoutGlobalScope('multitenancy')
            ->with(['marca', 'modelo', 'categoria'])
            ->where('empresa_id', $empresaId)
            ->where('estado', true);

        if ($sucursalId) {
            $prodQuery->where('sucursal_id', $sucursalId);
        }

        $tokens = array_filter(preg_split('/\s+/', $cleanTerm), fn($t) => mb_strlen($t) >= 2);

        $prodQuery->where(function ($q) use ($cleanTerm, $tokens) {
            $q->where('nombre_variante', 'like', "%{$cleanTerm}%")
                ->orWhere('sku', 'like', "%{$cleanTerm}%")
                ->orWhere('codigo_barras', 'like', "%{$cleanTerm}%")
                ->orWhereHas('categoria', fn($sub) => $sub->where('nombre', 'like', "%{$cleanTerm}%"))
                ->orWhereHas('marca', fn($sub) => $sub->where('nombre', 'like', "%{$cleanTerm}%"))
                ->orWhereHas('modelo', fn($sub) => $sub->where('nombre_comercial', 'like', "%{$cleanTerm}%"));

            if (count($tokens) > 1) {
                $q->orWhere(function ($allTokensQ) use ($tokens) {
                    foreach ($tokens as $token) {
                        $allTokensQ->where(function ($sub) use ($token) {
                            $sub->where('nombre_variante', 'like', "%{$token}%")
                                ->orWhere('sku', 'like', "%{$token}%")
                                ->orWhere('codigo_barras', 'like', "%{$token}%")
                                ->orWhereHas('categoria', fn($c) => $c->where('nombre', 'like', "%{$token}%"))
                                ->orWhereHas('marca', fn($m) => $m->where('nombre', 'like', "%{$token}%"))
                                ->orWhereHas('modelo', fn($mod) => $mod->where('nombre_comercial', 'like', "%{$token}%"));
                        });
                    }
                });
            }
        });

        $products = $prodQuery->limit(6)->get();

        // Si no encontró en la sucursal específica pero el usuario tiene sucursal, buscar en toda la empresa
        if ($products->isEmpty() && $sucursalId) {
            $productsFallback = Producto::withoutGlobalScope('multitenancy')
                ->with(['marca', 'modelo', 'categoria'])
                ->where('empresa_id', $empresaId)
                ->where('estado', true)
                ->where(function ($q) use ($cleanTerm, $tokens) {
                    $q->where('nombre_variante', 'like', "%{$cleanTerm}%")
                        ->orWhere('sku', 'like', "%{$cleanTerm}%")
                        ->orWhere('codigo_barras', 'like', "%{$cleanTerm}%")
                        ->orWhereHas('categoria', fn($sub) => $sub->where('nombre', 'like', "%{$cleanTerm}%"))
                        ->orWhereHas('marca', fn($sub) => $sub->where('nombre', 'like', "%{$cleanTerm}%"))
                        ->orWhereHas('modelo', fn($sub) => $sub->where('nombre_comercial', 'like', "%{$cleanTerm}%"));
                    if (count($tokens) > 1) {
                        $q->orWhere(function ($allTokensQ) use ($tokens) {
                            foreach ($tokens as $token) {
                                $allTokensQ->where(function ($sub) use ($token) {
                                    $sub->where('nombre_variante', 'like', "%{$token}%")
                                        ->orWhere('sku', 'like', "%{$token}%")
                                        ->orWhere('codigo_barras', 'like', "%{$token}%")
                                        ->orWhereHas('categoria', fn($c) => $c->where('nombre', 'like', "%{$token}%"))
                                        ->orWhereHas('marca', fn($m) => $m->where('nombre', 'like', "%{$token}%"))
                                        ->orWhereHas('modelo', fn($mod) => $mod->where('nombre_comercial', 'like', "%{$token}%"));
                                });
                            }
                        });
                    }
                })
                ->limit(6)
                ->get();
            if ($productsFallback->isNotEmpty()) {
                $products = $productsFallback;
            }
        }

        // 2. Buscar en Servicios Técnicos (mano de obra)
        $servQuery = Servicio::withoutGlobalScope('multitenancy')
            ->with(['categoria'])
            ->where('empresa_id', $empresaId)
            ->where('estado', true);

        $servQuery->where(function ($q) use ($cleanTerm, $tokens) {
            $q->where('nombre', 'like', "%{$cleanTerm}%")
                ->orWhere('codigo', 'like', "%{$cleanTerm}%")
                ->orWhere('descripcion', 'like', "%{$cleanTerm}%")
                ->orWhereHas('categoria', fn($sub) => $sub->where('nombre', 'like', "%{$cleanTerm}%"));

            if (count($tokens) > 1) {
                $q->orWhere(function ($allTokensQ) use ($tokens) {
                    foreach ($tokens as $token) {
                        $allTokensQ->where(function ($sub) use ($token) {
                            $sub->where('nombre', 'like', "%{$token}%")
                                ->orWhere('codigo', 'like', "%{$token}%")
                                ->orWhere('descripcion', 'like', "%{$token}%")
                                ->orWhereHas('categoria', fn($c) => $c->where('nombre', 'like', "%{$token}%"));
                        });
                    }
                });
            }
        });

        $servicios = $servQuery->limit(4)->get();

        // 3. Caso sin resultados
        if ($products->isEmpty() && $servicios->isEmpty()) {
            return [
                'type' => 'not_found',
                'message' => "❌ No encontré ningún producto, repuesto ni servicio relacionado con **\"{$cleanTerm}\"** en el catálogo.\n\n"
                    . "💡 *Puedes consultar por código SKU, modelo de equipo o marca, o registrar el producto nuevo si no existe.*",
                'quick_actions' => [
                    ['label' => "➕ Crear {$cleanTerm}", 'text' => "crear producto {$cleanTerm} precio 10 stock 5"],
                    ['label' => '📦 Ir a Inventario ↗', 'url' => '/admin/productos', 'type' => 'link'],
                    ['label' => '⚙️ Ver Servicios ↗', 'url' => '/admin/servicios', 'type' => 'link'],
                ],
            ];
        }

        // Construir datos de tarjetas interactivas
        $itemsData = [];
        foreach ($products as $p) {
            $nombre = $p->nombre_variante ?: trim(($p->marca?->nombre ?? '') . ' ' . ($p->modelo?->nombre_comercial ?? '') . ' ' . $p->sku);
            $cat = $p->categoria?->nombre ?? 'General';
            $stockStatus = ($p->usa_inventario && $p->stock <= 0) ? 'out_of_stock' : (($p->stock_minimo > 0 && $p->stock <= $p->stock_minimo) ? 'low' : 'ok');
            $itemsData[] = [
                'id' => $p->id,
                'nombre' => $nombre,
                'sku' => $p->sku,
                'stock' => (float)$p->stock,
                'stock_minimo' => (float)$p->stock_minimo,
                'stock_status' => $stockStatus,
                'tipo' => $p->tipo_producto === 'repuesto' ? 'repuesto' : 'producto',
                'categoria' => $cat,
                'precio' => "{$currency} " . number_format($p->precio_venta, 2),
                'precio_num' => (float)$p->precio_venta,
                'usa_inventario' => $p->usa_inventario,
            ];
        }

        foreach ($servicios as $s) {
            $itemsData[] = [
                'id' => $s->id,
                'nombre' => $s->nombre,
                'sku' => $s->codigo,
                'stock' => 0,
                'stock_minimo' => 0,
                'stock_status' => 'service',
                'tipo' => 'servicio',
                'categoria' => $s->categoria?->nombre ?? 'Mano de obra',
                'precio' => "{$currency} " . number_format($s->precio, 2),
                'precio_num' => (float)$s->precio,
                'usa_inventario' => false,
            ];
        }

        // Caso A: Coincidencia única o exacta (1 producto encontrado)
        if ($products->count() === 1 && $servicios->isEmpty()) {
            $p = $products->first();
            $nombre = $p->nombre_variante ?: trim(($p->marca?->nombre ?? '') . ' ' . ($p->modelo?->nombre_comercial ?? '') . ' ' . $p->sku);
            $cat = $p->categoria?->nombre ?? 'General';
            $isRepuesto = ($p->tipo_producto === 'repuesto');
            $precioFormat = "{$currency} " . number_format($p->precio_venta, 2);
            $stockVal = (float)$p->stock;

            $stockBadge = "ℹ️ Sin control de existencias";
            if ($p->usa_inventario) {
                if ($stockVal <= 0) {
                    $stockBadge = "🔴 **Agotado (0 unidades en stock)**";
                } elseif ($p->stock_minimo > 0 && $stockVal <= $p->stock_minimo) {
                    $stockBadge = "⚠️ **Stock bajo: {$stockVal} unidades disponibles** (Mín: {$p->stock_minimo})";
                } else {
                    $stockBadge = "🟢 **Disponible: {$stockVal} unidades en inventario**";
                }
            }

            $message = "💰 **Verificación de Precio:**\n\n"
                . "🏷️ **Artículo:** **{$nombre}**\n"
                . "💵 **Precio de venta:** **{$precioFormat}**\n"
                . "📦 **Disponibilidad:** {$stockBadge}\n"
                . "📁 **Categoría:** *{$cat}*" . ($p->sku ? " | SKU: `{$p->sku}`" : "") . "\n"
                . "🛠️ **Tipo:** " . ($isRepuesto ? "Repuesto técnico para taller" : "Producto comercial") . "\n";

            if ($isRepuesto) {
                $message .= "\n💡 *Si vas a realizar la reparación en taller, escribe `cotizar {$cleanTerm}` para calcular repuesto + mano de obra juntos.*";
            }

            $actions = [];
            if ($isRepuesto) {
                $actions[] = [
                    'label' => "💡 Cotizar reparación ({$cleanTerm})",
                    'text' => "cotizar {$cleanTerm}",
                ];
            }
            $actions[] = [
                'label' => '🛒 Ir a Punto de Venta (POS) ↗',
                'url' => '/admin/pos',
                'type' => 'link',
            ];
            $actions[] = [
                'label' => '📦 Ver en Catálogo ↗',
                'url' => "/admin/productos?search=" . urlencode($p->sku ?: $nombre),
                'type' => 'link',
            ];

            return [
                'type' => 'product_price',
                'message' => trim($message),
                'price_card' => [
                    'id' => $p->id,
                    'nombre' => $nombre,
                    'sku' => $p->sku,
                    'precio_formateado' => $precioFormat,
                    'precio_num' => (float)$p->precio_venta,
                    'categoria' => $cat,
                    'tipo' => $isRepuesto ? 'repuesto' : 'producto',
                    'stock' => $stockVal,
                    'disponible' => !$p->usa_inventario || $stockVal > 0,
                ],
                'items' => $itemsData,
                'quick_actions' => $actions,
            ];
        }

        // Caso B: Múltiples coincidencias
        $message = "💰 **Precios verificados para \"{$cleanTerm}\":**\n\n";

        if ($products->isNotEmpty()) {
            $message .= "📦 **Productos y Repuestos:**\n";
            foreach ($products as $p) {
                $nombre = $p->nombre_variante ?: trim(($p->marca?->nombre ?? '') . ' ' . ($p->modelo?->nombre_comercial ?? '') . ' ' . $p->sku);
                $pFormat = "{$currency} " . number_format($p->precio_venta, 2);
                $stk = $p->usa_inventario ? ($p->stock > 0 ? "🟢 {$p->stock} uds" : "🔴 Agotado") : "ℹ️ Sin stock físico";
                $message .= "• **{$nombre}**: **{$pFormat}** ({$stk})\n";
            }
            $message .= "\n";
        }

        if ($servicios->isNotEmpty()) {
            $message .= "⚙️ **Mano de Obra y Servicios Técnicos:**\n";
            foreach ($servicios as $s) {
                $sFormat = "{$currency} " . number_format($s->precio, 2);
                $message .= "• **{$s->nombre}**: **{$sFormat}** (🛠️ Tarifa técnica)\n";
            }
        }

        $actions = [
            [
                'label' => "💡 Cotizar reparación ({$cleanTerm})",
                'text' => "cotizar {$cleanTerm}",
            ],
            [
                'label' => '🛒 Ir a POS ↗',
                'url' => '/admin/pos',
                'type' => 'link',
            ],
            [
                'label' => '📦 Ver Catálogo ↗',
                'url' => '/admin/productos',
                'type' => 'link',
            ],
        ];

        return [
            'type' => 'product_price',
            'message' => trim($message),
            'items' => $itemsData,
            'quick_actions' => $actions,
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

    /**
     * Parsea consultas específicas de precios de productos, repuestos o servicios.
     */
    protected function parsePriceQuery(string $raw, string $normalized): ?string
    {
        $norm = trim($normalized);

        // Si escribe sólo "precio", "precios", "consultar precio", "ver precio" sin término:
        if (preg_match('/^(?:ver\s+|consultar\s+|mostrar\s+)?(?:precios?|tarifas?|costos?)$/i', $norm)) {
            return '';
        }

        // 1. "¿cuánto cuesta / cuánto vale / cuánto sale / a cómo está / a cómo sale...?"
        if (preg_match('/^(?:cuanto\s+(?:cuesta|vale|sale)|a\s+como\s+(?:esta|sale)|en\s+cuanto\s+(?:sale|esta))\s+(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?(?:producto\s+|repuesto\s+|servicio\s+)?(?:de\s+|del\s+)?(.+)$/i', $norm, $m)) {
            return trim($m[1]);
        }

        // 2. "¿cuál es el precio / costo / tarifa / valor de...?"
        if (preg_match('/^(?:cual\s+es\s+el\s+(?:precio|costo|tarifa|valor))\s+(?:de\s+|del\s+)?(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?(?:producto\s+|repuesto\s+|servicio\s+)?(.+)$/i', $norm, $m)) {
            return trim($m[1]);
        }

        // 3. "precio / precios / costo / valor de..." o "ver precio / consultar precio..."
        if (preg_match('/^(?:ver\s+|consultar\s+|mostrar\s+|dame\s+el\s+)?(?:precio|precios|costo|costos|tarifa|tarifas|valor)\s+(?:de\s+|del\s+)?(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?(?:producto\s+|repuesto\s+|servicio\s+)?(.+)$/i', $norm, $m)) {
            return trim($m[1]);
        }

        return null;
    }

    /**
     * Parsea consultas de inventario, stock, repuestos, categorías y servicios.
     */
    protected function parseStockSearch(string $normalized, string $raw): ?array
    {
        $raw = trim($raw);
        $norm = trim($normalized);

        // 1. Preguntas conceptuales sobre repuestos vs servicios
        if (preg_match('/\b(?:diferencia entre repuesto y servicio|que es un repuesto|que es un servicio|repuesto o servicio|repuestos o servicios|como funciona el stock|repuestos vs servicios)\b/i', $norm)) {
            return [
                'term' => '',
                'filter' => 'concept',
            ];
        }

        // 2. Listar servicios técnicos
        if (preg_match('/^(?:ver\s+)?servicios(?:\s+disponibles|\s+tecnicos)?$/i', $norm) || $norm === 'servicios') {
            return [
                'term' => '',
                'filter' => 'servicios_list',
            ];
        }

        // 3. Listar repuestos
        if (preg_match('/^(?:ver\s+)?repuestos(?:\s+disponibles)?$/i', $norm) || $norm === 'repuestos' || $norm === 'repuesto') {
            return [
                'term' => '',
                'filter' => 'repuesto',
            ];
        }

        // 4. Búsqueda específica de servicio técnico (ej: "servicio cambio de pantalla", "precio servicio formateo")
        if (preg_match('/^(?:servicio|servicios|buscar servicio|precio servicio|tarifa servicio|mano de obra)\s+(?:de\s+|para\s+)?(.+)$/i', $norm, $m)) {
            return [
                'term' => trim($m[1]),
                'filter' => 'servicio',
            ];
        }

        // 5. Búsqueda por categoría (ej: "categoria pantallas", "stock categoria cargadores", "repuestos de categoria display")
        if (preg_match('/^(?:stock\s+categoria|repuestos?\s+de\s+categoria|productos?\s+de\s+categoria|categoria|categorias)\s+(?:de\s+)?(.+)$/i', $norm, $m)) {
            return [
                'term' => trim($m[1]),
                'filter' => 'categoria',
            ];
        }

        // 6. Búsqueda explícita de repuesto (ej: "buscar repuesto bateria", "repuestos de iphone", "repuesto pantalla")
        if (preg_match('/^(?:buscar\s+repuestos?|repuestos?|piezas?|refacciones?)\s+(?:de\s+|para\s+)?(.+)$/i', $norm, $m)) {
            return [
                'term' => trim($m[1]),
                'filter' => 'repuesto',
            ];
        }

        // 7. Búsqueda explícita de producto / accesorio
        if (preg_match('/^(?:buscar\s+productos?|productos?)\s+(?:de\s+|para\s+)?(.+)$/i', $norm, $m)) {
            return [
                'term' => trim($m[1]),
                'filter' => 'producto',
            ];
        }

        // 8. Consultas de stock y existencias (ej: "stock pantalla", "existencia de cargador", "existencias baterias")
        if (preg_match('/^(?:stock|cuanto\s+stock|existencia|existencias|hay\s+stock|hay\s+en\s+existencia)\s+(?:de\s+|del\s+producto\s+|de\s+la\s+categoria\s+|de\s+categoria\s+)?(.+)$/i', $norm, $m)) {
            return [
                'term' => trim($m[1]),
                'filter' => 'all',
            ];
        }

        // 9. "¿cuánto hay de / en existencia de...?" o "cuántos hay..."
        if (preg_match('/^cuanto[s]?\s+hay\s+(?:en\s+existencia\s+)?(?:de\s+)?(.+)$/i', $norm, $m)) {
            return [
                'term' => trim($m[1]),
                'filter' => 'all',
            ];
        }

        // 10. "¿hay existencia(s) de...?"
        if (preg_match('/^hay\s+existencia[s]?\s+(?:de\s+)?(.+)$/i', $norm, $m)) {
            return [
                'term' => trim($m[1]),
                'filter' => 'all',
            ];
        }

        // 11. "precio de ..." / "costo de ..."
        if (preg_match('/^(?:precio|precios|costo|costos|tarifa|valor)\s+(?:de\s+|del\s+)?(.+)$/i', $norm, $m)) {
            return [
                'term' => trim($m[1]),
                'filter' => 'all',
            ];
        }

        // 12. "hay [algo]" (ej: "hay pantallas", "hay cargadores")
        if (preg_match('/^hay\s+(.+)$/i', $norm, $m)) {
            $candidate = trim($m[1]);
            if (!preg_match('/^(?:alguien|novedades|algo nuevo|problemas)\b/i', $candidate)) {
                return [
                    'term' => $candidate,
                    'filter' => 'all',
                ];
            }
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
    // PARSERS DE FASE 3: INVENTARIO Y KARDEX
    // ==========================================

    protected function parseStockAdjustmentCommand(string $raw): ?array
    {
        $raw = trim($raw);

        // 1. "ajustar stock (de|del producto)? [prod] a [cant] (por/motivo [motivo])"
        if (preg_match('/^ajustar\s+stock(?:\s+(?:de|del\s+producto))?\s+(.+?)\s+a\s+(\d+(?:\.\d+)?)(?:\s+(?:por|motivo)\s+(.+))?$/i', $raw, $m)) {
            return [
                'mode' => 'set',
                'product' => trim($m[1]),
                'quantity' => (float)$m[2],
                'reason' => isset($m[3]) ? trim($m[3]) : null,
            ];
        }

        // 2. "sumar/agregar/entrada [cant] (de)? stock (a/de)? [prod] (por [motivo])"
        if (preg_match('/^(?:sumar|agregar|entrada\s+de?)\s+(\d+(?:\.\d+)?)(?:\s+(?:de\s+)?stock)?(?:\s+(?:a|al\s+producto|de))?\s+(.+?)(?:\s+(?:por|motivo)\s+(.+))?$/i', $raw, $m)) {
            return [
                'mode' => 'add',
                'quantity' => (float)$m[1],
                'product' => trim($m[2]),
                'reason' => isset($m[3]) ? trim($m[3]) : null,
            ];
        }

        // 3. "restar/quitar/salida [cant] (de)? stock (a/de)? [prod] (por [motivo])"
        if (preg_match('/^(?:restar|quitar|salida\s+de?)\s+(\d+(?:\.\d+)?)(?:\s+(?:de\s+)?stock)?(?:\s+(?:a|al\s+producto|de))?\s+(.+?)(?:\s+(?:por|motivo)\s+(.+))?$/i', $raw, $m)) {
            return [
                'mode' => 'sub',
                'quantity' => (float)$m[1],
                'product' => trim($m[2]),
                'reason' => isset($m[3]) ? trim($m[3]) : null,
            ];
        }

        // 4. "ajustar stock [prod] [cant]" (ej: "ajustar stock Bateria 10")
        if (preg_match('/^ajustar\s+stock\s+(.+?)\s+(\d+(?:\.\d+)?)$/i', $raw, $m)) {
            return [
                'mode' => 'set',
                'product' => trim($m[1]),
                'quantity' => (float)$m[2],
                'reason' => null,
            ];
        }

        return null;
    }

    protected function parseKardexCommand(string $raw): ?array
    {
        $raw = trim($raw);
        if (preg_match('/^(?:ver\s+)?kardex(?:\s+(?:de|del\s+producto)?\s*(.+))?$/i', $raw, $m)) {
            return ['product' => !empty($m[1]) ? trim($m[1]) : null];
        }
        if (preg_match('/^(?:ver\s+)?movimientos(?:\s+(?:de|del\s+producto)?\s*(.+))?$/i', $raw, $m)) {
            return ['product' => !empty($m[1]) ? trim($m[1]) : null];
        }
        if (preg_match('/^historial\s+(?:de\s+)?inventario(?:\s+(?:de|del\s+producto)?\s*(.+))?$/i', $raw, $m)) {
            return ['product' => !empty($m[1]) ? trim($m[1]) : null];
        }
        return null;
    }

    protected function parseCreateProductCommand(string $raw): ?array
    {
        if (preg_match('/^(?:crear|nuevo|agregar)\s+producto\s+(.+)$/i', trim($raw), $m)) {
            $rest = trim($m[1]);
            $price = null;
            $stock = null;

            if (preg_match('/precio\s+(\d+(?:\.\d+)?)/i', $rest, $pm)) {
                $price = (float)$pm[1];
                $rest = preg_replace('/precio\s+\d+(?:\.\d+)?/i', '', $rest);
            }
            if (preg_match('/stock\s+(\d+(?:\.\d+)?)/i', $rest, $sm)) {
                $stock = (float)$sm[1];
                $rest = preg_replace('/stock\s+\d+(?:\.\d+)?/i', '', $rest);
            }

            $name = trim(preg_replace('/\s+/', ' ', $rest));
            return [
                'name' => $name,
                'price' => $price,
                'stock' => $stock,
            ];
        }
        return null;
    }

    // ==========================================
    // PARSERS DE FASE 4: POS, METAS, FONDO Y PROVEEDORES
    // ==========================================

    protected function isTodaySalesQuery(string $normalized): bool
    {
        return (bool) preg_match('/^(?:ver\s+)?ventas(?:\s+de)?\s+hoy$|^cuanto\s+vendimos\s+hoy$|^facturacion\s+hoy$|^ingresos\s+hoy$|^ventas\s+del\s+dia$|^resumen\s+de\s+ventas\s+hoy$/i', $normalized);
    }

    protected function isSalesGoalQuery(string $normalized): bool
    {
        return (bool) preg_match('/^(?:ver\s+)?metas?(?:\s+de\s+ventas?)?$|^meta\s+del\s+mes$|^como\s+van\s+las\s+ventas$|^ventas\s+del\s+mes$|^progreso\s+de\s+ventas$/i', $normalized);
    }

    protected function isMonthlyFundQuery(string $normalized): bool
    {
        return (bool) preg_match('/^(?:ver\s+)?fondo\s+(?:de\s+)?mes$|^fondo\s+mensual$|^como\s+va\s+el\s+fondo$|^estado\s+del\s+fondo$|^gastos\s+del\s+fondo$/i', $normalized);
    }

    protected function parseProviderCommand(string $raw, string $normalized): ?array
    {
        // 1. Crear proveedor: "crear proveedor Insumos Caracas (telefono 04121234567) (rif J-12345678-9)"
        if (preg_match('/^(?:crear|nuevo|agregar)\s+proveedor\s+(.+)$/i', trim($raw), $m)) {
            $rest = trim($m[1]);
            $phone = null;
            $rif = null;

            if (preg_match('/(?:telefono|celular|tlf)\s*[:=]?\s*([+\d\s\-]+)/i', $rest, $pm)) {
                $phone = trim($pm[1]);
                $rest = str_replace($pm[0], '', $rest);
            }
            if (preg_match('/(?:rif|doc|documento|cuit|rut)\s*[:=]?\s*([\w\d\-]+)/i', $rest, $rm)) {
                $rif = trim($rm[1]);
                $rest = str_replace($rm[0], '', $rest);
            }

            $name = trim(preg_replace('/\s+/', ' ', $rest));
            return [
                'action' => 'create',
                'name' => $name,
                'phone' => $phone,
                'rif' => $rif,
            ];
        }

        // 2. Listar proveedores
        if (preg_match('/^(?:ver|listar|mostrar)\s+proveedores$|^proveedores$/i', $normalized)) {
            return ['action' => 'list'];
        }

        return null;
    }

    protected function isPurchasesQuery(string $normalized): bool
    {
        return (bool) preg_match('/^(?:ver|listar|mostrar)?\s*compras(?:\s+recientes|\s+del\s+mes)?$|^ultimas\s+compras$|^gastos\s+en\s+compras$/i', $normalized);
    }

    protected function parseClientCommand(string $raw, string $normalized): ?array
    {
        $raw = trim($raw);

        // 1. Crear cliente: "crear cliente Juan Perez telefono 04121234567 email juan@gmail.com", "cliente nuevo Juan...", etc.
        if (preg_match('/^(?:crear|nuevo|agregar|anadir|añadir|registrar|alta)\s+cliente\s+(.+)$/i', $raw, $m)
            || preg_match('/^cliente\s+nuevo\s+(.+)$/i', $raw, $m)
        ) {
            $rest = trim($m[1]);
            $phone = null;
            $email = null;
            $address = null;

            if (preg_match('/(?:email|correo)\s*[:=]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i', $rest, $em)) {
                $email = trim($em[1]);
                $rest = str_replace($em[0], '', $rest);
            }

            if (preg_match('/(?:telefono|celular|tlf|movil|móvil|ws|whatsapp)\s*[:=]?\s*([+\d\s\-]{7,})/i', $rest, $pm)) {
                $phone = trim($pm[1]);
                $rest = str_replace($pm[0], '', $rest);
            } elseif (preg_match('/(?:\b)(\+?\d{7,15})(?:\b)/', $rest, $pm)) {
                $phone = trim($pm[1]);
                $rest = str_replace($pm[0], '', $rest);
            }

            if (preg_match('/(?:direccion|dirección|dir)\s*[:=]?\s*(.+)$/i', $rest, $dm)) {
                $address = trim($dm[1]);
                $rest = str_replace($dm[0], '', $rest);
            }

            $name = trim(preg_replace('/\s+/', ' ', $rest));
            if ($name !== '') {
                return [
                    'action' => 'create',
                    'name' => $name,
                    'phone' => $phone,
                    'email' => $email,
                    'address' => $address,
                ];
            }
        }

        // 2. Listar clientes: "ver clientes", "listar clientes", "clientes", "directorio clientes"
        if (preg_match('/^(?:ver|listar|mostrar|consultar)?\s*(?:los\s+)?clientes$|^directorio(?:\s+de)?\s+clientes$/i', $normalized)) {
            return ['action' => 'list'];
        }

        // 3. Buscar cliente: "buscar cliente [termino]", "consultar cliente [termino]", "cliente [termino]"
        if (preg_match('/^(?:buscar|consultar|ver|datos\s+del?|info\s+del?)\s+cliente\s+(.+)$/i', $raw, $m)
            || preg_match('/^cliente\s+([a-zA-Z0-9\s]{3,})$/i', $raw, $m)
        ) {
            $term = trim($m[1]);
            // Evitar confundir con "cliente nuevo" o "clientes"
            if (!in_array(mb_strtolower($term), ['nuevo', 'nueva', 'crear', 's'])) {
                return ['action' => 'search', 'term' => $term];
            }
        }

        return null;
    }

    protected function parseCreateRepairCommand(string $raw, string $normalized): ?array
    {
        $raw = trim($raw);
        $normalized = trim($normalized);

        // Si escribe sólo "crear orden", "nueva orden", "registrar reparacion", etc. sin datos:
        if (preg_match('/^(?:crear|nueva|registrar)\s+(?:reparacion|orden)(?:\s+de\s+(?:servicio|reparacion))?$/i', $raw)
            || preg_match('/^recibir\s+equipo$/i', $raw)
        ) {
            return [
                'missing_required' => true,
                'cliente' => null,
                'telefono' => null,
                'equipo' => null,
                'falla' => null,
                'costo' => 0.0,
            ];
        }

        if (!preg_match('/^(?:crear|nueva|registrar)\s+(?:reparacion|orden)(?:\s+de\s+(?:servicio|reparacion))?\s+(.+)$/i', $raw, $m)
            && !preg_match('/^recibir\s+equipo\s+(.+)$/i', $raw, $m)
        ) {
            return null;
        }

        $rest = trim($m[1]);
        $data = [
            'cliente' => null,
            'telefono' => null,
            'equipo' => null,
            'falla' => null,
            'costo' => 0.0,
        ];

        // 1. Costo / Precio
        if (preg_match('/(?:costo|precio|estimado|valor)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i', $rest, $pm)) {
            $data['costo'] = (float)$pm[1];
            $rest = str_replace($pm[0], '', $rest);
        } elseif (preg_match('/\b([0-9]+(?:\.[0-9]+)?)\s*$/', $rest, $pm)) {
            $data['costo'] = (float)$pm[1];
            $rest = substr($rest, 0, -strlen($pm[0]));
        }

        // 2. Teléfono explícito (con palabra clave)
        if (preg_match('/(?:telefono|celular|tlf|tel|ws|whatsapp|contacto)\s*[:=]?\s*([+\d\s\-()]{7,})/i', $rest, $tm)) {
            $data['telefono'] = trim($tm[1]);
            $rest = str_replace($tm[0], '', $rest);
        }

        // 3. Falla / Daño / Motivo
        if (preg_match('/(?:falla|problema|dano|daño|motivo|detalle)\s*[:=]?\s*([^,;]+?)(?=\s+(?:costo|precio|estimado|valor|telefono|celular|tlf|tel|ws|whatsapp|contacto|cliente|equipo|marca|modelo)|$)/i', $rest, $fm)) {
            $data['falla'] = trim($fm[1]);
            $rest = str_replace($fm[0], '', $rest);
        }

        // 4. Cliente explícito
        if (preg_match('/(?:cliente|usuario|nombre)\s*[:=]?\s*([^,;]+?)(?=\s+(?:telefono|celular|tlf|tel|ws|whatsapp|contacto|equipo|marca|modelo|dispositivo|con|falla|costo)|$)/i', $rest, $cm)) {
            $data['cliente'] = trim($cm[1]);
            $rest = str_replace($cm[0], '', $rest);
        }

        // 5. Teléfono suelto (si aún no se detectó y hay un bloque numérico de 7+ dígitos)
        if (!$data['telefono'] && preg_match('/\b((?:\+?\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s-]?\d{3}[\s-]?\d{3,4}|\d{7,15})\b/', $rest, $tm)) {
            $data['telefono'] = trim($tm[1]);
            $rest = str_replace($tm[0], '', $rest);
        }

        // 6. Equipo explícito
        if (preg_match('/(?:equipo|dispositivo|marca|modelo)\s*[:=]?\s*([^,;]+?)(?=\s+(?:falla|problema|costo|precio|telefono|celular|tlf|tel|ws|whatsapp|contacto)|$)/i', $rest, $em)) {
            $data['equipo'] = trim($em[1]);
            $rest = str_replace($em[0], '', $rest);
        } elseif (preg_match('/(?:equipo|dispositivo|marca|modelo)\s*[:=]?\s*(.+)$/i', $rest, $em)) {
            $data['equipo'] = trim($em[1]);
            $rest = str_replace($em[0], '', $rest);
        }

        $rest = trim(preg_replace('/\s+/', ' ', $rest));
        if (!$data['cliente'] && $rest !== '') {
            $parts = array_map('trim', explode(',', $rest));
            if (count($parts) >= 2) {
                $data['cliente'] = $parts[0];
                if (!$data['equipo']) $data['equipo'] = $parts[1];
                if (!$data['falla'] && isset($parts[2])) $data['falla'] = $parts[2];
            } else {
                $words = explode(' ', $rest);
                if (count($words) >= 3) {
                    $data['cliente'] = $words[0] . ' ' . $words[1];
                    if (!$data['equipo']) {
                        $data['equipo'] = implode(' ', array_slice($words, 2));
                    }
                } else {
                    $data['cliente'] = $rest;
                }
            }
        }

        return $data;
    }

    protected function parseDeleteOrderCommand(string $raw, string $normalized): ?array
    {
        $raw = trim($raw);
        $normalized = trim($normalized);

        // Caso sin número o código: "eliminar orden", "borrar orden", "eliminar orden de servicio", "borrar reparacion"
        if (preg_match('/^(?:eliminar|borrar|suprimir|remover)\s+(?:la\s+)?(?:orden(?:\s+de\s+(?:servicio|reparacion))?|reparacion|ticket)\s*$/i', $normalized)) {
            return [
                'missing_order' => true,
                'order_number' => null,
            ];
        }

        // Caso con número o folio: "eliminar orden 1", "borrar orden REP-000001", "eliminar orden #5", "borrar reparacion 2", "eliminar orden de servicio 3"
        if (preg_match('/^(?:eliminar|borrar|suprimir|remover)\s+(?:la\s+)?(?:orden(?:\s+de\s+(?:servicio|reparacion))?|reparacion|ticket)\s+#?((?:rep[-_ ]*)?\d+|rep[-_]\w+)\b/i', $raw, $m)) {
            return [
                'missing_order' => false,
                'order_number' => trim($m[1]),
            ];
        }

        // Variación invertida: "orden 1 eliminar", "orden #1 borrar", "reparacion REP-000001 borrar"
        if (preg_match('/^(?:orden(?:\s+de\s+(?:servicio|reparacion))?|reparacion|ticket)\s+#?((?:rep[-_ ]*)?\d+|rep[-_]\w+)\s+(?:eliminar|borrar|suprimir|remover)$/i', $raw, $m)) {
            return [
                'missing_order' => false,
                'order_number' => trim($m[1]),
            ];
        }

        return null;
    }

    protected function parseCashMovementCommand(string $raw, string $normalized): ?array
    {
        // Gasto / Egreso
        if (preg_match('/^(?:registrar\s+)?(?:gasto|egreso|salida(?:\s+de)?\s+caja)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:por|motivo|en)?\s*(.+)$/i', trim($raw), $m)) {
            return [
                'type' => 'outflow',
                'amount' => (float)$m[1],
                'reason' => trim($m[2]),
            ];
        }

        // Ingreso
        if (preg_match('/^(?:registrar\s+)?(?:ingreso(?:\s+a|\s+de)?\s+caja|entrada(?:\s+a|\s+de)?\s+caja)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:por|motivo|en)?\s*(.+)$/i', trim($raw), $m)) {
            return [
                'type' => 'inflow',
                'amount' => (float)$m[1],
                'reason' => trim($m[2]),
            ];
        }

        return null;
    }

    protected function parseOpenCashCommand(string $raw, string $normalized): ?array
    {
        if (preg_match('/^(?:abrir|apertura)\s+caja(?:\s+con)?(?:\s+([0-9]+(?:\.[0-9]+)?))?$/i', $normalized, $m)) {
            return [
                'amount' => isset($m[1]) ? (float)$m[1] : 0.0,
            ];
        }
        return null;
    }

    protected function parseCloseCashCommand(string $raw, string $normalized): ?array
    {
        if (preg_match('/^(?:cerrar|cierre(?:\s+de)?)\s+caja(?:\s+con)?(?:\s+([0-9]+(?:\.[0-9]+)?))?$/i', $normalized, $m)) {
            return [
                'counted_amount' => isset($m[1]) ? (float)$m[1] : null,
            ];
        }
        return null;
    }

    protected function isCashRegisterStatusQuery(string $normalized): bool
    {
        return (bool) preg_match('/^(?:estado\s+de\s+caja|ver\s+caja|caja\s+actual|saldo\s+de\s+caja|como\s+esta\s+la\s+caja|caja\s+chica|mi\s+caja|caja)$/i', $normalized);
    }

    protected function parseCreditPaymentCommand(string $raw, string $normalized): ?array
    {
        if (preg_match('/^(?:abonar|abono|pagar(?:\s+credito)?)\s+([0-9]+(?:\.[0-9]+)?)\s+(?:a\s+|de\s+)?(.+)$/i', trim($raw), $m)) {
            $amount = (float)$m[1];
            $rest = trim($m[2]);
            $method = 'efectivo';
            $note = null;

            if (preg_match('/(?:metodo|forma)\s*[:=]?\s*(\w+)/i', $rest, $mm)) {
                $method = trim($mm[1]);
                $rest = str_replace($mm[0], '', $rest);
            }
            if (preg_match('/(?:nota|concepto|obs)\s*[:=]?\s*(.+)$/i', $rest, $nm)) {
                $note = trim($nm[1]);
                $rest = str_replace($nm[0], '', $rest);
            }

            $client = trim(preg_replace('/\s+/', ' ', $rest));
            if ($client !== '') {
                return [
                    'amount' => $amount,
                    'client' => $client,
                    'method' => $method,
                    'note' => $note,
                ];
            }
        }
        return null;
    }

    protected function parseClientDebtCommand(string $raw, string $normalized): ?array
    {
        if (preg_match('/^(?:deuda|saldo|cuenta)\s+de\s+(.+)$/i', trim($raw), $m)
            || preg_match('/^cuanto\s+debe\s+(.+)$/i', trim($raw), $m)
        ) {
            return ['client' => trim($m[1])];
        }
        return null;
    }

    protected function isDebtorsQuery(string $normalized): bool
    {
        return (bool) preg_match('/^(?:clientes\s+con\s+deuda|deudas\s+pendientes|morosos|cuentas\s+por\s+cobrar|ver\s+deudas|creditos\s+pendientes|cartera\s+de\s+credito)$/i', $normalized);
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
            . "📋 **Guía Completa de Comandos de Fixy:**\n\n"
            . "🔧 **1. Servicio Técnico & Taller:**\n"
            . "• `crear orden cliente Juan Perez telefono 04141234567 equipo iPhone 11 falla pantalla costo 45`\n"
            . "• `#1` o `orden 1` ➔ Consulta ficha completa, técnico, saldo y estado.\n"
            . "• `estado 1 listo y notificar` ➔ Actualiza orden y envía WhatsApp con tracking público.\n"
            . "• `cotizar pantalla iphone 13` ➔ Calcula repuesto + mano de obra de taller.\n"
            . "• `eliminar orden 1` ➔ Cancela y elimina orden restaurando repuestos al inventario.\n"
            . "• `whatsapp 1` ➔ Notifica al cliente con enlace de seguimiento en vivo.\n"
            . "• `resumen hoy` / `resumen taller` ➔ Métricas y balance del taller.\n"
            . "• `ordenes listas` / `equipos listos` ➔ Dispositivos terminados para entrega.\n"
            . "• `equipos en taller` ➔ Equipos actualmente en revisión o reparación.\n\n"
            . "🏷️ **2. Precios, Inventario & Kardex:**\n"
            . "• `precio pantalla iphone 13` o `cuanto cuesta cargador` ➔ Tarjeta de precio y stock.\n"
            . "• `stock Pantalla` o `cuanto hay de bateria` ➔ Existencias físicas y disponibilidad.\n"
            . "• `repuestos Bateria` / `repuestos agotados` ➔ Filtrar piezas físicas de taller.\n"
            . "• `categoria Display` ➔ Artículos y repuestos por categoría.\n"
            . "• `kardex Pantalla` o `ver kardex` ➔ Auditoría de movimientos de almacén.\n"
            . "• `ajustar stock Bateria a 15 por inventario` ➔ Fijar conteo físico.\n"
            . "• `sumar 5 stock Pantalla` / `restar 2 stock Mica` ➔ Entradas y salidas rápidas.\n"
            . "• `crear producto Mica Vidrio precio 5 stock 20` ➔ Alta rápida en catálogo.\n"
            . "• `alertas stock` ➔ Repuestos y productos bajo el stock mínimo.\n\n"
            . "💼 **3. Caja Chica & Finanzas:**\n"
            . "• `ventas hoy` / `facturacion hoy` ➔ Total cobrado, tickets y desglose de pagos.\n"
            . "• `estado de caja` ➔ Efectivo en gaveta, ventas y balance del turno actual.\n"
            . "• `abrir caja 50` ➔ Apertura de turno con monto base.\n"
            . "• `cerrar caja 250` ➔ Cierre de turno y arqueo de caja.\n"
            . "• `gasto 10 almuerzo` ➔ Registro de egreso con motivo.\n"
            . "• `ingreso caja 20 cambio` ➔ Registro de entrada a caja chica.\n"
            . "• `meta de ventas` ➔ Progreso respecto a metas diarias y mensuales.\n"
            . "• `fondo de mes` ➔ Balance consolidado de compras y gastos del mes.\n"
            . "• `ver compras` ➔ Compras recientes de insumos y mercadería.\n"
            . "• `ver proveedores` / `crear proveedor Insumos Tech telefono 04121234567`\n\n"
            . "👤 **4. Clientes & Cuentas por Cobrar:**\n"
            . "• `ver clientes` / `buscar cliente Juan` ➔ Directorio y búsqueda.\n"
            . "• `crear cliente Juan Perez telefono 04141234567 email juan@ejemplo.com`\n"
            . "• `clientes con deuda` / `deudores` ➔ Listado de saldos pendientes por cobrar.\n"
            . "• `deuda de Carlos` ➔ Saldo exacto y límite de crédito de un cliente.\n"
            . "• `abonar 20 a Juan Perez` ➔ Registra abono a crédito y entrada en caja.\n\n"
            . "⚙️ **5. Catálogo & Servicios:**\n"
            . "• `servicios` / `servicio cambio de pantalla` ➔ Tarifas de mano de obra técnica.\n"
            . "• `ver marcas` / `crear marca Xiaomi`\n"
            . "• `ver categorias` / `crear categoria Baterias`\n"
            . "• `modelos de Xiaomi` / `crear modelo Redmi Note 13 para Xiaomi`";

        return [
            'type' => 'help',
            'message' => $message,
            'quick_actions' => [
                ['label' => '📊 Resumen Taller', 'action' => 'get_summary'],
                ['label' => '📈 Ventas Hoy', 'text' => 'ventas hoy'],
                ['label' => '🔍 Verificar Precio', 'text' => 'precio ', 'prefill' => true],
                ['label' => '💡 Cotizar Reparación', 'text' => 'cotizar ', 'prefill' => true],
                ['label' => '💰 Estado Caja', 'action' => 'get_cash_status'],
                ['label' => '💳 Deudas Clientes', 'action' => 'list_debtors'],
                ['label' => '📦 Ver Kardex', 'action' => 'get_kardex'],
                ['label' => '⚠️ Alertas Stock', 'action' => 'get_stock_alerts'],
            ],
        ];
    }

    protected function buildFallbackResponse(string $rawQuery): array
    {
        return [
            'type' => 'unknown',
            'message' => "No comprendí exactamente la instrucción: **\"{$rawQuery}\"**.\n\n"
                . "Prueba escribiendo el **número de orden** (ej. `1`), **\"estado de caja\"**, **\"clientes con deuda\"**, **\"abonar 20 a [cliente]\"**, **\"kardex [producto]\"**, **\"meta de ventas\"**, o escribe **\"ayuda\"** para ver todos los comandos.",
            'quick_actions' => [
                ['label' => '📊 Resumen Taller', 'action' => 'get_summary'],
                ['label' => '💰 Estado Caja', 'action' => 'get_cash_status'],
                ['label' => '💳 Deudas Clientes', 'action' => 'list_debtors'],
                ['label' => '❓ Ver Ayuda', 'action' => 'help', 'text' => 'ayuda'],
            ],
        ];
    }
}
