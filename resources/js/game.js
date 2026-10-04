// ============================================================
// TYPING DINO - Game Engine (vanilla JS + Canvas, pixel art)
// ============================================================

const API_BASE = '/game-api';

const WORD_BANK = {
    easy: ['aku','kau','ini','itu','mau','ada','bisa','oke','iya','lho','buku','meja','kursi','pintu',
           'jalan','air','laut','gunung','kucing','rumah','sekolah','mata','kaki'],
    medium: ['sekolah','keluarga','pekerjaan','kesehatan','olahraga','perjalanan','kebahagiaan',
              'pertanyaan','penjelasan','kesempatan','lingkungan','pendidikan','persahabatan',
              'kemerdekaan','kebudayaan','pengalaman','kepercayaan','perusahaan','kemampuan'],
    hard: ['ekstrakurikuler','pertanggungjawaban','pembangunan berkelanjutan','kewarganegaraan',
           'keanekaragaman hayati','perekonomian nasional','ketidakpastian global',
           'transformasi digital','revolusi industri','infrastruktur teknologi',
           'ketenagakerjaan','profesionalisme kerja','kesejahteraan masyarakat']
};

const DIFF_CONFIG = {
    easy:   { baseSpeed: 130, spawnGapMin: 900,  spawnGapMax: 1400, target: 15, scoreMul: 10, airChance: 0.25, label: 'EASY' },
    medium: { baseSpeed: 190, spawnGapMin: 650,  spawnGapMax: 1050, target: 20, scoreMul: 15, airChance: 0.35, label: 'MEDIUM' },
    hard:   { baseSpeed: 260, spawnGapMin: 450,  spawnGapMax: 800,  target: 25, scoreMul: 20, airChance: 0.45, label: 'HARD' },
};

const GROUND_Y = 280;
const PLAYER_X = 90;

// Fisika lompat dino, dihitung agar puncak lompatan pas di atas rintangan.
// JUMP_HANG_TIME = jeda singkat "melayang" di puncak, supaya lompatan tidak
// cuma 1 frame lewat dan rintangan tidak menabrak dino.
const JUMP_GRAVITY = 1600;
const JUMP_VY = -630;
const JUMP_RISE_TIME = Math.abs(JUMP_VY) / JUMP_GRAVITY;
const JUMP_HANG_TIME = 0.14; // detik melayang di puncak lompatan

// Variasi model visual rintangan (digambar vector, bukan pixel-art)
const GROUND_MODELS = ['cactus', 'rock', 'spike', 'log', 'crystal'];
const AIR_MODELS = ['drone', 'ufo', 'missile', 'hornet'];

// Lebar (px) tiap model rintangan — dipakai agar label kata selalu presisi
// di tengah-atas bentuknya (bukan offset tetap untuk semua model).
const GROUND_WIDTH = { cactus: 25, rock: 40, spike: 38, log: 44, crystal: 34 };
const AIR_WIDTH = { drone: 40, ufo: 40, missile: 50, hornet: 122 };
// Jarak label kata dari tiap model rintangan udara — beda-beda karena tinggi
// badannya juga beda (hornet jauh lebih tinggi dari model lain).
const AIR_LABEL_OFFSET = { drone: 16, ufo: 20, missile: 14, hornet: 70 };

// Lama (ms) menahan tampilan huruf TERAKHIR sebuah kata: BENAR -> kata penuh
// hijau sejenak sebelum lanjut ke skor/lompat; SALAH -> huruf terakhir merah
// tertahan lebih lama dari kedipan biasa (260ms), supaya hasilnya terbaca jelas.
const WORD_RESULT_HOLD_MS = 380;

// ============================================================
// DINO — sprite PNG animasi jalan (public/assets/images/walk/walk1..240.png)
// ============================================================
const DINO_SPRITE_PATH = 'assets/images/walk/walk';
const WALK_FRAME_COUNT = 240;
const DINO_FRAME_DURATION = 0.02; // detik/frame — kecilkan = animasi lebih cepat

// Ukuran render & titik jangkar "kaki" dino (0-1 relatif ukuran sprite).
// Sesuaikan 4 nilai ini kalau ganti file PNG, supaya kaki pas menapak tanah.
const DINO_SPRITE_W = 160;
const DINO_SPRITE_H = 215;
const DINO_SPRITE_ANCHOR_X = 0.38;
const DINO_SPRITE_ANCHOR_Y = 0.93;

// Jarak pijakan dari garis jalan (GROUND_Y) ke tempat dino & rintangan darat
// benar-benar berpijak. Dipakai KEDUANYA supaya sejajar — jangan diubah
// sepihak, nanti fisika lompat (JUMP_*) ikut meleset.
const GROUND_CONTACT_OFFSET = 40;

// Dorongan turun tambahan KHUSUS dino (rintangan tidak ikut), mengompensasi
// ruang transparan di bagian bawah file PNG dino.
const DINO_EXTRA_DROP = 34;

// Titik mulut dino (relatif thd titik kaki) — tempat bola api & kilau
// serangan muncul. Sesuaikan kalau posisi mulut di sprite kamu berbeda.
const DINO_MOUTH_X = 51;
const DINO_MOUTH_Y = -101;

// Buffer offscreen utk menggambar dino + tint efek damage. Wajib dikomposit
// di sini dulu (bukan langsung ke canvas utama) — kalau langsung, tint akan
// ikut menimpa background di bawah sprite ('source-atop' bereaksi ke semua
// piksel non-transparan yang sudah ada di context tujuan).
const dinoFxBuffer = document.createElement('canvas');
dinoFxBuffer.width = DINO_SPRITE_W;
dinoFxBuffer.height = DINO_SPRITE_H;
const dinoFxCtx = dinoFxBuffer.getContext('2d');

const dinoWalkFrames = [];
function preloadDinoSprites(){
    for (let i = 1; i <= WALK_FRAME_COUNT; i++){
        const img = new Image();
        img.src = `${DINO_SPRITE_PATH}${i}.png`;
        dinoWalkFrames.push(img);
    }
}
preloadDinoSprites();

// ============================================================
// HORNET — sprite PNG animasi (public/assets/images/hornet/hornet1..240.png),
// di-preload sejak awal supaya sudah siap saat pertama kali muncul.
// ============================================================
const HORNET_SPRITE_PATH = 'assets/images/hornet/hornet';
const HORNET_FRAME_COUNT = 240;
const HORNET_FRAME_DURATION = 0.035; // detik/frame — lebih lambat dari dino krn sprite besar
// Tinggi render hornet; lebar dihitung otomatis dari rasio asli PNG-nya
// (lihat drawAirObstacle) supaya tidak gepeng walau ukurannya besar.
const HORNET_TARGET_H = 156;

const hornetFrames = [];
function preloadHornetSprites(){
    for (let i = 1; i <= HORNET_FRAME_COUNT; i++){
        const img = new Image();
        img.src = `${HORNET_SPRITE_PATH}${i}.png`;
        hornetFrames.push(img);
    }
}
preloadHornetSprites();

// ============================================================
// POHON — sprite PNG statis (public/assets/images/tree/tree1-2.png),
// dipilih acak tapi stabil per posisi (lihat pickTreeVariant).
// ============================================================
const TREE_SPRITE_PATH = 'assets/images/tree/tree';
const TREE_VARIANT_COUNT = 2;
const TREE_TARGET_H = 130; // lebar dihitung otomatis dari rasio asli PNG

const treeSprites = [];
function preloadTreeSprites(){
    for (let i = 1; i <= TREE_VARIANT_COUNT; i++){
        const img = new Image();
        img.src = `${TREE_SPRITE_PATH}${i}.png`;
        treeSprites.push(img);
    }
}
preloadTreeSprites();

// ============================================================
// PEMANTAU KESIAPAN ASET — semua sprite mulai diunduh sejak halaman dibuka;
// tombol "Mulai Bermain" menunggu semuanya benar-benar siap (assetsReadyPromise)
// sebelum layar game tampil, supaya tidak ada gambar yang telat muncul.
// ============================================================
let assetsLoadedCount = 0;
let assetsTotalCount = 0;
let assetsAreReady = false;

// Memperbarui tampilan bar horizontal + persentase pada popup "Memuat"
// (dipanggil setiap satu aset selesai diunduh, selagi popup itu tampil).
function updateAssetLoadingProgress(){
    const pct = assetsTotalCount > 0 ? Math.round((assetsLoadedCount / assetsTotalCount) * 100) : 100;
    const fill = el('loadingBarFill');
    const label = el('loadingPercent');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
}

function waitForImage(img){
    assetsTotalCount++;
    if (img.complete && img.naturalWidth > 0){
        assetsLoadedCount++;
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const done = () => { assetsLoadedCount++; updateAssetLoadingProgress(); resolve(); };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true }); // gagal pun tetap lanjut, jangan sampai macet
    });
}

const assetsReadyPromise = Promise.all([
    ...dinoWalkFrames.map(waitForImage),
    ...hornetFrames.map(waitForImage),
    ...treeSprites.map(waitForImage),
]).then(() => { assetsAreReady = true; });

// ============================================================
// KAKTUS — sprite PNG (public/assets/images/obstacle/cactus.png), dipusatkan
// di hitbox GROUND_WIDTH.cactus & di-scale menjaga rasio asli (tidak gepeng).
// ============================================================
const CACTUS_SPRITE_PATH = 'assets/images/obstacle/cactus.png';
const CACTUS_TARGET_H = 64; // tinggi target render, menyamai tinggi desain vector sebelumnya

const cactusSprite = new Image();
cactusSprite.src = CACTUS_SPRITE_PATH;

function drawCactusSprite(ctx, x, baseY){
    const img = cactusSprite;
    // sprite belum termuat -> lewati saja frame ini (menghindari gambar rusak/kotak kosong)
    if (!img.complete || img.naturalWidth === 0) return;

    const targetH = CACTUS_TARGET_H;
    const targetW = targetH * (img.naturalWidth / img.naturalHeight);
    // dipusatkan tepat di titik tengah lebar hitbox kaktus (GROUND_WIDTH.cactus)
    // & bertumpu (anchor bawah) di baseY — sama seperti rintangan darat lain.
    const cx = x + GROUND_WIDTH.cactus / 2;
    ctx.drawImage(img, cx - targetW / 2, baseY - targetH, targetW, targetH);
}

// Pemilih varian pohon PSEUDO-RANDOM: hasilnya terlihat acak, tapi
// SELALU SAMA untuk seed (posisi) yang sama, supaya pohon tidak berganti-
// ganti gambar tiap frame saat scroll (harus stabil per posisi pohon).
function pickTreeVariant(seed){
    return seed % TREE_VARIANT_COUNT;
}

// Ikon tingkat kesulitan di HUD dibuat identik dengan ikon di layar
// "Pilih Tingkat Kesulitan" (3 batang naik, bukan emoji).
const DIFF_ICON_BARS = {
    easy:   [1, 0.3, 0.15],
    medium: [1, 1, 0.3],
    hard:   [1, 1, 1],
};
function diffIconSvg(difficulty){
    const op = DIFF_ICON_BARS[difficulty] || DIFF_ICON_BARS.easy;
    return `<svg class="hud-diff-ico" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="14" width="4.5" height="7" rx="1.2" fill="currentColor" opacity="${op[0]}"/>
        <rect x="9.75" y="9" width="4.5" height="12" rx="1.2" fill="currentColor" opacity="${op[1]}"/>
        <rect x="16.5" y="4" width="4.5" height="17" rx="1.2" fill="currentColor" opacity="${op[2]}"/>
    </svg>`;
}

