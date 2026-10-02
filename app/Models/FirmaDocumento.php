<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Documento enviado a firma electrónica con ZapSign dentro de un folio de
 * operación. Este modelo sólo guarda el estado; las llamadas a la API viven
 * en App\Services\ZapSignService.
 */
class FirmaDocumento extends Model
{
    use Multitenantable;

    protected $table = 'firma_documentos';

    public const ESTATUS_PENDIENTE = 'pendiente';
    public const ESTATUS_FIRMADO = 'firmado';
    public const ESTATUS_RECHAZADO = 'rechazado';
    public const ESTATUS_CANCELADO = 'cancelado';
    public const ESTATUS_ERROR = 'error';

    protected $fillable = [
        'operacion_id',
        'firmable_type',
        'firmable_id',
        'empresa_id',
        'sucursal_id',
        'zapsign_environment',
        'zapsign_plantilla_token',
        'zapsign_doc_token',
        'zapsign_signer_token',
        'sign_url',
        'nombre_documento',
        'firmante_nombre',
        'firmante_email',
        'firmante_telefono',
        'estatus',
        'enviado_en',
        'firmado_en',
        'rechazado_en',
        'pdf_firmado_path',
        'respuesta',
        'error_detalle',
    ];

    protected $hidden = [
        'sign_url',
        'zapsign_signer_token',
    ];

    protected function casts(): array
    {
        return [
            'enviado_en' => 'datetime',
            'firmado_en' => 'datetime',
            'rechazado_en' => 'datetime',
            'respuesta' => 'array',
        ];
    }

    public function operacion(): BelongsTo
    {
        return $this->belongsTo(OperacionValidacion::class, 'operacion_id');
    }

    public function firmable(): MorphTo
    {
        return $this->morphTo();
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }
}
