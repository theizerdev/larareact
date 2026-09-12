<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Puente de identidad entre el empleado de Shigoto y el de CONTPAQi.
     *
     * CONTPAQi identifica a la persona por su "Código empleado" (180, 286,
     * 320... en la prenómina del cliente), que no tiene ninguna relación con
     * el id interno de Shigoto ni con el emp_code del reloj checador. La
     * equivalencia se declara explícitamente.
     *
     * Sin una fila activa aquí, el empleado no sale en el archivo: se reporta
     * como omitido con su motivo. Es deliberado — exportar un renglón con el
     * código equivocado le carga horas extra a otra persona, y para cuando
     * alguien lo note la nómina ya se timbró.
     *
     * Tabla aparte en vez de una columna en `empleados` porque el código de
     * nómina pertenece a la relación con un sistema externo, no a la persona:
     * el mismo empleado puede existir en más de una razón social.
     */
    public function up(): void
    {
        Schema::create('contpaqi_empleado_mapeos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();

            // Código del empleado en CONTPAQi. Se guarda como string aunque en
            // el cliente sean numéricos: no hay garantía de que otro cliente
            // no use códigos con letras, y nunca se hace aritmética con él.
            $table->string('codigo_empleado', 30);

            // Nombre con el que aparece del lado de CONTPAQi. Sólo informativo,
            // para poder cotejar a ojo que el mapeo apunta a quien debe.
            $table->string('nombre_contpaqi')->nullable();

            // Permite excluir a alguien de la exportación sin borrar el mapeo.
            $table->boolean('activo')->default(true);
            $table->text('notas')->nullable();

            $table->timestamps();

            // Un código de CONTPAQi corresponde a una sola persona...
            $table->unique(['empresa_id', 'codigo_empleado']);
            // ...y una persona tiene un solo código dentro de la empresa.
            $table->unique(['empresa_id', 'empleado_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contpaqi_empleado_mapeos');
    }
};
