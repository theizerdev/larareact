<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'title',
        'description',
        'image_path',
        'live_url',
        'github_url',
        'category',
        'frontend_tech',
        'backend_tech',
        'order',
        'is_featured',
    ];

    protected $casts = [
        'frontend_tech' => 'array',
        'backend_tech' => 'array',
        'is_featured' => 'boolean',
    ];
}
