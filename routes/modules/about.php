<?php

use App\Http\Controllers\Admin\AboutController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('/about', [AboutController::class, 'edit'])->name('about.edit');
    Route::post('/about', [AboutController::class, 'update'])->name('about.update');
});
