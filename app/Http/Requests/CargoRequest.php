<?php

namespace App\Http\Requests;

use App\Models\Departamento;
use App\Models\Sucursal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CargoRequest extends FormRequest
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
            'departamento_id' => 'required|exists:departamentos,id',
            'empresa_id' => 'required|exists:empresas,id',
            'sucursal_id' => 'required|exists:sucursales,id',
            'user_id' => 'required|exists:users,id',
            'status' => 'nullable|integer|in:0,1',
        ];
    }

    /**
     * Same cross-tenant gap found and fixed in DepartamentoRequest: only
     * exists:* was checked, not tenant ownership or empresa/sucursal/
     * departamento consistency. See that class for the QA finding.
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
            $departamentoId = $this->input('departamento_id');

            if ($empresaId && $sucursalId && ! Sucursal::where('id', $sucursalId)->where('empresa_id', $empresaId)->exists()) {
                $validator->errors()->add('sucursal_id', __('The selected branch does not belong to the selected company.'));
            }

            if ($departamentoId && $sucursalId
                && ! Departamento::where('id', $departamentoId)->where('sucursal_id', $sucursalId)->exists()) {
                $validator->errors()->add('departamento_id', __('The selected department does not belong to the selected branch.'));
            }
        });
    }
}
