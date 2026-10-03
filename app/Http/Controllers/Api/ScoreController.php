<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Score;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ScoreController extends Controller
{
    /**
     * Simpan hasil satu sesi permainan.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'player_name'      => 'required|string|max:40',
            'difficulty'       => 'required|in:easy,medium,hard',
            'score'            => 'required|integer|min:0',
            'correct_words'    => 'required|integer|min:0',
            'wrong_hits'       => 'required|integer|min:0',
            'hearts_left'      => 'required|integer|min:0|max:10',
            'accuracy'         => 'required|numeric|min:0|max:100',
            'completion_time'  => 'nullable|numeric|min:0',
            'is_win'           => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $score = Score::create($validator->validated());

        // Ambil rekor terbaru pemain ini di kesulitan yang sama untuk dikembalikan ke frontend
        $best = $this->bestFor($score->player_name, $score->difficulty);

        return response()->json([
            'saved' => true,
            'record' => $score,
            'best'  => $best,
        ], 201);
    }

    /**
     * Ambil rekor terbaik (skor tertinggi & waktu tercepat) milik seorang pemain
     * untuk satu tingkat kesulitan tertentu.
     */
    public function best(Request $request)
    {
        $request->validate([
            'player_name' => 'required|string|max:40',
            'difficulty'  => 'required|in:easy,medium,hard',
        ]);

        return response()->json(
            $this->bestFor($request->player_name, $request->difficulty)
        );
    }

    private function bestFor(string $playerName, string $difficulty): array
    {
        $highestScore = Score::where('player_name', $playerName)
            ->where('difficulty', $difficulty)
            ->max('score');

        $fastestTime = Score::where('player_name', $playerName)
            ->where('difficulty', $difficulty)
            ->where('is_win', true)
            ->min('completion_time');

        return [
            'highest_score' => (int) ($highestScore ?? 0),
            'fastest_time'  => $fastestTime !== null ? (float) $fastestTime : null,
        ];
    }

    /**
     * Papan peringkat global (top 10) per tingkat kesulitan, diurutkan skor tertinggi.
     */
    public function leaderboard(Request $request)
    {
        $request->validate([
            'difficulty' => 'required|in:easy,medium,hard',
        ]);

        $top = Score::where('difficulty', $request->difficulty)
            ->orderByDesc('score')
            ->orderBy('completion_time')
            ->limit(10)
            ->get(['player_name', 'score', 'completion_time', 'is_win', 'created_at']);

        return response()->json($top);
    }
}
