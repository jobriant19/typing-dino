// ============================================================
// resources/js/landing-demo.js
// Demo otomatis di halaman paling awal (sebelum pengisian nama pemain).
// Vite memuat file ini sebagai ES module TERPISAH dari game.js, jadi semua
// yang dipakai ulang dari sana diakses lewat window.__gameInternals (lihat
// blok jembatan di akhir game.js). WAJIB dimuat SETELAH game.js.
// ============================================================
const G = window.__gameInternals;
const el = G.el;

function getState(){ return G.state; }
function setState(v){ G.state = v; }

let isDemoActive = false;
window.__demoInternals = { get isDemoActive(){ return isDemoActive; } };

let demoRunning = false;
let demoRafId = null;
let demoBotNextActionAt = 0;

const DEMO_TUTORIAL_MESSAGES = {
    cactus:  'Ketik kata di atas kaktus sebelum dino tiba!',
    rock:    'Batu menghadang ketik cepat agar dino melompat!',
    spike:   'Awas duri tajam selesaikan ketikan secepatnya!',
    log:     'Batang kayu melintang ketik untuk melompatinya!',
    crystal: 'Kristal menghalangi ketik untuk melewatinya!',
    drone:   'Drone menyerang ketik untuk menembaknya!',
    ufo:     'UFO di udara ketik untuk menghancurkannya!',
    missile: 'Rudal melesat cepat ketik secepat mungkin!',
    hornet:  'Tawon raksasa menyerang ketik untuk mengalahkannya!',
};

function updateDemoTutorialText(model){
    const label = el('landingSub');
    if (!label) return;
    label.textContent = DEMO_TUTORIAL_MESSAGES[model] || 'Ketik kata yang muncul sebelum dino tiba!';
}

function createDemoState(){
    const s = G.freshState('easy', 'Demo');
    s.running = true;
    s.waitingSpawn = true;
    s.startTime = performance.now();
    s.lastFrameTime = s.startTime;
    return s;
}

// Urutan skenario demo dibuat TERSTRUKTUR & berulang (bukan murni acak) —
// tiap siklus konsisten memperlihatkan: ketik benar semua, ketik ada yang
// salah (lalu dibetulkan), dan sama sekali tidak diketik (nyawa berkurang
// lewat jalur "terlewat", sama seperti pemain sungguhan) — bergantian rapi.
const DEMO_OUTCOME_PATTERN = ['correct', 'correct', 'mistake', 'correct', 'miss'];
let demoOutcomeIndex = 0;

function spawnDemoObstacle(now){
    const state = getState();
    if (state.current || !state.waitingSpawn) return;
    const cfg = G.DIFF_CONFIG[state.difficulty];
    const type = Math.random() < cfg.airChance ? 'air' : 'ground';
    const word = G.pickWord(state.difficulty);
    const outcome = DEMO_OUTCOME_PATTERN[demoOutcomeIndex % DEMO_OUTCOME_PATTERN.length];
    demoOutcomeIndex++;
    state.current = {
        type,
        model: G.pickModel(type), // sudah otomatis menghindari model yang sama berturut-turut
        word,
        x: 840,
        y: type === 'air' ? G.GROUND_Y - 155 : G.GROUND_Y - 26,
        resolved: null,
        jumped: false,
        attackTriggered: false,
        exploded: false,
        finalizeAt: 0,
        nextShotAt: 0,
        demoMistakeDone: false,
        demoOutcome: outcome,
    };
    state.typedIndex = 0;
    state.waitingSpawn = false;
    demoBotNextActionAt = now + 420;
    updateDemoTutorialText(state.current.model);
}

function updateDemoBotTyping(now){
    const state = getState();
    const ob = state.current;
    if (!ob || ob.resolved) return;

    // Skenario "miss": bot SENGAJA tidak mengetik sama sekali, membiarkan
    // rintangan/serangan udara ini benar-benar mencapai dino -> nyawa
    // berkurang lewat jalur "terlewat" (updatePhysics/resolveObstacle),
    // sama seperti pemain yang tidak sempat mengetik.
    if (ob.demoOutcome === 'miss') return;

    if (now < demoBotNextActionAt) return;

    const target = ob.word.toLowerCase();
    const expected = target[state.typedIndex];
    if (expected === undefined) return;

    const canMistake = ob.demoOutcome === 'mistake' && !ob.demoMistakeDone;
    if (canMistake){
        ob.demoMistakeDone = true;
        const wrongChar = expected === 'z' ? 'q' : 'z';
        G.handleChar(wrongChar);
        demoBotNextActionAt = now + 460 + Math.random() * 220;
        return;
    }

    G.handleChar(expected);
    demoBotNextActionAt = now + 260 + Math.random() * 180;
}

