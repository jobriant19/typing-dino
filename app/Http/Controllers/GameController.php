<?php

namespace App\Http\Controllers;

class GameController extends Controller
{
    /**
     * Tampilkan halaman utama game Typing Dino.
     */
    public function index()
    {
        return view('game');
    }
}
