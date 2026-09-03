<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sales_goals')) {
            Schema::table('sales_goals', function (Blueprint $table) {
                if (!Schema::hasColumn('sales_goals', 'year')) {
                    $table->integer('year')->default(date('Y'))->after('sucursal_id');
                }
                if (!Schema::hasColumn('sales_goals', 'month')) {
                    $table->integer('month')->default(date('n'))->after('year');
                }
                if (!Schema::hasColumn('sales_goals', 'base_sales')) {
                    $table->decimal('base_sales', 12, 2)->default(0.00)->after('month');
                }
                if (!Schema::hasColumn('sales_goals', 'increment_percentage')) {
                    $table->decimal('increment_percentage', 5, 2)->default(0.00)->after('base_sales');
                }
                if (!Schema::hasColumn('sales_goals', 'target_amount')) {
                    $table->decimal('target_amount', 12, 2)->default(0.00)->after('increment_percentage');
                }
                if (!Schema::hasColumn('sales_goals', 'notes')) {
                    $table->text('notes')->nullable()->after('target_amount');
                }

                // Drop legacy columns if present
                if (Schema::hasColumn('sales_goals', 'periodo')) {
                    $table->dropColumn('periodo');
                }
                if (Schema::hasColumn('sales_goals', 'monto_meta')) {
                    $table->dropColumn('monto_meta');
                }
                if (Schema::hasColumn('sales_goals', 'monto_alcanzado')) {
                    $table->dropColumn('monto_alcanzado');
                }
            });

            try {
                Schema::table('sales_goals', function (Blueprint $table) {
                    $table->unique(['empresa_id', 'sucursal_id', 'year', 'month'], 'sales_goals_emp_suc_yr_mo_uq');
                });
            } catch (\Throwable $e) {
                // Index might already exist
            }
        } else {
            Schema::create('sales_goals', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('empresa_id')->nullable()->index();
                $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
                $table->integer('year');
                $table->integer('month');
                $table->decimal('base_sales', 12, 2)->default(0.00);
                $table->decimal('increment_percentage', 5, 2)->default(0.00);
                $table->decimal('target_amount', 12, 2)->default(0.00);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['empresa_id', 'sucursal_id', 'year', 'month'], 'sales_goals_emp_suc_yr_mo_uq');
            });
        }
    }

    public function down(): void
    {
        // Safe down
    }
};