// Ikon HUD (skor/waktu/wpm) kini SEMUA berupa SVG vektor tipis & konsisten
// satu sama lain (bukan lagi emoji 🏆/⏱/⚡ yang gayanya beda-beda di tiap OS).
const HUD_ICON_SCORE = '<svg class="hud-ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5a2 2 0 0 0 0 4h1.5M16 5h3a2 2 0 0 1 0 4h-1.5"/><path d="M12 12v3"/><path d="M9 20h6"/><path d="M10 17h4l.6 3H9.4l.6-3Z"/></svg>';
const HUD_ICON_TIME = '<svg class="hud-ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8.2"/><path d="M12 9v4.3l3 2"/><path d="M9.5 2.2h5"/></svg>';
const HUD_ICON_WPM = '<svg class="hud-ico-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3.5 14.2A1 1 0 0 0 4.3 16H10l-1.3 6.2a.6.6 0 0 0 1.05.5L20.5 9.8A1 1 0 0 0 19.7 8H14l1.3-5.5A.6.6 0 0 0 14.2 2 .6.6 0 0 0 13 2Z"/></svg>';

function el(id){ return document.getElementById(id); }

const canvas = () => el('gameCanvas');

let state = null;

function freshState(difficulty, playerName){
    return {
        running: false,
        paused: false,
        pausedAt: 0,
        difficulty,
        playerName,
        score: 0,
        hearts: 3,
        clearedCount: 0,
        correctWords: 0,
        wrongHits: 0,
        correctKeys: 0,
        totalKeys: 0,
        startTime: 0,
        lastFrameTime: 0,
        current: null,       // obstacle sedang aktif untuk diketik
        typedIndex: 0,
        wrongFlashAt: 0,
        nextSpawnAt: 0,
        waitingSpawn: true,
        recentWords: [],
        lastGroundModel: null, // model rintangan darat terakhir -> dipakai agar tidak muncul 2x berturut-turut
        lastAirModel: null,    // model serangan udara terakhir -> dipakai agar tidak muncul 2x berturut-turut
        jump: { active:false, vy:0, y:0, hanging:false, hangTimer:0, pastApex:false },
        walkFrame: 0,
        walkTimer: 0,
        hitFlashUntil: 0,
        hitStartAt: 0,
        mouthGlowUntil: 0,
        finished: false,
        rafId: null,
        effects: { particles: [], projectiles: [], enemyBullets: [], shockwaves: [] }, // partikel ledakan, bola api dino, peluru musuh, & cincin ledakan
    };
}

function pickWord(difficulty){
    const pool = WORD_BANK[difficulty];
    let word;
    let tries = 0;
    do {
        word = pool[Math.floor(Math.random() * pool.length)];
        tries++;
    } while (state.recentWords.includes(word) && tries < 8);
    state.recentWords.push(word);
    if (state.recentWords.length > 4) state.recentWords.shift();
    return word;
}

// Model rintangan acak, tapi tidak pernah sama dgn model terakhir (darat/udara).
function pickModel(type){
    const models = type === 'air' ? AIR_MODELS : GROUND_MODELS;
    const lastKey = type === 'air' ? 'lastAirModel' : 'lastGroundModel';
    let model = models[Math.floor(Math.random() * models.length)];
    if (models.length > 1){
        while (model === state[lastKey]){
            model = models[Math.floor(Math.random() * models.length)];
        }
    }
    state[lastKey] = model;
    return model;
}

function currentSpeed(){
    const cfg = DIFF_CONFIG[state.difficulty];
    const bonus = Math.min(state.clearedCount * 3, 90); // makin lama makin cepat, dibatasi
    return cfg.baseSpeed + bonus;
}

// ============================================================
// SPAWN & UPDATE OBSTACLE
// ============================================================
function trySpawn(now){
    if (state.current || !state.waitingSpawn) return;
    const cfg = DIFF_CONFIG[state.difficulty];
    const type = Math.random() < cfg.airChance ? 'air' : 'ground';
    const word = pickWord(state.difficulty);
    const w = canvas().width;
    state.current = {
        type,
        model: pickModel(type),
        word,
        x: w + 40,
        y: type === 'air' ? GROUND_Y - 155 : GROUND_Y - 26,
        resolved: null,         // null | 'cleared' | 'missed'
        jumped: false,          // sudah trigger lompatan dino (rintangan darat)
        attackTriggered: false, // sudah trigger serangan dino (rintangan udara)
        exploded: false,        // sudah meledak (rintangan udara)
        finalizeAt: 0,
        nextShotAt: 0,          // waktu tembakan berikutnya (rintangan udara)
    };
    state.typedIndex = 0;
    state.waitingSpawn = false;
    renderTypingIndicator();
}

function scheduleNextSpawn(now){
    const cfg = DIFF_CONFIG[state.difficulty];
    const gap = cfg.spawnGapMin + Math.random() * (cfg.spawnGapMax - cfg.spawnGapMin);
    state.nextSpawnAt = now + gap;
    state.waitingSpawn = false;
    setTimeout(() => { if (state.running) state.waitingSpawn = true; }, gap);
}

function resolveObstacle(cleared){
    if (!state.current || state.current.resolved) return;
    const ob = state.current;

    if (cleared){
        state.score += DIFF_CONFIG[state.difficulty].scoreMul + ob.word.replace(/\s/g,'').length;
        state.correctWords++;
        state.clearedCount++;
        ob.resolved = 'cleared';
        // Rintangan tetap melaju (belum langsung hilang): darat -> dino
        // melompatinya; udara -> dino menyerangnya hingga hancur.
    } else {
        loseHeart();
        triggerHit();
        ob.resolved = 'missed';
    }

    state.typedIndex = 0;
    renderTypingIndicator();
    // Tidak ada kondisi "menang" — game hanya berakhir saat nyawa habis
    // (lihat loseHeart -> endGame()).
}

function finalizeObstacle(){
    state.current = null;
    state.typedIndex = 0;
    renderTypingIndicator();
    scheduleNextSpawn(performance.now());
}

function loseHeart(){
    if (state.gameOverPending) return;

    state.hearts = Math.max(0, state.hearts - 1);
    state.wrongHits++;
    updateHud();
    triggerHeartLostEffect();
    sfxDamage();

    // Di demo, nyawa boleh habis (landing-demo.js yang menampilkan siklus
    // GAME OVER-nya sendiri) — tapi TIDAK boleh memicu endGame() sungguhan
    // (itu akan mengirim skor palsu ke server).
    const isDemo = window.__demoInternals && window.__demoInternals.isDemoActive;
    if (state.hearts <= 0 && !isDemo){
        state.gameOverPending = true;
        setTimeout(() => {
            if (state && !state.finished) endGame();
        }, HEART_LOST_TO_GAMEOVER_DELAY);
    }
}

// Efek visual di TENGAH LAYAR saat nyawa berkurang: ikon hati pecah muncul
// sekejap lalu memudar, dibantu getaran kamera ringan supaya terasa berdampak.
const HEART_LOST_EFFECT_DURATION = 700;
const HEART_LOST_TO_GAMEOVER_DELAY = 700;
let heartLostTimeoutId = null;
function triggerHeartLostEffect(){
    // Ada 2 elemen ".game-stage" di dokumen (demo & permainan sungguhan) —
    // harus dipilih eksplisit sesuai konteks aktif, karena querySelector
    // biasa akan selalu mengambil yang pertama ditemukan.
    const isDemo = window.__demoInternals && window.__demoInternals.isDemoActive;
    const box = el(isDemo ? 'demoHeartLostEffect' : 'heartLostEffect');
    const stage = document.querySelector(isDemo ? '#landingScreen .game-stage' : '#gameScreen .game-stage');
    if (box){
        box.classList.remove('play');
        // eslint-disable-next-line no-unused-expressions
        void box.offsetWidth; // restart animasi CSS
        box.classList.add('play');
    }
    if (stage){
        stage.classList.remove('shake-hit');
        void stage.offsetWidth;
        stage.classList.add('shake-hit');
    }
    clearTimeout(heartLostTimeoutId);
    heartLostTimeoutId = setTimeout(() => { if (box) box.classList.remove('play'); }, HEART_LOST_EFFECT_DURATION);
}

function triggerJump(){
    state.jump.active = true;
    state.jump.vy = JUMP_VY;
    state.jump.pastApex = false;
    state.jump.hanging = false;
    state.jump.hangTimer = 0;
    sfxJump();
}

// Dino menembakkan rentetan bola api homing (selalu akurat, lihat
// updateEffects) ke rintangan udara — jeda & sebaran kecil antar tembakan
// biar terasa seperti rentetan, bukan 1 proyektil tunggal.
const AIR_ATTACK_BURST_COUNT = 4;
function triggerAirAttack(ob, now){
    const originX = PLAYER_X + 18 + DINO_MOUTH_X;
    const originY = GROUND_Y + GROUND_CONTACT_OFFSET + DINO_EXTRA_DROP + state.jump.y + DINO_MOUTH_Y;
    for (let i = 0; i < AIR_ATTACK_BURST_COUNT; i++){
        state.effects.projectiles.push({
            x: originX + (Math.random() * 8 - 4),
            y: originY + (Math.random() * 8 - 4),
            target: ob,     // mengejar posisi target terkini setiap frame -> selalu akurat
            speed: 780 + i * 30,
            hit: false,
            readyAt: now + i * 55, // jeda antar peluru dalam rentetan (ms)
        });
    }
    state.mouthGlowUntil = now + 320;
    sfxAttack();
}

function triggerHit(){
    const now = performance.now();
    state.hitStartAt = now;
    state.hitFlashUntil = now + 420; // durasi kedip merah/putih & guncangan saat kena damage
    spawnExplosion(PLAYER_X + 18, GROUND_Y + GROUND_CONTACT_OFFSET + DINO_EXTRA_DROP - 30, '#ef4444');
    spawnExplosion(PLAYER_X + 18, GROUND_Y + GROUND_CONTACT_OFFSET + DINO_EXTRA_DROP - 30, '#f8fafc');
}

// ============================================================
// EFEK VISUAL: partikel ledakan & proyektil serangan
// ============================================================
function spawnExplosion(x, y, color){
    for (let i = 0; i < 12; i++){
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 130;
        state.effects.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.35 + Math.random() * 0.3,
            maxLife: 0.65,
            r: 2 + Math.random() * 3,
            color,
        });
    }
}

// Peluru rintangan udara ke arah dino — selalu dibidik akurat, dianggap
// "kena" begitu jaraknya sudah sangat dekat (lihat updateEffects), jadi
// tidak pernah terlihat meleset. Bentuk bervariasi per model rintangan.
// `delayMs` opsional dipakai spawnEnemyBulletVolley untuk efek rentetan.
function spawnEnemyBullet(ob, now, delayMs){
    const halfW = (AIR_WIDTH[ob.model] || 34) / 2;
    const originX = ob.x + halfW + (Math.random() * 8 - 4);
    const originY = ob.y + 9 + (Math.random() * 6 - 3);
    // Jitter sasaran dibuat sangat kecil supaya peluru selalu terlihat
    // menuju & mengenai badan dino.
    const targetX = PLAYER_X + 18 + (Math.random() * 1.4 - 0.7);
    const targetY = GROUND_Y + GROUND_CONTACT_OFFSET + DINO_EXTRA_DROP + state.jump.y - 34 + (Math.random() * 1.4 - 0.7);
    const dx = targetX - originX, dy = targetY - originY;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 460 + Math.random() * 70;
    state.effects.enemyBullets.push({
        x: originX, y: originY,
        targetX, targetY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        speed,
        model: ob.model,
        life: 1.8,
        readyAt: delayMs ? now + delayMs : 0,
        hit: false,
    });
}

// Jumlah peluru per tembakan rintangan udara (1 = satu tembakan akurat,
// langsung kena — lihat spawnEnemyBullet & updateEffects).
const ENEMY_BULLET_BURST_COUNT = 1;
function spawnEnemyBulletVolley(ob, now){
    for (let i = 0; i < ENEMY_BULLET_BURST_COUNT; i++){
        spawnEnemyBullet(ob, now, i * 90);
    }
}

