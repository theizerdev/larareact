<?php

namespace App\Traits;

use Spatie\Activitylog\Contracts\Activity;

trait HasSpanishActivityLog
{
    public static $modelNamesMap = [
        'User' => 'Usuario',
        'Empresa' => 'Empresa',
        'Sucursal' => 'Sucursal',
        'Pais' => 'País',
        'Group' => 'Grupo',
        'TipoVisitante' => 'Tipo de Visitante',
        'MedioAcceso' => 'Medio de Acceso',
        'Departamento' => 'Departamento',
        'Cargo' => 'Cargo',
        'Contacto' => 'Contacto',
        'Category' => 'Categoría',
        'Brand' => 'Marca',
        'Product' => 'Producto',
        'Attribute' => 'Atributo',
        'Customer' => 'Cliente',
        'Order' => 'Pedido',
        'Coupon' => 'Cupón',
        'Cart' => 'Carrito',
        'Role' => 'Rol',
        'Supplier' => 'Proveedor',
        'PurchaseOrder' => 'Orden de Compra',
        'Shipment' => 'Envío',
        'Payment' => 'Pago',
        'Invoice' => 'Factura',
        'CreditNote' => 'Nota de Crédito',
        'CashRegister' => 'Caja Registradora',
        'Empleado' => 'Empleado',
        'Proveedor' => 'Proveedor',
        'VisitaTemporal' => 'Visita Temporal',
    ];

