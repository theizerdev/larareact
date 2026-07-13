<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('abouts', function (Blueprint $table) {
            $table->string('hero_title')->nullable()->after('id');
            $table->text('hero_subtitle')->nullable()->after('hero_title');
            $table->string('hero_badge')->nullable()->after('hero_subtitle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('abouts', function (Blueprint $table) {
            $table->dropColumn(['hero_title', 'hero_subtitle', 'hero_badge']);
        });
    }
};