function updateEffects(dt, now){
    state.effects.particles = state.effects.particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
        p.life -= dt;
        return p.life > 0;
    });

    // Cincin kejut (shockwave) ledakan: statis, hanya disaring berdasar usianya.
    state.effects.shockwaves = state.effects.shockwaves.filter(s => (now - s.start) < s.duration);

    // Proyektil homing: bergerak lurus mengejar posisi target TERKINI tiap
    // frame. Proyektil dgn readyAt di masa depan (bagian rentetan tembakan)
    // menunggu dulu sebelum ikut bergerak.
    state.effects.projectiles = state.effects.projectiles.filter(pr => {
        if (pr.hit) return false;
        if (pr.readyAt && now < pr.readyAt) return true;
        const ob = pr.target;
        if (!ob) return false;
        const tx = ob.x + 17, ty = ob.y + 8;
        const dx = tx - pr.x, dy = ty - pr.y;
        const dist = Math.hypot(dx, dy);
        const step = pr.speed * dt;

        // jejak percikan biru di belakang bola api agar terasa halus & bertenaga
        state.effects.particles.push({
            x: pr.x, y: pr.y,
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.5) * 16,
            life: 0.16, maxLife: 0.16,
            r: 1.4 + Math.random() * 1.8,
            color: 'rgba(56,189,248,0.85)',
        });

        if (dist <= step || dist < 5){
            pr.x = tx; pr.y = ty;
            pr.hit = true;
            if (state.current === ob && !ob.exploded){
                ob.exploded = true;
                // Ledakan: 3 gelombang partikel (biru/jingga/putih) + 2 shockwave
                // yang mengembang & memudar.
                spawnExplosion(tx, ty, '#38bdf8');
                spawnExplosion(tx, ty, '#f59e0b');
                spawnExplosion(tx, ty, '#ffffff');
                state.effects.shockwaves.push({ x: tx, y: ty, start: now, duration: 380, maxR: 30, color: 'rgba(148,197,255,0.9)' });
                state.effects.shockwaves.push({ x: tx, y: ty, start: now + 70, duration: 320, maxR: 20, color: 'rgba(251,191,36,0.9)' });
                ob.finalizeAt = now + 450;
            } else if (state.current === ob){
                // Proyektil susulan (target sudah meledak duluan) -> tetap
                // beri percikan kecil supaya terasa kena.
                spawnExplosion(tx, ty, '#7dd3fc');
            }
            return false;
        }

        pr.x += (dx / dist) * step;
        pr.y += (dy / dist) * step;
        return true;
    });

    // Peluru rintangan udara: melaju lurus akurat ke dino, dianggap "kena"
    // begitu jaraknya sudah sangat dekat (percikan lalu hilang) — jadi tidak
    // pernah terlihat meleset lewat dino.
    state.effects.enemyBullets = state.effects.enemyBullets.filter(b => {
        if (b.hit) return false;
        if (b.readyAt && now < b.readyAt) return true;

        const dx = b.targetX - b.x, dy = b.targetY - b.y;
        const dist = Math.hypot(dx, dy);
        const step = (b.speed || 400) * dt;

        if (dist <= step || dist < 6){
            b.hit = true;
            const impactColor = b.model === 'ufo' ? '#c084fc'
                : b.model === 'hornet' ? '#facc15'
                : '#f87171';
            spawnExplosion(b.targetX, b.targetY, impactColor);
            return false;
        }

        b.x += (dx / dist) * step;
        b.y += (dy / dist) * step;
        b.life -= dt;
        if (Math.random() < 0.55){
            const trailColor = b.model === 'ufo' ? 'rgba(168,85,247,0.75)'
                : b.model === 'hornet' ? (Math.random() < 0.5 ? 'rgba(15,15,17,0.7)' : 'rgba(250,204,21,0.7)')
                : 'rgba(239,68,68,0.75)';
            state.effects.particles.push({
                x: b.x, y: b.y,
                vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
                life: 0.16, maxLife: 0.16,
                r: 1.2 + Math.random() * 1.4,
                color: trailColor,
            });
        }
        return b.life > 0;
    });
}

// ============================================================
// INPUT HANDLING (keyboard desktop + input event untuk mobile)
// ============================================================
function handleChar(ch){
    if (!state || !state.running || state.finished || state.paused) return;
    if (!state.current){
        return; // belum ada rintangan aktif untuk diketik
    }
    const ob = state.current;
    const now = performance.now();

    // Input diabaikan sejenak selagi indikator huruf terakhir masih ditahan
    // tampil (lihat WORD_RESULT_HOLD_MS).
    if (ob.finalHoldUntil && now < ob.finalHoldUntil) return;

    const target = ob.word.toLowerCase();
    const typedChar = ch.toLowerCase();
    const isLastChar = state.typedIndex === target.length - 1;
    const expected = target[state.typedIndex];

    state.totalKeys++;

    if (typedChar === expected){
        state.correctKeys++;
        state.typedIndex++;
        renderTypingIndicator();
        sfxTyping();
        if (state.typedIndex >= target.length){
            // Kata lengkap & benar -> tahan tampilan (semua hijau) sejenak
            // sebelum diselesaikan (skor, lompat dino, dsb).
            ob.finalHoldUntil = now + WORD_RESULT_HOLD_MS;
            ob.finalHoldResult = 'correct';
            setTimeout(() => {
                if (state.current === ob && !ob.resolved) resolveObstacle(true);
            }, WORD_RESULT_HOLD_MS);
        }
    } else {
        state.wrongFlashAt = now;
        renderTypingIndicator(true);
        sfxTyping();
        // Rintangan udara ikut membalas saat pemain salah ketik.
        if (ob.type === 'air' && !ob.resolved){
            spawnEnemyBulletVolley(ob, now);
            ob.nextShotAt = now + 420 + Math.random() * 260;
        }
        loseHeart();
        triggerHit();

        if (isLastChar){
            // Salah tepat di huruf terakhir -> tahan indikator merahnya
            // lebih lama dari kedipan biasa, biar kesalahannya terbaca jelas.
            ob.finalHoldUntil = now + WORD_RESULT_HOLD_MS;
            ob.finalHoldResult = 'wrong';
        }
    }
}

// Menjaga area permainan tetap terlihat PENUH (tanpa zoom/terpotong) saat
// keyboard HP terbuka: tinggi & posisi viewport visual dipantau lalu dipakai
// lewat variabel CSS --vvh / --vvt (lihat body.is-playing di app.css).
function fitViewport(){
    const vv = window.visualViewport;
    const root = document.documentElement;
    root.style.setProperty('--vvh', (vv ? vv.height : window.innerHeight) + 'px');
    root.style.setProperty('--vvt', (vv ? vv.offsetTop : 0) + 'px');
}

function setupViewportFit(){
    fitViewport();
    if (window.visualViewport){
        window.visualViewport.addEventListener('resize', fitViewport);
        window.visualViewport.addEventListener('scroll', fitViewport);
    }
    window.addEventListener('resize', fitViewport);
    window.addEventListener('orientationchange', fitViewport);
}

function setupInput(){
    setupViewportFit();
    const hidden = el('hiddenTypingInput');
    hidden.value = '';

    hidden.addEventListener('input', (e) => {
        const val = hidden.value;
        if (val.length > 0){
            const lastChar = val.slice(-1);
            if (/^[a-zA-Z ]$/.test(lastChar)){
                handleChar(lastChar);
            }
        }
        hidden.value = '';
    });

    // Desktop: keydown langsung agar terasa responsif juga
    document.addEventListener('keydown', (e) => {
        // Ketikan asli pemain diabaikan selagi demo bot berjalan.
        // isDemoActive ada di landing-demo.js (module terpisah), dibaca
        // lewat window.__demoInternals.
        const demoActive = window.__demoInternals && window.__demoInternals.isDemoActive;
        if (!state || !state.running || state.paused || demoActive) return;
        if (e.key.length === 1 && /[a-zA-Z ]/.test(e.key)){
            e.preventDefault();
            handleChar(e.key);
        }
    });

    document.querySelector('.game-stage').addEventListener('touchstart', () => {
        if (state && state.paused){ resumeGame(); return; }
        if (state && state.running) hidden.focus();
    });
    document.querySelector('.game-stage').addEventListener('click', () => {
        if (state && state.paused){ resumeGame(); return; }
        if (state && state.running) hidden.focus();
    });

    // Berpindah tab/minimize = otomatis dijeda, lanjut lewat ketukan di atas
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pauseGame();
    });
}

// ============================================================
// PAUSE / RESUME (dipicu saat berpindah tab)
// ============================================================
function pauseGame(showCard = true){
    if (!state || !state.running || state.finished || state.paused) return;
    state.paused = true;
    state.pausedAt = performance.now();
    if (state.rafId) cancelAnimationFrame(state.rafId);
    if (showCard){
        const overlay = el('pauseOverlay');
        if (overlay) overlay.classList.remove('hidden');
    }
}

function resumeGame(){
    if (!state || !state.paused) return;
    const overlay = el('pauseOverlay');
    if (overlay) overlay.classList.add('hidden');
    const now = performance.now();
    const pausedDuration = now - state.pausedAt;
    state.startTime += pausedDuration;
    state.nextSpawnAt += pausedDuration;
    state.lastFrameTime = now;
    state.paused = false;
    state.rafId = requestAnimationFrame(loop);
}

// ============================================================
// KONFIRMASI KELUAR KE MENU — tidak langsung keluar tanpa konfirmasi dulu.
// ============================================================
let quitConfirmSource = null; // 'play' | 'pause' — asal konfirmasi dipicu
function openQuitConfirm(source){
    quitConfirmSource = source;
    if (source === 'play' && state && state.running && !state.paused){
        pauseGame(false); // bekukan diam-diam (tanpa kartu jeda) selagi dialog terbuka
    }
    const overlay = el('confirmQuitOverlay');
    if (overlay) overlay.classList.remove('hidden');
}
function closeQuitConfirm(resume){
    const overlay = el('confirmQuitOverlay');
    if (overlay) overlay.classList.add('hidden');
    if (resume && state && state.paused && quitConfirmSource === 'play') resumeGame();
    quitConfirmSource = null;
}

// ============================================================
// RENDER: TYPING INDICATOR
// ============================================================
function renderTypingIndicator(){
    // Indikator ketik kini digambar langsung di atas rintangan/serangan udara
    // pada canvas (lihat drawWordLabel), jadi kotak bawah sudah tidak dipakai.
}

// ============================================================
// HUD
// ============================================================
function updateHud(){
    const heartsBox = el('heartsBox');
    heartsBox.innerHTML = '';
    for (let i = 0; i < 3; i++){
        const h = document.createElement('div');
        h.className = 'heart' + (i >= state.hearts ? ' lost' : '');
        heartsBox.appendChild(h);
    }
    el('scoreBadge').innerHTML = HUD_ICON_SCORE + ' SKOR&nbsp;<b>' + state.score + '</b>';
    const elapsed = state.running ? (performance.now() - state.startTime) / 1000 : 0;
    el('timeBadge').innerHTML = HUD_ICON_TIME + ' WAKTU&nbsp;<b>' + elapsed.toFixed(1) + 's</b>';
    el('diffBadge').innerHTML = diffIconSvg(state.difficulty) + ' ' + DIFF_CONFIG[state.difficulty].label;
    el('diffBadge').className = 'hud-badge hud-badge-diff diff-' + state.difficulty;

    // WPM standar: (jumlah karakter benar / 5) dibagi menit yang berlalu
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((state.correctKeys / 5) / minutes) : 0;
    el('wpmBadge').innerHTML = HUD_ICON_WPM + ' WPM&nbsp;<b>' + wpm + '</b>';
}

// ============================================================
// GAME LOOP
// ============================================================
function loop(now){
    if (!state || !state.running) return;
    const dt = Math.min(0.05, (now - (state.lastFrameTime || now)) / 1000);
    state.lastFrameTime = now;

    trySpawn(now);
    updatePhysics(dt, now);
    draw(now);
    updateHud();

    state.rafId = requestAnimationFrame(loop);
}

