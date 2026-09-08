<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Sucursal extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'sucursales';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nombre', 'codigo_numeral', 'telefono', 'direccion', 'status', 'empresa_id'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'nombre',
        'codigo_numeral',
        'pais_telefono_id',
        'telefono',
        'direccion',
        'latitud',
        'longitud',
        'zona_horaria',
        'status',
    ];

    protected function casts(): array
    {
        return [
            // `decimal:8` devolvía string ("19.70000000") y el frontend
            // recibía coordenadas como texto. `float` mantiene el mismo
            // almacenamiento y unifica el tipo con Productor/Proveedor.
            'latitud' => 'float',
            'longitud' => 'float',
            'status' => 'boolean',
        ];
    }

    /**
     * Get the empresa that this sucursal belongs to.
     */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    /**
     * Get the pais used for the phone prefix of this sucursal.
     */
    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }
}
