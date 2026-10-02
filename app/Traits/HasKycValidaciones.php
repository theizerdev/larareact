<?php

namespace App\Traits;

use App\Models\KycValidacion;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * Da a una entidad de persona (Empleado, ProveedorEmpleado, ProductorEmpleado,
 * VisitaTemporal) acceso a su historial de validaciones KYC contra JAAK.
 *
 * La columna denormalizada `kyc_estatus` de la propia tabla refleja el estatus de
 * la última validación y es la que se usa para los badges de los listados.
 */
trait HasKycValidaciones
{
    public function kycValidaciones(): MorphMany
    {
        return $this->morphMany(KycValidacion::class, 'validable')->latest('id');
    }

    public function ultimaKycValidacion(): MorphOne
    {
        return $this->morphOne(KycValidacion::class, 'validable')->latestOfMany();
    }
}
