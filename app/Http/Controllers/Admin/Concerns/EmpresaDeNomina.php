<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * La empresa sobre la que trabaja el módulo de Nómina.
 *
 * Se exige explícita en vez de adivinarla porque exportar la nómina de la
 * razón social equivocada es un problema fiscal.
 *
 * Un usuario de empresa trabaja siempre sobre la suya y no puede salirse por
 * query string. El Super Administrador —y quien no tiene empresa asignada—
 * elige una con ?empresa_id=, y la elección se queda en la sesión: así los
 * formularios de las tres pantallas (incidencias, prenómina, mapeo) no tienen
 * que cargar el parámetro en cada POST, y cambiar de pantalla no lo regresa a
 * su empresa de origen a media revisión.
 */
trait EmpresaDeNomina
{
    private const SESION_EMPRESA_NOMINA = 'nomina.empresa_id';

    protected function empresaDeNomina(Request $request): Empresa
    {
        $usuario = $request->user();
        $pedida = $request->integer('empresa_id') ?: null;

        if ($this->puedeElegirEmpresaDeNomina($usuario)) {
            $empresaId = $pedida
                ?? $request->session()->get(self::SESION_EMPRESA_NOMINA)
                ?? $usuario->empresa_id;
        } else {
            abort_if(
                $pedida !== null && $pedida !== (int) $usuario->empresa_id,
                403,
                'No puedes operar sobre otra empresa.'
            );

            $empresaId = $usuario->empresa_id;
        }

        abort_if(
            blank($empresaId),
            422,
            'Tu usuario no tiene empresa asignada. Indica una con el parámetro empresa_id.'
        );

        $empresa = Empresa::withoutGlobalScopes()->find($empresaId);

        if ($empresa === null) {
            // Una empresa guardada en la sesión que ya no existe no debe dejar
            // la pantalla atorada en un 404: se olvida y se vuelve a elegir.
            $request->session()->forget(self::SESION_EMPRESA_NOMINA);

            abort(404, 'La empresa indicada no existe.');
        }

        if ($pedida !== null && $this->puedeElegirEmpresaDeNomina($usuario)) {
            $request->session()->put(self::SESION_EMPRESA_NOMINA, $empresa->id);
        }

        return $empresa;
    }

    /**
     * Empresas para el selector de la pantalla. Vacío para quien no puede
     * elegir, que es la señal para no pintar el selector.
     *
     * @return list<array{id: int, razon_social: string}>
     */
    protected function empresasElegiblesDeNomina(Request $request): array
    {
        if (! $this->puedeElegirEmpresaDeNomina($request->user())) {
            return [];
        }

        return Empresa::withoutGlobalScopes()
            ->where('status', true)
            ->orderBy('razon_social')
            ->get(['id', 'razon_social'])
            ->map(fn (Empresa $e) => ['id' => $e->id, 'razon_social' => $e->razon_social])
            ->all();
    }

    private function puedeElegirEmpresaDeNomina(User $usuario): bool
    {
        return blank($usuario->empresa_id) || $usuario->isSuperAdmin();
    }
}
