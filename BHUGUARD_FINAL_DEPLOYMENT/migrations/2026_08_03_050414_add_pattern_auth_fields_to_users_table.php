<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Additive only: adds Farmer Pattern-lock authentication fields to the
     * existing `users` table. The pre-existing `mpin` column is preserved
     * and unaffected.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('pattern_hash')->nullable()->after('biometric_enabled');
            $table->unsignedInteger('pattern_failed_attempts')->default(0)->after('pattern_hash');
            $table->timestamp('pattern_locked_until')->nullable()->after('pattern_failed_attempts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'pattern_hash',
                'pattern_failed_attempts',
                'pattern_locked_until',
            ]);
        });
    }
};
