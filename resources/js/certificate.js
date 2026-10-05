// ============================================================
// SERTIFIKAT PENCAPAIAN - digambar di canvas, pixel-art style
// ============================================================

function formatTanggal(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const DIFF_LABEL = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };
// Warna khas tiap tingkat — sama dengan kartu kesulitan di menu game.
const DIFF_THEME = {
    easy:   { main: '#22c55e', g1: '#4ade80', g2: '#16a34a', bars: 1 },
    medium: { main: '#eab308', g1: '#facc15', g2: '#ca8a04', bars: 2 },
    hard:   { main: '#ef4444', g1: '#f87171', g2: '#dc2626', bars: 3 },
};
const CERT_FONT = "'Poppins', 'Baloo 2', 'Segoe UI', Arial, sans-serif";
const CERT_TEXT = '#111827';
const CERT_MUTED = '#6b7280';

// Ikon (viewBox 24x24) digambar lewat Path2D
const CERT_ICON = {
    trophy: ['M8 4h8v4a4 4 0 0 1-8 0V4Z', 'M8 5H5a2 2 0 0 0 0 4h1.5M16 5h3a2 2 0 0 1 0 4h-1.5', 'M12 12v3', 'M9 20h6', 'M10 17h4l.6 3H9.4l.6-3Z'],
    clock:  ['M20.2 13a8.2 8.2 0 1 1-16.4 0 8.2 8.2 0 0 1 16.4 0Z', 'M12 9v4.3l3 2', 'M9.5 2.2h5'],
    target: ['M20.2 12a8.2 8.2 0 1 1-16.4 0 8.2 8.2 0 0 1 16.4 0Z', 'M8.4 12.4l2.5 2.5 4.7-5'],
};

