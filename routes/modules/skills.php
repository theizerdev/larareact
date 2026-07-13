<?php

use App\Http\Controllers\Admin\SkillController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::resource('skills', SkillController::class)->except(['show']);
});
