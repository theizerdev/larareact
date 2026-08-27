<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('whatsapp_messages')) {
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
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
    }
};
