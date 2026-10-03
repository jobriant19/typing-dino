<?php

namespace App\Http\Controllers;

class CertificateController extends Controller
{
    /**
     * Tampilkan halaman sertifikat (data diambil dari localStorage via JS
     * setelah pemain menang, dengan fallback query string).
     */
    public function show()
    {
        return view('certificate');
    }
}
