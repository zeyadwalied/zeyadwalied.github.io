document.addEventListener('DOMContentLoaded', () => {
    // ===== Initialize Lenis Smooth Scrolling =====
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (typeof Lenis !== 'undefined') {
        window.lenis = new Lenis({
            duration: isMobile ? 1.2 : 2.4, // Faster on mobile for better performance
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -12 * t)),
            direction: 'vertical',
            smoothWheel: true,
            wheelMultiplier: isMobile ? 1.0 : 0.85, // Less smoothing on mobile
            touchMultiplier: isMobile ? 1.2 : 1.6, // Less aggressive touch scroll
            lerp: isMobile ? 0.15 : 0.08, // Higher lerp = less smooth but better performance
            infinite: false
        });

        if (typeof gsap !== 'undefined') {
            window.lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => {
                window.lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        } else {
            function raf(time) {
                window.lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }
    }

    // ===== GSAP Sophisticated Modern Animations =====
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        const isMobileMotionViewport = window.matchMedia('(max-width: 767px)').matches;

        // Recalculate ScrollTrigger positions once layout/fonts are stable.
        // Fixes mobile flicker where cards animate against a stale viewport size.
        const refreshTriggers = () => ScrollTrigger.refresh();
        window.addEventListener('load', refreshTriggers);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(refreshTriggers).catch(() => {});
        }
        let resizeRaf;
        window.addEventListener('resize', () => {
            cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(refreshTriggers);
        });

        // 0. Hero Content Wrapper Entrance (no wave floating)
        const heroWrapper = document.querySelector('.hero-content-wrapper');
        if (heroWrapper) {
            gsap.fromTo(heroWrapper, 
                { scale: 0.95, opacity: 0 }, 
                { scale: 1, opacity: 1, duration: 1.2, ease: "expo.out" }
            );
        }

        // 1. Master Hero Timeline — only on pages that have hero elements
        if (document.querySelector('.hero-kicker')) {
            const heroTl = gsap.timeline({ delay: 0.2 });

            // Immediately hide elements to prevent CSS flash
            gsap.set(".hero-kicker, .hero-role, .hero-actions, .hero-side, .hero-socials", { opacity: 0, y: 20 });
            gsap.set(".hero-actions a", { opacity: 0, y: 10, scale: 0.9 });
            gsap.set(".hero-socials a", { opacity: 0, y: 8 });

            // Kicker text
            heroTl.to(".hero-kicker", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });

            // Scanner reveal for the name
            const heroName = document.querySelector('.hero-name-text');
            const scannerLine = document.querySelector('.scanner-line');
            if (heroName && scannerLine) {
                const nameWidth = heroName.getBoundingClientRect().width;
                heroTl.set(heroName, { opacity: 1, clipPath: "inset(0 100% 0 0)" })
                      .fromTo(scannerLine, { opacity: 0, left: 0 }, { opacity: 1, duration: 0.1 })
                      .to(scannerLine, { left: nameWidth, duration: 0.9, ease: "power4.inOut" })
                      .to(heroName, { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power4.inOut" }, "<")
                      .to(scannerLine, { opacity: 0, duration: 0.2 });
            }

            // Role text
            heroTl.to(".hero-role", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.3");

            // Buttons — staggered with a bounce
            heroTl.to(".hero-actions", { opacity: 1, y: 0, duration: 0.3 }, "-=0.2")
                  .to(".hero-actions a", {
                      opacity: 1, y: 0, scale: 1,
                      stagger: 0.08, duration: 0.5, ease: "back.out(1.7)"
                  }, "-=0.2");

            // Side panel (detail card)
            heroTl.to(".hero-side", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.5");

            // Socials — staggered pop-in
            heroTl.to(".hero-socials", { opacity: 1, y: 0, duration: 0.3 }, "-=0.3")
                  .to(".hero-socials a", {
                      opacity: 1, y: 0,
                      stagger: 0.06, duration: 0.4, ease: "back.out(1.4)"
                  }, "-=0.15");
        } // end hero guard

        // GSAP Magnetic Button Hover
        document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
            });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
            });
        });

        // 2. About Me Section - Deep Reveal & Parallax
        const aboutSection = document.querySelector('.about-me-gsap');
        if (aboutSection) {
            const imgWrapper = aboutSection.querySelector('.rounded-full');
            const shape = aboutSection.querySelector('.cyber-shape-pos');
            const aboutText = aboutSection.querySelector('p');
            
            // Continuous floating animation for the image
            if (imgWrapper) {
                gsap.to(imgWrapper, {
                    y: -15,
                    duration: 2.5,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1
                });
            }

            // Staggered text replacement (manual word split)
            if (aboutText) {
                const text = aboutText.textContent;
                const words = text.split(' ').filter(w => w.trim() !== '').map(word => `<span class="inline-block translate-y-4 opacity-0 filter blur-sm">${word}</span>`).join(' ');
                aboutText.innerHTML = words;
            }

            let tl = gsap.timeline({
                scrollTrigger: {
                    trigger: aboutSection,
                    start: "top 80%",
                }
            });

            tl.fromTo(aboutSection, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" })
              .fromTo(shape, { rotation: -180, scale: 0, opacity: 0 }, { rotation: 0, scale: 1, opacity: 0.4, duration: 1.5, ease: "elastic.out(1, 0.5)" }, "-=0.8");
              
            if (aboutText) {
                const spans = aboutText.querySelectorAll('span');
                tl.fromTo(spans, 
                    { y: 20, opacity: 0, filter: "blur(4px)" },
                    { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, stagger: 0.015, ease: "power2.out" }, 
                    "-=1"
                );
            }
        }

        // 3. Tech Chips - Floating Reveal
        const techSection = document.querySelector('.tech-wave-gsap');
        if (techSection) {
            // Animate the SVG wave line drawing
            const wavePath = techSection.querySelector('.featured-tech-wave path');
            if (wavePath) {
                const pathLength = wavePath.getTotalLength();
                gsap.set(wavePath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
                gsap.to(wavePath, {
                    strokeDashoffset: 0,
                    duration: 2,
                    ease: "power2.inOut",
                    scrollTrigger: { trigger: techSection, start: "top 80%" }
                });
            }

            gsap.fromTo(".featured-tech-chip", 
                { y: 30, opacity: 0, filter: "blur(5px)" },
                { 
                    y: 0, 
                    opacity: 1, 
                    filter: "blur(0px)",
                    duration: 0.8, 
                    stagger: 0.08, 
                    ease: "power2.out",
                    scrollTrigger: { trigger: techSection, start: "top 85%" }
                }
            );
        }

        // Section Title Wipe Reveals
        gsap.utils.toArray('.scroll-reveal h1, .scroll-reveal h2, #featured-projects h2').forEach(title => {
            gsap.fromTo(title,
                { clipPath: "inset(0 100% 0 0)", opacity: 0 },
                { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: 0.8, ease: "power3.out",
                    scrollTrigger: { trigger: title, start: "top 85%" }
                }
            );
        });

        // 6. Generic Scroll Reveals (Containers etc)
        gsap.utils.toArray('.scroll-reveal:not(h1):not(h2)').forEach(el => {
            gsap.fromTo(el, 
                { opacity: 0, y: 30 },
                { 
                    opacity: 1, y: 0, duration: 1, ease: "power3.out",
                    scrollTrigger: { trigger: el, start: "top 90%" }
                }
            );
        });

        // 7. Generic Data-Speed Parallax (Lenis Style)
        gsap.utils.toArray('[data-speed]').forEach(el => {
            const speed = parseFloat(el.getAttribute('data-speed'));
            if (speed) {
                gsap.to(el, {
                    y: () => -(window.innerHeight * speed),
                    ease: "none",
                    scrollTrigger: {
                        trigger: el,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                });
            }
        });

        // 4. Projects — Clip-path Curtain Reveal + Image Zoom
        const projectCards = gsap.utils.toArray('.project-card');
        projectCards.forEach((card) => {
            const img = card.querySelector('img');
            const content = card.querySelector('.p-6');
            
            let tl = gsap.timeline({
                scrollTrigger: {
                    trigger: card,
                    start: "top 85%",
                }
            });

            tl.fromTo(card, 
                { clipPath: "inset(100% 0 0 0)", opacity: 0 },
                { clipPath: "inset(0% 0 0 0)", opacity: 1, duration: 1, ease: "power4.out" }
            );

            if (img) {
                // Initial Entrance
                tl.fromTo(img,
                    { scale: 1.4, filter: "blur(5px)" },
                    { scale: 1.05, filter: "blur(0px)", duration: 1.2, ease: "power3.out" }, "-=0.8"
                );
                
                // Parallax Effect
                gsap.to(img, {
                    yPercent: 15,
                    ease: "none",
                    scrollTrigger: {
                        trigger: card,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                });
            }

            if (content) {
                tl.fromTo(content.children, 
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }, "-=0.8"
                );
            }
        });
        
        // 5. CTA Section Premium Reveal
        const ctaSection = document.querySelector('#cta');
        if (ctaSection) {
            const ctaContent = ctaSection.querySelector('.text-center');
            gsap.fromTo(ctaContent.children, 
                { y: 60, opacity: 0, scale: 0.95, filter: "blur(8px)" },
                { 
                    y: 0, 
                    opacity: 1, 
                    scale: 1,
                    filter: "blur(0px)",
                    duration: 1, 
                    stagger: 0.08, 
                    ease: "expo.out",
                    scrollTrigger: {
                        trigger: ctaSection,
                        start: "top 80%",
                    }
                }
            );
        }

        // 6. Skill cards — Wave-style staggered reveal with sine timing
        const skillsSection = document.querySelector('#skills-overview');
        if (skillsSection && !isMobileMotionViewport) {
            gsap.fromTo(".icon-skill-card",
                { y: 40, opacity: 0, scale: 0.9, filter: "blur(10px)" },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                    duration: 1.1,
                    stagger: {
                        each: 0.07,
                        grid: "auto",
                        from: "start",
                        ease: "sine.inOut"
                    },
                    ease: "expo.out",
                    scrollTrigger: {
                        trigger: ".skills-icon-grid",
                        start: "top 88%",
                        once: true
                    }
                }
            );
        } else if (skillsSection) {
            gsap.set(".icon-skill-card", { clearProps: "all", opacity: 1, y: 0, scale: 1, filter: "none" });
        }

        // 6.1 Services preview cards - stronger staggered reveal
        const servicesPreviewSection = document.querySelector('#services-preview');
        if (servicesPreviewSection) {
            const servicesHead = servicesPreviewSection.querySelector('.services-preview-head');
            const serviceCards = servicesPreviewSection.querySelectorAll('.service-preview-card');
            const servicesActions = servicesPreviewSection.querySelector('.services-preview-actions');

            if (servicesHead) {
                gsap.fromTo(servicesHead.children,
                    { y: 34, opacity: 0, filter: "blur(8px)" },
                    {
                        y: 0,
                        opacity: 1,
                        filter: "blur(0px)",
                        duration: 0.9,
                        stagger: 0.12,
                        ease: "expo.out",
                        scrollTrigger: {
                            trigger: servicesPreviewSection,
                            start: "top 82%"
                        }
                    }
                );
            }

            if (serviceCards.length) {
                // Modern cascade reveal with clip-path and gentle float up
                gsap.fromTo(serviceCards,
                    { 
                        y: 80, 
                        opacity: 0,
                        clipPath: "inset(0 0 100% 0)" 
                    },
                    {
                        y: 0,
                        opacity: 1,
                        clipPath: "inset(0 0 0% 0)",
                        duration: 1.1,
                        stagger: {
                            each: 0.12,
                            from: "start",
                            ease: "power2.inOut"
                        },
                        ease: "power4.out",
                        force3D: true,
                        scrollTrigger: {
                            trigger: servicesPreviewSection.querySelector('.services-preview-grid'),
                            start: "top 85%",
                            once: true
                        }
                    }
                );
            }

            if (servicesActions) {
                gsap.fromTo(servicesActions.children,
                    { y: 24, opacity: 0, scale: 0.92 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.75,
                        stagger: 0.08,
                        ease: "back.out(1.5)",
                        scrollTrigger: {
                            trigger: servicesActions,
                            start: "top 88%"
                        }
                    }
                );
            }
        }

        // 7. Generic Inner Page Reveals (Left/Right/Cards)
        gsap.utils.toArray('.reveal-left').forEach(el => {
            gsap.fromTo(el, 
                { x: -50, opacity: 0 }, 
                { x: 0, opacity: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }
            );
        });

        gsap.utils.toArray('.reveal-right').forEach(el => {
            gsap.fromTo(el, 
                { x: 50, opacity: 0 }, 
                { x: 0, opacity: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }
            );
        });

        // 8. Subpage Heroes / Headers (Above fold animations)
        const subHeroes = gsap.utils.toArray('.about-page-hero, .contact-page-hero, .services-page-hero');
        subHeroes.forEach(hero => {
            gsap.fromTo(hero, 
                { y: 40, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 1.2, ease: "expo.out" }
            );
            
            // Stagger children inside the hero
            const children = hero.querySelectorAll('.about-page-kicker, .about-page-lead, .about-page-badge, .about-page-card img, .about-page-stat, .contact-page-kicker, .contact-page-title, .contact-page-lead, .contact-page-badge, .services-page-kicker, .services-page-lead, .services-hero-actions a, .services-hero-card');
            if (children.length) {
                gsap.fromTo(children,
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power2.out", delay: 0.3 }
                );
            }
        });

        // 8.1 Modern Character Reveal for About & Contact Titles
        const titlesToReveal = document.querySelectorAll('.about-page-title, .contact-page-title, .services-page-title');
        titlesToReveal.forEach(title => {
            const text = title.textContent;
            title.innerHTML = text.split(' ').map(word => 
                `<span style="display:inline-block; overflow:hidden; vertical-align:bottom;">
                    <span style="display:inline-block;">${word}&nbsp;</span>
                </span>`
            ).join('');
            
            const spans = title.querySelectorAll('span > span');
            gsap.fromTo(spans,
                { y: "100%", opacity: 0 },
                { y: "0%", opacity: 1, duration: 1, stagger: 0.1, ease: "power4.out", delay: 0.5 }
            );
        });

        // 9. Kinetic Pin Scene (full pinned variant only)
        const kineticPin = document.querySelector('.kinetic-pin-scene:not(.kinetic-pin-compact)');
        if (kineticPin && !isMobileMotionViewport) {
            const eyebrow = kineticPin.querySelector('.kinetic-pin-eyebrow');
            const lines = kineticPin.querySelectorAll('.kinetic-pin-line');
            const sub = kineticPin.querySelector('.kinetic-pin-sub');
            const meta = kineticPin.querySelector('.kinetic-pin-meta');
            const tags = kineticPin.querySelectorAll('.kinetic-pin-tag');
            const glows = kineticPin.querySelectorAll('.kinetic-pin-glow');

            gsap.set(eyebrow, { opacity: 0, y: 24 });
            gsap.set(lines, { opacity: 0, yPercent: 110 });
            gsap.set(sub, { opacity: 0, y: 26 });
            gsap.set(meta, { opacity: 0, y: 30, scale: 0.94 });
            gsap.set(tags, { opacity: 0, scale: 0.85, y: 30 });

            const enterTl = gsap.timeline({
                scrollTrigger: {
                    trigger: kineticPin,
                    start: 'top 70%',
                    end: 'top 10%',
                    scrub: 1
                }
            });

            enterTl
                .to(eyebrow, { opacity: 1, y: 0, ease: 'power2.out' }, 0)
                .to(lines, { opacity: 1, yPercent: 0, ease: 'power3.out', stagger: 0.12 }, 0.05)
                .to(sub, { opacity: 1, y: 0, ease: 'power2.out' }, 0.4)
                .to(meta, { opacity: 1, y: 0, scale: 1, ease: 'power2.out' }, 0.5)
                .to(tags, { opacity: 1, scale: 1, y: 0, ease: 'power2.out', stagger: 0.08 }, 0.35);

            // Parallax glows + tag drift across the section
            gsap.timeline({
                scrollTrigger: {
                    trigger: kineticPin,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.2
                }
            })
                .to('.kinetic-pin-glow-a', { x: 80, y: 60, scale: 1.15, ease: 'none' }, 0)
                .to('.kinetic-pin-glow-b', { x: -90, y: -50, scale: 1.2, ease: 'none' }, 0)
                .to('.kinetic-pin-tag-a', { y: -60, x: -20, ease: 'none' }, 0)
                .to('.kinetic-pin-tag-b', { y: -40, x: 30, ease: 'none' }, 0)
                .to('.kinetic-pin-tag-c', { y: 60, x: -30, ease: 'none' }, 0)
                .to('.kinetic-pin-tag-d', { y: 50, x: 40, ease: 'none' }, 0);
        } else if (kineticPin) {
            gsap.set('.kinetic-pin-eyebrow, .kinetic-pin-line, .kinetic-pin-sub, .kinetic-pin-meta, .kinetic-pin-tag, .kinetic-pin-glow', { clearProps: 'all' });
        }

        // 10. Always-on Velocity Marquee (fast continuous movement + scroll speed boost + color shift)
        const motionMarquee = document.querySelector('.motion-marquee-track');
        const marqueeHost = document.querySelector('.hero-marquee-band, .motion-marquee-section');
        const marqueeItems = document.querySelectorAll('.hero-marquee-item');
        if (motionMarquee) {
            if (!isMobileMotionViewport) {
                // Desktop: full velocity marquee with scroll boost
                const marqueeTween = gsap.to(motionMarquee, {
                    xPercent: -50,
                    repeat: -1,
                    duration: 14,
                    ease: 'none'
                });
                marqueeTween.timeScale(1);

                if (marqueeHost) {
                    let resetCall = null;
                    ScrollTrigger.create({
                        trigger: marqueeHost,
                        start: 'top bottom',
                        end: 'bottom top',
                        onUpdate: (self) => {
                            const velocity = Math.abs(self.getVelocity());
                            const boost = Math.min(1 + velocity / 400, 5); // aggressive speed boost
                            gsap.to(marqueeTween, {
                                timeScale: boost,
                                duration: 0.4,
                                ease: 'power2.out',
                                overwrite: 'auto'
                            });
                            // Color shift to accent green during fast scroll
                            if (marqueeItems.length && velocity > 200) {
                                gsap.to(marqueeItems, {
                                    backgroundImage: 'linear-gradient(180deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
                                    duration: 0.3,
                                    overwrite: 'auto'
                                });
                            }
                            if (resetCall) resetCall.kill();
                            resetCall = gsap.delayedCall(0.4, () => {
                                gsap.to(marqueeTween, {
                                    timeScale: 1,
                                    duration: 1.2,
                                    ease: 'power2.out',
                                    overwrite: 'auto'
                                });
                                // Reset color after scroll stops
                                if (marqueeItems.length) {
                                    gsap.to(marqueeItems, {
                                        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #d6f5e8 70%, rgba(16, 185, 129, 0.6) 100%)',
                                        duration: 0.8,
                                        ease: 'power2.out',
                                        overwrite: 'auto'
                                    });
                                }
                            });
                        }
                    });
                }
            } else {
                // Mobile: simple continuous marquee (slower, no scroll boost)
                gsap.to(motionMarquee, {
                    xPercent: -50,
                    repeat: -1,
                    duration: 25,
                    ease: 'none'
                });
            }
        }

        // 10a. Stacked Process Cards (sticky stack with scale)
        const stackCards = gsap.utils.toArray('.stack-card');
        if (stackCards.length && !isMobileMotionViewport) {
            stackCards.forEach((card, i) => {
                if (i === stackCards.length - 1) return;
                const inner = card.querySelector('.stack-card-inner');
                if (!inner) return;
                gsap.to(inner, {
                    scale: 1 - (stackCards.length - 1 - i) * 0.04,
                    y: -(stackCards.length - 1 - i) * 12,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 18vh',
                        endTrigger: stackCards[stackCards.length - 1],
                        end: 'top 18vh',
                        scrub: 1
                    }
                });
            });
        }

        // 10b. Kinetic compact: bold scroll-driven entry & exit
        const kineticCompact = document.querySelector('.kinetic-pin-compact');
        if (kineticCompact) {
            if (!isMobileMotionViewport) {
                // Desktop: full dramatic scroll-driven animations
                const eyebrowEl = kineticCompact.querySelector('.kinetic-pin-eyebrow');
                const lineEls = kineticCompact.querySelectorAll('.kinetic-pin-line');
                const subEl = kineticCompact.querySelector('.kinetic-pin-sub');
                const metaEl = kineticCompact.querySelector('.kinetic-pin-meta');
                const tagA = kineticCompact.querySelector('.kinetic-pin-tag-a');
                const tagB = kineticCompact.querySelector('.kinetic-pin-tag-b');
                const tagC = kineticCompact.querySelector('.kinetic-pin-tag-c');
                const tagD = kineticCompact.querySelector('.kinetic-pin-tag-d');

                // Initial off-screen state with smaller scale for words - more dramatic
                gsap.set(eyebrowEl, { opacity: 0, y: 60 });
                gsap.set(subEl, { opacity: 0, y: 80 });
                gsap.set(metaEl, { opacity: 0, y: 100, scale: 0.7 });
                gsap.set(lineEls[0], { opacity: 0, x: '-60vw', scale: 0.2 });
                gsap.set(lineEls[1], { opacity: 0, x: '60vw', scale: 0.15 });
                gsap.set(lineEls[2], { opacity: 0, x: '-60vw', scale: 0.2 });
                gsap.set(tagA, { opacity: 0, x: -300, y: -150, rotate: -20, scale: 0.6 });
                gsap.set(tagB, { opacity: 0, x: 300, y: -150, rotate: 20, scale: 0.6 });
                gsap.set(tagC, { opacity: 0, x: -300, y: 180, rotate: 18, scale: 0.6 });
                gsap.set(tagD, { opacity: 0, x: 300, y: 180, rotate: -18, scale: 0.6 });

                // Entry timeline - dramatic scale-up animations for each word
                gsap.timeline({
                    scrollTrigger: {
                        trigger: kineticCompact,
                        start: 'top 95%',
                        end: 'top 15%',
                        scrub: 1
                    }
                })
                    .to(eyebrowEl, { opacity: 1, y: 0, ease: 'none' }, 0)
                    // First word: slides from left, scales from 0.2 to 1.6 then settles to 1.0
                    .to(lineEls[0], { opacity: 1, x: 0, scale: 1.6, ease: 'none' }, 0.05)
                    .to(lineEls[0], { scale: 1.0, ease: 'none' }, 0.18)
                    // Second word: slides from right, scales from 0.15 to 2.0 (most dramatic)
                    .to(lineEls[1], { opacity: 1, x: 0, scale: 2.0, ease: 'none' }, 0.12)
                    .to(lineEls[1], { scale: 1.0, ease: 'none' }, 0.28)
                    // Third word: slides from left, scales from 0.2 to 1.6
                    .to(lineEls[2], { opacity: 1, x: 0, scale: 1.6, ease: 'none' }, 0.22)
                    .to(lineEls[2], { scale: 1.0, ease: 'none' }, 0.35)
                    .to(subEl, { opacity: 1, y: 0, ease: 'none' }, 0.35)
                    .to(metaEl, { opacity: 1, y: 0, scale: 1, ease: 'none' }, 0.4)
                    // Tags scale up and float in with dramatic motion
                    .to(tagA, { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, ease: 'none' }, 0.15)
                    .to(tagB, { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, ease: 'none' }, 0.2)
                    .to(tagC, { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, ease: 'none' }, 0.25)
                    .to(tagD, { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, ease: 'none' }, 0.3);

                // Exit timeline - dramatic shrink and exit
                gsap.timeline({
                    scrollTrigger: {
                        trigger: kineticCompact,
                        start: 'bottom 80%',
                        end: 'bottom 0%',
                        scrub: 1
                    }
                })
                    .to(eyebrowEl, { opacity: 0, y: -60, ease: 'none' }, 0)
                    // Words dramatically shrink down as they slide out
                    .to(lineEls[0], { opacity: 0, x: '60vw', scale: 0.3, ease: 'none' }, 0)
                    .to(lineEls[1], { opacity: 0, x: '-60vw', scale: 0.25, ease: 'none' }, 0.05)
                    .to(lineEls[2], { opacity: 0, x: '60vw', scale: 0.3, ease: 'none' }, 0.1)
                    .to(subEl, { opacity: 0, y: -80, ease: 'none' }, 0.05)
                    .to(metaEl, { opacity: 0, y: -100, scale: 0.6, ease: 'none' }, 0.1)
                    // Tags dramatically shrink and fly out
                    .to(tagA, { opacity: 0, x: -300, y: -150, rotate: -20, scale: 0.5, ease: 'none' }, 0)
                    .to(tagB, { opacity: 0, x: 300, y: -150, rotate: 20, scale: 0.5, ease: 'none' }, 0.05)
                    .to(tagC, { opacity: 0, x: -300, y: 180, rotate: 18, scale: 0.5, ease: 'none' }, 0.1)
                    .to(tagD, { opacity: 0, x: 300, y: 180, rotate: -18, scale: 0.5, ease: 'none' }, 0.15);
            } else {
                // Mobile: simple fade-in animation without complex transforms
                const allElements = kineticCompact.querySelectorAll('.kinetic-pin-eyebrow, .kinetic-pin-line, .kinetic-pin-sub, .kinetic-pin-meta-item, .kinetic-pin-tag');
                // Reset all transforms first to ensure elements are in proper position
                gsap.set(allElements, { clearProps: 'all' });
                gsap.set(allElements, { opacity: 0, y: 30, x: 0, scale: 1 });
                gsap.timeline({
                    scrollTrigger: {
                        trigger: kineticCompact,
                        start: 'top 85%',
                        end: 'top 50%',
                        scrub: true
                    }
                })
                .to(allElements, { opacity: 1, y: 0, stagger: 0.08, ease: 'none' });
            }
        }


        const servicePageCards = gsap.utils.toArray('.services-page-card');
        if (servicePageCards.length) {
            gsap.fromTo(servicePageCards,
                { y: 70, opacity: 0, clipPath: "inset(0 0 100% 0)" },
                {
                    y: 0,
                    opacity: 1,
                    clipPath: "inset(0 0 0% 0)",
                    duration: 1,
                    stagger: { each: 0.1, from: "start", ease: "power2.inOut" },
                    ease: "power4.out",
                    force3D: true,
                    scrollTrigger: {
                        trigger: '.services-page-grid',
                        start: "top 85%",
                        once: true
                    }
                }
            );
        }

        const serviceProcessSteps = gsap.utils.toArray('.services-process-steps > div');
        if (serviceProcessSteps.length) {
            gsap.fromTo(serviceProcessSteps,
                { x: 34, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 0.85,
                    stagger: 0.1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: '.services-process-section',
                        start: "top 82%",
                        once: true
                    }
                }
            );
        }

        const caseStudyCards = gsap.utils.toArray('.case-study-card');
        if (caseStudyCards.length) {
            gsap.fromTo(caseStudyCards,
                { y: 60, opacity: 0, scale: 0.96 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.95,
                    stagger: 0.12,
                    ease: "expo.out",
                    force3D: true,
                    scrollTrigger: {
                        trigger: '.case-studies-grid',
                        start: "top 85%",
                        once: true
                    }
                }
            );
        }

        // 8.3 Contact Page Specifics (Magnetic Button & Form Reveal)
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            const inputs = contactForm.querySelectorAll('.contact-input, button');
            gsap.from(inputs, {
                y: 30,
                opacity: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: "power2.out",
                delay: 0.8
            });
            
            // Magnetic Submit Button
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.addEventListener('mousemove', (e) => {
                    const { left, top, width, height } = submitBtn.getBoundingClientRect();
                    const x = (e.clientX - left) / width - 0.5;
                    const y = (e.clientY - top) / height - 0.5;
                    
                    gsap.to(submitBtn, {
                        x: x * 30,
                        y: y * 20,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                });
                
                submitBtn.addEventListener('mouseleave', () => {
                    gsap.to(submitBtn, {
                        x: 0,
                        y: 0,
                        duration: 0.6,
                        ease: "elastic.out(1, 0.3)"
                    });
                });
            }
        }

        // 8.4 Magnetic Contact Methods
        const contactMethods = document.querySelectorAll('.contact-method');
        contactMethods.forEach(method => {
            const icon = method.querySelector('.contact-method-icon');
            if (icon) {
                method.addEventListener('mousemove', (e) => {
                    const { left, top, width, height } = method.getBoundingClientRect();
                    const x = (e.clientX - left) / width - 0.5;
                    const y = (e.clientY - top) / height - 0.5;
                    
                    gsap.to(icon, {
                        x: x * 40,
                        y: y * 40,
                        scale: 1.1,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                    
                    gsap.to(method, {
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        duration: 0.3
                    });
                });
                
                method.addEventListener('mouseleave', () => {
                    gsap.to(icon, {
                        x: 0,
                        y: 0,
                        scale: 1,
                        duration: 0.6,
                        ease: "elastic.out(1, 0.3)"
                    });
                    
                    gsap.to(method, {
                        backgroundColor: "rgba(255, 255, 255, 0)",
                        duration: 0.3
                    });
                });
            }
        });

        // 9. About Story Details Items Stagger
        const detailItems = document.querySelectorAll('.about-detail-item');
        if (detailItems.length) {
            gsap.fromTo(detailItems, 
                { x: 30, opacity: 0 },
                { 
                    x: 0, 
                    opacity: 1, 
                    duration: 0.6, 
                    stagger: 0.08, 
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: ".about-details-panel",
                        start: "top 85%"
                    }
                }
            );
        }
    }

    const serviceCards = document.querySelectorAll('.services-page-card[data-service]');
    const serviceModal = document.querySelector('#serviceConfirmModal');
    const serviceModalTitle = document.querySelector('#serviceConfirmTitle');
    const serviceModalYes = document.querySelector('#serviceConfirmYes');
    let selectedService = '';

    const closeServiceModal = () => {
        if (!serviceModal) return;
        serviceModal.classList.remove('is-open');
        serviceModal.setAttribute('aria-hidden', 'true');
        selectedService = '';
    };

    const openServiceModal = (serviceName) => {
        if (!serviceModal) return;
        selectedService = serviceName;
        if (serviceModalTitle) {
            serviceModalTitle.textContent = `Request ${serviceName}?`;
        }
        serviceModal.classList.add('is-open');
        serviceModal.setAttribute('aria-hidden', 'false');
        if (serviceModalYes) {
            serviceModalYes.focus();
        }
    };

    serviceCards.forEach(card => {
        card.addEventListener('click', () => openServiceModal(card.dataset.service));
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openServiceModal(card.dataset.service);
            }
        });
    });

    document.querySelectorAll('.service-request-btn[data-service]').forEach(btn => {
        btn.addEventListener('click', () => openServiceModal(btn.dataset.service));
    });

    document.querySelectorAll('[data-service-modal-close]').forEach(button => {
        button.addEventListener('click', closeServiceModal);
    });

    if (serviceModalYes) {
        serviceModalYes.addEventListener('click', () => {
            if (!selectedService) return;
            window.location.href = `contact.html?service=${encodeURIComponent(selectedService)}`;
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeServiceModal();
        }
    });

    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        const serviceName = new URLSearchParams(window.location.search).get('service');
        const messageField = contactForm.querySelector('textarea[name="message"]');
        if (serviceName && messageField && !messageField.value.trim()) {
            messageField.value = `I need help with (${serviceName}).`;
        }
    }

    const mobileViewportQuery = window.matchMedia('(max-width: 767px)');
    const syncMobilePerformanceMode = (isMobileViewport = mobileViewportQuery.matches) => {
        document.documentElement.classList.toggle('mobile-performance-mode', isMobileViewport);
    };

    syncMobilePerformanceMode();
    if (mobileViewportQuery.addEventListener) {
        mobileViewportQuery.addEventListener('change', (event) => syncMobilePerformanceMode(event.matches));
    } else {
        mobileViewportQuery.addListener((event) => syncMobilePerformanceMode(event.matches));
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if(mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('hidden');
            navLinks.classList.toggle('flex');
            navLinks.classList.toggle('flex-col');
            navLinks.classList.toggle('absolute');
            navLinks.classList.toggle('top-full');
            navLinks.classList.toggle('left-0');
            navLinks.classList.toggle('w-full');
            navLinks.classList.toggle('bg-dark-secondary');
            navLinks.classList.toggle('p-6');
            navLinks.classList.toggle('gap-4');
        });
    }

    // Close mobile menu when a link is clicked
    const closeMobileMenu = () => {
        if (!navLinks) return;
        navLinks.classList.add('hidden');
        navLinks.classList.remove('flex', 'flex-col', 'absolute', 'top-full', 'left-0', 'w-full', 'bg-dark-secondary', 'p-6', 'gap-4');
    };

    document.addEventListener('click', (event) => {
        const navLink = event.target.closest('.nav-links a');
        if (navLink && window.innerWidth < 768) {
            closeMobileMenu();
        }
    });




    // Skill Bars BOLD GSAP animation
    const skillPanels = document.querySelectorAll('.about-skill-panel');
    if (skillPanels.length > 0) {
        skillPanels.forEach(panel => {
            const items = panel.querySelectorAll('.skill-item');
            
            // 1. Panel Entrance
            gsap.fromTo(panel, 
                { y: 60, opacity: 0, scale: 0.95 },
                { 
                    y: 0, 
                    opacity: 1, 
                    scale: 1, 
                    duration: 1.2, 
                    ease: "expo.out",
                    scrollTrigger: {
                        trigger: panel,
                        start: "top 90%",
                        once: true
                    }
                }
            );

            // 2. Staggered Items & Bars
            items.forEach((item, index) => {
                const bar = item.querySelector('.skill-bar');
                const percentText = item.querySelector('.text-accent.text-sm');
                const targetWidth = bar ? bar.getAttribute('data-width') : "0%";
                const targetVal = parseInt(targetWidth);

                // Initial states to prevent flash
                if (bar) bar.style.width = "0%";

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: item,
                        start: "top 95%",
                        once: true
                    }
                });

                tl.fromTo(item, 
                    { x: -30, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
                );

                if (bar) {
                    tl.to(bar, {
                        width: targetWidth,
                        duration: 1.8,
                        ease: "expo.out"
                    }, "-=0.4");
                }

                if (percentText) {
                    const counter = { val: 0 };
                    tl.to(counter, {
                        val: targetVal,
                        duration: 1.8,
                        ease: "expo.out",
                        onUpdate: () => {
                            percentText.textContent = Math.ceil(counter.val) + "%";
                        }
                    }, "<");
                }
            });
        });
    }

    // Form submission interception setup for Formspree
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent standard redirect
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // Validate Email exactly
            const emailInput = form.querySelector('input[type="email"]');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput && !emailRegex.test(emailInput.value)) {
                alert("Please enter a valid email address.");
                return;
            }

            btn.innerHTML = 'Sending...';
            btn.style.opacity = '0.7';

            fetch(form.action, {
                method: form.method,
                body: new FormData(form),
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    btn.innerHTML = 'Message Sent ✓';
                    btn.style.backgroundColor = 'var(--accent)';
                    form.reset();
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.backgroundColor = '';
                        btn.style.opacity = '1';
                    }, 4000);
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            alert(data["errors"].map(error => error["message"]).join(", "));
                        } else {
                            alert("Oops! There was a problem submitting your form");
                        }
                        btn.innerHTML = originalText;
                        btn.style.opacity = '1';
                    })
                }
            }).catch(error => {
                alert("Oops! There was a problem submitting your form");
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
            });
        });
    });

    // Video Modal functionality
    const syncVideoModalCursorState = (isOpen) => {
        document.documentElement.classList.toggle('video-modal-open', isOpen);
        document.body.classList.toggle('video-modal-open', isOpen);
    };

    window.openVideoModal = function(videoId) {
        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('modalIframe');
        if(modal && iframe) {
            syncVideoModalCursorState(true);
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Small delay to allow display:block to apply before animating opacity
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.classList.add('opacity-100');
            }, 10);
            document.body.style.overflow = 'hidden';
            
            // Add skeleton listener
            const skeleton = modal.querySelector('.skeleton');
            if(skeleton) skeleton.classList.remove('hidden');
            iframe.onload = () => {
                if(skeleton) skeleton.classList.add('hidden');
            };
        }
    };

    window.closeVideoModal = function() {
        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('modalIframe');
        if(modal && iframe) {
            syncVideoModalCursorState(false);
            modal.classList.remove('opacity-100');
            modal.classList.add('opacity-0');
            document.body.style.overflow = 'auto';
            setTimeout(() => {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
                iframe.src = '';
            }, 300);
        }
    };

    // Top Loading Bar functionality
    const createLoadingBar = () => {
        let bar = document.getElementById('top-loading-bar');
        if(!bar) {
            bar = document.createElement('div');
            bar.id = 'top-loading-bar';
            document.body.prepend(bar);
        }
        bar.style.transition = 'none';
        bar.style.transform = 'scaleX(0)';
        bar.style.opacity = '1';
        requestAnimationFrame(() => {
            bar.style.transition = 'transform 0.3s ease-out, opacity 0.5s ease';
        });
        return bar;
    };

    document.addEventListener('click', (event) => {
        const anchor = event.target.closest('a');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        const isInternalPage = href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && anchor.target !== '_blank';

        if (!isInternalPage) return;

        event.preventDefault();
        const bar = createLoadingBar();

        requestAnimationFrame(() => {
            bar.style.transform = 'scaleX(0.4)';
        });
        setTimeout(() => { bar.style.transform = 'scaleX(0.8)'; }, 150);
        setTimeout(() => {
            bar.style.transform = 'scaleX(1)';
            setTimeout(() => {
                window.location.href = href;
            }, 150);
        }, 300);
    });

    // Theme Toggle Functionality
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    const applyLightMode = () => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.querySelectorAll('.sun-icon').forEach(icon => icon.classList.add('hidden'));
        document.querySelectorAll('.moon-icon').forEach(icon => icon.classList.remove('hidden'));
    };

    const applyDarkMode = () => {
        document.documentElement.removeAttribute('data-theme');
        document.querySelectorAll('.moon-icon').forEach(icon => icon.classList.add('hidden'));
        document.querySelectorAll('.sun-icon').forEach(icon => icon.classList.remove('hidden'));
    };

    if (savedTheme === 'light') {
        applyLightMode();
    } else {
        applyDarkMode();
    }

    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            if(isLight) {
                applyDarkMode();
                localStorage.setItem('theme', 'dark');
            } else {
                applyLightMode();
                localStorage.setItem('theme', 'light');
            }
        });
    });

    // ===== Custom Cursor (desktop pointer devices only) =====
    const isDesktopPointer = window.matchMedia('(pointer: fine)').matches && navigator.maxTouchPoints === 0;
    if (isDesktopPointer) {
        const dot = document.createElement('div');
        const outline = document.createElement('div');
        dot.className = 'cursor-dot';
        outline.className = 'cursor-outline';
        document.body.appendChild(dot);
        document.body.appendChild(outline);
        document.documentElement.classList.add('has-custom-cursor');

        let outX = 0, outY = 0, mouseX = 0, mouseY = 0;
        let cursorDirty = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDirty = true;

            if (document.documentElement.classList.contains('video-modal-open')) {
                dot.classList.add('cursor-hide');
                outline.classList.add('cursor-hide');
                return;
            }
            
            // Hide if near scrollbar (right side) or top/bottom/left edges
            if (mouseX > window.innerWidth - 25 || mouseY < 5 || mouseX < 5 || mouseY > window.innerHeight - 5) {
                dot.classList.add('cursor-hide');
                outline.classList.add('cursor-hide');
            } else {
                dot.classList.remove('cursor-hide');
                outline.classList.remove('cursor-hide');
            }
        });

        document.addEventListener('mouseleave', () => {
            dot.classList.add('cursor-hide');
            outline.classList.add('cursor-hide');
        });

        document.addEventListener('mouseenter', () => {
            if (document.documentElement.classList.contains('video-modal-open')) {
                return;
            }
            dot.classList.remove('cursor-hide');
            outline.classList.remove('cursor-hide');
        });

        // Batch all cursor DOM writes into a single rAF loop
        const tick = () => {
            if (cursorDirty) {
                dot.style.left = mouseX + 'px';
                dot.style.top  = mouseY + 'px';
                dot.style.opacity = '1';
                outline.style.opacity = '1';
                cursorDirty = false;
            }
            outX += (mouseX - outX) * 0.15;
            outY += (mouseY - outY) * 0.15;
            outline.style.left = outX + 'px';
            outline.style.top  = outY + 'px';
            requestAnimationFrame(tick);
        };
        tick();

        // Hover enlarge on interactive elements
        document.addEventListener('pointerover', (event) => {
            if (event.target.closest('a, button, .social-icon, .theme-toggle')) {
                document.body.classList.add('cursor-hover');
            }
        });

        document.addEventListener('pointerout', (event) => {
            if (event.target.closest('a, button, .social-icon, .theme-toggle')) {
                document.body.classList.remove('cursor-hover');
            }
        });
    }

    // ===== Click Ripple (desktop only) =====
    if (isDesktopPointer) {
        window.addEventListener('mousedown', (e) => {
            if (document.documentElement.classList.contains('video-modal-open')) {
                return;
            }
            const r = document.createElement('div');
            r.className = 'click-ripple';
            r.style.left = e.clientX + 'px';
            r.style.top  = e.clientY + 'px';
            document.body.appendChild(r);
            r.addEventListener('animationend', () => r.remove());
        });
    }

    // ===== Lazy Loading with Skeleton =====
    const lazyImages = document.querySelectorAll('img[data-src]');
    if (lazyImages.length > 0) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.onload = () => {
                        img.classList.add('loaded');
                        const skeleton = img.previousElementSibling;
                        if (skeleton && skeleton.classList.contains('skeleton')) {
                            skeleton.classList.add('opacity-0');
                        }
                    };
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '200px 0px' });

        lazyImages.forEach(img => imageObserver.observe(img));
    }
});
