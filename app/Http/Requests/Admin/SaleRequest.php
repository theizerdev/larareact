<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SaleRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cliente_nombre' => ['nullable', 'string', 'max:255'],
            'cliente_id' => ['nullable', 'integer', 'exists:clientes,id'],
            'metodo_pago' => ['nullable', 'string', 'max:50'],
            'impuesto' => ['nullable', 'numeric', 'min:0'],
            'descuento' => ['nullable', 'numeric', 'min:0'],
            'monto_recibido' => ['nullable', 'numeric', 'min:0'],
            'es_credito' => ['nullable', 'boolean'],
            'payments' => ['nullable', 'array'],
            'payments.*.metodo_pago' => ['required_with:payments', 'string', 'max:50'],
            'payments.*.monto' => ['required_with:payments', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.itemable_id' => ['nullable', 'integer'],
            'items.*.concepto_tipo' => ['required', 'in:producto,servicio,reparacion'],
            'items.*.nombre' => ['required', 'string', 'max:255'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.precio_unitario' => ['required', 'numeric', 'min:0'],
        ];
    }
}
