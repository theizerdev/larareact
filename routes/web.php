<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::post('locale', function (Request $request) {
    $request->validate([
        'locale' => 'required|in:en,es',
    ]);

    session(['locale' => $request->locale]);

    return back();
})->name('locale.update');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::inertia('dashboard', 'admin/dashboard')->name('dashboard');
    });
});

Route::middleware(['auth', 'verified'])->group(function () {
    // ... otras rutas
    Route::get('/admin/paises', [App\Http\Controllers\Admin\PaisController::class, 'index'])->name('admin.paises.index');
    Route::post('/admin/paises', [App\Http\Controllers\Admin\PaisController::class, 'store'])->name('admin.paises.store');
    Route::put('/admin/paises/{pais}', [App\Http\Controllers\Admin\PaisController::class, 'update'])->name('admin.paises.update');
    Route::post('/admin/paises/bulk-destroy', [App\Http\Controllers\Admin\PaisController::class, 'bulkDestroy'])->name('admin.paises.bulk-destroy');
});

if (file_exists(__DIR__.'/larareact-settings.php')) {
    require __DIR__.'/larareact-settings.php';
}