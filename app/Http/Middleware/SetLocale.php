<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = session('locale', config('app.locale'));
        // \Log::debug("SetLocale: session locale is '{$locale}'");

        if (in_array($locale, ['en', 'es'])) {
            App::setLocale($locale);
            // \Log::debug("SetLocale: App::setLocale set to '{$locale}'");
        }

        return $next($request);
    }
}
