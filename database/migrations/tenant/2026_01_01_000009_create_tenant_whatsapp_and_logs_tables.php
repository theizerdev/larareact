<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->string('message_id')->nullable()->index();
            $table->unsignedBigInteger('template_id')->nullable();
            $table->string('recipient_phone')->index();
            $table->string('recipient_name')->nullable();
            $table->text('message_content');
            $table->json('variables')->nullable();
            $table->enum('status', ['pending', 'sent', 'delivered', 'read', 'failed'])->default('pending')->index();
            $table->timestamp('sent_at')->nullable()->index();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->text('error_message')->nullable();
            $table->enum('direction', ['inbound', 'outbound'])->default('outbound')->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->decimal('cost', 8, 4)->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedTinyInteger('retry_count')->default(0);
            $table->timestamps();

            $table->index(['created_at', 'direction', 'retry_count']);
            $table->index(['direction', 'status', 'retry_count']);
            $table->index(['recipient_phone', 'created_at']);
            $table->index(['status', 'created_at']);
        });

        Schema::create('whatsapp_templates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->string('nombre', 150);
            $table->string('categoria', 50)->default('general')->index();
            $table->text('contenido');
            $table->json('variables')->nullable();
            $table->boolean('activo')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('activity_log', function (Blueprint $table) {
            $table->id();
            $table->string('log_name')->nullable()->index();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();
            $table->text('description');
            $table->nullableMorphs('subject', 'subject');
            $table->string('event')->nullable();
            $table->nullableMorphs('causer', 'causer');
            $table->json('properties')->nullable();
            $table->char('batch_uuid', 36)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_log');
        Schema::dropIfExists('whatsapp_templates');
        Schema::dropIfExists('whatsapp_messages');
    }
};
