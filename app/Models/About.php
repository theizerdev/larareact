<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class About extends Model
{
    protected $fillable = [
        'hero_title',
        'hero_subtitle',
        'hero_badge',
        'bio',
        'experience_years',
        'completed_projects',
        'avatar_path',
    ];
}