function updatePhysics(dt, now){
    // Update posisi & status rintangan aktif
    if (state.current){
        const ob = state.current;
        const speed = currentSpeed();

        if (!ob.resolved){
            ob.x -= speed * dt; // belum selesai diketik -> tetap melaju normal
            // Serangan udara hanya menembak saat sudah dekat/di atas dino,
            // bukan sepanjang perjalanan dari kanan layar.
            const nearDino = ob.type === 'air' && ob.x <= PLAYER_X + 130 && ob.x > PLAYER_X - 50;
            if (nearDino && now >= ob.nextShotAt){
                spawnEnemyBulletVolley(ob, now);
                ob.nextShotAt = now + 420 + Math.random() * 260;
            }
            if (ob.x <= PLAYER_X - 10){
                resolveObstacle(false); // mencapai dino tanpa selesai diketik = MISS
            }
        } else if (ob.resolved === 'cleared' && ob.type === 'ground'){
            // Sudah benar diketik: rintangan tetap melaju, dino melompatinya.
            ob.x -= speed * dt;
            // Jarak ancang-ancang dihitung dari kecepatan SAAT INI, supaya puncak
            // lompatan pas di atas rintangan saat tiba di posisi dino. +10 sebagai
            // margin kecil (dino agak besar); sisa keamanan datang dari
            // JUMP_HANG_TIME & fase turun. Jangan tambah buffer besar — lompatan
            // jadi terpicu terlalu awal dan malah tersentuh saat mendarat.
            const leadDistance = speed * JUMP_RISE_TIME + 10;
            if (!ob.jumped && ob.x <= PLAYER_X + leadDistance){
                triggerJump();
                ob.jumped = true;
            }
            if (ob.x < -60){
                finalizeObstacle();
            }
        } else if (ob.resolved === 'cleared' && ob.type === 'air'){
            // Sudah benar diketik: dino menyerang hingga rintangan hancur.
            if (!ob.attackTriggered){
                ob.attackTriggered = true;
                triggerAirAttack(ob, now);
            }
            if (!ob.exploded){
                ob.x -= speed * 0.4 * dt; // sedikit melaju selama serangan berlangsung
            } else if (now >= ob.finalizeAt){
                finalizeObstacle();
            }
        } else if (ob.resolved === 'missed'){
            // Sudah menabrak dino: lanjutkan lintasan sesaat lalu hilang.
            ob.x -= speed * dt;
            if (ob.x < PLAYER_X - 80){
                finalizeObstacle();
            }
        }
    }

    // Fisika lompat, dengan jeda "melayang" singkat di puncak (JUMP_HANG_TIME)
    // supaya dino benar-benar berada di atas rintangan sesaat, bukan cuma
    // melintas 1 frame.
    if (state.jump.active){
        if (state.jump.hanging){
            state.jump.hangTimer -= dt;
            if (state.jump.hangTimer <= 0){
                state.jump.hanging = false;
            }
        } else {
            state.jump.vy += JUMP_GRAVITY * dt; // gravitasi
            state.jump.y += state.jump.vy * dt;
            if (!state.jump.pastApex && state.jump.vy >= 0){
                // Baru lewat puncak -> mulai jeda melayang
                state.jump.pastApex = true;
                state.jump.hanging = true;
                state.jump.hangTimer = JUMP_HANG_TIME;
            }
            if (state.jump.y >= 0){
                state.jump.y = 0;
                state.jump.active = false;
                state.jump.vy = 0;
                state.jump.hanging = false;
                state.jump.pastApex = false;
            }
        }
    }

    // Animasi jalan dino (loop walk1..walk240 terus-menerus)
    state.walkTimer += dt;
    if (state.walkTimer >= DINO_FRAME_DURATION){
        state.walkTimer -= DINO_FRAME_DURATION;
        state.walkFrame = (state.walkFrame + 1) % WALK_FRAME_COUNT;
    }

    updateEffects(dt, now);
}

// ============================================================
// DRAWING (gaya vector halus / neumorphism, bukan pixel-art)
// ============================================================
function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Label kata mengambang di atas rintangan/serangan udara:
// abu tua = belum diketik, hijau = sudah benar, merah = baru salah ketik.
function drawWordLabel(ctx, word, typedIndex, cx, y, now, ob){
    ctx.font = "700 16px 'Consolas', 'Poppins', monospace";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Selagi huruf terakhir ditahan tampil, status ikut hasil tahan itu
    // (bukan flash 260ms biasa) — lihat WORD_RESULT_HOLD_MS.
    const inFinalHold = ob && ob.finalHoldUntil && now < ob.finalHoldUntil;
    const wrongFlash = inFinalHold ? ob.finalHoldResult === 'wrong' : (now - state.wrongFlashAt) < 260;
    const allCorrectSoFar = inFinalHold ? ob.finalHoldResult === 'correct' : (typedIndex > 0 && !wrongFlash);

    const charWidths = word.split('').map(ch => ctx.measureText(ch).width);
    const totalWidth = charWidths.reduce((a, b) => a + b, 0);
    const padX = 14, padY = 8, boxH = 26 + padY, boxW = totalWidth + padX * 2;
    const boxTop = y - 19 - padY;
    const boxLeft = cx - boxW / 2;
    const radius = 12;

    ctx.save();

    // Neumorphism tegas: bayangan gelap (bawah-kanan) + highlight terang (atas-kiri)
    ctx.shadowColor = 'rgba(15,23,42,0.32)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, boxLeft, boxTop, boxW, boxH, radius);
    ctx.fill();

    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = -4;
    ctx.shadowOffsetY = -4;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, boxLeft, boxTop, boxW, boxH, radius);
    ctx.fill();

    // garis tepi tipis sebagai indikator status tambahan (benar/salah/netral)
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = wrongFlash ? '#ef4444' : allCorrectSoFar ? '#16a34a' : 'rgba(148,163,184,0.55)';
    roundRect(ctx, boxLeft, boxTop, boxW, boxH, radius);
    ctx.stroke();

    let x = boxLeft + padX;
    const ty = boxTop + boxH / 2 + 5.5;
    for (let i = 0; i < word.length; i++){
        const ch = word[i];
        let color;
        if (i < typedIndex){
            color = '#16a34a';
        } else if (i === typedIndex && wrongFlash){
            color = '#ef4444';
        } else {
            color = '#334155';
        }
        ctx.fillStyle = color;
        ctx.fillText(ch, x, ty);
        x += charWidths[i];
    }
    ctx.restore();
}