function roundRectPath(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawIcon(ctx, name, cx, cy, size, color, lw){
    ctx.save();
    ctx.translate(cx - size / 2, cy - size / 2);
    ctx.scale(size / 24, size / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    CERT_ICON[name].forEach(d => ctx.stroke(new Path2D(d)));
    ctx.restore();
}

// Ikon tingkat kesulitan: 3 batang naik (sama seperti ikon di kartu menu)
function drawDiffBars(ctx, x, baseY, h, filled, colorOn, colorOff){
    const bw = h * 0.28, gap = h * 0.16;
    for (let i = 0; i < 3; i++){
        const bh = h * (0.38 + i * 0.31);
        ctx.fillStyle = i < filled ? colorOn : colorOff;
        roundRectPath(ctx, x + i * (bw + gap), baseY - bh, bw, bh, bw * 0.3);
        ctx.fill();
    }
    return bw * 3 + gap * 2;
}

function drawInstagram(ctx, cx, cy, size){
    const g = ctx.createLinearGradient(cx - size / 2, cy + size / 2, cx + size / 2, cy - size / 2);
    g.addColorStop(0, '#feda75');
    g.addColorStop(0.28, '#fa7e1e');
    g.addColorStop(0.52, '#d62976');
    g.addColorStop(0.76, '#962fbf');
    g.addColorStop(1, '#4f5bd5');
    ctx.save();
    ctx.strokeStyle = g;
    ctx.fillStyle = g;
    ctx.lineWidth = size * 0.1;
    const w = size * 0.78;
    roundRectPath(ctx, cx - w / 2, cy - w / 2, w, w, size * 0.22);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.18, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + size * 0.23, cy - size * 0.23, size * 0.045, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawCopyright(ctx, cx, y, year){
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const fs = 20, gap = 10, ico = 22, pad = 12;
    ctx.font = `900 ${fs}px ${CERT_FONT}`;
    const wBrand = ctx.measureText('DINOTYPING').width;
    ctx.font = `800 ${fs}px ${CERT_FONT}`;
    const wYear = ctx.measureText(String(year)).width;
    const wUser = ctx.measureText('jo_briant19').width;
    const pillW = pad + ico + 8 + wUser + pad;
    const total = wBrand + gap + ico + gap + wYear + gap + pillW;
    let x = cx - total / 2;

    ctx.font = `900 ${fs}px ${CERT_FONT}`;
    ctx.fillStyle = '#16a34a';
    ctx.fillText('DINOTYPING', x, y);
    x += wBrand + gap;

    // ikon copyright (lingkaran + huruf C)
    ctx.strokeStyle = CERT_TEXT;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x + ico / 2, y, ico / 2 - 1, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + ico / 2, y, ico * 0.2, Math.PI * 0.3, Math.PI * 1.7); ctx.stroke();
    x += ico + gap;

    ctx.font = `800 ${fs}px ${CERT_FONT}`;
    ctx.fillStyle = CERT_TEXT;
    ctx.fillText(String(year), x, y);
    x += wYear + gap;

    // pil: ikon Instagram + username
    ctx.fillStyle = '#f3f4f6';
    roundRectPath(ctx, x, y - 18, pillW, 36, 18);
    ctx.fill();
    drawInstagram(ctx, x + pad + ico / 2 - 2, y, ico);
    ctx.fillStyle = CERT_TEXT;
    ctx.fillText('jo_briant19', x + pad + ico + 6, y);
    ctx.restore();
}

function renderCertificate(data, logo){
    const canvas = document.getElementById('certCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const t = DIFF_THEME[data.difficulty] || DIFF_THEME.easy;
    const label = DIFF_LABEL[data.difficulty] || 'EASY';

    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // latar putih berbingkai warna tingkat kesulitan
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, 0, 0, W, H, 40);
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = t.main;
    roundRectPath(ctx, 10, 10, W - 20, H - 20, 34);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    roundRectPath(ctx, 34, 34, W - 68, H - 68, 22);
    ctx.stroke();
    ctx.restore();

    // ornamen sudut
    ctx.fillStyle = t.main;
    [[58, 58, 1, 1], [W - 58, 58, -1, 1], [58, H - 58, 1, -1], [W - 58, H - 58, -1, -1]].forEach(([x, y, sx, sy]) => {
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.arc(x + 20 * sx, y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y + 20 * sy, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });

    // logo DinoTyping
    if (logo && logo.naturalWidth > 0){
        let lh = 118;
        let lw = lh * logo.naturalWidth / logo.naturalHeight;
        if (lw > 420){ lw = 420; lh = lw * logo.naturalHeight / logo.naturalWidth; }
        ctx.drawImage(logo, W / 2 - lw / 2, 50, lw, lh);
    }

    // judul
    ctx.fillStyle = CERT_TEXT;
    ctx.font = `900 46px ${CERT_FONT}`;
    ctx.fillText('SERTIFIKAT PENCAPAIAN', W / 2, 222);
    ctx.fillStyle = t.main;
    roundRectPath(ctx, W / 2 - 60, 258, 120, 6, 3);
    ctx.fill();

    ctx.fillStyle = CERT_MUTED;
    ctx.font = `600 22px ${CERT_FONT}`;
    ctx.fillText('Dengan bangga diberikan kepada', W / 2, 301);

    // nama pemain (otomatis mengecil jika panjang)
    let nameSize = 60;
    ctx.font = `900 ${nameSize}px ${CERT_FONT}`;
    while (ctx.measureText(data.name).width > 820 && nameSize > 28){
        nameSize -= 2;
        ctx.font = `900 ${nameSize}px ${CERT_FONT}`;
    }
    ctx.fillStyle = CERT_TEXT;
    ctx.fillText(data.name, W / 2, 357);
    const lineW = Math.min(Math.max(ctx.measureText(data.name).width + 60, 360), 880);
    ctx.fillStyle = t.main;
    roundRectPath(ctx, W / 2 - lineW / 2, 391, lineW, 4, 2);
    ctx.fill();

    ctx.fillStyle = CERT_MUTED;
    ctx.font = `600 22px ${CERT_FONT}`;
    ctx.fillText('atas keberhasilan menyelesaikan level tingkat', W / 2, 432);

    // lencana tingkat kesulitan (ikon batang + label) berwarna khas
    ctx.font = `900 30px ${CERT_FONT}`;
    const labelW = ctx.measureText(label).width;
    const barH = 26, barsW = barH * 1.16;
    const pillW = 34 + barsW + 16 + labelW + 38, pillH = 58, pillY = 456;
    const pillX = W / 2 - pillW / 2;
    const pg = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0);
    pg.addColorStop(0, t.g1);
    pg.addColorStop(1, t.g2);
    ctx.save();
    ctx.shadowColor = t.main + '66';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = pg;
    roundRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.restore();
    drawDiffBars(ctx, pillX + 34, pillY + pillH / 2 + barH / 2, barH, t.bars, '#ffffff', 'rgba(255,255,255,0.4)');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, pillX + 34 + barsW + 16, pillY + pillH / 2 + 1);
    ctx.textAlign = 'center';

    // kartu statistik
    const cardW = 250, cardH = 116, cardGap = 28, cardY = 546;
    const startX = (W - (cardW * 3 + cardGap * 2)) / 2;
    const stats = [
        ['trophy', 'SKOR', String(data.score)],
        ['clock', 'WAKTU', data.time.toFixed(1) + 's'],
        ['target', 'AKURASI', Math.round(data.accuracy) + '%'],
    ];
    stats.forEach(([icon, name, val], i) => {
        const x = startX + i * (cardW + cardGap);
        const cx = x + cardW / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(17,24,39,0.14)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = '#ffffff';
        roundRectPath(ctx, x, cardY, cardW, cardH, 20);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;
        ctx.strokeStyle = t.main;
        roundRectPath(ctx, x, cardY, cardW, cardH, 20);
        ctx.stroke();
        ctx.restore();

        drawIcon(ctx, icon, cx, cardY + 26, 28, t.main, 2.1);
        ctx.fillStyle = CERT_MUTED;
        ctx.font = `800 14px ${CERT_FONT}`;
        ctx.fillText(name, cx, cardY + 56);
        ctx.fillStyle = CERT_TEXT;
        ctx.font = `900 36px ${CERT_FONT}`;
        ctx.fillText(val, cx, cardY + 87);
    });

    // tanggal & copyright
    const dateObj = new Date(data.date);
    const year = isNaN(dateObj.getTime()) ? new Date().getFullYear() : dateObj.getFullYear();
    ctx.fillStyle = CERT_MUTED;
    ctx.font = `600 18px ${CERT_FONT}`;
    ctx.fillText(formatTanggal(data.date), W / 2, 697);
    drawCopyright(ctx, W / 2, 737, year);
}

function loadCertData(){
    const params = new URLSearchParams(window.location.search);
    if (params.has('name')){
        return {
            name: params.get('name'),
            difficulty: params.get('difficulty') || 'easy',
            score: parseInt(params.get('score') || '0', 10),
            time: parseFloat(params.get('time') || '0'),
            accuracy: parseFloat(params.get('accuracy') || '100'),
            date: params.get('date') || new Date().toISOString(),
        };
    }
    const raw = localStorage.getItem('typingDinoCertData');
    return raw ? JSON.parse(raw) : null;
}

function initCertificatePage(){
    const data = loadCertData();
    const canvas = document.getElementById('certCanvas');
    if (!data){
        canvas.style.display = 'none';
        document.getElementById('certEmpty').style.display = 'block';
        document.getElementById('downloadCertBtn').disabled = true;
        document.getElementById('printCertBtn').disabled = true;
        return;
    }

    // pastikan font & logo sudah termuat sebelum digambar
    const logo = new Image();
    const logoReady = new Promise(resolve => { logo.onload = () => resolve(logo); logo.onerror = () => resolve(null); });
    logo.src = new URL(canvas.dataset.logo || '/assets/images/logo.png', window.location.href).pathname;
    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.all([fontsReady, logoReady]).then(([, img]) => renderCertificate(data, img));

    document.getElementById('downloadCertBtn').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `sertifikat-typing-dino-${data.name.replace(/\s+/g,'-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    document.getElementById('printCertBtn').addEventListener('click', () => {
        window.print();
    });
}

if (document.getElementById('certCanvas')){
    document.addEventListener('DOMContentLoaded', initCertificatePage);
}
