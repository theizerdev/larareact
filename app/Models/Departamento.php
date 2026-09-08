<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Departamento extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity, Multitenantable;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nombre', 'descripcion', 'ubicacion', 'piso', 'codigo', 'responsable', 'status'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'nombre',
        'descripcion',
        'ubicacion',
        'piso',
        'codigo',
        'responsable',
        'empresa_id',
        'sucursal_id',
        'user_id',
        'status',
        'latitud',
        'longitud',
    ];

    protected function casts(): array
    {
        return [
            // Coherente con el resto de modelos: `decimal:8` serializaba a
            // string y el frontend recibía coordenadas como texto.
            'latitud' => 'float',
            'longitud' => 'float',
            'status' => 'integer',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