    public static $fieldLabelsMap = [
        'name' => 'Nombre',
        'nombres' => 'Nombres',
        'apellidos' => 'Apellidos',
        'email' => 'Correo electrónico',
        'phone' => 'Teléfono',
        'telefono' => 'Teléfono',
        'status' => 'Estado',
        'empleado_id' => 'Empleado a visitar',
        'responsable_id' => 'Responsable que autoriza',
        'motivo_visita' => 'Motivo de visita',
        'fecha_ingreso' => 'Fecha de ingreso',
        'hora_ingreso' => 'Hora de ingreso',
        'fecha_salida' => 'Fecha de salida',
        'hora_salida' => 'Hora de salida',
        'empresa_id' => 'Empresa',
        'sucursal_id' => 'Sucursal',
        'failed_login_attempts' => 'Intentos fallidos de acceso',
        'documento_identidad' => 'Documento de identidad',
        'responsable' => 'Responsable',
        'pais_id' => 'País',
        'pais_telefono_id' => 'País del prefijo telefónico',
        'latitud' => 'Latitud',
        'longitud' => 'Longitud',
        'tipo_documento' => 'Tipo de documento',
        'numero_documento' => 'Número de documento',
        'razon_social' => 'Razón social',
        'nombre_comercial' => 'Nombre comercial',
        'direccion_fiscal' => 'Dirección fiscal',
        'direccion' => 'Dirección',
        'ciudad' => 'Ciudad',
        'estado' => 'Estado',
        'codigo_postal' => 'Código postal',
        'tipo_pago' => 'Tipo de pago',
        'total' => 'Total',
        'total_usd' => 'Total USD',
        'total_bs' => 'Total Bs.',
        'total_con_impuestos' => 'Total con impuestos',
        'numero_control_fiscal' => 'N° Control Fiscal',
        'es_factura_fiscal' => 'Es factura fiscal',
        'base_imponible' => 'Base imponible',
        'iva_monto' => 'Monto IVA',
        'igtf_monto' => 'Monto IGTF',
        'metodo_pago' => 'Método de pago',
        'cliente_fiscal_id' => 'Cliente fiscal',
        'fecha' => 'Fecha',
        'fecha_inicio' => 'Fecha de inicio',
        'fecha_fin' => 'Fecha de fin',
        'motivo' => 'Motivo',
        'notas' => 'Notas',
        'observaciones' => 'Observaciones',
        'paciente_id' => 'Paciente',
        'medico_id' => 'Médico',
        'especialidad_id' => 'Especialidad',
        'subespecialidad_id' => 'Subespecialidad',
        'licencia_medica' => 'Licencia médica',
        'anios_experiencia' => 'Años de experiencia',
        'nivel_experiencia' => 'Nivel de experiencia',
        'serie' => 'Serie',
        'correlativo_actual' => 'Correlativo actual',
        'control_fiscal_actual' => 'Control fiscal actual',
        'activo' => 'Activo',
        'serie_afectada' => 'Serie afectada',
        'numero_control_desde' => 'N° Control desde',
        'numero_control_hasta' => 'N° Control hasta',
        'correlativo_desde' => 'Correlativo desde',
        'correlativo_hasta' => 'Correlativo hasta',
        'cantidad_documentos' => 'Cantidad de documentos',
        'fecha_anulacion' => 'Fecha de anulación',
        'date' => 'Fecha',
        'usd_rate' => 'Tasa USD',
        'eur_rate' => 'Tasa EUR',
        'source' => 'Fuente',
        'recorded_by' => 'Registrado por',
        'year' => 'Año',
        'month' => 'Mes',
        'usd_avg' => 'Promedio USD',
        'usd_min' => 'Mínimo USD',
        'usd_max' => 'Máximo USD',
        'eur_avg' => 'Promedio EUR',
        'records_count' => 'Cantidad de registros',
        'generated_by' => 'Generado por',
        'prefijo' => 'Prefijo',
        'rango_inicio' => 'Rango inicio',
        'rango_fin' => 'Rango fin',
        'username' => 'Nombre de usuario',
        'parent_id' => 'Categoría padre',
        'descripcion' => 'Descripción',
        'descripcion_corta' => 'Descripción corta',
        'precio' => 'Precio',
        'precio_oferta' => 'Precio oferta',
        'precio_compra' => 'Precio compra',
        'stock' => 'Stock',
        'stock_minimo' => 'Stock mínimo',
        'sku' => 'SKU',
        'peso' => 'Peso',
        'category_id' => 'Categoría',
        'brand_id' => 'Marca',
        'tiene_variantes' => 'Tiene variantes',
        'destacado' => 'Destacado',
        'nuevo' => 'Nuevo',
        'imagen_principal' => 'Imagen principal',
        'logo' => 'Logo',
        'imagen' => 'Imagen',
        'website' => 'Sitio web',
        'tipo' => 'Tipo',
        'usado_para_variantes' => 'Usado para variantes',
        'orden' => 'Orden',
        'meta_title' => 'Meta título',
        'meta_description' => 'Meta descripción',
        'notas_cliente' => 'Notas cliente',
        'metodo_pago' => 'Método de pago',
        'metodo_envio' => 'Método de envío',
        'numero_seguimiento' => 'N° Seguimiento',
        'referencia_pago' => 'Referencia pago',
        'codigo' => 'Código',
        'valor' => 'Valor',
        'compra_minima' => 'Compra mínima',
        'usos_maximos' => 'Usos máximos',
        'usos_actuales' => 'Usos actuales',
        'acumular' => 'Acumulable',
        'whatsapp' => 'WhatsApp',
        'documento' => 'Documento',
        'nombre' => 'Nombre',
        'apellido' => 'Apellido',
        'telefono' => 'Teléfono',
        'direccion' => 'Dirección',
        'empresa_nombre' => 'Empresa',
        'fuente' => 'Fuente',
        'fecha_nacimiento' => 'Fecha de nacimiento',
        'user_id' => 'Usuario',
        'customer_id' => 'Cliente',
        'numero' => 'Número',
        'tipo' => 'Tipo',
        'estado_pago' => 'Estado de pago',
        'subtotal' => 'Subtotal',
        'descuento' => 'Descuento',
        'impuesto' => 'Impuesto',
        'envio' => 'Envío',
        'total' => 'Total',
        'coupon_id' => 'Cupón',
        'codigo_cupon' => 'Código cupón',
        'pais_envio_id' => 'País envío',
        'notas_internas' => 'Notas internas',
        'cantidad' => 'Cantidad',
        'precio_unitario' => 'Precio unitario',
        'created_at' => 'Fecha de creación',
        'updated_at' => 'Fecha de actualización',
        'contacto' => 'Contacto',
        'rif' => 'RIF',
        'supplier_id' => 'Proveedor',
        'estado' => 'Estado',
        'fecha_entrega_esperada' => 'Fecha entrega esperada',
        'fecha_recepcion' => 'Fecha recepción',
        'carrier_name' => 'Transportadora',
        'tracking_number' => 'N° Seguimiento',
        'fecha_envio' => 'Fecha envío',
        'fecha_entrega' => 'Fecha entrega',
        'costo_envio' => 'Costo envío',
        'costo_unitario' => 'Costo unitario',
        'stock_anterior' => 'Stock anterior',
        'stock_nuevo' => 'Stock nuevo',
        'amount' => 'Monto',
        'metodo_pago' => 'Método de pago',
        'referencia' => 'Referencia',
        'fecha_pago' => 'Fecha de pago',
        'comprobante_path' => 'Comprobante',
        'numero' => 'Número',
        'tipo' => 'Tipo',
        'serie' => 'Serie',
        'numero_control' => 'Número de control',
        'fecha_emision' => 'Fecha de emisión',
        'subtotal' => 'Subtotal',
        'impuesto' => 'Impuesto',
        'total' => 'Total',
        'motivo' => 'Motivo',
        'monto' => 'Monto',
        'monto_inicial' => 'Monto inicial',
        'monto_final' => 'Monto final',
        'fecha_apertura' => 'Fecha de apertura',
        'fecha_cierre' => 'Fecha de cierre',
        'total_ingresos' => 'Total ingresos',
        'total_egresos' => 'Total egresos',
        'genero' => 'Género',
        'foto_empleado' => 'Foto del empleado',
        'foto_documento' => 'Foto del documento de identidad',
        'responsable_id' => 'Responsable',
        'cargo_id' => 'Cargo',
    ];

