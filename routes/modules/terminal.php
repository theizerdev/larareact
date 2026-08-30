<?php

use App\Http\Controllers\Admin\TerminalController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/monitoring/terminal', [TerminalController::class, 'index'])->name('monitoring.terminal.index');
    Route::post('/monitoring/terminal/execute', [TerminalController::class, 'execute'])->name('monitoring.terminal.execute');
});
