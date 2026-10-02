<?php

namespace App\Http\Requests;

use App\Models\Sucursal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DepartamentoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'piso' => 'nullable|string|max:255',
            'codigo' => 'nullable|string|max:255',
            'responsable' => 'nullable|string|max:255',
            'empresa_id' => 'required|exists:empresas,id',
            'sucursal_id' => 'required|exists:sucursales,id',
            'user_id' => 'required|exists:users,id',
            'status' => 'nullable|integer|in:0,1',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
        ];
    }

    /**
     * empresa_id/sucursal_id only pass `exists:` above, which lets any
     * authenticated non-super-admin write into another tenant's company
     * simply by submitting a different id. Confirmed exploitable in QA
     * testing (2026-08-21). Non-super-admins are pinned to their own
     * empresa/sucursal; everyone is blocked from an inconsistent pair.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();

            if (! $user || $user->isSuperAdmin()) {
                return;
            }

            if ($user->empresa_id && (int) $this->input('empresa_id') !== (int) $user->empresa_id) {
                $validator->errors()->add('empresa_id', __('You are not allowed to assign this company.'));
            }

            if ($user->sucursal_id && (int) $this->input('sucursal_id') !== (int) $user->sucursal_id) {
                $validator->errors()->add('sucursal_id', __('You are not allowed to assign this branch.'));
            }
        });

        $validator->after(function (Validator $validator) {
            $empresaId = $this->input('empresa_id');
            $sucursalId = $this->input('sucursal_id');

            if ($empresaId && $sucursalId && ! Sucursal::where('id', $sucursalId)->where('empresa_id', $empresaId)->exists()) {
                $validator->errors()->add('sucursal_id', __('The selected branch does not belong to the selected company.'));
            }
        });
    }
}
