<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Identificador de la empresa en su liga de acceso (/e/{slug}): con él la
 * pantalla de login muestra el logo de la empresa antes de que se inicie sesión.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('slug', 60)->nullable()->unique()->after('nombre_comercial');
        });

        $usados = [];
        foreach (DB::table('empresas')->orderBy('id')->get(['id', 'razon_social', 'nombre_comercial']) as $empresa) {
            $base = Str::slug(preg_replace('/,?\s*(inc|s\.?a\.?(\s*de\s*c\.?v\.?)?|s\.?\s*de\s*r\.?l\.?.*)\.?$/i', '', $empresa->nombre_comercial ?: $empresa->razon_social)) ?: 'empresa';
            $slug = $base;
            for ($i = 2; in_array($slug, $usados, true); $i++) {
                $slug = "{$base}-{$i}";
            }
            $usados[] = $slug;
            DB::table('empresas')->where('id', $empresa->id)->update(['slug' => $slug]);
        }
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
