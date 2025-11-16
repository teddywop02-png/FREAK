// Simple left-to-right horizontal carousel using duplicated images
class ContinuousHorizontalScroller {
    constructor(trackId = 'carouselTrack', totalImages = 12, speedPxPerSec = 80) {
        this.track = document.getElementById(trackId);
        if (!this.track) throw new Error('Carousel track not found');
        this.total = totalImages;
        this.speed = speedPxPerSec;
        this.rafId = null;
        this.offset = 0;
        this.singleWidth = 0;
        this.running = false;
        this.lastTs = 0;

        // create images (duplicated sequence for seamless loop)
        this.images = [];
        // first copy
        for (let i = 1; i <= this.total; i++) {
            const img = document.createElement('img');
            img.src = `/images/${i}.png`;
            img.alt = `carousel ${i}`;
            img.style.height = '100%';
            img.style.display = 'block';
            img.style.objectFit = 'cover';
            img.style.flexShrink = '0';
            this.track.appendChild(img);
            this.images.push(img);
        }
        // second copy (for seamless loop)
        for (let i = 1; i <= this.total; i++) {
            const img = document.createElement('img');
            img.src = `/images/${i}.png`;
            img.alt = `carousel dup ${i}`;
            img.style.height = '100%';
            img.style.display = 'block';
            img.style.objectFit = 'cover';
            img.style.flexShrink = '0';
            this.track.appendChild(img);
        }

        // wait for load then start
        const waitImages = Array.from(this.track.querySelectorAll('img')).map(img => {
            return new Promise(res => {
                if (img.complete) return res();
                img.onload = img.onerror = () => res();
            });
        });

        Promise.all(waitImages).then(() => {
            this.singleWidth = this.track.scrollWidth / 2;
            this.offset = -this.singleWidth;
            this.lastTs = performance.now();
            this.start();
        }).catch(() => {
            this.singleWidth = this.track.scrollWidth / 2 || 1000;
            this.offset = -this.singleWidth;
            this.lastTs = performance.now();
            this.start();
        });
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTs = performance.now();
        this.rafId = requestAnimationFrame(this._tick.bind(this));
    }

    stop() {
        this.running = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
    }

    _tick(ts) {
        const dt = (ts - this.lastTs) / 1000;
        this.lastTs = ts;

        this.offset += this.speed * dt;

        if (this.offset >= 0) {
            this.offset -= this.singleWidth;
        }

        this.track.style.transform = `translateX(${this.offset}px)`;

        if (this.running) this.rafId = requestAnimationFrame(this._tick.bind(this));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        // speed in px/sec; adjust to make carousel faster/slower
        window.freakCarousel = new ContinuousHorizontalScroller('carouselTrack', 12, 80);
    } catch (err) {
        console.error('Carousel init failed', err);
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContinuousHorizontalScroller;
}