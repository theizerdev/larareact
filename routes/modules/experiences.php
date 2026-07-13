<?php

use App\Http\Controllers\Admin\ExperienceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::resource('experiences', ExperienceController::class)->except(['show']);
});
