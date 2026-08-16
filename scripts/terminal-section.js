(function () {
    const COLOR_CLASSES = ['c-green', 'c-cyan', 'c-blue', 'c-purple', 'c-pink', 'c-yellow', 'c-orange'];

    const CODE_SNIPPETS = [
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

    const BINARY_HEADERS = [
        '[0x7F 0x45 0x4C 0x46]',
        '[heap::alloc 0x14A0]',
        '[sys_call:OK]',
        '[mem::0x3FA2 -> stack]',
        '[proc:0x1A7F ready]',
        '[core::mount success]'
    ];

    const SHORT_DELAY = 3;
    const LONG_DELAY = 5;

    function pickFrom(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    function generateCodeLine() {
        return Math.random() < 0.16 ? pickFrom(BINARY_HEADERS) : pickFrom(CODE_SNIPPETS);
    }

    function initTerminalLines(terminalContent) {
        const linesCount = window.matchMedia('(max-width: 767px)').matches ? 11 : 14;
        const lines = [];
        const cursor = document.createElement('span');
        const fragment = document.createDocumentFragment();

        cursor.className = 'terminal-cursor';

        for (let i = 0; i < linesCount; i++) {
            const line = document.createElement('span');
            line.className = 'terminal-line ' + pickFrom(COLOR_CLASSES);
            line.textContent = generateCodeLine();
            fragment.appendChild(line);
            lines.push(line);
        }

        lines[lines.length - 1].classList.add('highlight');
        lines[lines.length - 1].appendChild(cursor);
        terminalContent.replaceChildren(fragment);

        return function typeNewLine() {
            for (let i = 0; i < linesCount - 1; i++) {
                lines[i].textContent = lines[i + 1].textContent;
                lines[i].className = lines[i + 1].className.replace(' highlight', '');
            }

            const lastLine = lines[linesCount - 1];
            lastLine.textContent = generateCodeLine();
            lastLine.className = 'terminal-line ' + pickFrom(COLOR_CLASSES) + ' highlight';
            lastLine.appendChild(cursor);
        };
    }

    function isElementInView(el) {
        var rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.18;
    }

    function init() {
        var section = document.querySelector('#terminal-section');
        if (!section) return;

        var wrappers = document.querySelectorAll('.terminal-carousel .terminal-wrapper');
        var dots = document.querySelectorAll('.terminal-carousel-dots span');
        if (wrappers.length < 3) return;

        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var activeIndex = 0;
        var t1Returned = false;
        var cycleTimer = null;
        var typeFunctions = [];
        var typingIntervals = [];

        wrappers.forEach(function (wrapper, i) {
            var content = wrapper.querySelector('.terminal-scroll-content');
            typeFunctions.push(initTerminalLines(content));
            typingIntervals.push(null);
        });

        function setActive(index) {
            wrappers.forEach(function (w, i) {
                w.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (d, i) {
                d.classList.toggle('is-active', i === index);
            });
        }

        function getDelay() {
            if (activeIndex === 0 && t1Returned) return LONG_DELAY;
            return SHORT_DELAY;
        }

        function startTyping(index) {
            if (typingIntervals[index]) return;
            if (reduceMotion) return;
            typingIntervals[index] = window.setInterval(typeFunctions[index], 950);
        }

        function stopTyping(index) {
            if (typingIntervals[index]) {
                window.clearInterval(typingIntervals[index]);
                typingIntervals[index] = null;
            }
        }

        function switchTo(index) {
            if (index === activeIndex) return;
            stopTyping(activeIndex);
            var currentEl = wrappers[activeIndex];
            var nextEl = wrappers[index];
            if (window.gsap) {
                gsap.timeline({
                    onComplete: function () {
                        currentEl.classList.remove('is-active');
                        nextEl.classList.add('is-active');
                        gsap.set([currentEl, nextEl], { clearProps: 'opacity' });
                        activeIndex = index;
                        setActive(index);
                        startTyping(index);
                    }
                })
                .to(currentEl, { opacity: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }, 0)
                .to(nextEl, { opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }, 0.08);
            } else {
                currentEl.classList.remove('is-active');
                nextEl.classList.add('is-active');
                activeIndex = index;
                setActive(index);
                startTyping(index);
            }
        }

        function nextWrapper() {
            if (activeIndex === 0) t1Returned = true;
            var next = (activeIndex + 1) % wrappers.length;
            switchTo(next);
            scheduleNext();
        }

        function scheduleNext() {
            if (cycleTimer) clearTimeout(cycleTimer);
            cycleTimer = setTimeout(nextWrapper, getDelay() * 1000);
        }

        function startCycle() {
            if (cycleTimer) return;
            if (!isElementInView(section)) return;
            startTyping(activeIndex);
            scheduleNext();
        }

        function stopCycle() {
            if (cycleTimer) {
                clearTimeout(cycleTimer);
                cycleTimer = null;
            }
            typingIntervals.forEach(function (_, i) { stopTyping(i); });
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                if (i === activeIndex) return;
                switchTo(i);
                if (i === 0) t1Returned = true;
                if (cycleTimer) {
                    clearTimeout(cycleTimer);
                    cycleTimer = null;
                    scheduleNext();
                }
            });
        });

        setActive(0);

        function onScroll() {
            if (isElementInView(section)) {
                if (!cycleTimer) startCycle();
            } else {
                stopCycle();
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });

        if (isElementInView(section) && !reduceMotion) {
            startCycle();
        }

        if (window.gsap && window.ScrollTrigger && !reduceMotion) {
            gsap.from('.terminal-carousel', {
                y: 40,
                opacity: 0,
                duration: 0.9,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 82%',
                    once: true
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
