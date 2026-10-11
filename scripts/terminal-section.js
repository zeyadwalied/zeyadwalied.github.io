(function () {
    'use strict';

    var COLOR_CLASSES = ['c-green', 'c-cyan', 'c-blue', 'c-purple', 'c-pink', 'c-yellow', 'c-orange'];

    var CODE_SNIPPETS = [
        "const app = express().use(cors()).use(json());",
        "async function fetchUser(id) { return await db.query(id); }",
        "export default function Component({ data }) { return <View />; }",
        "if (user.role === 'admin') return next(); else throw new Error('403');",
        "await Promise.all(tasks.map(t => processTask(t).catch(logger.error)));",
        "router.post('/api/checkout', authMiddleware, controller.checkout);",
        "const cache = new Map(); cache.set(key, { value, expires: Date.now() + TTL });",
        "git commit -m 'feat(core): ship zero-downtime migration path';",
        "SELECT id, name, created_at FROM users WHERE active = 1 LIMIT 50;",
        "add_action('woocommerce_before_checkout_form', 'zw_render_upsell', 20);",
        "try { const data = JSON.parse(raw); } catch (e) { sentry.capture(e); }",
        "class Queue { enqueue(job) { this.#heap.push(job); this.#sift(); } }",
        "CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);",
        "curl -sSL https://api.zeyad.dev/v1/health | jq '.status'",
        "self.addEventListener('fetch', (e) => e.respondWith(caches.match(e.request)));"
    ];

    var BINARY_HEADERS = [
        '[0x7F 0x45 0x4C 0x46]',
        '[heap::alloc 0x14A0]',
        '[sys_call:OK]',
        '[mem::0x3FA2 -> stack]',
        '[proc:0x1A7F ready]',
        '[core::mount success]'
    ];

    /* ── Timing ──────────────────────────────────────────── */
    var SHORT_DELAY     = 4800;  // ms a slide stays before advancing
    var LONG_DELAY      = 6500;  // ms on the first slide after it returns
    var CHAR_DELAY_IDLE = 42;    // ms per typed character normally
    var CHAR_DELAY_FAST = 14;    // ms per typed character while scrolling
    var LINE_PAUSE      = 420;   // ms pause after a finished line
    var SLIDE_MS        = 700;   // must match the CSS transition duration

    function pickFrom(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    function generateCodeLine() {
        return Math.random() < 0.16 ? pickFrom(BINARY_HEADERS) : pickFrom(CODE_SNIPPETS);
    }

    /* ── Per-terminal typewriter ─────────────────────────────
       Types one character at a time into the active (highlight)
       line. When a line finishes it is locked in and a fresh
       line begins; once the terminal is full, the oldest line
       scrolls out so new text keeps flowing in from the bottom.  */
    function createTypewriter(contentEl, linesCount, speedFn) {
        var cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';

        var lines    = [];     // all line <span>s currently in the DOM
        var active   = null;   // line being typed right now
        var textNode = null;   // text node inside the active line
        var target   = '';     // full text the active line is typing toward
        var idx      = 0;      // how many characters have been typed
        var timer    = null;
        var running  = false;

        function trim() {
            while (lines.length > linesCount) {
                var old = lines.shift();
                if (old && old.parentNode) old.parentNode.removeChild(old);
            }
        }

        function addCompletedLine(text) {
            var el = document.createElement('span');
            el.className = 'terminal-line ' + pickFrom(COLOR_CLASSES);
            el.textContent = text;
            contentEl.appendChild(el);
            lines.push(el);
            trim();
        }

        function beginLine() {
            active = document.createElement('span');
            active.className = 'terminal-line ' + pickFrom(COLOR_CLASSES) + ' highlight';
            textNode = document.createTextNode('');
            active.appendChild(textNode);
            active.appendChild(cursor);
            contentEl.appendChild(active);
            lines.push(active);
            trim();
            target = generateCodeLine();
            idx = 0;
        }

        function endLine() {
            if (!active) return;
            active.classList.remove('highlight');
            if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
            active = null;
            textNode = null;
        }

        function step() {
            if (!running) return;
            if (!active) beginLine();

            if (idx < target.length) {
                // small natural bursts: type 1-2 chars per tick
                var burst = Math.random() < 0.22 ? 2 : 1;
                idx = Math.min(target.length, idx + burst);
                textNode.nodeValue = target.slice(0, idx);
                timer = window.setTimeout(step, speedFn());
            } else {
                endLine();
                timer = window.setTimeout(step, LINE_PAUSE);
            }
        }

        return {
            prefill: function (count) {
                var seed = (count != null) ? count : Math.max(0, linesCount - 4);
                for (var i = 0; i < seed; i++) {
                    addCompletedLine(generateCodeLine());
                }
            },
            start: function () {
                if (running) return;
                running = true;
                step();
            },
            stop: function () {
                running = false;
                if (timer) { window.clearTimeout(timer); timer = null; }
            }
        };
    }

    function init() {
        var section = document.querySelector('#terminal-section');
        if (!section) return;

        var wrappers = document.querySelectorAll('.terminal-carousel .terminal-wrapper');
        var dots     = document.querySelectorAll('.terminal-carousel-dots span');
        if (wrappers.length < 2) return;

        var linesCount = window.matchMedia('(max-width: 767px)').matches ? 10 : 13;

        var activeIndex     = 0;
        var t1Returned      = false;
        var cycleTimer      = null;
        var isScrolling     = false;
        var scrollStopTimer = null;
        var isAnimating     = false;
        var isVisible       = true;

        function speedFn() {
            return isScrolling ? CHAR_DELAY_FAST : CHAR_DELAY_IDLE;
        }

        var typers = [];
        wrappers.forEach(function (wrapper) {
            var content = wrapper.querySelector('.terminal-scroll-content');
            content.textContent = '';
            var tw = createTypewriter(content, linesCount, speedFn);
            tw.prefill();
            typers.push(tw);
        });

        function setActiveDots(index) {
            dots.forEach(function (d, i) {
                d.classList.toggle('is-active', i === index);
            });
        }

        /* ── Slide transition: current exits left, next enters right and stops ── */
        function switchTo(index) {
            if (index === activeIndex || isAnimating) return;
            isAnimating = true;
            typers[activeIndex].stop();

            var currentEl = wrappers[activeIndex];
            var nextEl    = wrappers[index];

            // Park the next slide off-screen on the right, no transition.
            nextEl.classList.remove('is-active', 'is-exiting-left');
            nextEl.classList.add('is-entering-right');

            // Force reflow so the browser registers the right-side start.
            void nextEl.offsetWidth;

            // Animate: current slides out left, next slides in and settles.
            currentEl.classList.remove('is-active');
            currentEl.classList.add('is-exiting-left');
            nextEl.classList.remove('is-entering-right');
            nextEl.classList.add('is-active');

            activeIndex = index;
            setActiveDots(index);
            if (isVisible) typers[index].start();

            window.setTimeout(function () {
                currentEl.classList.remove('is-exiting-left');
                isAnimating = false;
            }, SLIDE_MS);
        }

        function getDelay() {
            if (activeIndex === 0 && t1Returned) return LONG_DELAY;
            return SHORT_DELAY;
        }

        function nextWrapper() {
            if (activeIndex === 0) t1Returned = true;
            switchTo((activeIndex + 1) % wrappers.length);
            scheduleNext();
        }

        function scheduleNext() {
            if (cycleTimer) clearTimeout(cycleTimer);
            cycleTimer = window.setTimeout(nextWrapper, getDelay());
        }

        function play() {
            typers[activeIndex].start();
            if (!cycleTimer) scheduleNext();
        }

        function pause() {
            if (cycleTimer) {
                clearTimeout(cycleTimer);
                cycleTimer = null;
            }
            typers[activeIndex].stop();
        }

        /* ── Dot navigation ─────────────────────────────────── */
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                if (i === activeIndex) return;
                switchTo(i);
                if (i === 0) t1Returned = true;
                scheduleNext();
            });
        });

        /* ── Initial state ──────────────────────────────────── */
        wrappers.forEach(function (w, i) {
            w.classList.toggle('is-active', i === 0);
        });
        setActiveDots(0);

        // Start right away; the observer below only pauses when off-screen.
        play();

        /* ── Pause / resume based on visibility. IntersectionObserver is
             reliable even with Lenis smooth-scroll hijacking the native
             scroll event. NOTE: typing/sliding runs regardless of the
             prefers-reduced-motion setting because this terminal is an
             explicit, requested showcase animation. ───────────────── */
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                var entry = entries[entries.length - 1];
                isVisible = entry.isIntersecting;
                if (isVisible) {
                    play();
                } else {
                    pause();
                }
            }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
            io.observe(section);
        }

        /* ── Scroll only tunes typing speed (faster while scrolling). ── */
        window.addEventListener('scroll', function () {
            isScrolling = true;
            clearTimeout(scrollStopTimer);
            scrollStopTimer = window.setTimeout(function () {
                isScrolling = false;
            }, 200);
        }, { passive: true });

        /* ── GSAP scroll-scrubbed zoom-in: the terminal enters small and
             grows to its full size as you scroll it into view. Runs after
             window load so Lenis + ScrollTrigger (wired in main.js) are
             ready. ─────────────────────────────────────────────────── */
        function setupReveal() {
            if (!(window.gsap && window.ScrollTrigger)) return;
            try {
                gsap.registerPlugin(window.ScrollTrigger);
            } catch (e) { /* already registered */ }

            var carousel = section.querySelector('.terminal-carousel');
            if (!carousel) return;

            gsap.fromTo(carousel,
                { scale: 0.7, opacity: 0, y: 60, transformOrigin: '50% 50%' },
                {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 92%',
                        end: 'top 38%',
                        scrub: 0.6
                    }
                }
            );
            window.ScrollTrigger.refresh();
        }

        if (document.readyState === 'complete') {
            setupReveal();
        } else {
            window.addEventListener('load', setupReveal, { once: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
