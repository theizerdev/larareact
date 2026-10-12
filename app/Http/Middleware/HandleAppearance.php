<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        
        // El valor de la cookie se imprime dentro de un <script> en app.blade.php:
        // solo se aceptan los tres modos válidos.
        $appearance = $request->cookie('appearance');
        View::share('appearance', in_array($appearance, ['light', 'dark', 'system'], true) ? $appearance : 'system');

        return $next($request);
    }
}
