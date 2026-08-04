<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Additive display IDs. Preserves farmer_code / artisan_code.
 * Format: BHG-KISHAN-{n} / BHG-ART-{n} starting at 01.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('farmers') && ! Schema::hasColumn('farmers', 'farmer_display_id')) {
            Schema::table('farmers', function (Blueprint $table) {
                $table->string('farmer_display_id', 32)->nullable()->after('farmer_code');
            });

            Schema::table('farmers', function (Blueprint $table) {
                $table->unique('farmer_display_id');
            });

            $n = 1;
            DB::table('farmers')->orderBy('id')->select(['id'])->chunkById(200, function ($rows) use (&$n): void {
                foreach ($rows as $row) {
                    $suffix = $n < 10 ? '0'.$n : (string) $n;
                    DB::table('farmers')->where('id', $row->id)->update([
                        'farmer_display_id' => 'BHG-KISHAN-'.$suffix,
                    ]);
                    $n++;
                }
            });
        }

        if (Schema::hasTable('artisans') && ! Schema::hasColumn('artisans', 'artisan_display_id')) {
            Schema::table('artisans', function (Blueprint $table) {
                $table->string('artisan_display_id', 32)->nullable()->after('artisan_code');
            });

            Schema::table('artisans', function (Blueprint $table) {
                $table->unique('artisan_display_id');
            });

            $n = 1;
            DB::table('artisans')->orderBy('id')->select(['id'])->chunkById(200, function ($rows) use (&$n): void {
                foreach ($rows as $row) {
                    $suffix = $n < 10 ? '0'.$n : (string) $n;
                    DB::table('artisans')->where('id', $row->id)->update([
                        'artisan_display_id' => 'BHG-ART-'.$suffix,
                    ]);
                    $n++;
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('farmers') && Schema::hasColumn('farmers', 'farmer_display_id')) {
            Schema::table('farmers', function (Blueprint $table) {
                $table->dropUnique(['farmer_display_id']);
                $table->dropColumn('farmer_display_id');
            });
        }

        if (Schema::hasTable('artisans') && Schema::hasColumn('artisans', 'artisan_display_id')) {
            Schema::table('artisans', function (Blueprint $table) {
                $table->dropUnique(['artisan_display_id']);
                $table->dropColumn('artisan_display_id');
            });
        }
    }
};
