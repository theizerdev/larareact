<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, Password|ValidationRule|array<mixed>|string>
     */
    protected function passwordRules(?\App\Models\User $user = null): array
    {
        $targetUser = $user ?? (method_exists($this, 'user') ? $this->user() : auth()->user());

        $rules = ['required', 'string', Password::default(), 'confirmed'];

        if ($targetUser) {
            $rules[] = new \App\Rules\NotInPasswordHistory($targetUser);
        }

        return $rules;
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, Password|ValidationRule|array<mixed>|string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'string', 'current_password'];
    }
}
