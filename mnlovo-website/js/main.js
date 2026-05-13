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
const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        const d = parseInt(e.target.dataset.delay || '0', 10);
        setTimeout(() => e.target.classList.add('on'), d);
        io.unobserve(e.target);
    });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

function setupReveal() {
    document.querySelectorAll('.sec-head').forEach(el => {
        el.classList.add('reveal'); io.observe(el);
    });
    ['.feat-card', '.proj-card'].forEach(sel => {
        document.querySelectorAll(sel).forEach((el, i) => {
            el.classList.add('reveal');
            el.dataset.delay = String(i * 90);
            io.observe(el);
        });
    });
    ['.about-text', '.about-visual', '.cta-body'].forEach(sel => {
        document.querySelectorAll(sel).forEach((el, i) => {
            el.classList.add('reveal');
            el.dataset.delay = String(i * 110);
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

// ── Notify form ───────────────────────────────
function submitNotify() {
    const input = document.getElementById('emailIn');
    const val   = (input?.value || '').trim();
    if (!val || !val.includes('@') || !val.includes('.')) {
        showToast('⚠️ أدخل بريد إلكتروني صحيح', 'toast-warn');
        return;
    }
    input.value = '';
    showToast('🎉 سيصلك إشعار عند الإطلاق!', 'toast-ok');
}

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

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setupReveal();
    setupProgress();
});
