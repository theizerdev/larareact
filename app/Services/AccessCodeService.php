<?php

namespace App\Services;

use App\Models\Sucursal;
use App\Models\Empleado;
use App\Models\Proveedor;
use App\Models\Productor;
use App\Models\VisitaAcceso;
use Illuminate\Database\UniqueConstraintViolationException;

class AccessCodeService
{
    public const ROL_EMPLEADOS = '1';
    public const ROL_PRODUCTORES = '3';
    public const ROL_PROVEEDORES = '5';
    public const ROL_VISITANTES = '8';

    /**
     * Generar un código de acceso único de 8 dígitos según el rol, la sucursal y el tipo de nivel.
     *
     * Estructura: [Rol (1D)] + [Numeral 1 Planta (2D)] + [Numeral 2 Tipo (1D)] + [Consecutivo (4D)]
     * Ejemplo: 1 01 0 0001 -> 10100001
     *
     * @param string $rol 'empleado'|'productor'|'proveedor'|'visitante' o dígito '1'|'3'|'5'|'8'
     * @param int|null $sucursalId
     * @param int $numeral2 0 para Normal, 1 para VIP
     * @return string Código de 8 dígitos
     */
    public static function generate(string $rol, ?int $sucursalId = null, int $numeral2 = 0): string
    {
        $rolDigit = static::resolveRolDigit($rol);
        $numeral1 = static::resolveNumeral1($sucursalId);
        $numeral2Digit = (string) max(0, min(9, $numeral2));

        $prefix = $rolDigit . $numeral1 . $numeral2Digit;

        $consecutivoInt = static::getNextConsecutivo($rolDigit, $prefix);
        $consecutivoStr = sprintf('%04d', $consecutivoInt);

        return $prefix . $consecutivoStr;
    }

    /**
     * Convierte el nombre o dígito del rol a su caracter único.
     */
    public static function resolveRolDigit(string $rol): string
    {
        $rolLower = strtolower(trim($rol));
        return match ($rolLower) {
            '1', 'empleado', 'empleados' => self::ROL_EMPLEADOS,
            '3', 'productor', 'productores' => self::ROL_PRODUCTORES,
            '5', 'proveedor', 'proveedores' => self::ROL_PROVEEDORES,
            '8', 'visitante', 'visitantes', 'visita' => self::ROL_VISITANTES,
            default => self::ROL_VISITANTES,
        };
    }

    /**
     * Obtiene el Numeral 1 (Planta / Ubicación de 2 dígitos).
     */
    public static function resolveNumeral1(?int $sucursalId): string
    {
        if ($sucursalId) {
            $sucursal = Sucursal::find($sucursalId);
            if ($sucursal && !empty($sucursal->codigo_numeral)) {
                return sprintf('%02d', (int) $sucursal->codigo_numeral);
            }
        }

        $firstSucursal = Sucursal::first();
        if ($firstSucursal && !empty($firstSucursal->codigo_numeral)) {
            return sprintf('%02d', (int) $firstSucursal->codigo_numeral);
        }

        return '01';
    }

    /**
     * Obtiene el siguiente número consecutivo para un prefijo dado de 4 dígitos.
     */
    protected static function getNextConsecutivo(string $rolDigit, string $prefix): int
    {
        switch ($rolDigit) {
            case self::ROL_EMPLEADOS:
                $maxCode = Empleado::where('codigo_acceso', 'like', "{$prefix}%")->max('codigo_acceso');
                break;
            case self::ROL_PRODUCTORES:
                $maxCode = Productor::where('codigo_acceso', 'like', "{$prefix}%")->max('codigo_acceso');
                break;
            case self::ROL_PROVEEDORES:
                $maxCode = Proveedor::where('codigo_acceso', 'like', "{$prefix}%")->max('codigo_acceso');
                break;
            case self::ROL_VISITANTES:
            default:
                $maxCode = VisitaAcceso::where('codigo_visitante', 'like', "{$prefix}%")->max('codigo_visitante');
                break;
        }

        if ($maxCode) {
            $lastConsecutivoStr = substr((string) $maxCode, 4, 4);
            $lastConsecutivo = (int) $lastConsecutivoStr;
            return $lastConsecutivo + 1;
        }

        return 1;
    }

    /**
     * generate() computes the next code from MAX(existing)+1 with no locking,
     * so two near-simultaneous creates for the same rol/sucursal can compute
     * the identical code; whichever inserts second throws a
     * UniqueConstraintViolationException that, before this, wasn't caught
     * anywhere and surfaced to the user as a raw 500. Confirmed reproducible
     * in QA testing (2026-08-21) with two ordinary back-to-back employee
     * creations, not just under real concurrency.
     *
     * Retrying re-runs $createFn, which re-generates the code from a fresh
     * MAX() query - by then it sees the row the other request just inserted,
     * so the new code is correct. Only retries on a codigo_acceso/
     * codigo_visitante collision specifically, so unrelated unique-constraint
     * failures (e.g. a duplicate document number) still fail immediately.
     */
    public static function createWithRetry(\Closure $createFn, int $maxAttempts = 3)
    {
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                return $createFn();
            } catch (UniqueConstraintViolationException $e) {
                $isCodeCollision = str_contains($e->getMessage(), 'codigo_acceso')
                    || str_contains($e->getMessage(), 'codigo_visitante');

                if (! $isCodeCollision || $attempt === $maxAttempts) {
                    throw $e;
                }
            }
        }
    }
}
