<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::inertia('dashboard', 'admin/dashboard')->name('dashboard');
    });
});

if (file_exists(__DIR__.'/larareact-settings.php')) {
    require __DIR__.'/larareact-settings.php';
}
