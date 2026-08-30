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

        return redirect()->intended(config('fortify.home'));
    }
}
