<x-layout :title="'DinoTyping'">
<div class="app-wrap cert-page">
    <div class="pixel-panel title-bar">
        <div>
            <h1 class="pixel-font" style="font-size:clamp(14px,3.5vw,22px);">🏆 SERTIFIKAT PENCAPAIAN</h1>
            <div class="subtitle">Sertifikat Eksklusif Hasil Game <b class="cert-brand">DINOTYPING</b></div>
        </div>
    </div>

    <section class="pixel-panel cert-wrap">
        <div class="cert-stage">
            <canvas id="certCanvas" width="1200" height="800" data-logo="{{ asset('assets/images/logo.png') }}"></canvas>
        </div>

        <div id="certEmpty" class="footer-note" style="display:none;">
            Belum ada data kemenangan ditemukan. Selesaikan sebuah level (menang) terlebih dahulu untuk mendapatkan sertifikat.
        </div>

        <div class="btn-row cert-actions">
            <button class="btn btn-amber" id="downloadCertBtn">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 4v11m0 0-4-4m4 4 4-4"/>
                    <path d="M5 19h14"/>
                </svg>
                <span>UNDUH PNG</span>
            </button>
            <button class="btn btn-howto" id="printCertBtn">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 9V4h10v5"/>
                    <rect x="4" y="9" width="16" height="8" rx="2"/>
                    <path d="M7 14h10v6H7z"/>
                </svg>
                <span>CETAK</span>
            </button>
            <a class="btn btn-danger" href="{{ route('game.index') }}">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 11.5 12 4l8 7.5"/>
                    <path d="M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9"/>
                </svg>
                <span>KEMBALI KE MENU</span>
            </a>
        </div>
    </section>
</div>
</x-layout>
