<x-layout :title="'Sertifikat Pencapaian - Typing Dino'">
<div class="app-wrap">
    <div class="pixel-panel title-bar">
        <div>
            <h1 class="pixel-font" style="font-size:clamp(14px,3.5vw,22px);">🏆 SERTIFIKAT PENCAPAIAN</h1>
            <div class="subtitle">Sertifikat eksklusif hasil permainan Typing Dino kamu</div>
        </div>
    </div>

    <section class="pixel-panel cert-wrap">
        <canvas id="certCanvas" width="1200" height="800"></canvas>

        <div id="certEmpty" class="footer-note" style="display:none;">
            Belum ada data kemenangan ditemukan. Selesaikan sebuah level (menang) terlebih dahulu untuk mendapatkan sertifikat.
        </div>

        <div class="btn-row">
            <button class="btn btn-yellow" id="downloadCertBtn">⬇ UNDUH PNG</button>
            <button class="btn btn-secondary" id="printCertBtn">🖨 CETAK</button>
            <a class="btn" href="{{ route('game.index') }}">← KEMBALI KE MENU</a>
        </div>
    </section>
</div>
</x-layout>
