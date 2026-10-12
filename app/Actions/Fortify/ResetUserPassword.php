<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    /**
     * Validate and reset the user's forgotten password.
     *
     * @param  array<string, string>  $input
     */
    public function reset(User $user, array $input): void
    {
        Validator::make($input, [
            'password' => $this->passwordRules($user),
        ])->validate();

        // Sin password_changed_at la política SOX la daría por vencida y
        // pediría cambiarla otra vez justo después de restablecerla.
        $user->forceFill([
            'password' => $input['password'],
            'password_changed_at' => now(),
        ])->save();

        $user->recordPasswordHistory($user->password);
    }
}
