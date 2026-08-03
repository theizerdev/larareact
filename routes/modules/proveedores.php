<?php

use App\Http\Controllers\Admin\ProveedorController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::resource('proveedores', ProveedorController::class)->except(['create', 'edit']);
});
