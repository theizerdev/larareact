<?php

use App\Http\Controllers\Admin\ClientController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::resource('clients', ClientController::class)->except(['show']);
});
