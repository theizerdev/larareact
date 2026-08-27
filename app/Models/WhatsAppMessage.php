<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsAppMessage extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_messages';

    protected $fillable = [
        'message_id',
        'template_id',
        'recipient_phone',
        'recipient_name',
        'message_content',
        'variables',
        'status',
        'sent_at',
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
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
