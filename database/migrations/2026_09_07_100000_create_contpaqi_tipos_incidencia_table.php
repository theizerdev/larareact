<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catálogo de tipos de incidencia de CONTPAQi Nóminas, por empresa.
     *
     * Cada cliente arma el suyo: el de Frigorífico Santander trae 21 renglones
     * (HE1..HE5, TRAB, PCS, PSS, VAC, INC...) pero el del siguiente cliente
     * será distinto. Por eso el catálogo vive en base de datos y es editable,
     * no clavado en código. La semilla de config/contpaqi.php sólo sirve para
     * arrancar.
     *
     * El mnemónico es la llave real del lado de CONTPAQi: es lo que identifica
     * la incidencia en su catálogo y lo que viaja como encabezado de columna
     * en el archivo de prenómina.
     */
    public function up(): void
    {
        Schema::create('contpaqi_tipos_incidencia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();

            // Mnemónico tal cual lo tiene CONTPAQi. Es la llave de negocio.
            $table->string('mnemonico', 10);
            $table->string('descripcion');

            // Cómo se mide la incidencia. Determina si la cantidad son días o
            // son horas, y con eso cómo se redondea al escribir el archivo.
            $table->enum('unidad', ['dias', 'horas'])->default('dias');

            // Número de concepto de CONTPAQi (el 4, 54, 132... del catálogo de
            // conceptos). Opcional: el catálogo del cliente lo trae vacío para
            // las incidencias y lleno sólo para las percepciones.
            $table->unsignedInteger('concepto_nomipaq')->nullable();

            // Clasificación ante el IMSS: Ausencia, Incapacidad, Vacaciones o
            // vacío. Lo trae el catálogo del cliente y afecta cómo CONTPAQi
            // calcula. Shigoto no lo interpreta, sólo lo conserva para que el
            // catálogo sea auditable contra el original impreso.
            $table->string('tipo_imss', 30)->nullable();

            $table->boolean('derecho_sueldo')->default(false);
            $table->decimal('porcentaje_derecho', 5, 2)->default(0);
            $table->boolean('descuenta_septimo')->default(false);

            /*
             * Una incidencia derivada la calcula Shigoto desde la asistencia
             * (días trabajados, horas extra, retardos). Una NO derivada sólo
             * puede entrar por captura humana: nadie puede deducir unas
             * vacaciones o una incapacidad mirando marcajes de reloj.
             *
             * La bandera existe para que la UI de captura no ofrezca tipos que
             * el sistema ya calcula solo, que es la vía más fácil de acabar
             * pagando dos veces el mismo concepto.
             */
            $table->boolean('es_derivada')->default(false);

            // Permite sacar un tipo de circulación sin borrarlo ni perder el
            // histórico de incidencias que ya lo usaron.
            $table->boolean('activo')->default(true);
            $table->text('notas')->nullable();

            $table->timestamps();

            // Un mnemónico es único dentro de la empresa: es lo que CONTPAQi
            // usa para desambiguar y no puede repetirse.
            $table->unique(['empresa_id', 'mnemonico']);
            $table->index(['empresa_id', 'activo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contpaqi_tipos_incidencia');
    }
};