    protected static function getModelNameInSpanish(): string
    {
        return static::$modelNamesMap[class_basename(static::class)] ?? class_basename(static::class);
    }

    protected static function getSpanishDescription(string $eventName): string
    {
        $modelName = mb_strtolower(static::getModelNameInSpanish());

        return match ($eventName) {
            'created' => "Se creó un nuevo registro de {$modelName}",
            'updated' => "Se actualizó la información de {$modelName}",
            'deleted' => "Se eliminó el registro de {$modelName}",
            'restored' => "Se restauró el registro de {$modelName}",
            default => "{$eventName} {$modelName}",
        };
    }

    public function tapActivity(Activity $activity, string $eventName): void
    {
        $request = request();

        $properties = $activity->properties->toArray();
        $extra = [];

        // Conservar propiedades existentes
        foreach ($properties as $key => $value) {
            $extra[$key] = $value;
        }

        $extra['ip_address'] = $request->ip();
        $extra['user_agent'] = $request->userAgent();
        $extra['url'] = $request->fullUrl();
        $extra['method'] = $request->method();
        $extra['tabla'] = $this->getTable();
        $extra['registro_id'] = $this->getKey();
        $extra['evento'] = $eventName;
        $extra['fecha_hora'] = now()->format('Y-m-d H:i:s');

        // Agregar detalles específicos de cambios para actualizaciones
        if ($eventName === 'updated') {
            $changes = $this->getChanges();
            // Obtener valores originales ANTES de los cambios si es posible, o usar getOriginal()
            // En created/updated events, getOriginal() ya tiene los valores actuales.
            // Para 'updated', activitylog suele guardar 'old' y 'attributes' en properties automáticamente si logOnlyDirty está activado.
            // Intentaremos usar los datos que activitylog ya capturó si existen.

            $detailedChanges = [];

            // Si activitylog ya capturó 'attributes' y 'old'
            if (isset($extra['attributes']) && isset($extra['old'])) {
                foreach ($extra['attributes'] as $key => $newValue) {
                    if (in_array($key, ['updated_at', 'created_at', 'deleted_at'])) {
                        continue;
                    }

                    $oldValue = $extra['old'][$key] ?? null;
                    $label = static::$fieldLabelsMap[$key] ?? ucfirst(str_replace('_', ' ', $key));

                    // Formatear booleanos u objetos/arrays
                    if (is_array($oldValue) || is_object($oldValue)) {
                        $oldValStr = json_encode($oldValue, JSON_UNESCAPED_UNICODE);
                    } else {
                        $oldValStr = is_bool($oldValue) ? ($oldValue ? 'Sí' : 'No') : (string) $oldValue;
                    }

                    if (is_array($newValue) || is_object($newValue)) {
                        $newValStr = json_encode($newValue, JSON_UNESCAPED_UNICODE);
                    } else {
                        $newValStr = is_bool($newValue) ? ($newValue ? 'Sí' : 'No') : (string) $newValue;
                    }

                    $detailedChanges[] = "{$label}: de '{$oldValStr}' a '{$newValStr}'";
                }
            }
            // Fallback a getChanges() si no hay datos en properties
            elseif (! empty($changes)) {
                $original = $this->getOriginal();
                // Nota: getOriginal en evento 'updated' trae los valores NUEVOS en Laravel recientes,
                // pero activitylog suele ejecutarse después.
                // La mejor fuente son las propiedades 'old' y 'attributes' del paquete.
                // Si no están, intentamos inferir.
            }

            if (! empty($detailedChanges)) {
                $descDetalle = implode(', ', $detailedChanges);
                // Evitar descripciones excesivamente largas en la columna principal
                if (mb_strlen($descDetalle) > 100) {
                    $descDetalle = mb_substr($descDetalle, 0, 97).'...';
                }
                $activity->description .= ' - Cambios: '.$descDetalle;
            }
        }

        // Agregar identificador principal
        $identifier = $this->name ?? $this->nombre ?? $this->nombres ?? $this->razon_social ?? $this->codigo ?? null;
        if ($identifier) {
            $extra['identificador_registro'] = $identifier;
            // Solo agregar si no está ya en la descripción
            if (! str_contains($activity->description, (string) $identifier)) {
                $activity->description .= ' - '.$identifier;
            }
        }

        $activity->properties = collect($extra);
    }
}
