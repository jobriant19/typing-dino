<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Score extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_name',
        'difficulty',
        'score',
        'correct_words',
        'wrong_hits',
        'hearts_left',
        'accuracy',
        'completion_time',
        'is_win',
    ];

    protected $casts = [
        'is_win' => 'boolean',
        'accuracy' => 'float',
        'completion_time' => 'float',
    ];
}
