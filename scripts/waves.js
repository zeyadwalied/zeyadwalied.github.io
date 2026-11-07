// Classical Perlin Noise
function ClassicalNoise() {
    this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    this.p = [];
    for (var i = 0; i < 256; i++) this.p[i] = Math.floor(Math.random() * 256);
    this.perm = new Array(512);
    for (var i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
}
ClassicalNoise.prototype.dot = function(g, x, y, z) { return g[0]*x + g[1]*y + g[2]*z; };
ClassicalNoise.prototype.mix = function(a, b, t) { return (1-t)*a + t*b; };
ClassicalNoise.prototype.fade = function(t) { return t*t*t*(t*(t*6-15)+10); };
ClassicalNoise.prototype.noise = function(x, y, z) {
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    var u = this.fade(x), v = this.fade(y), w = this.fade(z);
    var A = this.perm[X]+Y, AA = this.perm[A]+Z, AB = this.perm[A+1]+Z;
    var B = this.perm[X+1]+Y, BA = this.perm[B]+Z, BB = this.perm[B+1]+Z;
    return this.mix(
        this.mix(this.mix(this.dot(this.grad3[this.perm[AA]%12],x,y,z), this.dot(this.grad3[this.perm[BA]%12],x-1,y,z), u),
                 this.mix(this.dot(this.grad3[this.perm[AB]%12],x,y-1,z), this.dot(this.grad3[this.perm[BB]%12],x-1,y-1,z), u), v),
        this.mix(this.mix(this.dot(this.grad3[this.perm[AA+1]%12],x,y,z-1), this.dot(this.grad3[this.perm[BA+1]%12],x-1,y,z-1), u),
                 this.mix(this.dot(this.grad3[this.perm[AB+1]%12],x,y-1,z-1), this.dot(this.grad3[this.perm[BB+1]%12],x-1,y-1,z-1), u), v), w);
};

// Wave Animation
(function() {
    var canvas = document.getElementById('wave-canvas');
    if (!canvas) return;

    var disableMotionQuery = window.matchMedia('(max-width: 767px)');

    var ctx = canvas.getContext('2d'),
        perlin = new ClassicalNoise(),
        variation = 0.001,
        amp = 400,
        maxLines = 15,
        variators = [],
        canvasWidth, canvasHeight, startY,
        isActive = true;

    for (var i = 0, u = 0; i < maxLines; i++, u += 0.016) {
        variators[i] = u;
    }

    function isWaveAnimationEnabled() {
        return !disableMotionQuery.matches;
    }

    function syncCanvasState() {
        if (isWaveAnimationEnabled()) {
            canvas.style.display = 'block';
            resizeCanvas();
        } else {
            canvas.style.display = 'none';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Pause when tab hidden for performance
    document.addEventListener('visibilitychange', function() {
        isActive = !document.hidden;
    });

    function draw() {
        ctx.shadowBlur = 0;

        for (var i = 0; i < maxLines; i++) {
            ctx.beginPath();
            ctx.moveTo(0, startY);
            var y;
            // Increased step to 10 for massive performance boost
            for (var x = 0; x <= canvasWidth; x += 10) {
                y = perlin.noise(x * variation + variators[i], x * variation, 0);
                ctx.lineTo(x, startY + amp * y);
            }
            var alpha = Math.min(Math.abs(y), 0.8) + 0.05;
            ctx.strokeStyle = 'rgba(59, 130, 246,' + (alpha * 0.35) + ')';
            ctx.stroke();
            ctx.closePath();
            variators[i] += 0.004;
        }
    }

    var lastFrame = 0;

    function animate() {
        // Throttle to ~30fps: this is a soft, blurred background. Drawing it every
        // frame at 60fps competed with the cursor and scroll for the main thread.
        if (isActive && isWaveAnimationEnabled()) {
            var now = performance.now();
            if (now - lastFrame >= 33) {
                lastFrame = now;
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                draw();
            }
        }
        requestAnimationFrame(animate);
    }

    function resizeCanvas() {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        startY = canvasHeight / 2;
    }

    syncCanvasState();
    animate();
    window.addEventListener('resize', resizeCanvas);
    if (disableMotionQuery.addEventListener) {
        disableMotionQuery.addEventListener('change', syncCanvasState);
    } else if (disableMotionQuery.addListener) {
        disableMotionQuery.addListener(syncCanvasState);
    }
})();
