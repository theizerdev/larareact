<?php

use App\Http\Controllers\Admin\AssistantController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::post('assistant/chat', [AssistantController::class, 'chat'])->name('assistant.chat');
    Route::post('assistant/action', [AssistantController::class, 'action'])->name('assistant.action');
    Route::get('assistant/quick-stats', [AssistantController::class, 'quickStats'])->name('assistant.quick-stats');
});
