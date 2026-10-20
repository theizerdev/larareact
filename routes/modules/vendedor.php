<?php

use App\Http\Controllers\Admin\VendedorDashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('vendedor/dashboard', [VendedorDashboardController::class, 'index'])->name('vendedor.dashboard');
});
