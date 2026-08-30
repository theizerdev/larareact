<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations on central/landlord database.
     */
    public function up(): void
    {
        if (Schema::connection('landlord')->hasTable('empresas')) {
            Schema::connection('landlord')->table('empresas', function (Blueprint $table) {
                if (! Schema::connection('landlord')->hasColumn('empresas', 'db_name')) {
                    $table->string('db_name')->nullable()->after('status');
                }
                if (! Schema::connection('landlord')->hasColumn('empresas', 'db_status')) {
                    $table->string('db_status', 50)->default('ready')->after('db_name');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::connection('landlord')->hasTable('empresas')) {
            Schema::connection('landlord')->table('empresas', function (Blueprint $table) {
                $table->dropColumn(['db_name', 'db_status']);
            });
        }
    }
};
