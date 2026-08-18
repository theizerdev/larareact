<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class TipoAtencion extends Model
{
    use HasFactory, HasSpanishActivityLog, Multitenantable, SoftDeletes;

    protected $table = 'tipos_atencion';

    protected $fillable = [
        'empresa_id',
        'nombre',
        'slug',
        'codigo',
        'modalidad',
        'tipo_consulta',
        'es_primera_vez',
        'es_subsecuente',
        'descripcion',
        'icono',
        'color',
        'duracion_estimada_minutos',
        'requiere_link_virtual',
        'requiere_direccion',
        'costo_adicional_sugerido',
        'permite_reserva_online',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'es_primera_vez' => 'boolean',
            'es_subsecuente' => 'boolean',
            'duracion_estimada_minutos' => 'integer',
            'requiere_link_virtual' => 'boolean',
            'requiere_direccion' => 'boolean',
            'costo_adicional_sugerido' => 'decimal:2',
            'permite_reserva_online' => 'boolean',
            'status' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->slug) && ! empty($model->nombre)) {
                $model->slug = Str::slug($model->nombre);
            }
            if (empty($model->codigo) && ! empty($model->nombre)) {
                $model->codigo = Str::upper(Str::slug($model->nombre, '_'));
            }
        });

        static::updating(function ($model) {
            if ($model->isDirty('nombre')) {
                $model->slug = Str::slug($model->nombre);
            }
        });
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('status', true);
    }
}
