<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrdenReparacion extends Model
{
    use HasFactory, HasSpanishActivityLog;

    public const ESTADO_RECIBIDO = 'recibido';
    public const ESTADO_EN_DIAGNOSTICO_PRESUPUESTO = 'en_diagnostico_presupuesto';
    public const ESTADO_CONFIRMACION_PRESUPUESTO = 'confirmacion_presupuesto';
    public const ESTADO_ESPERA_REFACCION = 'espera_refaccion';
    public const ESTADO_EN_REPARACION = 'en_reparacion';
    public const ESTADO_LISTO_REPARADO = 'listo_reparado';
    public const ESTADO_LISTO_SIN_SOLUCION = 'listo_sin_solucion';
    public const ESTADO_ENTREGADO_FINALIZADO = 'entregado_finalizado';
    public const ESTADO_REINCIDENCIA_GARANTIA = 'reincidencia_garantia';

    public static function getEstados(): array
    {
        return [
            self::ESTADO_RECIBIDO => [
                'key' => self::ESTADO_RECIBIDO,
                'label' => '1-RECIBIDO',
                'title' => 'Recibido',
            ],
            self::ESTADO_EN_DIAGNOSTICO_PRESUPUESTO => [
                'key' => self::ESTADO_EN_DIAGNOSTICO_PRESUPUESTO,
                'label' => '2-EN DIAGNOSTICO Y PRESUPUESTO',
                'title' => 'En Diagnóstico y Presupuesto',
            ],
            self::ESTADO_CONFIRMACION_PRESUPUESTO => [
                'key' => self::ESTADO_CONFIRMACION_PRESUPUESTO,
                'label' => '3-CONFIRMACION DE PRESUPUESTO',
                'title' => 'Confirmación de Presupuesto',
            ],
            self::ESTADO_ESPERA_REFACCION => [
                'key' => self::ESTADO_ESPERA_REFACCION,
                'label' => '4-ESPERA DE REFACCION',
                'title' => 'Espera de Refacción',
            ],
            self::ESTADO_EN_REPARACION => [
                'key' => self::ESTADO_EN_REPARACION,
                'label' => '5-EN REPARACION',
                'title' => 'En Reparación',
            ],
            self::ESTADO_LISTO_REPARADO => [
                'key' => self::ESTADO_LISTO_REPARADO,
                'label' => '6-LISTO PARA ENTREGAR REPARADO',
                'title' => 'Listo para Entregar Reparado',
            ],
            self::ESTADO_LISTO_SIN_SOLUCION => [
                'key' => self::ESTADO_LISTO_SIN_SOLUCION,
                'label' => '7-LISTO PARA ENTREGAR SIN SOLUCION',
                'title' => 'Listo para Entregar Sin Solución',
            ],
            self::ESTADO_ENTREGADO_FINALIZADO => [
                'key' => self::ESTADO_ENTREGADO_FINALIZADO,
                'label' => '8-ENTREGADO FINALIZADO',
                'title' => 'Entregado Finalizado',
            ],
            self::ESTADO_REINCIDENCIA_GARANTIA => [
                'key' => self::ESTADO_REINCIDENCIA_GARANTIA,
                'label' => '8-REINCIDENCIA/GARANTIA',
                'title' => 'Reincidencia / Garantía',
            ],
        ];
    }

    protected $table = 'ordenes_reparacion';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'numero_orden',
        'cliente_id',
        'cliente_nombre',
        'cliente_telefono',
        'tipo_dispositivo',
        'marca_id',
        'marca_nombre',
        'modelo_id',
        'modelo_nombre',
        'color',
        'imei_serie',
        'descripcion_falla',
        'observaciones_fisicas',
        'contrasena_patron',
        'inspeccion_json',
        'post_servicio_json',
        'tecnico_id',
        'comision_tecnico_pct',
        'estado_orden',
        'costo_mano_obra',
        'costo_repuestos',
        'costo_estimado',
        'anticipo',
        'saldo_restante',
        'garantia_dias',
        'fecha_recepcion',
        'fecha_prometida',
        'fecha_entrega',
        'sale_id',
    ];

    protected $casts = [
        'costo_mano_obra' => 'decimal:2',
        'costo_repuestos' => 'decimal:2',
        'costo_estimado' => 'decimal:2',
        'anticipo' => 'decimal:2',
        'saldo_restante' => 'decimal:2',
        'comision_tecnico_pct' => 'decimal:2',
        'fecha_recepcion' => 'datetime',
        'fecha_prometida' => 'datetime',
        'fecha_entrega' => 'datetime',
        'inspeccion_json' => 'array',
        'post_servicio_json' => 'array',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class);
    }

    public function modelo(): BelongsTo
    {
        return $this->belongsTo(Modelo::class);
    }

    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tecnico_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrdenReparacionItem::class, 'orden_id');
    }

    public function historial(): HasMany
    {
        return $this->hasMany(OrdenReparacionHistorial::class, 'orden_id')->orderBy('created_at', 'desc');
    }

    public function fotos(): HasMany
    {
        return $this->hasMany(OrdenReparacionFoto::class, 'orden_id');
    }
}
