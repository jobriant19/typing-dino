<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migration.
     */
    public function up(): void
    {
        Schema::create('scores', function (Blueprint $table) {
            $table->id();
            $table->string('player_name', 40);
            $table->enum('difficulty', ['easy', 'medium', 'hard']);
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('correct_words')->default(0);
            $table->unsignedInteger('wrong_hits')->default(0);
            $table->unsignedTinyInteger('hearts_left')->default(0);
            $table->decimal('accuracy', 5, 2)->default(0);
            // waktu penyelesaian (detik) - hanya terisi jika pemain MENANG (clear target rintangan)
            $table->decimal('completion_time', 8, 2)->nullable();
            $table->boolean('is_win')->default(false);
            $table->timestamps();

            $table->index(['player_name', 'difficulty']);
            $table->index(['difficulty', 'score']);
            $table->index(['difficulty', 'completion_time']);
        });
    }

    /**
     * Batalkan migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('scores');
    }
};
