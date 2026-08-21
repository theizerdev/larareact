<?php

namespace App\Http\Requests;

use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Sucursal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ResponsableRequest extends FormRequest
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
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'documento_identidad' => 'nullable|string|max:50',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'telefono' => 'nullable|string|max:50',
            'correo' => 'nullable|email|max:255',
            'departamento_id' => 'nullable|exists:departamentos,id',
            'cargo_id' => 'nullable|exists:cargos,id',
            'empresa_id' => 'required|exists:empresas,id',
            'sucursal_id' => 'required|exists:sucursales,id',
            'user_id' => 'required|exists:users,id',
            'status' => 'nullable|integer|in:0,1',
        ];
    }

    /**
     * Same cross-tenant gap found and fixed in DepartamentoRequest/CargoRequest.
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
            $sucursalId = $this->input('sucursal_id');
            $departamentoId = $this->input('departamento_id');
            $cargoId = $this->input('cargo_id');

            if ($this->input('empresa_id') && $sucursalId
                && ! Sucursal::where('id', $sucursalId)->where('empresa_id', $this->input('empresa_id'))->exists()) {
                $validator->errors()->add('sucursal_id', __('The selected branch does not belong to the selected company.'));
            }

            if ($departamentoId && $sucursalId
                && ! Departamento::where('id', $departamentoId)->where('sucursal_id', $sucursalId)->exists()) {
                $validator->errors()->add('departamento_id', __('The selected department does not belong to the selected branch.'));
            }

            if ($cargoId && $departamentoId
                && ! Cargo::where('id', $cargoId)->where('departamento_id', $departamentoId)->exists()) {
                $validator->errors()->add('cargo_id', __('The selected position does not belong to the selected department.'));
            }
        });
    }
}
