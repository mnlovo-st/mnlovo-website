/* ══════════════════════════════
   MNLOVO — main.js
   ══════════════════════════════ */
'use strict';

// ── Nav stick + auto-hide on mobile scroll-down ────────────────
const nav = document.getElementById('nav');
let _lastScroll = 0;
let _navTicking = false;

window.addEventListener('scroll', () => {
    if (_navTicking) return;
    _navTicking = true;
    requestAnimationFrame(() => {
        const y = window.scrollY;
        nav.classList.toggle('stuck', y > 40);

        // Auto-hide only on mobile (≤ 480px)
        if (window.innerWidth <= 480) {
            const delta = y - _lastScroll;
            if (y > 120 && delta > 4) {
                nav.classList.add('nav-hide');         // scrolling down → hide
            } else if (delta < -4 || y <= 60) {
                nav.classList.remove('nav-hide');      // scrolling up → show
            }
        } else {
            nav.classList.remove('nav-hide');          // never hide on desktop
        }
        _lastScroll = y;
        _navTicking = false;
    });
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
            const w = parseInt(e.target.dataset.w || 0);
            e.target.style.width = w + '%';
            if (w >= 100) e.target.classList.add('complete');
            obs.unobserve(e.target);
        });
    }, { threshold: 0.35 });
    document.querySelectorAll('.pp-fill').forEach(b => obs.observe(b));
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
