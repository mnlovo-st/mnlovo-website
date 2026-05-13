/* ══════════════════════════════
   MNLOVO — main.js
   ══════════════════════════════ */
'use strict';

// ── Nav stick ───────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('stuck', window.scrollY > 40);
}, { passive: true });

// ── Smooth scroll ────────────────────────────
function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ── Particles canvas ─────────────────────────
(function () {
    const c = document.getElementById('cvs');
    if (!c) return;
    const ctx = c.getContext('2d');
    let W, H, pts = [];

    function resize() {
        W = c.width  = c.offsetWidth;
        H = c.height = c.offsetHeight;
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    const count = Math.min(60, Math.floor(W * H / 14000));
    for (let i = 0; i < count; i++) {
        pts.push({
            x:  Math.random() * W,
            y:  Math.random() * H,
            r:  Math.random() * 1.3 + 0.25,
            vx: (Math.random() - 0.5) * 0.32,
            vy: -(Math.random() * 0.48 + 0.08),
            a:  Math.random() * 0.28 + 0.04,
        });
    }

    (function draw() {
        ctx.clearRect(0, 0, W, H);
        for (const p of pts) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,212,255,${p.a})`;
            ctx.fill();
            p.x += p.vx; p.y += p.vy;
            if (p.y < -4)   { p.y = H + 4; p.x = Math.random() * W; }
            if (p.x < -2)     p.x = W + 2;
            if (p.x > W + 2)  p.x = -2;
        }
        requestAnimationFrame(draw);
    })();
})();

// ── Scroll reveal ─────────────────────────────
// Strategy: animation-play-state: paused holds opacity:0 via fill-mode:both.
// Observer just flips it to running — no setTimeout/rAF timing tricks needed.
const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('on');
        io.unobserve(e.target);
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

function setupReveal() {
    document.querySelectorAll('.sec-head').forEach(el => {
        el.classList.add('reveal');
        io.observe(el);
    });
    ['.feat-card', '.proj-card'].forEach(sel => {
        document.querySelectorAll(sel).forEach((el, i) => {
            el.classList.add('reveal');
            el.style.animationDelay = (i * 90) + 'ms';
            io.observe(el);
        });
    });
    ['.about-text', '.about-visual', '.cta-body'].forEach(sel => {
        document.querySelectorAll(sel).forEach((el, i) => {
            el.classList.add('reveal');
            el.style.animationDelay = (i * 110) + 'ms';
            io.observe(el);
        });
    });
}

// ── Progress bars ─────────────────────────────
function setupProgress() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.style.width = (e.target.dataset.w || 0) + '%';
            obs.unobserve(e.target);
        });
    }, { threshold: 0.35 });
    document.querySelectorAll('.pp-fill').forEach(b => obs.observe(b));
}

// ── Discord webhook (PASTE YOUR URL HERE) ────────────────────
// Get it from: Discord Server → Channel ⚙️ → Integrations → Webhooks → New
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1504157837792772267/JT-HAntNswdPUZHfzb9tDKarlT386ofmAYoK7aTxfcoaZWVcvFLwFAm3XrDf41CyoC6_';

async function sendToDiscord(email) {
    if (!DISCORD_WEBHOOK || DISCORD_WEBHOOK.includes('PASTE_YOUR')) {
        console.warn('[mnlovo] Discord webhook not configured');
        return;
    }
    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: '📧 إيميل جديد للقائمة!',
                    description: '```' + email + '```',
                    color: 0x00d4ff,
                    timestamp: new Date().toISOString(),
                    footer: { text: 'MNLOVO Waitlist' }
                }]
            })
        });
        console.log('[mnlovo] email sent to Discord');
    } catch (err) {
        console.error('[mnlovo] Discord webhook failed:', err);
    }
}

// ── Notify form ───────────────────────────────
function submitNotify() {
    const input   = document.getElementById('emailIn');
    const success = document.getElementById('notifySuccess');
    const val     = (input?.value || '').trim();

    if (!val || !val.includes('@') || !val.includes('.')) {
        showToast('⚠️ أدخل بريد إلكتروني صحيح', 'toast-warn');
        return;
    }

    // Save locally + send to Discord
    const stored = JSON.parse(localStorage.getItem('mnlovo_emails') || '[]');
    stored.push({ email: val, date: new Date().toISOString() });
    localStorage.setItem('mnlovo_emails', JSON.stringify(stored));
    sendToDiscord(val);   // fire-and-forget

    const emailVal = val;
    input.value = '';
    input.blur();

    vaporizeNotifyRow(emailVal, () => {
        const row = document.getElementById('notifyRow');
        if (row) row.remove();
        const s = document.getElementById('notifySuccess');
        if (s) {
            // Brute-force display — bypasses any cached CSS
            s.style.display      = 'flex';
            s.style.flexDirection = 'column';
            s.style.alignItems   = 'center';
            s.style.opacity      = '1';
            s.classList.add('show');
            console.log('[mnlovo] success state activated', s);
        } else {
            console.error('[mnlovo] #notifySuccess NOT FOUND');
        }
    });

    showToast('🎉 سيصلك إشعار عند الإطلاق!', 'toast-ok');
}

// ── Canvas roundRect polyfill (Safari < 15.4) ─────────────────
(function () {
    const p = CanvasRenderingContext2D.prototype;
    if (p.roundRect) return;
    p.roundRect = function (x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        this.moveTo(x + r, y);
        this.arcTo(x + w, y,     x + w, y + h, r);
        this.arcTo(x + w, y + h, x,     y + h, r);
        this.arcTo(x,     y + h, x,     y,     r);
        this.arcTo(x,     y,     x + w, y,     r);
        this.closePath();
    };
})();

// ── Vaporize notify-row with canvas particles ─────────────────
// FIX: canvas is PAD pixels larger on every side so particles can
// travel outside the row bounds without being clipped.
function vaporizeNotifyRow(email, onComplete) {
    const row   = document.getElementById('notifyRow');
    const input = document.getElementById('emailIn');
    const btn   = row ? row.querySelector('.notify-btn') : null;
    if (!row) { onComplete(); return; }

    const rowRect   = row.getBoundingClientRect();
    const inputRect = input ? input.getBoundingClientRect() : null;
    const btnRect   = btn   ? btn.getBoundingClientRect()   : null;

    const dpr = Math.min(window.devicePixelRatio * 1.5, 3);
    const PAD = 180;                          // extra breathing room for particles
    const W   = rowRect.width  + PAD * 2;
    const H   = rowRect.height + PAD * 2;

    // Canvas is PAD px larger on every side
    const canvas = document.createElement('canvas');
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.cssText = [
        `position:fixed`,
        `top:${rowRect.top  - PAD}px`,
        `left:${rowRect.left - PAD}px`,
        `width:${W}px`,
        `height:${H}px`,
        `pointer-events:none`,
        `z-index:9999`,
    ].join(';');
    document.body.appendChild(canvas);

    row.style.opacity = '0';          // instant hide — kills border + focus ring

    const ctx = canvas.getContext('2d');

    // Draw form elements — offset inward by PAD so they sit in the right spot
    _drawForm(ctx, email, dpr, PAD, rowRect, inputRect, btnRect);

    // Sample pixels → particles
    const imgData    = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px         = imgData.data;
    const sampleRate = Math.max(1, Math.round(dpr / 1.5));
    const particles  = [];

    for (let y = 0; y < canvas.height; y += sampleRate) {
        for (let x = 0; x < canvas.width; x += sampleRate) {
            const idx = (y * canvas.width + x) * 4;
            if (px[idx + 3] < 12) continue;
            const origA = (px[idx + 3] / 255) * (sampleRate / dpr);
            particles.push({
                x, y, ox: x, oy: y,
                col: `rgba(${px[idx]},${px[idx+1]},${px[idx+2]},`,
                op: origA, oa: origA,
                vx: 0, vy: 0, spd: 0,
                quick: Math.random() > 0.52,
            });
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Animate — wave sweeps right→left (RTL feel)
    const DURATION = 1300;
    const SPREAD   = 3.2;
    const t0 = performance.now();
    let   last = t0;

    // The wave starts at the right edge of the actual form content (not the PAD)
    const formRight = (rowRect.width + PAD) * dpr;
    const formLeft  = PAD * dpr;

    (function step(now) {
        const dt       = Math.min((now - last) / 1000, 0.05);
        last           = now;
        const progress = Math.min(1, (now - t0) / DURATION);
        const waveX    = formRight - (formRight - formLeft) * progress;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let allGone = true;

        for (const p of particles) {
            const hit = p.ox >= waveX;

            if (hit) {
                if (p.spd === 0) {
                    const ang = Math.random() * Math.PI * 2;
                    p.spd = (Math.random() * 1.4 + 0.4) * SPREAD;
                    p.vx  = Math.cos(ang) * p.spd;
                    p.vy  = Math.sin(ang) * p.spd;
                }

                if (p.quick) {
                    p.op = Math.max(0, p.op - dt * 1.8);
                } else {
                    const dx   = p.ox - p.x;
                    const dy   = p.oy - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const damp = Math.max(0.92, 1 - dist / (90 * SPREAD));
                    p.vx = (p.vx + (Math.random() - .5) * SPREAD * 3 + dx * .002) * damp;
                    p.vy = (p.vy + (Math.random() - .5) * SPREAD * 3 + dy * .002) * damp;
                    const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    const max = SPREAD * 2;
                    if (vel > max) { const s = max / vel; p.vx *= s; p.vy *= s; }
                    p.x += p.vx * dt * 20;
                    p.y += p.vy * dt * 10;
                    p.op = Math.max(0, p.op - dt * 0.28);
                }

                if (p.op > 0.008) allGone = false;
            } else {
                allGone = false;
            }

            if (p.op > 0) {
                ctx.fillStyle = `${p.col}${p.op})`;
                ctx.fillRect(p.x, p.y, sampleRate, sampleRate);
            }
        }

        if (progress < 1 || !allGone) {
            requestAnimationFrame(step);
        } else {
            canvas.remove();
            onComplete();
        }
    })(t0);
}

// ── Draw form on canvas — all positions offset by PAD ────────
function _drawForm(ctx, email, dpr, PAD, rowRect, inputRect, btnRect) {
    const r  = 12 * dpr;
    const px = PAD * dpr;   // PAD in physical pixels

    if (inputRect) {
        const ix = (inputRect.left - rowRect.left) * dpr + px;
        const iy = (inputRect.top  - rowRect.top)  * dpr + px;
        const iw = inputRect.width  * dpr;
        const ih = inputRect.height * dpr;

        ctx.beginPath();
        ctx.roundRect(ix, iy, iw, ih, r);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();

        if (email) {
            ctx.font = `500 ${14 * dpr}px Cairo,sans-serif`;
            ctx.fillStyle = '#eeeef5';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(email, ix + 18 * dpr, iy + ih / 2);
        }
    }

    if (btnRect) {
        const bx = (btnRect.left - rowRect.left) * dpr + px;
        const by = (btnRect.top  - rowRect.top)  * dpr + px;
        const bw = btnRect.width  * dpr;
        const bh = btnRect.height * dpr;

        const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        grad.addColorStop(0, '#00d4ff');
        grad.addColorStop(1, '#7928ca');

        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, r);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.font = `800 ${14 * dpr}px Cairo,sans-serif`;
        ctx.fillStyle = '#06060a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('أعلمني', bx + bw / 2, by + bh / 2);
    }
}

// ── Email list helpers (browser console) ─────────────────────
window.getEmails    = () => JSON.parse(localStorage.getItem('mnlovo_emails') || '[]');
window.exportEmails = () => {
    const list = window.getEmails();
    if (!list.length) { console.log('لا يوجد إيميلات مسجلة'); return; }
    const txt = list.map((e, i) =>
        `${i + 1}. ${e.email}  (${new Date(e.date).toLocaleString('ar')})`
    ).join('\n');
    console.log('═══ قائمة الإيميلات ═══\n' + txt + `\n\nالمجموع: ${list.length}`);
    return list;
};

// ── Toast ─────────────────────────────────────
let _tt;
function showToast(msg, cls = 'toast-ok') {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    clearTimeout(_tt);
    t.textContent = msg;
    t.className   = 'toast ' + cls;
    requestAnimationFrame(() => t.classList.add('show'));
    _tt = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Language toggle (AR/EN) ──────────────────
function applyLang(lang) {
    const html = document.documentElement;
    html.lang = lang;
    html.dir  = lang === 'ar' ? 'rtl' : 'ltr';

    // simple text content
    document.querySelectorAll('[data-ar][data-en]').forEach(el => {
        const txt = el.dataset[lang];
        if (txt != null) el.textContent = txt;
    });
    // HTML content (with nested spans/br)
    document.querySelectorAll('[data-ar-html][data-en-html]').forEach(el => {
        const html = el.dataset[lang + 'Html'];
        if (html != null) el.innerHTML = html;
    });
    // input placeholders
    document.querySelectorAll('[data-ar-ph][data-en-ph]').forEach(el => {
        const ph = el.dataset[lang + 'Ph'];
        if (ph != null) el.placeholder = ph;
    });

    // update toggle button label (shows the OTHER lang to switch TO)
    const btn = document.querySelector('.nav-lang-current');
    if (btn) btn.textContent = lang === 'ar' ? 'EN' : 'ع';

    localStorage.setItem('mnlovo_lang', lang);
}

function toggleLang() {
    const current = document.documentElement.lang || 'ar';
    applyLang(current === 'ar' ? 'en' : 'ar');
}

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setupReveal();
    setupProgress();
    // restore saved language (default: Arabic)
    const saved = localStorage.getItem('mnlovo_lang') || 'ar';
    applyLang(saved);
});
