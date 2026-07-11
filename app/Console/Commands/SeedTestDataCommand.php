<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SeedTestDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:test-data {--fresh : Drop all tables and re-run migrations}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed all test data in the correct order';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('fresh')) {
            $this->info('Dropping all tables and re-running migrations...');
            $this->call('migrate:fresh');
        }

        $this->info('Seeding test data...');

        // Delete all records from tables in correct order to avoid foreign key constraints
        $this->deleteTableRecords();

        $seeders = [
            'RolesAndPermissionsSeeder',
            'UsersTableSeeder',
            'EmpresaSeeder',
            'SucursalSeeder',
            'EducationalLevelSeeder',
            'SchoolPeriodSeeder',
            'TurnoSeeder',  // Added TurnoSeeder
            'ProgramaSeeder',
            'StudentSeeder',
            'ConceptoPagoSeeder',
            'MatriculaSeeder',
            'PagoSeeder',
        ];

        foreach ($seeders as $seeder) {
            $this->info("Running {$seeder}...");
            $this->call('db:seed', ['--class' => $seeder]);
        }

        $this->info('All test data seeded successfully!');
    }

    /**
     * Delete all records from tables in correct order to avoid foreign key constraints
     */
    private function deleteTableRecords()
    {
        $this->info('Deleting records from tables...');

        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Delete records from tables in correct order (children first, parents last)
        $tables = [
            'pagos',           // Children of matriculas
            'matriculas',      // Children of students, programas, school_periods
            'students',        // Children of niveles_educativos, turnos, school_periods
            'programas',       // Children of niveles_educativos
            'conceptos_pago',  // Independent
            'niveles_educativos', // Independent
            'turnos',          // Independent
            'school_periods'   // Independent
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->delete();
                $this->line("Deleted records from {$table}");
            }
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }
}
