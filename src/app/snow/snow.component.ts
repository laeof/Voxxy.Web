import {
    Component,
    ElementRef,
    AfterViewInit,
    ViewChild,
    HostListener,
    Input,
    OnChanges,
    SimpleChanges,
    OnDestroy,
} from '@angular/core';

type SnowflakeShape = 'dot' | 'flake';

interface Snowflake {
    x: number;
    y: number;
    size: number;
    speed: number;
    sway: number;
    opacity: number;
    angle: number;
    angularSpeed: number;
    phase: number;
    shape: SnowflakeShape;
}

@Component({
    selector: 'app-snow',
    standalone: true,
    template: `<canvas #canvas class="snow-canvas"></canvas>`,
    styles: [
        `
            .snow-canvas {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 1000;
                display: block;
            }
        `,
    ],
})
export class SnowComponent implements AfterViewInit, OnChanges, OnDestroy {
    @ViewChild('canvas', { static: true })
    canvasRef!: ElementRef<HTMLCanvasElement>;

    @Input() count = 150;

    private ctx!: CanvasRenderingContext2D;
    private readonly snowflakes: Snowflake[] = [];

    private width = window.innerWidth;
    private height = window.innerHeight;
    private dpr = window.devicePixelRatio || 1;

    private rafId = 0;
    private lastTime = 0;

    private readonly snowflakeCache = new Map<number, HTMLCanvasElement>();

    /* ---------------- lifecycle ---------------- */

    ngAfterViewInit(): void {
        this.setupCanvas();
        this.createSnowflakes();
        this.animate();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['count'] && !changes['count'].firstChange) {
            this.createSnowflakes();
        }
    }

    ngOnDestroy(): void {
        cancelAnimationFrame(this.rafId);
    }

    /* ---------------- canvas ---------------- */

    private setupCanvas(): void {
        const canvas = this.canvasRef.nativeElement;

        canvas.width = this.width * this.dpr;
        canvas.height = this.height * this.dpr;
        canvas.style.width = `${this.width}px`;
        canvas.style.height = `${this.height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';

        this.ctx = ctx;
    }

    @HostListener('window:resize')
    onResize(): void {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = window.devicePixelRatio || 1;

        this.setupCanvas();

        // сохраняем текущие позиции
        for (const flake of this.snowflakes) {
            flake.x %= this.width;
            flake.y %= this.height;
        }
    }

    private createSnowflakes(): void {
        this.snowflakes.length = 0;

        for (let i = 0; i < this.count; i++) {
            const flakeType: SnowflakeShape = Math.random() > 0.7 ? 'flake' : 'dot';

            // размер, скорость и прозрачность зависят от формы
            const size =
                flakeType === 'dot'
                    ? Math.random() * 2 + 2 // мелкие точки
                    : Math.random() * 3 + 3; // снежинки крупнее

            const speed =
                flakeType === 'dot' ? Math.random() * 0.5 + 0.3 : Math.random() * 0.8 + 0.7;

            const opacity =
                flakeType === 'dot' ? Math.random() * 0.3 + 0.2 : Math.random() * 0.5 + 0.5;

            this.snowflakes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size,
                speed,
                sway: Math.random() * 0.6 + 0.2,
                opacity,
                angle: (Math.random() * Math.PI) / 2,
                angularSpeed: (Math.random() - 0.5) * 0.01,
                phase: Math.random() * Math.PI * 2,
                shape: flakeType,
            });
        }
    }

    /* ---------------- animation ---------------- */

    private animate(): void {
        const loop = (time: number) => {
            if (time - this.lastTime < 16) {
                this.rafId = requestAnimationFrame(loop);
                return;
            }
            this.lastTime = time;

            const ctx = this.ctx;

            // Всегда учитываем DPR
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.clearRect(0, 0, this.width, this.height);

            for (const flake of this.snowflakes) {
                flake.y += flake.speed;
                flake.phase += 0.01;
                flake.x += Math.sin(flake.phase) * flake.sway;

                if (flake.shape === 'flake') {
                    flake.angle += flake.angularSpeed;
                }

                if (flake.y > this.height) {
                    flake.y = -flake.size;
                    flake.x = Math.random() * this.width;
                }

                if (flake.x < 0) flake.x = this.width;
                if (flake.x > this.width) flake.x = 0;

                ctx.globalAlpha = flake.opacity;

                if (flake.shape === 'dot') {
                    ctx.setTransform(
                        this.dpr,
                        0,
                        0,
                        this.dpr,
                        flake.x * this.dpr,
                        flake.y * this.dpr
                    );

                    ctx.beginPath();
                    ctx.arc(0, 0, flake.size, 0, Math.PI * 2);
                    ctx.fillStyle = 'white';
                    ctx.shadowBlur = 2;
                    ctx.fill();
                } else {
                    const sprite = this.getSnowflakeSprite(flake.size);

                    ctx.setTransform(
                        Math.cos(flake.angle) * this.dpr,
                        Math.sin(flake.angle) * this.dpr,
                        -Math.sin(flake.angle) * this.dpr,
                        Math.cos(flake.angle) * this.dpr,
                        flake.x * this.dpr,
                        flake.y * this.dpr
                    );

                    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
                }
            }

            ctx.globalAlpha = 1;
            this.rafId = requestAnimationFrame(loop);
        };

        this.rafId = requestAnimationFrame(loop);
    }

    private getSnowflakeSprite(size: number): HTMLCanvasElement {
        const key = Math.round(size);

        if (this.snowflakeCache.has(key)) {
            return this.snowflakeCache.get(key)!;
        }

        const d = size * 6;
        const canvas = document.createElement('canvas');
        canvas.width = d;
        canvas.height = d;

        const ctx = canvas.getContext('2d')!;
        ctx.translate(d / 2, d / 2);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1; // тонкая линия
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 2;

        const arms = 6;
        const branchLength = size * 0.5; // длина маленьких веточек
        const branchAngle = Math.PI / 3; // угол 15°

        for (let i = 0; i < arms; i++) {
            const angle = (Math.PI * 2 * i) / arms;

            // основная палка
            const xEnd = Math.cos(angle) * size;
            const yEnd = Math.sin(angle) * size;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(xEnd, yEnd);
            ctx.stroke();

            // ответвления на конце палки
            // ветка слева
            ctx.beginPath();
            ctx.moveTo(xEnd, yEnd);
            ctx.lineTo(
                xEnd + Math.cos(angle - branchAngle) * branchLength,
                yEnd + Math.sin(angle - branchAngle) * branchLength
            );
            ctx.stroke();

            // ветка справа
            ctx.beginPath();
            ctx.moveTo(xEnd, yEnd);
            ctx.lineTo(
                xEnd + Math.cos(angle + branchAngle) * branchLength,
                yEnd + Math.sin(angle + branchAngle) * branchLength
            );
            ctx.stroke();

            // ветка посередине (продолжение)
            ctx.beginPath();
            ctx.moveTo(xEnd, yEnd);
            ctx.lineTo(
                xEnd + Math.cos(angle) * branchLength,
                yEnd + Math.sin(angle) * branchLength
            );
            ctx.stroke();
        }

        this.snowflakeCache.set(key, canvas);
        return canvas;
    }
}
