<?php

namespace App\Rules;

use App\Models\ConfiguracionSox;
use App\Models\PasswordHistory;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Hash;

class NotInPasswordHistory implements ValidationRule
{
    private int $limit;

    public function __construct(private ?User $user = null, ?int $limit = null)
    {
        $this->limit = $limit ?? ConfiguracionSox::current($user?->empresa_id)->password_history_limit ?? 8;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!$this->user || !$this->user->exists) {
            return;
        }

        // Also check against current password
        if ($this->user->password && Hash::check($value, $this->user->password)) {
            $fail("La nueva contraseña no puede ser igual a su contraseña actual.");
            return;
        }

        $recentHistories = PasswordHistory::where('user_id', $this->user->id)
            ->latest('id')
            ->take($this->limit)
            ->get();

        foreach ($recentHistories as $history) {
            if (Hash::check($value, $history->password_hash)) {
                $fail("La nueva contraseña no puede coincidir con ninguna de sus últimas {$this->limit} contraseñas utilizadas.");
                return;
            }
        }
    }
}
