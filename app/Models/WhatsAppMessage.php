<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppMessage extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_messages';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'instance_name',
        'message_id',
        'template_id',
        'recipient_phone',
        'recipient_name',
        'message_content',
        'variables',
        'status',
        'sent_at',
        'scheduled_at',
        'delivered_at',
        'read_at',
        'error_message',
        'direction',
        'created_by',
        'cost',
        'metadata',
        'retry_count',
    ];

    protected $casts = [
        'variables' => 'array',
        'metadata' => 'array',
        'sent_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }
}
