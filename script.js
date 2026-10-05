/*
 * mm.ai portfolio interactions.
 *
 * Animations use Motion (the library formerly called Framer Motion), loaded in
 * index.html as its vanilla JS build, which defines window.Motion.
 * Without Motion, or when the visitor prefers reduced motion, the page renders
 * fully static with all content visible.
 */
(() => {
    const M = window.Motion;
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    // Motion tokens: durations are seconds, easings are cubic-bezier points.
    const EASE_OUT = [0.22, 1, 0.36, 1];
    const EASE_IN_OUT = [0.76, 0, 0.24, 1];
    const SPRING_SNAPPY = { type: 'spring', stiffness: 300, damping: 30 };
    const SPRING_MAGNET = { type: 'spring', stiffness: 160, damping: 14, mass: 0.2 };
    const SPRING_POP = { type: 'spring', stiffness: 500, damping: 22 };
    const IN_VIEW = { amount: 0.2, margin: '0px 0px -8% 0px' };
    // Resting value for every property a reveal animates.
    const REST = { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' };
    // Glyphs shown while a heading "decodes".
    const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEFXYZ';

    /* ---------- Ambient motion toggle (WCAG 2.2.2: pause moving content) ---------- */
    const fxToggle = $('#fx-toggle');
    let fxOn = !reduceMotion;
    try {
        const saved = localStorage.getItem('mm-fx');
        if (saved) fxOn = saved === 'on';
    } catch { /* storage blocked: keep the default */ }

    const applyFx = () => {
        root.classList.toggle('fx-off', !fxOn);
        fxToggle?.setAttribute('aria-pressed', String(!fxOn));
    };
    applyFx();
    fxToggle?.addEventListener('click', () => {
        fxOn = !fxOn;
        applyFx();
        try { localStorage.setItem('mm-fx', fxOn ? 'on' : 'off'); } catch { /* ignore */ }
    });

    startMatrixRain();
    setupSpotlight();

    if (!M || reduceMotion) {
        $('#preloader')?.remove();
        return;
    }

    // If setup fails, a CSS class forces every hidden element visible again.
    // CSS wins even over style writes Motion still has queued for the next frame.
    const restorers = [];
    let bailed = false;
    const revealEverything = () => {
        bailed = true;
        $('#preloader')?.remove();
        root.classList.add('motion-failed');
        restorers.forEach((restore) => restore());
    };

    try {
        setupMotion();
    } catch (err) {
        console.error(err);
        revealEverything();
    }

    /* ======================= Motion choreography ======================= */

    function setupMotion() {
        const preloader = $('#preloader');
        const hero = prepareHero();
        const terminal = prepareTerminal();
        const registerReveals = prepareReveals();

        setupScrollEffects();
        setupNav();
        setupButtons();

        const start = () => {
            const failsafe = setTimeout(revealEverything, 9000);
            runBootLog($('#boot-text'))
                .then(() => {
                    clearTimeout(failsafe);
                    if (bailed) return;
                    const t0 = 0.5; // the hero starts while the curtain is still lifting
                    M.animate($('.boot-container'), { opacity: 0, y: -16 }, { duration: 0.25, ease: 'easeIn' });
                    M.animate(preloader, { y: '-100%' }, { duration: 0.9, delay: 0.1, ease: EASE_IN_OUT })
                        .finished.then(() => preloader.remove());
                    hero.play(t0);
                    terminal.play(t0 + 0.75);
                    setTimeout(registerReveals, (t0 + 0.5) * 1000);
                })
                .catch((err) => {
                    console.error(err);
                    revealEverything();
                });
        };

        // A tab opened in the background waits until someone can see the intro.
        if (document.hidden) document.addEventListener('visibilitychange', start, { once: true });
        else start();
    }

    function runBootLog(container) {
        const messages = [
            "INIT: version 2.88 booting",
            "[ OK ] Starting system message bus...",
            "[ OK ] Started Login Service.",
            "[ OK ] Started mm.ai Core Systems.",
            "Mounting /portfolio/experience... done.",
            "Loading skills manifest... [ OK ]",
            "Initializing Agentic AI modules... success.",
            "Establishing connection to port 3000...",
            "Decrypting user payload... verified.",
            "Welcome to mm.ai workspace."
        ];

        return new Promise((resolve) => {
            let i = 0;
            const next = () => {
                if (i === messages.length) {
                    setTimeout(resolve, 450);
                    return;
                }
                const line = document.createElement('div');
                // Static strings only, so building markup here is safe.
                line.innerHTML = messages[i++].replace(/\[ OK \]|done\.|success\.|verified\./g, (m) => `<span class="ok">${m}</span>`);
                container.append(line);
                M.animate(line, { opacity: [0, 1], x: [-6, 0] }, { duration: 0.2, ease: EASE_OUT });
                // Randomly stagger log generation speed to simulate real IO parsing
                setTimeout(next, Math.random() * 110 + 30);
            };
            setTimeout(next, 250);
        });
    }

    function prepareHero() {
        const title = $('.hero-title');
        const glow = $('.hero-glow');
        const words = splitWords(title);
        const items = [$('.hero-subtitle'), $('.hero-actions'), $('.hero-links')];

        setInitial(words, { y: '115%' });
        setInitial(items, { opacity: 0, y: 24, filter: 'blur(6px)' });
        setInitial(glow, { opacity: 0, scale: 0.6 });

        return {
            play(t0) {
                M.animate(glow, { opacity: 1, scale: 1 }, { duration: 1.8, delay: t0, ease: EASE_OUT });
                M.animate(words, { y: '0%' }, { duration: 1, ease: EASE_OUT, delay: M.stagger(0.07, { startDelay: t0 }) })
                    .finished.then(() => title.classList.add('is-revealed'));
                M.animate(items, { opacity: 1, y: 0, filter: 'blur(0px)' }, {
                    duration: 0.9,
                    ease: EASE_OUT,
                    delay: M.stagger(0.12, { startDelay: t0 + 0.4 }),
                }).finished.then(() => items.forEach(clearFilter));
            },
        };
    }

    function prepareTerminal() {
        const box = $('.terminal-container');
        const win = $('.terminal-window');
        const lines = $$('.term-line', win);
        const cmd = splitLabel($('.term-command', win));

        setInitial(box, { opacity: 0, y: 60 });
        setInitial(lines, { opacity: 0 });
        cmd.visual.textContent = '';
        restorers.push(() => { cmd.visual.textContent = cmd.text; });

        // The window starts tilted back and flattens as it scrolls into place.
        M.scroll(
            M.animate(win, { rotateX: [24, 0], scale: [0.9, 1] }, { ease: 'linear' }),
            { target: box, offset: ['start end', 'start 25%'] }
        );

        // Type the command, then stream the output line by line.
        const stream = () => {
            M.animate(lines[0], { opacity: 1 }, { duration: 0.2 });
            M.animate(0, cmd.text.length, {
                duration: 0.8,
                delay: 0.15,
                ease: 'linear',
                onUpdate: (v) => { cmd.visual.textContent = cmd.text.slice(0, Math.round(v)); },
            }).finished.then(() => {
                M.animate(lines.slice(1), { opacity: [0, 1], x: [-8, 0] }, {
                    duration: 0.35,
                    ease: EASE_OUT,
                    delay: M.stagger(0.05),
                });
            });
        };

        return {
            play(delay) {
                M.animate(box, { opacity: 1, y: 0 }, { duration: 1.1, delay, ease: EASE_OUT });
                setTimeout(() => M.inView(win, () => { stream(); }, { amount: 0.35 }), delay * 1000);
            },
        };
    }

    // Hides content now and returns a function that arms the scroll-triggered entrances.
    function prepareReveals() {
        const triggers = [];
        const reveal = (els, from, { delay = () => 0, onShow, view = IN_VIEW, ...transition } = {}) => {
            els = els.filter(Boolean);
            if (!els.length) return;
            const to = Object.fromEntries(Object.keys(from).map((key) => [key, REST[key]]));
            setInitial(els, from);
            triggers.push(() => M.inView(els, (el) => {
                M.animate(el, to, { duration: 0.8, ease: EASE_OUT, ...transition, delay: delay(els.indexOf(el), el) })
                    .finished.then(() => clearFilter(el));
                onShow?.(el);
            }, view));
        };
        const popIn = (els, startDelay) =>
            M.animate(els, { opacity: 1, scale: 1 }, { ...SPRING_POP, delay: M.stagger(0.035, { startDelay }) });

        const UP = { opacity: 0, y: 32, filter: 'blur(6px)' };

        // Section titles decode like terminal output, then their subtitles rise in.
        const titles = $$('.section-header h2, .cta-title');
        const titleLabels = new Map();
        titles.forEach((h) => {
            const label = splitLabel(h);
            label.visual.textContent = scramble(label.text, 0);
            titleLabels.set(h, label);
            restorers.push(() => { label.visual.textContent = label.text; });
        });
        reveal(titles, { opacity: 0 }, { duration: 0.3, onShow: (h) => decode(titleLabels.get(h)) });
        reveal($$('.section-header p, .cta-section p, .cta-actions, .subhead'), { opacity: 0, y: 16 }, {
            delay: (i, el) => (el.classList.contains('cta-actions') ? 0.45 : 0.3),
        });

        // Highlight numbers count up.
        const counters = new Map();
        $$('.stat-value').forEach((el) => {
            const raw = el.dataset.count;
            const counter = {
                label: splitLabel(el),
                target: parseFloat(raw),
                decimals: (raw.split('.')[1] || '').length,
                suffix: el.dataset.suffix || '',
            };
            counter.label.visual.textContent = formatCount(0, counter);
            counters.set(el.closest('.stat'), counter);
            restorers.push(() => { counter.label.visual.textContent = counter.label.text; });
        });
        reveal($$('.stat'), UP, { delay: (i) => i * 0.08, onShow: (stat) => countUp(counters.get(stat)) });

        // Experience timeline: card slides in, node lights up, bullets stream.
        $$('.timeline-item').forEach((item) => {
            setInitial($('.timeline-node', item), { scale: 0 });
            setInitial($$('.card-list li', item), { opacity: 0, x: -10 });
            setInitial($$('.tech-chips li', item), { opacity: 0, scale: 0.8 });
        });
        reveal($$('.timeline-item'), { opacity: 0, x: 48, filter: 'blur(8px)' }, {
            duration: 0.9,
            onShow: (item) => {
                item.classList.add('is-lit');
                M.animate($('.timeline-node', item), { scale: [0, 1.4, 1] }, { duration: 0.6, delay: 0.1 });
                M.animate($$('.card-list li', item), { opacity: 1, x: 0 }, {
                    duration: 0.5,
                    ease: EASE_OUT,
                    delay: M.stagger(0.06, { startDelay: 0.25 }),
                });
                popIn($$('.tech-chips li', item), 0.5);
            },
        });

        // Project grid: featured cards span the row; the two columns below are slightly offset.
        const projectCards = $$('.project-card');
        const gridCards = projectCards.filter((card) => !card.classList.contains('featured'));
        projectCards.forEach((card) => setInitial($$('.tech-chips li', card), { opacity: 0, scale: 0.8 }));
        reveal(projectCards, UP, {
            delay: (i, el) => (gridCards.includes(el) ? (gridCards.indexOf(el) % 2) * 0.12 : 0),
            onShow: (card) => popIn($$('.tech-chips li', card), 0.35),
        });

        // Skills: each category rises, then its tags pop in.
        $$('.skill-category').forEach((cat) => setInitial($$('.skill-tags span', cat), { opacity: 0, scale: 0.6 }));
        reveal($$('.skill-category'), { opacity: 0, y: 24 }, {
            delay: (i) => (i % 2) * 0.1,
            onShow: (cat) => popIn($$('.skill-tags span', cat), 0.2),
        });

        reveal($$('.edu-card'), UP, { delay: (i) => (i % 2) * 0.12 });
        reveal($$('.cert-list li'), { opacity: 0, x: -24 }, { delay: (i) => (i % 2) * 0.08 });
        reveal($$('.publication-item'), { opacity: 0, x: -40, filter: 'blur(6px)' });
        reveal([$('.footer-container')], { opacity: 0, y: 16 });

        return () => triggers.forEach((arm) => arm());
    }

    function setupScrollEffects() {
        // Reading progress bar across the top of the page.
        M.scroll(M.animate('.scroll-progress', { scaleX: [0, 1] }, { ease: 'linear' }));

        // Hero drifts and fades as it scrolls away; the glow moves slower for depth.
        const heroRange = { target: $('.hero'), offset: ['start start', 'end start'] };
        M.scroll(M.animate('.hero-content', { y: [0, 140], opacity: [1, 0] }, { ease: 'linear' }), heroRange);
        M.scroll(M.animate('.hero-glow', { y: [0, 220] }, { ease: 'linear' }), heroRange);

        // Timeline line fills as you read down the experience section.
        const timeline = $('.timeline');
        if (timeline) {
            M.scroll(
                M.animate('.timeline-progress', { scaleY: [0, 1] }, { ease: 'linear' }),
                { target: timeline, offset: ['start 70%', 'end 70%'] }
            );
        }
    }

    function setupNav() {
        const nav = $('.navbar');
        const linksBox = $('.nav-links');
        const links = $$('.nav-links a');

        // Sliding underline that follows the section currently on screen.
        const indicator = document.createElement('span');
        indicator.className = 'nav-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        linksBox.append(indicator);

        let active = null;
        const place = (transition) => {
            if (!active) return;
            M.animate(indicator, { x: active.offsetLeft, scaleX: active.offsetWidth, opacity: 1 }, transition);
        };
        const setActive = (link) => {
            if (link === active) return;
            active?.classList.remove('is-active');
            active = link;
            if (!link) {
                M.animate(indicator, { opacity: 0 }, { duration: 0.2 });
                return;
            }
            link.classList.add('is-active');
            place({ ...SPRING_SNAPPY, opacity: { duration: 0.2 } });
            // On narrow screens the links scroll sideways; keep the active one visible.
            if (linksBox.scrollWidth > linksBox.clientWidth) {
                linksBox.scrollTo({ left: link.offsetLeft - 16, behavior: 'smooth' });
            }
        };

        links.forEach((link) => {
            const section = $(link.getAttribute('href'));
            if (!section) return;
            M.inView(section, () => {
                setActive(link);
                return () => { if (active === link) setActive(null); };
            }, { margin: '-45% 0px -50% 0px' });
        });
        window.addEventListener('resize', () => place({ duration: 0 }));

        // Hide the bar while scrolling down, bring it back on any upward scroll.
        // Direction comes from position deltas: Motion reports zero velocity when
        // scroll events arrive >50ms apart, which is how a notched wheel scrolls.
        let navHidden = false;
        let lastY = window.scrollY;
        const show = () => {
            if (!navHidden) return;
            navHidden = false;
            M.animate(nav, { y: '0%' }, SPRING_SNAPPY);
        };
        M.scroll((_, info) => {
            const y = info.y.current;
            const delta = y - lastY;
            if (Math.abs(delta) < 8) return; // ignore jitter, let small moves accumulate
            lastY = y;
            if (y < 120 || delta < 0) {
                show();
            } else if (!navHidden && !nav.contains(document.activeElement)) {
                navHidden = true;
                M.animate(nav, { y: '-100%' }, { duration: 0.3, ease: EASE_IN_OUT });
            }
        });
        nav.addEventListener('focusin', show);
    }

    function setupButtons() {
        const magnets = $$('.btn, .nav-cta');

        // Buttons lean toward the cursor and spring back when it leaves.
        if (finePointer) {
            magnets.forEach((el) => {
                el.addEventListener('pointermove', (e) => {
                    const r = el.getBoundingClientRect();
                    M.animate(el, {
                        x: (e.clientX - r.left - r.width / 2) * 0.25,
                        y: (e.clientY - r.top - r.height / 2) * 0.4,
                    }, SPRING_MAGNET);
                });
                el.addEventListener('pointerleave', () => M.animate(el, { x: 0, y: 0 }, SPRING_SNAPPY));
            });
        }

        // Tactile press feedback.
        M.press([...magnets, fxToggle].filter(Boolean), (el) => {
            M.animate(el, { scale: 0.94 }, SPRING_SNAPPY);
            return () => M.animate(el, { scale: 1 }, SPRING_SNAPPY);
        });
    }

    /* ======================= Helpers ======================= */

    function setInitial(els, values) {
        const list = [].concat(els).filter(Boolean);
        if (!list.length) return;
        list.forEach((el) => el.setAttribute('data-reveal', ''));
        M.animate(list, values, { duration: 0 });
    }

    // A finished blur(0px) still forces a compositing layer; drop it.
    function clearFilter(el) {
        el.style.filter = '';
    }

    function srOnly(text) {
        const span = document.createElement('span');
        span.className = 'sr-only';
        span.textContent = text;
        return span;
    }

    // Screen readers get the real text once; the animated copy is hidden from them.
    function splitLabel(el) {
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        const visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        visual.textContent = text;
        el.replaceChildren(srOnly(text), visual);
        return { text, visual };
    }

    // Wraps each word in a mask so it can rise into view. Keeps <br> elements.
    function splitWords(el) {
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        const visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        const words = [];
        for (const node of [...el.childNodes]) {
            if (node.nodeType !== Node.TEXT_NODE) {
                visual.append(node.cloneNode(true));
                continue;
            }
            for (const part of node.textContent.split(/(\s+)/)) {
                if (!part) continue;
                if (!part.trim()) {
                    visual.append(' ');
                    continue;
                }
                const mask = document.createElement('span');
                mask.className = 'word';
                const inner = document.createElement('span');
                inner.textContent = part;
                mask.append(inner);
                visual.append(mask);
                words.push(inner);
            }
        }
        el.replaceChildren(srOnly(text), visual);
        return words;
    }

    function scramble(text, resolved) {
        let out = text.slice(0, resolved);
        for (let i = resolved; i < text.length; i++) {
            out += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        return out;
    }

    // Resolves scrambled glyphs into the real text, left to right.
    function decode(label) {
        let last = 0;
        M.animate(0, label.text.length, {
            duration: Math.min(1.4, 0.4 + label.text.length * 0.03),
            ease: 'linear',
            onUpdate: (v) => {
                const now = performance.now();
                if (now - last < 45) return; // ~22 glyph swaps per second reads as decoding, not flicker
                last = now;
                label.visual.textContent = scramble(label.text, Math.floor(v));
            },
        }).finished.then(() => { label.visual.textContent = label.text; });
    }

    function formatCount(value, { decimals, suffix }) {
        return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    }

    function countUp(counter) {
        M.animate(0, counter.target, {
            duration: 1.8,
            delay: 0.15,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => { counter.label.visual.textContent = formatCount(v, counter); },
        });
    }

    /* ======================= Always-on (no Motion needed) ======================= */

    // Cursor-follow glow on cards; the CSS reads --mx / --my.
    function setupSpotlight() {
        if (!finePointer) return;
        const selector = '.card, .stat, .publication-item, .cert-link';
        document.addEventListener('pointermove', (e) => {
            const el = e.target.closest?.(selector);
            if (!el) return;
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', `${e.clientX - r.left}px`);
            el.style.setProperty('--my', `${e.clientY - r.top}px`);
        }, { passive: true });
    }

    // --- Matrix Rain Background ---
    function startMatrixRain() {
        const canvas = $('#matrix-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Clean binary and hex characters for a subtle, attractive AI theme
        const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/-=*';
        const fontSize = 14;
        let columns = Math.ceil(canvas.width / fontSize);
        const drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        function drawMatrix() {
            // Paused by the visitor, or nobody is looking at the tab.
            if (!fxOn || document.hidden) return;

            // Smooth soft fade for a gentler rain effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = fontSize + 'px "Fira Code", monospace';
            // A soft, consistent translucent green for subtle elegance
            ctx.fillStyle = 'rgba(57, 255, 20, 0.5)';

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.985) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        setInterval(drawMatrix, 45);

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            columns = Math.ceil(canvas.width / fontSize);
            for (let x = drops.length; x < columns; x++) {
                drops[x] = 1;
            }
        });
    }
})();
