<?php

use App\Http\Controllers\CertificateController;
use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/', [GameController::class, 'index'])->name('game.index');
Route::get('/sertifikat', [CertificateController::class, 'show'])->name('certificate.show');