// Dino: sprite PNG animasi jalan (walk1..walk240). Efek damage mengikuti
// siluet asli sprite (compositing 'source-atop') + guncangan & percikan.
function drawDino(ctx, now){
    const hitActive = now < state.hitFlashUntil;
    const mouthGlowActive = now < state.mouthGlowUntil;
    const footX = PLAYER_X + 18;
    const footY = GROUND_Y + GROUND_CONTACT_OFFSET + DINO_EXTRA_DROP + state.jump.y;

    // guncangan singkat & meredup (knockback) saat kena damage
    let shakeX = 0, shakeY = 0;
    if (hitActive){
        const t = now - state.hitStartAt;
        const decay = Math.max(0, 1 - t / 420);
        shakeX = Math.sin(t / 26) * 5 * decay;
        shakeY = Math.abs(Math.sin(t / 40)) * -2 * decay;
    }

    const frameIndex = Math.floor(state.walkFrame) % WALK_FRAME_COUNT;
    const frame = dinoWalkFrames[frameIndex];
    const spriteReady = frame && frame.complete && frame.naturalWidth > 0;
    const dw = DINO_SPRITE_W, dh = DINO_SPRITE_H;
    const dx = footX + shakeX - dw * DINO_SPRITE_ANCHOR_X;
    const dy = footY + shakeY - dh * DINO_SPRITE_ANCHOR_Y;

    ctx.save();
    if (spriteReady){
        if (hitActive){
            // Gambar dino di buffer terisolasi dulu, tint di sana (hanya
            // menempel ke siluet dino), baru tempel ke canvas utama.
            dinoFxCtx.clearRect(0, 0, DINO_SPRITE_W, DINO_SPRITE_H);
            dinoFxCtx.drawImage(frame, 0, 0, DINO_SPRITE_W, DINO_SPRITE_H);
            const t = now - state.hitStartAt;
            const blink = Math.floor(t / 55) % 2 === 0;
            dinoFxCtx.globalCompositeOperation = 'source-atop';
            dinoFxCtx.fillStyle = blink ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.5)';
            dinoFxCtx.fillRect(0, 0, DINO_SPRITE_W, DINO_SPRITE_H);
            dinoFxCtx.globalCompositeOperation = 'source-over';
            ctx.drawImage(dinoFxBuffer, dx, dy, dw, dh);
        } else {
            ctx.drawImage(frame, dx, dy, dw, dh);
        }
    } else {
        // penampung sementara selagi sprite belum termuat
        ctx.fillStyle = 'rgba(76,184,92,0.35)';
        roundRect(ctx, dx, dy, dw, dh, 14);
        ctx.fill();
    }

    // kilau mulut biru saat menembak bola api
    if (mouthGlowActive){
        const gx = footX + shakeX + DINO_MOUTH_X, gy = footY + shakeY + DINO_MOUTH_Y;
        const glow = ctx.createRadialGradient(gx, gy, 1, gx, gy, 12);
        glow.addColorStop(0, 'rgba(224,247,255,0.95)');
        glow.addColorStop(0.5, 'rgba(56,189,248,0.65)');
        glow.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(gx, gy, 12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // percikan debu/cahaya kecil sesekali saat kena damage
    if (hitActive && Math.random() < 0.35){
        spawnExplosion(footX + shakeX, footY + shakeY - 40, Math.random() < 0.5 ? '#ef4444' : '#ffffff');
    }
}


function drawGroundObstacle(ctx, ob, now){
    const x = ob.x;
    const baseY = GROUND_Y + GROUND_CONTACT_OFFSET;

    // bayangan tegas di tanah (digambar dulu agar siluet objek lebih menonjol) —
    // lebarnya mengikuti lebar model masing-masing supaya tetap proporsional.
    const shadowHalfW = (GROUND_WIDTH[ob.model] || 20) * 0.9;
    ctx.fillStyle = 'rgba(15,10,28,0.34)';
    ctx.beginPath();
    ctx.ellipse(x + (GROUND_WIDTH[ob.model] || 20) / 2, baseY + 4, shadowHalfW, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    switch (ob.model){
        case 'cactus': {
            // Kaktus sekarang digambar dari sprite PNG
            // (public/assets/images/obstacle/cactus.png), posisi & anchor
            // tetap sama seperti rintangan darat lainnya — lihat drawCactusSprite.
            drawCactusSprite(ctx, x, baseY);
            break;
        }
        case 'rock': {
            const g = ctx.createLinearGradient(x - 6, baseY - 44, x + 38, baseY);
            g.addColorStop(0, '#c3ccd9');
            g.addColorStop(1, '#818ea0');
            ctx.fillStyle = g;
            ctx.strokeStyle = '#3f4a5c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 6, baseY);
            ctx.lineTo(x, baseY - 36);
            ctx.lineTo(x + 20, baseY - 44);
            ctx.lineTo(x + 38, baseY - 10);
            ctx.lineTo(x + 30, baseY);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.beginPath();
            ctx.moveTo(x + 2, baseY - 30);
            ctx.lineTo(x + 18, baseY - 38);
            ctx.lineTo(x + 12, baseY - 20);
            ctx.closePath();
            ctx.fill();
            // retakan batu (detail tambahan)
            ctx.strokeStyle = 'rgba(63,74,92,0.65)';
            ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(x + 6, baseY - 6); ctx.lineTo(x + 16, baseY - 22); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 22, baseY - 30); ctx.lineTo(x + 27, baseY - 12); ctx.stroke();
            // lumut di dasar batu
            ctx.fillStyle = 'rgba(74,145,79,0.75)';
            ctx.beginPath(); ctx.ellipse(x + 4, baseY - 4, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x + 26, baseY - 3, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
            // kilau mineral berkedip di permukaan batu (detail tambahan)
            const sparkle = Math.abs(Math.sin(now / 260 + x));
            ctx.fillStyle = `rgba(255,255,255,${(0.3 + sparkle * 0.4).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(x + 14, baseY - 24, 1.6, 0, Math.PI * 2); ctx.fill();
            break;
        }
        case 'spike': {
            // pelat besi dasar perangkap
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = '#3d4658';
            roundRect(ctx, x - 4, baseY - 6, 46, 6, 2); ctx.fill();
            ctx.strokeStyle = '#1a2029';
            ctx.lineWidth = 1.4;
            ctx.strokeRect(x - 4, baseY - 6, 46, 6);
            for (let b = 0; b < 3; b++){
                ctx.fillStyle = '#6b7280';
                ctx.beginPath(); ctx.arc(x + 4 + b * 18, baseY - 3, 1.6, 0, Math.PI * 2); ctx.fill();
            }
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowBlur = 6;
            const g = ctx.createLinearGradient(x, baseY - 44, x + 36, baseY);
            g.addColorStop(0, '#c3ccd9');
            g.addColorStop(1, '#7b8494');
            ctx.fillStyle = g;
            ctx.strokeStyle = '#252c38';
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++){
                ctx.beginPath();
                ctx.moveTo(x + i * 13, baseY - 6);
                ctx.lineTo(x + i * 13 + 6, baseY - 44);
                ctx.lineTo(x + i * 13 + 12, baseY - 6);
                ctx.closePath();
                ctx.fill(); ctx.stroke();
            }
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            for (let i = 0; i < 3; i++){
                ctx.beginPath();
                ctx.moveTo(x + i * 13 + 6, baseY - 44);
                ctx.lineTo(x + i * 13 + 8, baseY - 20);
                ctx.lineTo(x + i * 13 + 6, baseY - 20);
                ctx.closePath();
                ctx.fill();
            }
            // noda karat (detail tambahan)
            ctx.fillStyle = 'rgba(180,83,9,0.5)';
            for (let i = 0; i < 3; i++){
                ctx.beginPath(); ctx.ellipse(x + i * 13 + 6, baseY - 14, 2, 3.4, 0, 0, Math.PI * 2); ctx.fill();
            }
            // percikan listrik kecil berkedip antar-duri (detail tambahan)
            if (Math.sin(now / 140) > 0.6){
                ctx.strokeStyle = 'rgba(191,219,254,0.85)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(x + 6, baseY - 30); ctx.lineTo(x + 10, baseY - 22); ctx.lineTo(x + 15, baseY - 28);
                ctx.stroke();
            }
            break;
        }
        case 'log': {
            // Batang kayu dirombak agar terlihat seperti gelondongan sungguhan:
            // penampang lingkaran-tahun-pohon di kedua ujung (dekat lebih besar,
            // jauh lebih kecil untuk kesan perspektif), alur kulit kayu melengkung
            // di sepanjang badan, & sorotan cahaya di atas untuk kesan silinder.
            const logW = 54, logH = 24;
            const lx = x - 10, ly = baseY - logH;

            const g = ctx.createLinearGradient(lx, ly, lx, baseY);
            g.addColorStop(0, '#e3b483');
            g.addColorStop(0.5, '#b9814e');
            g.addColorStop(1, '#8a5c34');
            ctx.fillStyle = g;
            ctx.strokeStyle = '#6e4726';
            ctx.lineWidth = 3;
            roundRect(ctx, lx, ly, logW, logH, 11); ctx.fill(); ctx.stroke();
            ctx.shadowColor = 'transparent';

            // penampang ujung dekat (kiri) dengan lingkaran tahun pohon
            ctx.save();
            ctx.beginPath(); ctx.ellipse(lx + 5, ly + logH / 2, 6.5, logH / 2 - 1, 0, 0, Math.PI * 2); ctx.clip();
            ctx.fillStyle = '#eec89c';
            ctx.fillRect(lx - 4, ly, 22, logH);
            ctx.restore();
            ctx.strokeStyle = 'rgba(138,92,52,0.75)';
            ctx.lineWidth = 1.5;
            [3.2, 5.6].forEach(r => { ctx.beginPath(); ctx.ellipse(lx + 5, ly + logH / 2, r, r * 0.72, 0, 0, Math.PI * 2); ctx.stroke(); });
            ctx.strokeStyle = '#6e4726';
            ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.ellipse(lx + 5, ly + logH / 2, 6.5, logH / 2 - 1, 0, 0, Math.PI * 2); ctx.stroke();

            // penampang ujung jauh (kanan), lebih kecil untuk kesan perspektif
            ctx.strokeStyle = '#8a5f3d';
            ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.ellipse(lx + logW - 5, ly + logH / 2, 4.4, logH / 2 - 2, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(lx + logW - 5, ly + logH / 2, 2, (logH / 2 - 2) * 0.55, 0, 0, Math.PI * 2); ctx.stroke();

            // alur kulit kayu melengkung sepanjang badan (bukan garis lurus kaku)
            ctx.strokeStyle = 'rgba(110,71,38,0.55)';
            ctx.lineWidth = 1.4;
            for (let i = 0; i < 3; i++){
                const oy = ly + 6 + i * 6;
                ctx.beginPath();
                ctx.moveTo(lx + 15, oy);
                ctx.quadraticCurveTo(lx + logW / 2, oy + (i % 2 === 0 ? 2.4 : -2.4), lx + logW - 7, oy);
                ctx.stroke();
            }

            // sorotan cahaya di atas (kesan silinder terkena cahaya matahari)
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.ellipse(lx + logW / 2 + 2, ly + 4, logW / 2 - 8, 3, 0, 0, Math.PI * 2); ctx.fill();

            // jamur kecil tumbuh di batang (detail tambahan)
            ctx.fillStyle = '#fca5a5';
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 1.2;
            roundRect(ctx, lx + logW - 16, ly - 8, 3, 8, 1.4); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(lx + logW - 14.5, ly - 9, 5.2, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fecaca';
            for (let s = 0; s < 3; s++){
                ctx.beginPath(); ctx.arc(lx + logW - 17 + s * 2, ly - 9.4, 0.6, 0, Math.PI * 2); ctx.fill();
            }

            // lumut tipis di dasar batang
            ctx.fillStyle = 'rgba(74,145,79,0.55)';
            ctx.beginPath(); ctx.ellipse(lx + 12, baseY - 1, 7, 2.4, 0, 0, Math.PI * 2); ctx.fill();
            break;
        }
        case 'crystal': {
            const pulse = 0.5 + Math.abs(Math.sin(now / 400)) * 0.5;
            ctx.shadowColor = `rgba(168,85,247,${0.5 * pulse})`;
            ctx.shadowBlur = 14;
            const g = ctx.createLinearGradient(x, baseY - 46, x + 34, baseY);
            g.addColorStop(0, '#e9d5ff');
            g.addColorStop(1, '#9333ea');
            ctx.fillStyle = g;
            ctx.strokeStyle = '#5b21b6';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(x + 6, baseY);
            ctx.lineTo(x, baseY - 24);
            ctx.lineTo(x + 12, baseY - 46);
            ctx.lineTo(x + 24, baseY - 22);
            ctx.lineTo(x + 20, baseY);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 20, baseY);
            ctx.lineTo(x + 22, baseY - 18);
            ctx.lineTo(x + 32, baseY - 36);
            ctx.lineTo(x + 34, baseY - 8);
            ctx.lineTo(x + 30, baseY);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath(); ctx.moveTo(x + 8, baseY - 30); ctx.lineTo(x + 12, baseY - 42); ctx.lineTo(x + 13, baseY - 26); ctx.closePath(); ctx.fill();
            // percikan energi kecil melayang di sekitar kristal
            for (let i = 0; i < 3; i++){
                const ang = now / 500 + i * 2.1;
                const ex = x + 17 + Math.cos(ang) * 16;
                const ey = baseY - 26 + Math.sin(ang) * 14;
                ctx.fillStyle = `rgba(216,180,254,${pulse.toFixed(2)})`;
                ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, Math.PI * 2); ctx.fill();
            }
            break;
        }
    }

    ctx.restore();
}

function drawAirObstacle(ctx, ob, now){
    const x = ob.x;
    const bob = Math.sin(now / 220 + x * 0.05) * 3;
    const y = ob.y + bob;

    if (!ob.exploded){
        // bayangan proyeksi di tanah agar posisi rintangan udara lebih terbaca —
        // ukurannya kini mengikuti lebar model masing-masing (hornet yang jauh
        // lebih besar mendapat bayangan yang sebanding, bukan bayangan kecil tetap).
        const shadowHalf = (AIR_WIDTH[ob.model] || 34) / 2;
        ctx.fillStyle = 'rgba(15,10,28,0.18)';
        ctx.beginPath();
        ctx.ellipse(x + shadowHalf, GROUND_Y + 4, shadowHalf * 0.95, 4 + (ob.model === 'hornet' ? 3 : 0), 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
        switch (ob.model){
            case 'drone': {
                const g = ctx.createLinearGradient(x, y, x + 40, y + 17);
                g.addColorStop(0, '#9aa7ba');
                g.addColorStop(1, '#5c6878');
                ctx.fillStyle = g;
                ctx.strokeStyle = '#242b38';
                ctx.lineWidth = 3;
                roundRect(ctx, x, y, 40, 17, 8); ctx.fill(); ctx.stroke();
                // sensor/panel kecil di badan drone
                ctx.shadowColor = 'transparent';
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                roundRect(ctx, x + 4, y + 3, 32, 4, 2); ctx.fill();
                ctx.lineWidth = 2.4;
                ctx.beginPath(); ctx.moveTo(x + 9, y - 10); ctx.lineTo(x + 9, y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x + 31, y - 10); ctx.lineTo(x + 31, y); ctx.stroke();
                ctx.fillStyle = '#1e293b';
                ctx.beginPath(); ctx.arc(x + 9, y - 10, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(x + 31, y - 10, 5, 0, Math.PI * 2); ctx.fill();
                // baling-baling berputar (blur ganda mengikuti waktu agar terasa berputar)
                const spin = (now / 40) % Math.PI;
                [x + 9, x + 31].forEach(px => {
                    ctx.strokeStyle = 'rgba(30,41,59,0.55)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(px, y - 10, 9, 2.4, spin, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.ellipse(px, y - 10, 9, 2.4, spin + Math.PI / 2, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.strokeStyle = 'rgba(56,189,248,0.7)';
                ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.arc(x + 9, y - 10, 8, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(x + 31, y - 10, 8, 0, Math.PI * 2); ctx.stroke();
                // lampu sorot berkedip di bawah
                const blink = Math.sin(now / 150) > 0 ? 1 : 0.25;
                ctx.fillStyle = `rgba(56,189,248,${blink})`;
                ctx.beginPath(); ctx.arc(x + 20, y + 8.5, 3.6, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = `rgba(56,189,248,${blink * 0.5})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(x + 20, y + 12); ctx.lineTo(x + 20, y + 22); ctx.stroke();
                break;
            }
            case 'ufo': {
                // sinar tarik digambar LEBIH DULU (di belakang badan) dengan gradasi
                // lembut yang memudar ke bawah, bukan blok warna rata bertepi tegas —
                // supaya terlihat seperti cahaya sungguhan, bukan artefak/anomali.
                const beamGlow = ctx.createLinearGradient(0, y + 12, 0, y + 30);
                beamGlow.addColorStop(0, 'rgba(233,226,255,0.28)');
                beamGlow.addColorStop(1, 'rgba(233,226,255,0)');
                ctx.fillStyle = beamGlow;
                ctx.beginPath();
                ctx.moveTo(x + 13, y + 13); ctx.lineTo(x + 27, y + 13);
                ctx.lineTo(x + 32, y + 30); ctx.lineTo(x + 8, y + 30);
                ctx.closePath(); ctx.fill();

                const g = ctx.createLinearGradient(x, y, x + 40, y + 16);
                g.addColorStop(0, '#cdb6ff');
                g.addColorStop(1, '#8b5cf6');
                ctx.fillStyle = g;
                ctx.strokeStyle = '#5b21b6';
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.ellipse(x + 20, y + 8, 23, 9.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                // cincin energi tipis di pinggir badan (statis, rapi — tanpa distorsi rotasi)
                ctx.strokeStyle = 'rgba(233,226,255,0.85)';
                ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.ellipse(x + 20, y + 8, 17, 4, 0, 0, Math.PI * 2); ctx.stroke();
                // kubah kaca dengan pantulan cahaya
                ctx.fillStyle = '#e9e2ff';
                ctx.beginPath(); ctx.arc(x + 20, y, 11, Math.PI, 0); ctx.fill(); ctx.stroke();
                ctx.shadowColor = 'transparent';
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.beginPath(); ctx.ellipse(x + 15, y - 5, 4, 2.4, -0.4, 0, Math.PI * 2); ctx.fill();
                // lampu berkedip bergantian, rapi berjajar di tepi bawah badan
                for (let i = 0; i < 3; i++){
                    const on = Math.sin(now / 220 + i * 2.1) > 0;
                    ctx.fillStyle = on ? '#facc15' : 'rgba(250,204,21,0.3)';
                    ctx.beginPath(); ctx.arc(x + 8 + i * 12, y + 12, 2.4, 0, Math.PI * 2); ctx.fill();
                }
                break;
            }
            case 'missile': {
                // Bom-energi: bola logam berduri berputar, inti berdenyut,
                // jejak ion kebiruan di belakangnya.
                const spin = now / 260;
                const cx = x + 18, cy = y + 8;

                // jejak ion di belakang (gradasi kebiruan, bukan percikan api)
                const trail = ctx.createLinearGradient(cx - 30, cy, cx - 6, cy);
                trail.addColorStop(0, 'rgba(56,189,248,0)');
                trail.addColorStop(1, 'rgba(56,189,248,0.55)');
                ctx.fillStyle = trail;
                ctx.beginPath();
                ctx.moveTo(cx - 30, cy - 2); ctx.lineTo(cx - 6, cy - 5); ctx.lineTo(cx - 6, cy + 5); ctx.lineTo(cx - 30, cy + 2);
                ctx.closePath(); ctx.fill();

                // duri logam berputar mengelilingi bola inti
                ctx.strokeStyle = '#52525b';
                ctx.lineWidth = 2.4;
                for (let i = 0; i < 6; i++){
                    const ang = spin + (i / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(ang) * 9, cy + Math.sin(ang) * 9);
                    ctx.lineTo(cx + Math.cos(ang) * 15, cy + Math.sin(ang) * 15);
                    ctx.stroke();
                }

                // bola logam gelap
                ctx.shadowColor = 'rgba(0,0,0,0.35)';
                const bodyG = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 11);
                bodyG.addColorStop(0, '#6b7280');
                bodyG.addColorStop(1, '#27272a');
                ctx.fillStyle = bodyG;
                ctx.strokeStyle = '#18181b';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.shadowColor = 'transparent';

                // inti energi berdenyut di tengah (tanda bahaya)
                const pulse = 0.5 + Math.abs(Math.sin(now / 140)) * 0.5;
                ctx.fillStyle = `rgba(239,68,68,${pulse.toFixed(2)})`;
                ctx.beginPath(); ctx.arc(cx, cy, 3.6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath(); ctx.arc(cx - 2.4, cy - 2.4, 1.4, 0, Math.PI * 2); ctx.fill();
                break;
            }
            case 'hornet': {
                // Sprite PNG animasi (hornet1..240), sudah di-preload sejak awal.
                const frameIndex = Math.floor(now / (HORNET_FRAME_DURATION * 1000)) % HORNET_FRAME_COUNT;
                const hFrame = hornetFrames[frameIndex];
                const hReady = hFrame && hFrame.complete && hFrame.naturalWidth > 0;
                const hcx = x + AIR_WIDTH.hornet / 2;
                const hcy = y + 8;
                if (hReady){
                    // Lebar dihitung dari rasio asli PNG, bukan kotak tetap.
                    const aspect = hFrame.naturalWidth / hFrame.naturalHeight;
                    const hh = HORNET_TARGET_H;
                    const hw = hh * aspect;

                    // Aura peringatan berdenyut di belakang sprite biar menonjol.
                    ctx.shadowColor = 'transparent';
                    const glowPulse = 0.55 + Math.abs(Math.sin(now / 260)) * 0.25;
                    const glow = ctx.createRadialGradient(hcx, hcy, hh * 0.1, hcx, hcy, hh * 0.62);
                    glow.addColorStop(0, `rgba(250,204,21,${(glowPulse * 0.32).toFixed(2)})`);
                    glow.addColorStop(1, 'rgba(250,204,21,0)');
                    ctx.fillStyle = glow;
                    ctx.beginPath(); ctx.ellipse(hcx, hcy, hh * 0.62, hh * 0.5, 0, 0, Math.PI * 2); ctx.fill();

                    // shadowBlur dimatikan di sini (operasi berat) supaya animasi
                    // sprite sebesar ini tetap mulus.
                    ctx.drawImage(hFrame, hcx - hw / 2, hcy - hh / 2, hw, hh);
                } else {
                    // penampung sementara (nyaris tak pernah muncul, sudah di-preload)
                    ctx.fillStyle = 'rgba(250,204,21,0.35)';
                    roundRect(ctx, hcx - HORNET_TARGET_H * 0.65, hcy - HORNET_TARGET_H / 2, HORNET_TARGET_H * 1.3, HORNET_TARGET_H, 10);
                    ctx.fill();
                }
                break;
            }
        }
        ctx.restore();
    }
}

function drawEffects(ctx, now){
    state.effects.enemyBullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        if (b.model === 'ufo'){
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
            glow.addColorStop(0, '#f3e8ff');
            glow.addColorStop(0.5, '#a855f7');
            glow.addColorStop(1, 'rgba(168,85,247,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
        } else if (b.model === 'hornet'){
            // peluru sengat: lancip & hitam pekat, dibalut pendar kuning tipis
            // + jejak percikan di belakangnya (efek) — bukan lagi elips kuning polos.
            const bGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
            bGlow.addColorStop(0, 'rgba(250,204,21,0.55)');
            bGlow.addColorStop(1, 'rgba(250,204,21,0)');
            ctx.fillStyle = bGlow;
            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#0b0b0d';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-2, -3.4);
            ctx.lineTo(-9, 0);
            ctx.lineTo(-2, 3.4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(250,204,21,0.9)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            const g = ctx.createLinearGradient(-15, 0, 5, 0);
            g.addColorStop(0, 'rgba(239,68,68,0)');
            g.addColorStop(1, '#f87171');
            ctx.strokeStyle = g;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(5, 0); ctx.stroke();
            ctx.fillStyle = '#fecaca';
            ctx.beginPath(); ctx.arc(5, 0, 2.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    });

    state.effects.projectiles.forEach(pr => {
        ctx.save();
        const glow = ctx.createRadialGradient(pr.x, pr.y, 1, pr.x, pr.y, 13);
        glow.addColorStop(0, '#f0fbff');
        glow.addColorStop(0.35, '#38bdf8');
        glow.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, 13, 0, Math.PI * 2);
        ctx.fill();
        // cincin energi tipis yang berputar mengelilingi inti bola api —
        // detail tambahan supaya proyektil terasa "berenergi", bukan bulatan polos.
        ctx.strokeStyle = 'rgba(224,247,255,0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(pr.x, pr.y, 8, 3, now / 120, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(pr.x, pr.y, 8, 3, now / 120 + Math.PI / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#e0f7ff';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Cincin kejut (shockwave) dari ledakan serangan udara: lingkaran yang
    // mengembang & memudar — memberi kesan "boom" yang lebih terasa & detail
    // dibanding sekadar percikan partikel.
    state.effects.shockwaves.forEach(s => {
        const t = (now - s.start) / s.duration;
        if (t < 0 || t > 1) return;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.85;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3 * (1 - t) + 1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.maxR * t, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });

    state.effects.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// ============================================================
// BACKGROUND — bukit berlapis, pohon bergoyang, burung/kupu-kupu, awan.
// Semua digambar via canvas, tanpa file gambar (kecuali sprite pohon).
// ============================================================
function drawHillsLayer(ctx, W, baseY, colorTop, colorBottom, offset, amp, waveLen){
    const g = ctx.createLinearGradient(0, baseY - amp, 0, baseY + 20);
    g.addColorStop(0, colorTop);
    g.addColorStop(1, colorBottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, baseY + 20);
    for (let hx = 0; hx <= W; hx += 20){
        const hy = baseY - amp - Math.sin((hx + offset) / waveLen) * amp * 0.5;
        ctx.lineTo(hx, hy);
    }
    ctx.lineTo(W, baseY + 20);
    ctx.closePath();
    ctx.fill();
}

function drawTreeSprite(ctx, x, baseY, scale, sway, variantIndex){
    const img = treeSprites[variantIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return; // belum termuat -> lewati

    const targetH = TREE_TARGET_H * scale;
    const targetW = targetH * (img.naturalWidth / img.naturalHeight);

    ctx.save();
    ctx.translate(x, baseY); // (0,0) = dasar batang pohon
    ctx.rotate(sway);
    ctx.drawImage(img, -targetW / 2, -targetH, targetW, targetH);
    ctx.restore();
}

function drawTreesLine(ctx, W, offset, now){
    const baseY = GROUND_Y - 2;
    const spacing = 150;
    let treeSlot = 0;
    for (let bx = offset - spacing; bx < W + spacing; bx += spacing){
        const sway = Math.sin(now / 1400 + bx * 0.01) * 0.045;
        drawTreeSprite(ctx, bx, baseY, 1, sway, pickTreeVariant(treeSlot));
        drawTreeSprite(ctx, bx + 78, baseY, 0.7, -sway * 1.2, pickTreeVariant(treeSlot + 1));
        treeSlot++;
    }
}

function drawClouds(ctx, W, now, y, speed, scale, alpha){
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    for (let i = 0; i < 3; i++){
        const cx = ((i * 260 + now * speed) % (W + 200)) - 100;
        const cy = y + (i % 2) * 22;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 30 * scale, 11 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 20 * scale, cy + 3, 20 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - 18 * scale, cy + 4, 16 * scale, 7 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawBirds(ctx, W, now){
    ctx.strokeStyle = 'rgba(70,60,90,0.55)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++){
        const t = (now / 1000 * (18 + i * 4) + i * 260) % (W + 120);
        const bx = W + 60 - t;
        const by = 46 + i * 20 + Math.sin(now / 300 + i) * 4;
        const flap = Math.sin(now / 90 + i * 2) * 6;
        ctx.beginPath();
        ctx.moveTo(bx - 8, by + flap);
        ctx.quadraticCurveTo(bx - 3, by - 4, bx, by);
        ctx.quadraticCurveTo(bx + 3, by - 4, bx + 8, by + flap);
        ctx.stroke();
    }
}

function drawButterflies(ctx, W, now){
    for (let i = 0; i < 3; i++){
        const bx = ((i * 210 + now * 0.05) % (W + 80)) - 40;
        const by = GROUND_Y - 70 - i * 26 + Math.sin(now / 260 + i * 2) * 14;
        const wing = Math.abs(Math.sin(now / 90 + i));
        const hue = i % 2 === 0 ? '#fca5f1' : '#fde68a';
        ctx.save();
        ctx.translate(bx, by);
        ctx.fillStyle = hue;
        ctx.beginPath(); ctx.ellipse(-3, 0, 3.4 * wing + 1, 4, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3, 0, 3.4 * wing + 1, 4, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4b3621';
        ctx.beginPath(); ctx.ellipse(0, 0, 1, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

// Tanah bertema jalan raya: aspal gelap, kerb dua-nada, marka putih di
// bahu jalan, marka kuning putus-putus di tengah.
function drawGroundNature(ctx, W, H, now){
    const grad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    grad.addColorStop(0, '#5b5f68');
    grad.addColorStop(0.45, '#43464e');
    grad.addColorStop(1, '#2a2c31');
    ctx.fillStyle = grad;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Kerb/trotoar di tepi atas jalan: beton terang + garis bayangan tipis di bawahnya
    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(0, GROUND_Y, W, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, GROUND_Y + 4, W, 1.5);

    // Marka jalan putus-putus kuning khas jalan raya, bergerak sesuai kecepatan permainan
    ctx.strokeStyle = 'rgba(250,204,21,0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 16]);
    ctx.lineDashOffset = -((now * 0.09) % 36);
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 48);
    ctx.lineTo(W, GROUND_Y + 48);
    ctx.stroke();
    ctx.setLineDash([]);

    // Garis marka putih solid tipis di dekat kerb (khas bahu jalan)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 14);
    ctx.lineTo(W, GROUND_Y + 14);
    ctx.stroke();
}

function drawBackground(ctx, W, H, now){
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#7ec9f0');
    sky.addColorStop(0.55, '#cdeaf5');
    sky.addColorStop(1, '#eef8e2');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const sunX = W - 92, sunY = 56;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 90);
    sunGlow.addColorStop(0, 'rgba(255,244,180,0.8)');
    sunGlow.addColorStop(1, 'rgba(255,244,180,0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath(); ctx.arc(sunX, sunY, 90, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(now / 8000);
    ctx.strokeStyle = 'rgba(255,238,150,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++){
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30);
        ctx.lineTo(Math.cos(a) * 40, Math.sin(a) * 40);
        ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(sunX, sunY, 26, 0, Math.PI * 2); ctx.fill();

    drawBirds(ctx, W, now);
    drawClouds(ctx, W, now, 40, 0.015, 1, 0.85);
    drawClouds(ctx, W, now, 90, 0.008, 0.7, 0.6);

    drawHillsLayer(ctx, W, GROUND_Y - 4, '#bfe3a0', '#9fd07f', -((now * 0.01) % 400), 60, 260);
    drawHillsLayer(ctx, W, GROUND_Y - 2, '#a3d787', '#7fbf63', -((now * 0.02) % 300), 40, 180);

    drawTreesLine(ctx, W, -((now * 0.03) % 300), now);
    drawButterflies(ctx, W, now);
    drawGroundNature(ctx, W, H, now);
}

function draw(now){
    const c = canvas();
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    const W = c.width, H = c.height;

    drawBackground(ctx, W, H, now);
    drawDino(ctx, now);

    if (state.current){
        const ob = state.current;
        if (ob.type === 'ground'){
            drawGroundObstacle(ctx, ob, now);
        } else {
            drawAirObstacle(ctx, ob, now);
        }

        // Titik tengah label kata dihitung per model (lebarnya beda-beda),
        // supaya selalu presisi di tengah-atas bentuk rintangan.
        if (!ob.resolved){
            const widthMap = ob.type === 'air' ? AIR_WIDTH : GROUND_WIDTH;
            const halfWidth = (widthMap[ob.model] || 34) / 2;
            const cx = ob.x + halfWidth;
            const labelY = ob.type === 'air' ? ob.y - (AIR_LABEL_OFFSET[ob.model] || 24) : GROUND_Y - 44;
            drawWordLabel(ctx, ob.word, state.typedIndex, cx, labelY, now, ob);
        }
    }

    drawEffects(ctx, now);
}

// ============================================================
// START / END GAME
// ============================================================
function startGame(difficulty, playerName){
    state = freshState(difficulty, playerName);
    state.running = true;
    state.startTime = performance.now();
    state.lastFrameTime = state.startTime;
    state.waitingSpawn = true;

    el('welcomeScreen').style.display = 'none';
    el('difficultyScreen').style.display = 'none';
    el('gameScreen').style.display = 'block';
    el('gameOverOverlay').classList.add('hidden');
    el('howToOverlay').classList.add('hidden');
    if (el('pauseOverlay')) el('pauseOverlay').classList.add('hidden');
    if (el('confirmQuitOverlay')) el('confirmQuitOverlay').classList.add('hidden');

    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    document.body.classList.add('is-playing');
    fitViewport();
    el('mobileHint').style.display = isMobile ? 'block' : 'none';
    if (isMobile){
        const hid = el('hiddenTypingInput');
        hid.focus({ preventScroll: true });
        setTimeout(() => hid.focus({ preventScroll: true }), 300);
    }

    updateHud();
    renderTypingIndicator();
    state.rafId = requestAnimationFrame(loop);
}

async function endGame(){
    if (!state || state.finished) return;
    state.finished = true;
    state.running = false;
    if (state.rafId) cancelAnimationFrame(state.rafId);

    const elapsed = (performance.now() - state.startTime) / 1000;
    // Jangan tampilkan akurasi 100% kalau totalKeys 0 (tidak mengetik sama sekali).
    const accuracy = state.totalKeys > 0 ? (state.correctKeys / state.totalKeys) * 100 : 0;

    // Tidak ada status "menang" -> completion_time & is_win selalu netral.
    const payload = {
        player_name: state.playerName,
        difficulty: state.difficulty,
        score: state.score,
        correct_words: state.correctWords,
        wrong_hits: state.wrongHits,
        hearts_left: state.hearts,
        accuracy: Math.round(accuracy * 100) / 100,
        completion_time: null,
        is_win: false,
    };

    // Popup Game Over langsung tampil pakai rekor lokal (tanpa menunggu
    // server) — rekor server disinkronkan di belakang layar, lalu badge
    // "REKOR BARU!" diperbarui begitu responsnya tiba (updateRecordBadge).
    const priorBest = getLocalBest(state.playerName, state.difficulty);
    let best = {
        highest_score: Math.max(priorBest.highest_score || 0, state.score),
        fastest_time: priorBest.fastest_time ?? null,
    };

    showEndOverlay(elapsed, accuracy, best);
    saveLocalBest(state.playerName, state.difficulty, best);

    try {
        const res = await fetch(`${API_BASE}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok){
            const data = await res.json();
            best = data.best;
            saveLocalBest(state.playerName, state.difficulty, best);
            updateRecordBadge(best);
        }
    } catch (err){
        console.warn('Gagal menyimpan skor ke server, menggunakan cache lokal.', err);
    }

    refreshMenuBestLines();
}

// Menampilkan popup Game Over beserta statistiknya — dipisah dari endGame
// supaya bisa dipanggil segera tanpa menunggu server.
function showEndOverlay(elapsed, accuracy, best){
    // Akurasi tetap dihitung/disimpan (dipakai sertifikat/API), tapi yang
    // ditampilkan di popup hanya WPM.
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((state.correctKeys / 5) / minutes) : 0;

    // Sertifikat tersedia di setiap akhir permainan, jadi datanya disiapkan di sini.
    localStorage.setItem('typingDinoCertData', JSON.stringify({
        name: state.playerName,
        difficulty: state.difficulty,
        score: state.score,
        time: elapsed,
        accuracy: Math.round(accuracy * 100) / 100,
        date: new Date().toISOString(),
    }));

    el('goScore').textContent = state.score;
    el('goTime').textContent = elapsed.toFixed(1) + 's';
    el('goWpm').textContent = wpm;
    el('goHearts').textContent = state.hearts;
    // Tutup keyboard HP & hentikan guncangan layar supaya kartu hasil
    // (Game Over / Rekor Baru) tampil penuh dan jelas.
    el('hiddenTypingInput').blur();
    const stageEl = el('gameOverOverlay').closest('.game-stage');
    if (stageEl) stageEl.classList.remove('shake-hit');
    el('gameOverOverlay').classList.remove('hidden');
    sfxGameOver();

    // Badge SKOR/WAKTU/WPM di kanan atas (HUD) di-reset ke 0 saat Game Over,
    // karena statistik akhir sudah ditampilkan lengkap di dalam kartu popup ini.
    el('scoreBadge').innerHTML = HUD_ICON_SCORE + ' SKOR&nbsp;<b>0</b>';
    el('timeBadge').innerHTML = HUD_ICON_TIME + ' WAKTU&nbsp;<b>0.0s</b>';
    el('wpmBadge').innerHTML = HUD_ICON_WPM + ' WPM&nbsp;<b>0</b>';

    updateRecordBadge(best);
}

// Menyegarkan badge rekor pada popup yang sudah tampil (dipanggil langsung
// dgn rekor lokal, lalu lagi begitu rekor server terkonfirmasi).
function updateRecordBadge(best){
    const isNewRecord = best.highest_score === state.score;
    applyGameOverTheme(isNewRecord);
}

// Tema kartu Game Over: merah + ikon sedih (default), atau hijau + ikon
// piala kalau skor kali ini memecahkan rekor.
function applyGameOverTheme(isRecord){
    el('goCard').className = 'result-card ' + (isRecord ? 'win-card' : 'lose-card');
    el('goRing1').className = isRecord ? 'win-ring win-ring-1' : 'lose-ring lose-ring-1';
    el('goRing2').className = isRecord ? 'win-ring win-ring-2' : 'lose-ring lose-ring-2';
    el('goIconWrap').className = 'result-icon ' + (isRecord ? 'result-icon-win' : 'result-icon-lose');
    el('goIconSad').style.display = isRecord ? 'none' : 'block';
    el('goIconTrophy').style.display = isRecord ? 'block' : 'none';
    el('goTitle').className = (isRecord ? 'win' : 'lose') + ' pixel-font';
    el('goTitle').textContent = isRecord ? 'REKOR BARU!' : 'GAME OVER';
}

// ============================================================
// LOCAL STORAGE CACHE UNTUK REKOR (fallback offline)
// ============================================================
function bestStoreKey(name){ return 'typingDinoBest:' + name.trim().toLowerCase(); }

function saveLocalBest(name, difficulty, best){
    const key = bestStoreKey(name);
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    all[difficulty] = best;
    localStorage.setItem(key, JSON.stringify(all));
}

function getLocalBest(name, difficulty){
    const key = bestStoreKey(name);
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    return all[difficulty] || { highest_score: 0, fastest_time: null };
}

async function fetchServerBest(name, difficulty){
    try {
        const res = await fetch(`${API_BASE}/scores/best?player_name=${encodeURIComponent(name)}&difficulty=${difficulty}`);
        if (res.ok) return await res.json();
    } catch (err){ /* offline fallback */ }
    return null;
}

async function refreshMenuBestLines(){
    const name = el('playerName').value.trim();
    if (!name) return;
    for (const diff of ['easy','medium','hard']){
        const line = document.querySelector(`.best-line[data-best="${diff}"]`);
        const local = getLocalBest(name, diff);
        renderBestLine(line, local);
        const server = await fetchServerBest(name, diff);
        if (server){
            renderBestLine(line, server);
            saveLocalBest(name, diff, server);
        }
    }
}

const BEST_ICON_TROPHY = '<svg class="best-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5a2 2 0 0 0 0 4h1.5M16 5h3a2 2 0 0 1 0 4h-1.5"/><path d="M12 12v3"/><path d="M9 20h6"/><path d="M10 17h4l.6 3H9.4l.6-3Z"/></svg>';
const BEST_ICON_SCORE  = '<svg class="best-ico" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 16.7l-5.2 2.8 1-5.9L3.5 9.4l5.9-.8L12 3.2Z"/></svg>';
const BEST_ICON_TIME   = '<svg class="best-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4.3l2.8 1.9"/><path d="M9.5 2.5h5"/></svg>';

function renderBestLine(line, best){
    if (!line) return;
    const scoreTxt = best.highest_score ? best.highest_score : '-';
    const timeTxt = best.fastest_time ? best.fastest_time.toFixed(1) + 's' : '-';
    line.innerHTML =
        `<span class="best-title">${BEST_ICON_TROPHY}REKOR</span>` +
        `<span class="best-vals">` +
            `<span class="best-val">${BEST_ICON_SCORE}<b>${scoreTxt}</b></span>` +
            `<span class="best-val">${BEST_ICON_TIME}<b>${timeTxt}</b></span>` +
        `</span>`;
}

// ============================================================
// MENU / UI WIRING
// ============================================================
function selectedDifficulty(){
    return document.querySelector('.diff-card.active')?.dataset.diff || 'easy';
}

function goToDifficultyScreen(){
    const nameInput = el('playerName');
    const name = nameInput.value.trim();
    if (!name){
        el('welcomeMsg').textContent = 'Masukkan nama kamu terlebih dahulu!';
        return;
    }
    el('welcomeMsg').textContent = '';
    localStorage.setItem('typingDinoName', name);
    el('welcomeScreen').style.display = 'none';
    el('difficultyScreen').style.display = 'block';
    refreshMenuBestLines();
}

function initMenu(){
    // Tampilan awal kartu rekor (sebelum data pemain dimuat)
    document.querySelectorAll('.best-line').forEach(line => renderBestLine(line, { highest_score: 0, fastest_time: null }));

    document.querySelectorAll('.diff-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.diff-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });

    const nameInput = el('playerName');
    const savedName = localStorage.getItem('typingDinoName');
    if (savedName) nameInput.value = savedName;

    const continueBtn = el('continueBtn');
    const syncContinueState = () => { continueBtn.disabled = nameInput.value.trim().length === 0; };
    syncContinueState();
    if (savedName) refreshMenuBestLines();

    nameInput.addEventListener('input', syncContinueState);
    nameInput.addEventListener('change', () => {
        localStorage.setItem('typingDinoName', nameInput.value.trim());
    });
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !continueBtn.disabled) goToDifficultyScreen();
    });

    continueBtn.addEventListener('click', goToDifficultyScreen);

    el('backToWelcomeBtn').addEventListener('click', () => {
        el('difficultyScreen').style.display = 'none';
        el('welcomeScreen').style.display = 'flex';
    });

    const gameSoundToggleBtn = el('gameSoundToggleBtn');
    if (gameSoundToggleBtn){
        gameSoundToggleBtn.addEventListener('click', () => toggleMute());
    }

    el('startBtn').addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (!name){
            el('difficultyScreen').style.display = 'none';
            el('welcomeScreen').style.display = 'flex';
            return;
        }
        el('menuMsg').textContent = '';

        // Fokus input keyboard SEKARANG (masih dalam gestur ketukan) — kalau
        // menunggu sampai aset selesai dimuat, HP sering menolak memunculkan keyboard.
        if (window.matchMedia('(pointer: coarse)').matches){
            el('hiddenTypingInput').focus({ preventScroll: true });
        }

        const stillLoading = !assetsAreReady;
        if (stillLoading){
            updateAssetLoadingProgress();
            el('assetLoadingOverlay').classList.remove('hidden');
        }
        await Promise.all([assetsReadyPromise, sfxReadyPromise]);
        if (stillLoading){
            el('assetLoadingOverlay').classList.add('hidden');
        }

        startGame(selectedDifficulty(), name);
    });

    el('howToPlayBtn').addEventListener('click', () => {
        el('howToOverlay').classList.remove('hidden');
    });
    el('closeHowTo').addEventListener('click', () => {
        el('howToOverlay').classList.add('hidden');
    });

    el('quitBtn').addEventListener('click', () => openQuitConfirm('play'));
    el('menuBtnLose').addEventListener('click', () => backToMenu());
    el('retryBtnLose').addEventListener('click', () => startGame(state.difficulty, state.playerName));
    el('certBtn').addEventListener('click', () => { window.location.href = '/sertifikat'; });

    // Layar jeda: lanjut atau minta keluar (dgn konfirmasi). stopPropagation
    // supaya tap tombol tidak ikut memicu "tap layar utk lanjut" milik .game-stage.
    const resumeBtn = el('resumePauseBtn');
    if (resumeBtn) resumeBtn.addEventListener('click', (e) => { e.stopPropagation(); resumeGame(); });
    const quitFromPauseBtn = el('quitFromPauseBtn');
    if (quitFromPauseBtn) quitFromPauseBtn.addEventListener('click', (e) => { e.stopPropagation(); openQuitConfirm('pause'); });

    // Dialog konfirmasi keluar ke menu
    const confirmYesBtn = el('confirmQuitYes');
    if (confirmYesBtn) confirmYesBtn.addEventListener('click', () => { closeQuitConfirm(false); backToMenu(); });
    const confirmNoBtn = el('confirmQuitNo');
    if (confirmNoBtn) confirmNoBtn.addEventListener('click', () => closeQuitConfirm(true));
}

function backToMenu(){
    document.body.classList.remove('is-playing');
    el('hiddenTypingInput').blur();
    if (state && state.rafId) cancelAnimationFrame(state.rafId);
    if (state) { state.running = false; state.paused = false; }
    el('gameOverOverlay').classList.add('hidden');
    if (el('pauseOverlay')) el('pauseOverlay').classList.add('hidden');
    if (el('confirmQuitOverlay')) el('confirmQuitOverlay').classList.add('hidden');
    el('gameScreen').style.display = 'none';
    el('difficultyScreen').style.display = 'block';
    refreshMenuBestLines();
}

// ============================================================
// EFEK SUARA — Web Audio API (bukan tag <audio>), supaya: waktu putar
// presisi tanpa jeda, backsound bisa loop sample-accurate tanpa potongan,
// dan instance sebelumnya dari sampel yang sama otomatis dihentikan
// sebelum yang baru main (efek beruntun tidak menumpuk).
// ============================================================
let audioCtx = null;
function getAudioCtx(){
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

const sfxBuffers = {};
const sfxActiveSource = {};

function loadSfxBuffer(name, url){
    return fetch(url)
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.arrayBuffer();
        })
        .then(data => {
            const ctx = getAudioCtx();
            if (!ctx) return null;
            return ctx.decodeAudioData(data);
        })
        .then(buffer => {
            if (!buffer) return;
            sfxBuffers[name] = buffer;
            if (name === 'typing'){
                console.log('[audio] typing.mp3 durasi: ' + buffer.duration.toFixed(2) + ' detik — sesuaikan offset/duration di sfxTyping() kalau masih kurang pas.');
            }
        })
        .catch(err => console.warn('[audio] Gagal memuat ' + url + ':', err.message));
}
// Satu promise gabungan -> ditunggu sebelum mengetik/permainan boleh dimulai
// (lihat startBtn & landing-demo.js), supaya semua sampel (termasuk typing.mp3)
// sudah pasti siap sebelum dipakai.
const sfxReadyPromise = Promise.all([
    loadSfxBuffer('jump', '/assets/sounds/jump.mp3'),
    loadSfxBuffer('typing', '/assets/sounds/typing.mp3'),
    loadSfxBuffer('backsound', '/assets/sounds/backsound.mp3'),
    loadSfxBuffer('gameover', '/assets/sounds/gameover.mp3'),
    loadSfxBuffer('damage', '/assets/sounds/damage.mp3'),
]);

// Mute global — dipakai bersama tombol suara di landing page & layar
// permainan (lihat toggleMute), jadi statusnya selalu konsisten.
let isMuted = false;
let bgMusicGainNode = null;

function setMuted(muted){
    isMuted = muted;
    if (bgMusicGainNode) bgMusicGainNode.gain.value = muted ? 0 : 0.35;
    document.querySelectorAll('.sound-toggle-btn').forEach(btn => {
        const onIcon = btn.querySelector('.sound-icon-on');
        const offIcon = btn.querySelector('.sound-icon-off');
        if (onIcon) onIcon.style.display = muted ? 'none' : 'block';
        if (offIcon) offIcon.style.display = muted ? 'block' : 'none';
        btn.classList.toggle('is-muted', muted);
    });
}
function toggleMute(){ setMuted(!isMuted); }

// Memutar satu sampel sekali jalan. `rate` = kecepatan putar (>1 lebih cepat).
function playSfxBuffer(name, { rate = 1, gain = 0.6, offset = 0, duration = null } = {}){
    if (isMuted) return;
    const ctx = getAudioCtx();
    const buffer = sfxBuffers[name];
    if (!ctx || !buffer) return;
    if (sfxActiveSource[name]){
        try { sfxActiveSource[name].stop(); } catch (e) {}
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(ctx.destination);
    // `offset` = titik mulai putar di dalam file (detik). `duration` = kalau
    // diisi, otomatis berhenti setelah durasi itu (klip pendek, bukan
    // diputar sampai habis).
    const safeOffset = Math.min(Math.max(offset, 0), Math.max(buffer.duration - 0.02, 0));
    if (duration){
        src.start(0, safeOffset, duration);
    } else {
        src.start(0, safeOffset);
    }
    sfxActiveSource[name] = src;
    src.onended = () => { if (sfxActiveSource[name] === src) sfxActiveSource[name] = null; };
}

// Browser memblokir suara sebelum ada interaksi -> dicoba terus di setiap
// interaksi (bukan cuma sekali) sampai berhasil.
function unlockAudio(){
    getAudioCtx();
    startBgMusic();
}
['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
    document.addEventListener(evt, unlockAudio, { passive: true });
});

// Musik latar: sekali dimulai (loop sample-accurate, tanpa jeda), lalu
// tidak pernah dihentikan/diulang lagi — terus berbunyi di demo maupun
// permainan sungguhan.
let bgMusicStarted = false;
function startBgMusic(){
    if (bgMusicStarted) return;
    const ctx = getAudioCtx();
    const buffer = sfxBuffers.backsound;
    if (!ctx || !buffer) return; // belum selesai dimuat -> dicoba lagi di interaksi berikutnya
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = isMuted ? 0 : 0.35;
    src.connect(g).connect(ctx.destination);
    src.start(0);
    bgMusicGainNode = g;
    bgMusicStarted = true;
    console.log('[audio] Musik latar mulai diputar (loop tanpa jeda).');
}

function playTone({ freq = 440, duration = 0.08, type = 'sine', gain = 0.18, glideTo = null, delay = 0 } = {}){
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(glideTo, 1), t0 + duration);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
}

function playNoise({ duration = 0.15, gain = 0.22, delay = 0 } = {}){
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++){
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    noise.connect(g).connect(ctx.destination);
    noise.start(t0);
}

// Lompat, ketik, & game over pakai sampel dari public/assets/sounds/.
// Serang & damage tetap nada sintesis (playTone/playNoise) kecuali damage
// (lihat sfxDamage di bawah).

// Satu suara ketik (typing.mp3) untuk benar maupun salah. offset/duration
// memotong file jadi klip pendek (~220ms) yang pas dengan momen huruf
// berubah warna — sesuaikan kedua angka ini kalau file typing.mp3-mu
// punya jeda hening di awal (cek durasi aslinya di Console browser, F12).
function sfxTyping(){ playSfxBuffer('typing', { gain: 0.5, offset: 0, duration: 0.22 }); }
// rate 1.25 = sedikit dipercepat biar pas dgn durasi animasi lompat.
function sfxJump(){ playSfxBuffer('jump', { rate: 1.25, gain: 0.55 }); }
function sfxGameOver(){ playSfxBuffer('gameover', { gain: 0.6 }); }
function sfxAttack(){
    playTone({ freq: 900, duration: 0.12, type: 'sawtooth', gain: 0.14, glideTo: 220 });
    playNoise({ duration: 0.08, gain: 0.08 });
}
function sfxDamage(){ playSfxBuffer('damage', { gain: 0.6 }); }

// ============================================================
// BOOTSTRAP
// ============================================================
if (document.getElementById('welcomeScreen')){
    document.addEventListener('DOMContentLoaded', () => {
        initMenu();
        setupInput();
    });
}

// ============================================================
// JEMBATAN untuk landing-demo.js — Vite memuat tiap file sebagai ES module
// terpisah (tidak otomatis berbagi variabel seperti <script> klasik), jadi
// semua yang dibutuhkan landing-demo.js diekspos lewat satu objek di sini.
// ============================================================
window.__gameInternals = {
    get state(){ return state; },
    set state(v){ state = v; },
    el, freshState, DIFF_CONFIG, pickWord, pickModel, updatePhysics,
    resolveObstacle, handleChar, drawBackground, drawDino,
    drawGroundObstacle, drawAirObstacle, drawWordLabel, drawEffects,
    GROUND_Y, AIR_WIDTH, GROUND_WIDTH, AIR_LABEL_OFFSET,
    get assetsAreReady(){ return assetsAreReady; },
    assetsReadyPromise, updateAssetLoadingProgress,
    sfxReadyPromise, toggleMute, sfxGameOver,
};