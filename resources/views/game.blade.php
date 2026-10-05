<x-layout :title="'DinoTyping'">
<div class="app-wrap">

    {{-- Musik latar — satu elemen ini dipakai terus-menerus baik di halaman
         awal (demo) maupun saat permainan sungguhan berjalan, jadi TIDAK
         pernah restart saat berpindah layar. Diputar otomatis & berulang
         begitu ada interaksi pertama dari pengguna (lihat startBgMusic di
         game.js — kebijakan browser memblokir autoplay bersuara). --}}
    <audio id="bgMusic" loop preload="auto">
        <source src="{{ asset('assets/sounds/backsound.mp3') }}" type="audio/mpeg">
    </audio>

    {{-- Input tersembunyi untuk keyboard HP. Sengaja berada DI LUAR gameScreen (yang
         display:none sebelum game mulai) supaya bisa di-focus() langsung saat
         tombol Mulai diketuk -> keyboard HP benar-benar muncul. --}}
    <input type="text" id="hiddenTypingInput" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-hidden="true" tabindex="-1">

    {{-- ===================== HALAMAN PALING AWAL (DEMO OTOMATIS) ===================== --}}
    <section id="landingScreen" class="pixel-panel">
        <div class="diff-logo-wrap">
            <img src="{{ asset('assets/images/logo.png') }}" alt="DinoTyping" class="diff-logo">
        </div>

        <div class="game-stage">
            <canvas id="demoCanvas" width="800" height="360"></canvas>
            <div class="hearts demo-hearts" id="demoHeartsBox"></div>

            <button class="sound-toggle-btn sound-toggle-floating" id="soundToggleBtn" type="button" aria-label="Aktif/nonaktifkan suara">
                <svg class="sound-icon-on" viewBox="0 0 24 24" fill="none">
                    <path d="M3 10v4a1 1 0 0 0 1 1h3.2l4.3 3.6a.6.6 0 0 0 1-.46V5.86a.6.6 0 0 0-1-.46L7.2 9H4a1 1 0 0 0-1 1Z" fill="currentColor"/>
                    <path d="M15.5 9a3.5 3.5 0 0 1 0 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <path d="M18 6.5a7 7 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                <svg class="sound-icon-off" viewBox="0 0 24 24" fill="none" style="display:none;">
                    <path d="M3 10v4a1 1 0 0 0 1 1h3.2l4.3 3.6a.6.6 0 0 0 1-.46V5.86a.6.6 0 0 0-1-.46L7.2 9H4a1 1 0 0 0-1 1Z" fill="currentColor"/>
                    <path d="m16.5 9.5 5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
            </button>

            <div class="demo-gameover-banner" id="demoGameOverBanner">
                <svg class="demo-gameover-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3c-4.4 0-7 3-7 6.8 0 2.4 1 4 2 5.2V17a2 2 0 0 0 2 2h1v1.4a.6.6 0 0 0 1 .45L12.6 20l1.6.85a.6.6 0 0 0 .9-.53V19h1a2 2 0 0 0 2-2v-2c1-1.2 2-2.8 2-5.2C19 6 16.4 3 12 3Z"/>
                    <circle cx="9" cy="10.5" r="1.3" fill="currentColor" stroke="none"/>
                    <circle cx="15" cy="10.5" r="1.3" fill="currentColor" stroke="none"/>
                    <path d="M10.4 14h3.2"/>
                </svg>
                <span class="pixel-font demo-gameover-text">GAME OVER</span>
            </div>

            {{-- Efek nyawa berkurang khusus demo — sama seperti di permainan sungguhan --}}
            <div class="heart-lost-effect" id="demoHeartLostEffect">
                <svg class="heart-lost-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20.2s-7.4-4.6-9.8-9.2C.6 7.6 2 4 5.6 3.4c2-.35 3.7.55 4.8 2.1a1 1 0 0 0 1.2 0c1.1-1.55 2.8-2.45 4.8-2.1C19.99 4 21.4 7.6 19.8 11c-.9 1.9-2.6 3.8-4.3 5.35"/>
                    <path d="M9.5 9.5 7 13l3 1-1.6 3.6"/>
                </svg>
                <span class="heart-lost-text">-1 NYAWA</span>
            </div>
        </div>

        <p class="landing-sub" id="landingSub">Ketik kata yang muncul sebelum dino tiba!</p>

        <div class="landing-actions">
            <button id="landingStartBtn" class="btn btn-start">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <span>MULAI</span>
            </button>
        </div>
    </section>

    {{-- ===================== WELCOME SCREEN (NAMA PEMAIN) ===================== --}}
    <section id="welcomeScreen" class="screen-center" style="display:none;">
        <div class="pixel-panel welcome-card">
            <img src="{{ asset('assets/images/logo.png') }}" alt="DinoTyping" class="welcome-logo">

            <div class="field-group field-center">
                <label for="playerName">Nama Pemain</label>
                <input type="text" id="playerName" maxlength="20" placeholder="Masukkan nama kamu..." class="input-center">
            </div>

            <div class="btn-row welcome-actions">
                <button type="button" id="backToLandingBtn" class="btn btn-danger" aria-label="Kembali ke halaman demo">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 19l-7-7 7-7"/>
                    </svg>
                    <span>KEMBALI</span>
                </button>
                <button id="continueBtn" class="btn btn-primary" disabled>
                    <span>LANJUT</span>
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
            <p id="welcomeMsg" class="form-msg"></p>

            <div class="welcome-copyright">
                <span class="copy-brand">DINOTYPING</span>
                <svg class="copy-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M14.9 9.4a3.6 3.6 0 1 0 0 5.2"/>
                </svg>
                <span class="copy-year">{{ date('Y') }}</span>
                <span class="copy-author">
                    <svg class="copy-ig" viewBox="0 0 24 24" fill="none" stroke="url(#igGradient)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <defs>
                            <linearGradient id="igGradient" gradientUnits="userSpaceOnUse" x1="4" y1="21" x2="20" y2="3">
                                <stop offset="0" stop-color="#feda75"/>
                                <stop offset="0.28" stop-color="#fa7e1e"/>
                                <stop offset="0.52" stop-color="#d62976"/>
                                <stop offset="0.76" stop-color="#962fbf"/>
                                <stop offset="1" stop-color="#4f5bd5"/>
                            </linearGradient>
                        </defs>
                        <rect x="3" y="3" width="18" height="18" rx="5.2"/>
                        <circle cx="12" cy="12" r="4.1"/>
                        <circle cx="17.3" cy="6.7" r="1" fill="url(#igGradient)" stroke="none"/>
                    </svg>
                    jo_briant19
                </span>
            </div>
        </div>
    </section>

    {{-- ===================== PILIH TINGKAT KESULITAN ===================== --}}
    <section id="difficultyScreen" class="pixel-panel" style="display:none;">
        <div class="diff-logo-wrap">
            <img src="{{ asset('assets/images/logo.png') }}" alt="DinoTyping" class="diff-logo">
        </div>

        <div class="diff-header">
            <h2 class="diff-title">PILIH TINGKAT KESULITAN</h2>
        </div>

        <div class="difficulty-grid" id="difficultyGrid">
            <div class="diff-card diff-easy active" data-diff="easy">
                <div class="diff-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="14" width="4.5" height="7" rx="1.2" fill="currentColor"/>
                        <rect x="9.75" y="9" width="4.5" height="12" rx="1.2" fill="currentColor" opacity="0.3"/>
                        <rect x="16.5" y="4" width="4.5" height="17" rx="1.2" fill="currentColor" opacity="0.15"/>
                    </svg>
                </div>
                <h3>EASY</h3>
                <div class="diff-tags"><span class="diff-tag">Kata Pendek &amp; Santai</span></div>
                <div class="best-line" data-best="easy"></div>
            </div>
            <div class="diff-card diff-medium" data-diff="medium">
                <div class="diff-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="14" width="4.5" height="7" rx="1.2" fill="currentColor"/>
                        <rect x="9.75" y="9" width="4.5" height="12" rx="1.2" fill="currentColor"/>
                        <rect x="16.5" y="4" width="4.5" height="17" rx="1.2" fill="currentColor" opacity="0.3"/>
                    </svg>
                </div>
                <h3>MEDIUM</h3>
                <div class="diff-tags"><span class="diff-tag">Kata Sedang &amp; Normal</span></div>
                <div class="best-line" data-best="medium"></div>
            </div>
            <div class="diff-card diff-hard" data-diff="hard">
                <div class="diff-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="14" width="4.5" height="7" rx="1.2" fill="currentColor"/>
                        <rect x="9.75" y="9" width="4.5" height="12" rx="1.2" fill="currentColor"/>
                        <rect x="16.5" y="4" width="4.5" height="17" rx="1.2" fill="currentColor"/>
                    </svg>
                </div>
                <h3>HARD</h3>
                <div class="diff-tags"><span class="diff-tag">Kata Panjang &amp; Cepat</span></div>
                <div class="best-line" data-best="hard"></div>
            </div>
        </div>

        <div class="btn-row diff-actions">
            <button type="button" id="backToWelcomeBtn" class="btn btn-back" aria-label="Kembali ganti nama">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 19l-7-7 7-7"/>
                </svg>
                <span>GANTI NAMA</span>
            </button>
            <button id="startBtn" class="btn btn-start">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <span>MULAI BERMAIN</span>
            </button>
            <button id="howToPlayBtn" class="btn btn-howto">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.4-1.2 1.8-1.9 2.6-.4.4-.6.9-.6 1.4"/>
                    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/>
                </svg>
                <span>CARA MAIN</span>
            </button>
        </div>

        <p id="menuMsg" class="footer-note" style="min-height:20px;"></p>
    </section>

    {{-- ===================== AREA PERMAINAN ===================== --}}
    <section id="gameScreen" class="pixel-panel" style="display:none;">
        <div class="hud">
            <div class="hud-left">
                <div class="hearts" id="heartsBox"></div>
                <div class="hud-badge" id="diffBadge">EASY</div>
            </div>
            <div class="hud-right">
                <div class="hud-badge" id="scoreBadge">SKOR: 0</div>
                <div class="hud-badge" id="timeBadge">WAKTU: 0.0s</div>
                <div class="hud-badge" id="wpmBadge">WPM: 0</div>
                <button class="sound-toggle-btn" id="gameSoundToggleBtn" type="button" aria-label="Aktif/nonaktifkan suara">
                    <svg class="sound-icon-on" viewBox="0 0 24 24" fill="none">
                        <path d="M3 10v4a1 1 0 0 0 1 1h3.2l4.3 3.6a.6.6 0 0 0 1-.46V5.86a.6.6 0 0 0-1-.46L7.2 9H4a1 1 0 0 0-1 1Z" fill="currentColor"/>
                        <path d="M15.5 9a3.5 3.5 0 0 1 0 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M18 6.5a7 7 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                    <svg class="sound-icon-off" viewBox="0 0 24 24" fill="none" style="display:none;">
                        <path d="M3 10v4a1 1 0 0 0 1 1h3.2l4.3 3.6a.6.6 0 0 0 1-.46V5.86a.6.6 0 0 0-1-.46L7.2 9H4a1 1 0 0 0-1 1Z" fill="currentColor"/>
                        <path d="m16.5 9.5 5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>

        <div class="game-stage">
            <canvas id="gameCanvas" width="800" height="360"></canvas>

            {{-- Efek nyawa berkurang: muncul di TENGAH layar, bukan hanya di dino --}}
            <div class="heart-lost-effect" id="heartLostEffect">
                <svg class="heart-lost-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20.2s-7.4-4.6-9.8-9.2C.6 7.6 2 4 5.6 3.4c2-.35 3.7.55 4.8 2.1a1 1 0 0 0 1.2 0c1.1-1.55 2.8-2.45 4.8-2.1C19.99 4 21.4 7.6 19.8 11c-.9 1.9-2.6 3.8-4.3 5.35"/>
                    <path d="M9.5 9.5 7 13l3 1-1.6 3.6"/>
                </svg>
                <span class="heart-lost-text">-1 NYAWA</span>
            </div>

            {{-- Layar Jeda (Pause) — neumorphism, konsisten dgn kartu hasil lainnya --}}
            <div class="overlay hidden" id="pauseOverlay">
                <div class="result-card pause-card">
                    <div class="result-icon result-icon-pause">
                        <svg class="result-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="6" y="4.5" width="4" height="15" rx="1.4" fill="currentColor"/>
                            <rect x="14" y="4.5" width="4" height="15" rx="1.4" fill="currentColor"/>
                        </svg>
                    </div>
                    <h2 class="pause-title pixel-font">DIJEDA</h2>
                    <p class="pause-text">Permainan <b>dijeda</b>. Lanjutkan kapan saja.</p>
                    <div class="btn-row">
                        <button class="btn btn-start btn-block" id="resumePauseBtn">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            <span>LANJUTKAN</span>
                        </button>
                    </div>
                </div>
            </div>

                                    {{-- Modal Game Over — MERAH + ikon sedih (seperti semula) secara
                 default, otomatis berubah HIJAU + ikon piala saat REKOR BARU
                 (lihat applyGameOverTheme di game.js). 3 tombol kini sebaris:
                 Coba Lagi, Sertifikat, Kembali ke Menu. --}}
            <div class="overlay hidden" id="gameOverOverlay">
                <div class="result-card lose-card" id="goCard">
                    <div class="lose-ring lose-ring-1" id="goRing1"></div>
                    <div class="lose-ring lose-ring-2" id="goRing2"></div>
                    <div class="result-icon result-icon-lose" id="goIconWrap">
                        <svg id="goIconSad" class="result-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 3c-4.4 0-7 3-7 6.8 0 2.4 1 4 2 5.2V17a2 2 0 0 0 2 2h1v1.4a.6.6 0 0 0 1 .45L12.6 20l1.6.85a.6.6 0 0 0 .9-.53V19h1a2 2 0 0 0 2-2v-2c1-1.2 2-2.8 2-5.2C19 6 16.4 3 12 3Z"/>
                            <circle cx="9" cy="10.5" r="1.3" fill="currentColor" stroke="none"/>
                            <circle cx="15" cy="10.5" r="1.3" fill="currentColor" stroke="none"/>
                            <path d="M10.4 14h3.2"/>
                        </svg>
                        <svg id="goIconTrophy" class="result-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                            <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/>
                            <path d="M8 5H5a2 2 0 0 0 0 4h1.5M16 5h3a2 2 0 0 1 0 4h-1.5"/>
                            <path d="M12 12v3"/>
                            <path d="M9 20h6"/>
                            <path d="M10 17h4l.6 3H9.4l.6-3Z"/>
                        </svg>
                    </div>
                    <h2 class="lose pixel-font" id="goTitle">GAME OVER</h2>
                    <div class="stat-grid">
                        <div class="stat-box">
                            <span><svg class="stat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5a2 2 0 0 0 0 4h1.5M16 5h3a2 2 0 0 1 0 4h-1.5"/><path d="M12 12v3"/><path d="M9 20h6"/><path d="M10 17h4l.6 3H9.4l.6-3Z"/></svg>Skor Akhir</span>
                            <b id="goScore">0</b>
                        </div>
                        <div class="stat-box">
                            <span><svg class="stat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8.2"/><path d="M12 9v4.3l3 2"/><path d="M9.5 2.2h5"/></svg>Waktu</span>
                            <b id="goTime">0.0s</b>
                        </div>
                        <div class="stat-box">
                            <span><svg class="stat-ico" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3.5 14.2A1 1 0 0 0 4.3 16H10l-1.3 6.2a.6.6 0 0 0 1.05.5L20.5 9.8A1 1 0 0 0 19.7 8H14l1.3-5.5A.6.6 0 0 0 14.2 2 .6.6 0 0 0 13 2Z"/></svg>WPM</span>
                            <b id="goWpm">0</b>
                        </div>
                        <div class="stat-box">
                            <span><svg class="stat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.2s-7.4-4.6-9.8-9.2C.6 7.6 2 4 5.6 3.4c2-.35 3.7.55 4.8 2.1a1 1 0 0 0 1.2 0c1.1-1.55 2.8-2.45 4.8-2.1C19.99 4 21.4 7.6 19.8 11c-.9 1.9-2.6 3.8-4.3 5.35"/></svg>Nyawa</span>
                            <b id="goHearts">0</b>
                        </div>
                    </div>
                    <div class="btn-row" style="margin-top:16px;">
                        <button class="btn btn-start" id="retryBtnLose">
                            <svg class="btn-icon btn-icon-retry" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 12a8 8 0 1 1-2.34-5.66"/>
                                <path d="M20 4v5h-5"/>
                            </svg>
                            <span>COBA LAGI</span>
                        </button>
                        <button class="btn btn-amber" id="certBtn">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/>
                                <path d="M8 5H5a2 2 0 0 0 0 4h1.5M16 5h3a2 2 0 0 1 0 4h-1.5"/>
                                <path d="M12 12v3"/><path d="M9 20h6"/><path d="M10 17h4l.6 3H9.4l.6-3Z"/>
                            </svg>
                            <span>SERTIFIKAT</span>
                        </button>
                        <button class="btn btn-danger" id="menuBtnLose">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 11.5 12 4l8 7.5"/>
                                <path d="M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9"/>
                            </svg>
                            <span>KEMBALI KE MENU</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>

        <div class="btn-row" style="margin-top:12px;">
            <button class="btn btn-danger" id="quitBtn">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9"/>
                    <path d="M10 12h11m0 0-3.5-3.5M21 12l-3.5 3.5"/>
                </svg>
                <span>KELUAR KE MENU</span>
            </button>
        </div>
    </section>

    {{-- Dialog konfirmasi "Kembali ke Menu" — berdiri sendiri di atas segalanya --}}
    <div class="overlay hidden" id="confirmQuitOverlay">
        <div class="result-card confirm-card">
            <div class="result-icon result-icon-confirm">
                <svg class="result-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3.6 2.9 19.3a1 1 0 0 0 .87 1.5h16.46a1 1 0 0 0 .87-1.5L12 3.6Z"/>
                    <path d="M12 10v4.4"/>
                    <circle cx="12" cy="17.4" r="0.8" fill="currentColor" stroke="none"/>
                </svg>
            </div>
            <h2 class="confirm-title pixel-font">KELUAR KE MENU?</h2>
            <p class="confirm-text">Progres permainan saat ini <b>akan hilang</b>.</p>
            <div class="btn-row" style="margin-top:16px;">
                <button class="btn btn-danger" id="confirmQuitYes">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9 17l11-11"/></svg>
                    <span>YA, KELUAR</span>
                </button>
                <button class="btn btn-howto" id="confirmQuitNo">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
                    <span>BATAL</span>
                </button>
            </div>
        </div>
    </div>

    {{-- Modal Cara Main: berdiri sendiri, tidak menumpuk di atas layar game --}}
    <div class="overlay hidden" id="howToOverlay">
        <div class="result-card howto-card">
            <h2 class="pixel-font howto-title">CARA BERMAIN</h2>
                        <div class="howto-steps">
                <div class="howto-step">
                    <span class="howto-ico">🌵</span>
                    <p>Kata muncul di atas <b>rintangan darat</b> &amp; <b>serangan udara</b> yang mendekat.</p>
                </div>
                <div class="howto-step">
                    <span class="howto-ico">⌨️</span>
                    <p><b>Ketik kata itu</b> sebelum rintangan mencapai dino.</p>
                </div>
                <div class="howto-step">
                    <span class="howto-ico">🦖</span>
                    <p>Kata benar &rarr; dino otomatis <b>melompat</b> / <b>menyerang</b> serangan udara.</p>
                </div>
                <div class="howto-step">
                    <span class="howto-ico">💔</span>
                    <p>Salah ketik atau rintangan terlewat = <b style="color:var(--hard)">1 nyawa hilang</b>.</p>
                </div>
                <div class="howto-step">
                    <span class="howto-ico">🏆</span>
                    <p>Nyawa habis = Game Over. Kejar <b>skor tertinggi</b> &amp; lihat sertifikatmu!</p>
                </div>
            </div>
            <div class="btn-row howto-actions">
                <button class="btn" id="closeHowTo">MENGERTI</button>
            </div>
        </div>
    </div>

    {{-- Popup "Memuat" — HANYA tampil kalau sprite (dino/hornet/pohon) belum
         semuanya selesai diunduh saat "Mulai Bermain" diklik (lihat
         assetsReadyPromise di game.js). Berdiri sendiri di atas segalanya,
         sama seperti howToOverlay. --}}
    <div class="overlay hidden" id="assetLoadingOverlay">
        <div class="result-card loading-card">
            <img src="{{ asset('assets/images/logo.png') }}" alt="DinoTyping" class="loading-logo">
            <h2 class="loading-title pixel-font">
                <span>MEMUAT GAME</span>

            </h2>
            <p class="loading-sub" id="loadingStatus">Menyiapkan aset permainan...</p>
            <div class="loading-bar-track">
                <div class="loading-bar-fill" id="loadingBarFill"></div>
            </div>
            <p class="loading-percent" id="loadingPercent">0%</p>
        </div>
    </div>
</div>
</x-layout>