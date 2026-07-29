<?php

use App\Http\Controllers\Admin\CreditConfigController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('admin/credit-config')->name('admin.credit-config.')->group(function () {
    Route::get('/', [CreditConfigController::class, 'index'])->name('index');
    Route::post('/', [CreditConfigController::class, 'update'])->name('update');
    Route::put('/{id}', [CreditConfigController::class, 'update'])->name('update.id');
});