function drawDemo(now){
    const c = el('demoCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    const W = c.width, H = c.height;
    const state = getState();

    G.drawBackground(ctx, W, H, now);
    G.drawDino(ctx, now);

    if (state.current){
        const ob = state.current;
        if (ob.type === 'ground'){
            G.drawGroundObstacle(ctx, ob, now);
        } else {
            G.drawAirObstacle(ctx, ob, now);
        }
        if (!ob.resolved){
            const widthMap = ob.type === 'air' ? G.AIR_WIDTH : G.GROUND_WIDTH;
            const halfWidth = (widthMap[ob.model] || 34) / 2;
            const cx = ob.x + halfWidth;
            const labelY = ob.type === 'air' ? ob.y - (G.AIR_LABEL_OFFSET[ob.model] || 24) : G.GROUND_Y - 44;
            G.drawWordLabel(ctx, ob.word, state.typedIndex, cx, labelY, now, ob);
        }
    }

    G.drawEffects(ctx, now);
}

function updateDemoHud(){
    const box = el('demoHeartsBox');
    if (!box) return;
    const state = getState();
    box.innerHTML = '';
    for (let i = 0; i < 3; i++){
        const h = document.createElement('div');
        h.className = 'heart' + (i >= state.hearts ? ' lost' : '');
        box.appendChild(h);
    }
}

let demoGameOverActive = false;

// Nyawa BENAR-BENAR bisa habis di demo (tidak lagi "disembuhkan" paksa) —
// begitu terjadi, tampilkan GAME OVER sesaat langsung di kanvas demo, lalu
// otomatis pulih & lanjut lagi (siklus tak berhenti, cocok untuk halaman
// paling awal yang harus terus berjalan).
// Durasi tampil GAME OVER di demo disamakan dengan panjang gameover.mp3,
// supaya suaranya selesai berbunyi tepat sebelum demo lanjut lagi.
const DEMO_GAMEOVER_DURATION_MS = 4000;

function showDemoGameOver(){
    demoGameOverActive = true;
    const banner = el('demoGameOverBanner');
    if (banner) banner.classList.add('show');
    // Jeda 450ms dulu sebelum suara game over, supaya tidak tabrakan dengan
    // suara damage dari nyawa terakhir yang baru hilang.
    setTimeout(() => { if (G.sfxGameOver) G.sfxGameOver(); }, 450);
    setTimeout(() => {
        const banner2 = el('demoGameOverBanner');
        if (banner2) banner2.classList.remove('show');
        const s = getState();
        if (s){
            s.hearts = 3;
            s.current = null;
            s.waitingSpawn = true;
            s.clearedCount = 0;
        }
        demoGameOverActive = false;
    }, DEMO_GAMEOVER_DURATION_MS);
}

function demoLoop(now){
    if (!demoRunning) return;
    const state = getState();
    const dt = Math.min(0.05, (now - (state.lastFrameTime || now)) / 1000);
    state.lastFrameTime = now;

    if (state.clearedCount >= 6) state.clearedCount = 0;

    if (state.hearts <= 0 && !demoGameOverActive){
        showDemoGameOver();
    }

    if (!demoGameOverActive){
        spawnDemoObstacle(now);
        updateDemoBotTyping(now);
    }
    G.updatePhysics(dt, now);
    updateDemoHud();
    drawDemo(now);

    demoRafId = requestAnimationFrame(demoLoop);
}

function startDemo(){
    if (!el('demoCanvas')) return;
    isDemoActive = true;
    demoRunning = true;
    setState(createDemoState());
    updateDemoHud();
    demoRafId = requestAnimationFrame(demoLoop);
}

function stopDemo(){
    demoRunning = false;
    isDemoActive = false;
    if (demoRafId) cancelAnimationFrame(demoRafId);
    demoRafId = null;
    setState(null);
}

document.addEventListener('DOMContentLoaded', () => {
    const landingStartBtn = el('landingStartBtn');
    if (landingStartBtn){
        landingStartBtn.addEventListener('click', () => {
            stopDemo();
            el('landingScreen').style.display = 'none';
            el('welcomeScreen').style.display = 'flex';
        });
    }

    const soundToggleBtn = el('soundToggleBtn');
    if (soundToggleBtn){
        soundToggleBtn.addEventListener('click', () => { if (G.toggleMute) G.toggleMute(); });
    }

    if (!el('demoCanvas')) return;

    (async () => {
        const stillLoading = !G.assetsAreReady;
        if (stillLoading){
            G.updateAssetLoadingProgress();
            el('assetLoadingOverlay').classList.remove('hidden');
        }
        await Promise.all([G.assetsReadyPromise, G.sfxReadyPromise]);
        if (stillLoading){
            el('assetLoadingOverlay').classList.add('hidden');
        }
        startDemo();
    })();
});