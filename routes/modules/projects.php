<?php

use App\Http\Controllers\Admin\ProjectController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::resource('projects', ProjectController::class)->except(['show']);
});
