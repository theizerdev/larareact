<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Una fila por marcaje considerado para envío a PeopleSoft Time and Labor.
 * Ver la migración para el porqué de cada estado.
 */
class PeoplesoftExportacion extends Model
{
    protected $table = 'peoplesoft_exportaciones';

    /** Se generó el payload pero todavía no se resolvió. */
    public const ESTADO_PENDIENTE = 'pendiente';

    /** Corrida en seco: el payload se generó y se guardó, no se envió nada. */
    public const ESTADO_SIMULADO = 'simulado';

    /** Entregado al Integration Broker y con acuse de recibo. */
    public const ESTADO_ENVIADO = 'enviado';

    /** El envío falló; es candidato a reintento. */
    public const ESTADO_ERROR = 'error';

    /** No se puede/debe enviar (sin mapeo, tipo de punch no soportado...). */
    public const ESTADO_OMITIDO = 'omitido';

    protected $fillable = [
        'empresa_id',
        'biotime_marcaje_id',
        'emp_code',
        'badge_id',
        'emplid',
        'empl_rcd',
        'punch_dttm',
        'punch_type',
        'tcd_id',
        'estado',
        'motivo',
        'lote_uuid',
        'payload',
        'respuesta',
        'enviado_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'respuesta' => 'array',
            'enviado_at' => 'datetime',
            'empl_rcd' => 'integer',
        ];
    }

    /** @return BelongsTo<BiotimeMarcaje, $this> */
    public function marcaje(): BelongsTo
    {
        return $this->belongsTo(BiotimeMarcaje::class, 'biotime_marcaje_id');
    }

    /** @return BelongsTo<Empresa, $this> */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
