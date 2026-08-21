<?php

namespace App\Http\Requests;

use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Responsable;
use App\Models\Sucursal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class EmpleadoRequest extends FormRequest
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
        $empleadoId = $this->route('empleado') 
            ? (is_object($this->route('empleado')) ? $this->route('empleado')->id : $this->route('empleado')) 
            : null;

        return [
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'documento_identidad' => 'nullable|string|max:50|unique:empleados,documento_identidad,' . $empleadoId,
            'tarjeta_acceso_1' => 'nullable|string|max:50',
            'tarjeta_acceso_2' => 'nullable|string|max:50',
            'tarjeta_acceso_3' => 'nullable|string|max:50',
            'curp' => ['nullable', 'string', new \App\Rules\ValidCurp()],
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'telefono' => 'nullable|string|max:50',
            'correo' => 'nullable|email|max:255',
            'genero' => 'nullable|string|in:M,F,Otro',
            'departamento_id' => 'required|exists:departamentos,id',
            'responsable_id' => 'nullable|exists:responsables,id',
            'cargo_id' => 'nullable|exists:cargos,id',
            'foto_empleado' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'foto_empleado_2' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'foto_documento' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'foto_documento_reverso' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'jornada_laboral' => 'nullable|array',
            'vehiculos' => 'nullable|array',
            'empresa_id' => 'required|exists:empresas,id',
            'sucursal_id' => 'required|exists:sucursales,id',
            'user_id' => 'required|exists:users,id',
            'status' => 'nullable|integer|in:0,1',
        ];
    }

    /**
     * Same cross-tenant gap found and fixed in DepartamentoRequest and
     * siblings: empresa_id/sucursal_id/departamento_id/cargo_id/
     * responsable_id only checked exists:*, not tenant ownership or
     * parent-consistency.
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
            $cargoId = $this->input('cargo_id');
            $responsableId = $this->input('responsable_id');

            if ($empresaId && $sucursalId && ! Sucursal::where('id', $sucursalId)->where('empresa_id', $empresaId)->exists()) {
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

            if ($responsableId && $sucursalId
                && ! Responsable::where('id', $responsableId)->where('sucursal_id', $sucursalId)->exists()) {
                $validator->errors()->add('responsable_id', __('The selected host does not belong to the selected branch.'));
            }
        });
    }
}
