class ProjectsSignatureOrbs {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.numParticles = options.numParticles || 480;
        this.isMorphing = false;
        this.colors = options.colors || ['#10b981', '#3b82f6', '#ef4444', '#f97316', '#8b5cf6'];

        // Configuration for positioning
        this.anchorX = options.anchorX !== undefined ? options.anchorX : 0.8;
        this.anchorY = options.anchorY !== undefined ? options.anchorY : 0.5;
        this.scaleMultiplier = options.scaleMultiplier || 0.35;
        this.interval = options.interval || 12000;
        this.svgList = options.svgs || [
             // YouTube icon
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
            // GitHub icon
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`,
           
            // LinkedIn icon
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
           
        ];
        this.currentShapeIndex = 0;
        this.shapeCache = [];
        this.isActive = false;
        this.init();
        this.setupObserver();
        window.addEventListener('resize', () => {
            this.resize();
            if (!this.isMorphing) this.createRandomParticles();
        });
    }

    async init() {
        this.resize();
        this.createRandomParticles();
        for (let svgString of this.svgList) {
            this.shapeCache.push(await this.parseSVGString(svgString));
        }
        this.animate();
        setTimeout(() => this.cycleShape(), 220);
        setInterval(() => {
            if (this.isActive) this.cycleShape();
        }, this.interval);
    }

    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isActive = entry.isIntersecting && !document.hidden;
            });
        }, { threshold: 0.1 });
        observer.observe(this.canvas);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isActive = false;
            } else {
                const rect = this.canvas.getBoundingClientRect();
                this.isActive = rect.bottom > 0 && rect.top < window.innerHeight;
            }
        });
    }

    resize() {
        if (!this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.renderWidth = rect.width;
        this.renderHeight = rect.height;
        this.centerX = this.renderWidth * this.anchorX;
        this.centerY = this.renderHeight * this.anchorY;
        this.drawScale = Math.min(this.renderWidth, this.renderHeight) * this.scaleMultiplier;
    }

    createRandomParticles() {
        this.particles = [];
        const isSmall = window.matchMedia('(max-width: 767px)').matches;
        const total = isSmall ? 260 : this.numParticles;
        for (let i = 0; i < total; i++) {
            const x = (Math.random() - 0.5) * 8;
            const y = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            this.particles.push({
                x: 0,
                y: 0,
                z: 0,
                baseX: x,
                baseY: y,
                baseZ: z,
                morphX: 0,
                morphY: 0,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                size: Math.random() * 2 + 1,
                angleOffset: Math.random() * Math.PI * 2,
                morphProgress: 0,
                driftSpeedX: (Math.random() - 0.5) * 0.001,
                driftSpeedY: (Math.random() - 0.5) * 0.001
            });
        }
    }

    parseSVGString(svgRaw) {
        const shapeCanvas = document.createElement('canvas');
        const shapeCtx = shapeCanvas.getContext('2d', { willReadFrequently: true });
        const sSize = 220;
        shapeCanvas.width = sSize;
        shapeCanvas.height = sSize;
        let svgString = svgRaw.replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${sSize}" height="${sSize}"`);
        svgString = svgString.replace(/currentColor/g, '#ffffff');
        const base64Svg = btoa(unescape(encodeURIComponent(svgString)));
        const url = 'data:image/svg+xml;base64,' + base64Svg;
        return new Promise((resolve) => {
            const img = new Image();
            const timeout = setTimeout(() => resolve([]), 450);
            img.onload = () => {
                clearTimeout(timeout);
                shapeCtx.clearRect(0, 0, sSize, sSize);
                shapeCtx.drawImage(img, 0, 0, sSize, sSize);
                const imageData = shapeCtx.getImageData(0, 0, sSize, sSize).data;
                const allValidPixels = [];
                for (let y = 0; y < sSize; y++) {
                    for (let x = 0; x < sSize; x++) {
                        const alpha = imageData[(y * sSize + x) * 4 + 3];
                        if (alpha > 40) {
                            allValidPixels.push({
                                x: (x / sSize) * 2 - 1,
                                y: (y / sSize) * 2 - 1
                            });
                        }
                    }
                }
                resolve(allValidPixels);
            };
            img.onerror = () => {
                clearTimeout(timeout);
                resolve([]);
            };
            img.src = url;
        });
    }

    cycleShape() {
        if (this.shapeCache.length === 0) return;
        const allPixels = this.shapeCache[this.currentShapeIndex];
        if (allPixels && allPixels.length > 0) {
            this.isMorphing = true;
            this.particles.forEach((p) => {
                const randomPixel = allPixels[Math.floor(Math.random() * allPixels.length)];
                p.morphX = randomPixel.x;
                p.morphY = randomPixel.y;
                gsap.killTweensOf(p);
                gsap.to(p, {
                    morphProgress: 1,
                    duration: 1.5 + Math.random() * 1.5,
                    ease: 'expo.inOut',
                    delay: Math.random() * 0.2
                });
            });
            setTimeout(() => {
                this.morphToSphere();
            }, 8000);
        }
        this.currentShapeIndex = (this.currentShapeIndex + 1) % this.svgList.length;
    }

    morphToSphere() {
        this.isMorphing = false;
        this.particles.forEach(p => {
            gsap.killTweensOf(p);
            p.baseX = (Math.random() - 0.5) * 8;
            p.baseY = (Math.random() - 0.5) * 8;
            p.baseZ = (Math.random() - 0.5) * 8;
            gsap.to(p, {
                morphProgress: 0,
                duration: 1.5 + Math.random() * 1.5,
                ease: 'power2.out',
                delay: Math.random() * 0.1
            });
        });
    }

    animate() {
        if (!this.isActive || document.hidden) {
            // Fully idle while off-screen or hidden: still keep the loop alive so
            // it resumes, but draw nothing.
            requestAnimationFrame(this.animate.bind(this));
            return;
        }
        const now = performance.now();
        // Cap at ~40fps. The canvas is decorative; 60fps bought nothing but
        // main-thread contention with scrolling and the custom cursor.
        if (this._lastFrame && now - this._lastFrame < 24) {
            requestAnimationFrame(this.animate.bind(this));
            return;
        }
        this._lastFrame = now;
        this.ctx.clearRect(0, 0, this.renderWidth, this.renderHeight);
        if (!this.isMorphing) {
            this.particles.forEach(p => {
                p.baseX += p.driftSpeedX;
                p.baseY += p.driftSpeedY;
                if (p.baseX > 4 || p.baseX < -4) p.driftSpeedX *= -1;
                if (p.baseY > 4 || p.baseY < -4) p.driftSpeedY *= -1;
            });
        }
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const morphNoiseX = Math.sin(Date.now() * 0.0016 + p.angleOffset) * 0.012;
            const morphNoiseY = Math.cos(Date.now() * 0.0014 + p.angleOffset) * 0.012;
            const floatNoise = Math.sin(Date.now() * 0.001 + p.angleOffset) * 0.08;
            const cx = p.baseX * (1 - p.morphProgress) + p.morphX * p.morphProgress;
            const cy = p.baseY * (1 - p.morphProgress) + p.morphY * p.morphProgress;
            const currentX = cx * (1 + floatNoise * (1 - p.morphProgress)) + morphNoiseX * p.morphProgress;
            const currentY = cy * (1 + floatNoise * (1 - p.morphProgress)) + morphNoiseY * p.morphProgress;
            const finalX = this.centerX + currentX * this.drawScale;
            const finalY = this.centerY + currentY * this.drawScale;
            const finalSize = Math.max(0.5, p.size);
            this.ctx.globalAlpha = p.morphProgress * 0.6 + 0.4;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(finalX - finalSize / 2, finalY - finalSize / 2, finalSize, finalSize);
        }
        this.ctx.globalAlpha = 1;
        requestAnimationFrame(this.animate.bind(this));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('projects-signature-canvas')) {
        window.projectsSignatureOrbs = new ProjectsSignatureOrbs('projects-signature-canvas');
    }
});
