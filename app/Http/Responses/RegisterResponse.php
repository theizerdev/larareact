<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        $user = $request->user();

        if ($user && ! empty($user->telefono) && ! $user->whatsapp_verified_at) {
            return redirect()->route('verify-whatsapp.index');
        }

        // Evitar redirigir a endpoints JSON o de polling si quedaron guardados en la sesión
        $intended = session()->get('url.intended');
        if ($intended && (
            str_contains($intended, '/status') ||
            str_contains($intended, '/queue-stats') ||
            str_contains($intended, '/api/') ||
            str_contains($intended, '/diagnostic') ||
            str_contains($intended, '/ping') ||
            str_ends_with($intended, '.json')
        )) {
            session()->forget('url.intended');
        }

        return redirect()->intended(config('fortify.home'));
    }
}
