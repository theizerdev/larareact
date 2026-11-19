<?php

use App\Http\Controllers\Admin\RoleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['permission:roles.view'])->group(function () {
    Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
});
Route::middleware(['permission:roles.create'])->group(function () {
    Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
    Route::post('/roles/{role}/duplicate', [RoleController::class, 'duplicate'])->name('roles.duplicate');
});
Route::middleware(['permission:roles.edit'])->group(function () {
    Route::post('/roles/sync-permissions', [RoleController::class, 'syncPermissions'])->name('roles.sync-permissions');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
});
Route::middleware(['permission:roles.delete'])->group(function () {
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
});
