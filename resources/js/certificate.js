// ============================================================
// SERTIFIKAT PENCAPAIAN - digambar di canvas, pixel-art style
// ============================================================

function formatTanggal(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const DIFF_LABEL = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };
const DIFF_COLOR = { easy: '#39ff6a', medium: '#ffe14d', hard: '#ff3d5a' };

function drawPixelBorder(ctx, W, H, color){
    const t = 14;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, t);
    ctx.fillRect(0, H - t, W, t);
    ctx.fillRect(0, 0, t, H);
    ctx.fillRect(W - t, 0, t, H);

    // pola pixel di sudut (dekorasi)
    const corner = 46;
    ctx.fillStyle = color;
    [[0,0],[W-corner,0],[0,H-corner],[W-corner,H-corner]].forEach(([cx, cy]) => {
        for (let i = 0; i < 5; i++){
            ctx.fillRect(cx + i*8, cy + i*8, 8, 8);
            ctx.fillRect(cx + corner - i*8 - 8, cy + i*8, 8, 8);
        }
    });
}

function drawMedal(ctx, cx, cy, color){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#170b34';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = "bold 30px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 2);
    // pita
    ctx.fillStyle = color;
    ctx.fillRect(-18, 40, 14, 46);
    ctx.fillRect(4, 40, 14, 46);
    ctx.restore();
}

function renderCertificate(data){
    const canvas = document.getElementById('certCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const accent = DIFF_COLOR[data.difficulty] || '#39ff6a';

    // background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#170b34');
    grad.addColorStop(1, '#241354');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // dekor bintang
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 60; i++){
        const x = (i * 97) % W;
        const y = (i * 53) % H;
        ctx.fillRect(x, y, 3, 3);
    }

    drawPixelBorder(ctx, W, H, accent);
    drawMedal(ctx, W/2, 150, accent);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#eae6ff';
    ctx.font = "bold 34px 'Press Start 2P', monospace";
    ctx.fillText('SERTIFIKAT', W/2, 270);
    ctx.font = "20px 'Press Start 2P', monospace";
    ctx.fillStyle = accent;
    ctx.fillText('PENCAPAIAN TYPING DINO', W/2, 305);

    ctx.fillStyle = '#9a8fc9';
    ctx.font = "16px 'VT323', monospace";
    ctx.fillText('Dengan bangga diberikan kepada', W/2, 365);

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 44px 'VT323', monospace";
    ctx.fillText(data.name, W/2, 420);
    ctx.fillStyle = accent;
    ctx.fillRect(W/2 - 160, 435, 320, 3);

    ctx.fillStyle = '#eae6ff';
    ctx.font = "22px 'VT323', monospace";
    ctx.fillText(`atas keberhasilan menyelesaikan level tingkat`, W/2, 475);

    ctx.font = "bold 28px 'Press Start 2P', monospace";
    ctx.fillStyle = accent;
    ctx.fillText(DIFF_LABEL[data.difficulty] || 'EASY', W/2, 520);

    // statistik
    const statY = 580;
    const stats = [
        ['SKOR', data.score],
        ['WAKTU', data.time.toFixed(1) + 's'],
        ['AKURASI', Math.round(data.accuracy) + '%'],
    ];
    const gap = 260;
    const startX = W/2 - gap;
    stats.forEach(([label, val], i) => {
        const x = startX + i * gap;
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.fillStyle = '#9a8fc9';
        ctx.fillText(label, x, statY);
        ctx.font = "bold 26px 'Press Start 2P', monospace";
        ctx.fillStyle = '#ffe14d';
        ctx.fillText(String(val), x, statY + 36);
    });

    ctx.font = "16px 'VT323', monospace";
    ctx.fillStyle = '#9a8fc9';
    ctx.fillText(formatTanggal(data.date), W/2, H - 60);
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.fillStyle = accent;
    ctx.fillText('TYPING DINO', W/2, H - 32);
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

    // pastikan font pixel sudah termuat sebelum digambar agar tidak fallback ke font default
    if (document.fonts && document.fonts.ready){
        document.fonts.ready.then(() => renderCertificate(data));
    } else {
        renderCertificate(data);
    }

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
