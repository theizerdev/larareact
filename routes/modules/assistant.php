<?php

use App\Http\Controllers\Admin\AssistantController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::post('assistant/chat', [AssistantController::class, 'chat'])->name('assistant.chat');
    Route::post('assistant/action', [AssistantController::class, 'action'])->name('assistant.action');
    Route::get('assistant/quick-stats', [AssistantController::class, 'quickStats'])->name('assistant.quick-stats');

    // Redirecciones de compatibilidad y alias amigables
    Route::redirect('pos/alertas-stock', '/admin/stock-alerts');
    Route::redirect('inventario/productos', '/admin/productos');
    Route::redirect('inventario', '/admin/productos');
    Route::redirect('equipos/marcas', '/admin/marcas');
    Route::redirect('equipos/modelos', '/admin/modelos');
    Route::redirect('equipos/categorias', '/admin/categorias');
});
