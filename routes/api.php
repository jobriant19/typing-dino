<?php

use App\Http\Controllers\Api\ScoreController;
use Illuminate\Support\Facades\Route;

Route::post('/scores', [ScoreController::class, 'store']);
Route::get('/scores/best', [ScoreController::class, 'best']);
Route::get('/scores/leaderboard', [ScoreController::class, 'leaderboard']);
