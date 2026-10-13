<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('password_changed_at')->nullable()->after('password');
            $table->unsignedInteger('failed_login_attempts')->default(0)->after('password_changed_at');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
        });

        Schema::create('password_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('password_hash');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('configuraciones_sox', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->unsignedSmallInteger('min_password_length')->default(15);
            $table->unsignedSmallInteger('password_history_limit')->default(8);
            $table->unsignedSmallInteger('password_expires_days')->default(90);
            $table->unsignedSmallInteger('max_failed_attempts')->default(5);
            $table->unsignedSmallInteger('lockout_minutes')->default(15);
            $table->boolean('require_mixed_case')->default(true);
            $table->boolean('require_numbers')->default(true);
            $table->boolean('require_symbols')->default(true);
            $table->boolean('require_uncompromised')->default(true);
            $table->boolean('sso_azure_enabled')->default(false);
            $table->string('azure_tenant_id')->nullable();
            $table->string('azure_client_id')->nullable();
            $table->text('azure_client_secret')->nullable();
            $table->string('azure_redirect_uri')->nullable();
            $table->timestamps();
        });

        // Seed default SOX config
        DB::table('configuraciones_sox')->insert([
            'min_password_length' => 15,
            'password_history_limit' => 8,
            'password_expires_days' => 90,
            'max_failed_attempts' => 5,
            'lockout_minutes' => 15,
            'require_mixed_case' => true,
            'require_numbers' => true,
            'require_symbols' => true,
            'require_uncompromised' => true,
            'sso_azure_enabled' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Baseline existing users: set password_changed_at and initial password history
        $users = DB::table('users')->select(['id', 'password', 'created_at'])->get();
        foreach ($users as $user) {
            DB::table('users')->where('id', $user->id)->update([
                'password_changed_at' => $user->created_at ?? now(),
                'failed_login_attempts' => 0,
            ]);

            if (!empty($user->password)) {
                DB::table('password_histories')->insert([
                    'user_id' => $user->id,
                    'password_hash' => $user->password,
                    'created_at' => $user->created_at ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configuraciones_sox');
        Schema::dropIfExists('password_histories');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['password_changed_at', 'failed_login_attempts', 'locked_until']);
        });
    }
};
