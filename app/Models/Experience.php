<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Experience extends Model
{
    protected $fillable = [
        'role',
        'company',
        'description',
        'start_date',
        'end_date',
        'is_current',
    ];
}
