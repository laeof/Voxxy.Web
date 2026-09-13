import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
} from '@angular/core';

interface Leaf {
    x: number;
    y: number;
    size: number;

    speedY: number;
    speedX: number;

    sway: number;
    phase: number;

    angle: number;
    angularSpeed: number;

    opacity: number;
    color: string;

    shape: LeafShape;
}

type LeafShape = 'oval' | 'maple';

@Component({
    selector: 'app-autumn-leaves',
    standalone: true,
    template: `<canvas #canvas class="leaves-canvas"></canvas>`,
    styles: [
        `
            .leaves-canvas {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 1000;
                display: block;
            }
        `,
    ],
})
export class AutumnLeavesComponent implements AfterViewInit, OnChanges, OnDestroy {
    @ViewChild('canvas', { static: true })
    canvasRef!: ElementRef<HTMLCanvasElement>;

    @Input() count = 80;

    private ctx!: CanvasRenderingContext2D;

    private readonly leaves: Leaf[] = [];

    private width = window.innerWidth;
    private height = window.innerHeight;
    private dpr = window.devicePixelRatio || 1;

    private rafId = 0;
    private lastTime = 0;

    private readonly leafCache = new Map<string, HTMLCanvasElement>();

    private readonly colors = ['#E87516', '#D96512', '#F28C28', '#C95716', '#E07A1F', '#B94E14'];

    /* ---------------- lifecycle ---------------- */

    ngAfterViewInit(): void {
        this.setupCanvas();
        this.createLeaves();
        this.animate();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['count'] && !changes['count'].firstChange) {
            this.createLeaves();
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

        if (!ctx) {
            throw new Error('Canvas not supported');
        }

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        this.ctx = ctx;
    }

    @HostListener('window:resize')
    onResize(): void {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = window.devicePixelRatio || 1;

        this.setupCanvas();

        for (const leaf of this.leaves) {
            leaf.x %= this.width;
            leaf.y %= this.height;
        }
    }

    /* ---------------- leaves ---------------- */

    private createLeaves(): void {
        this.leaves.length = 0;

        for (let i = 0; i < this.count; i++) {
            this.leaves.push(this.createLeaf(true));
        }
    }

    private createLeaf(randomY = false): Leaf {
        const size = Math.random() * 1.5 + 2;

        return {
            x: Math.random() * this.width,

            y: randomY ? Math.random() * this.height : -size * 3,

            size,

            speedY: Math.random() * 0.9 + 0.7,
            speedX: Math.random() * 0.35 - 0.1,

            sway: Math.random() * 0.8 + 0.4,
            phase: Math.random() * Math.PI * 2,

            angle: Math.random() * Math.PI * 2,
            angularSpeed: (Math.random() - 0.5) * 0.035,

            opacity: Math.random() * 0.35 + 0.65,

            color: this.colors[Math.floor(Math.random() * this.colors.length)],

            shape: Math.random() > 0.5 ? 'oval' : 'maple',
        };
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

            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

            ctx.clearRect(0, 0, this.width, this.height);

            for (const leaf of this.leaves) {
                /*
                 * vertical fall
                 */
                leaf.y += leaf.speedY;

                /*
                 * horizontal movement
                 */
                leaf.phase += 0.015;

                leaf.x += leaf.speedX + Math.sin(leaf.phase) * leaf.sway;

                /*
                 * rotation
                 */
                leaf.angle += leaf.angularSpeed;

                /*
                 * reset
                 */
                if (leaf.y > this.height + leaf.size * 3) {
                    const newLeaf = this.createLeaf();

                    leaf.x = newLeaf.x;
                    leaf.y = newLeaf.y;

                    leaf.size = newLeaf.size;

                    leaf.speedY = newLeaf.speedY;
                    leaf.speedX = newLeaf.speedX;

                    leaf.sway = newLeaf.sway;
                    leaf.phase = newLeaf.phase;

                    leaf.angle = newLeaf.angle;
                    leaf.angularSpeed = newLeaf.angularSpeed;

                    leaf.opacity = newLeaf.opacity;
                    leaf.color = newLeaf.color;
                }

                if (leaf.x < -leaf.size * 3) {
                    leaf.x = this.width + leaf.size;
                }

                if (leaf.x > this.width + leaf.size * 3) {
                    leaf.x = -leaf.size;
                }

                /*
                 * draw
                 */

                ctx.globalAlpha = leaf.opacity;

                const sprite = this.getLeafSprite(leaf.size, leaf.color, leaf.shape);

                const cos = Math.cos(leaf.angle);
                const sin = Math.sin(leaf.angle);

                ctx.setTransform(
                    cos * this.dpr,
                    sin * this.dpr,
                    -sin * this.dpr,
                    cos * this.dpr,
                    leaf.x * this.dpr,
                    leaf.y * this.dpr,
                );

                ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
            }

            ctx.globalAlpha = 1;

            this.rafId = requestAnimationFrame(loop);
        };

        this.rafId = requestAnimationFrame(loop);
    }

    /* ---------------- sprite ---------------- */

    private getLeafSprite(size: number, color: string, shape: LeafShape): HTMLCanvasElement {
        const roundedSize = Math.round(size);
        const key = `${roundedSize}-${color}-${shape}`;

        const cached = this.leafCache.get(key);

        if (cached) {
            return cached;
        }

        const scale = 3;

        const canvas = document.createElement('canvas');

        canvas.width = roundedSize * 8;
        canvas.height = roundedSize * 10;

        const ctx = canvas.getContext('2d')!;

        ctx.translate(canvas.width / 2, canvas.height / 2);

        ctx.scale(scale, scale);

        if (shape === 'oval') {
            this.drawLeaf(ctx, roundedSize, color);
        } else {
            this.drawMapleLeaf(ctx, roundedSize, color);
        }

        this.leafCache.set(key, canvas);

        return canvas;
    }

    private drawLeaf(ctx: CanvasRenderingContext2D, size: number, color: string): void {
        ctx.save();

        // Немного поворачиваем сам shape,
        // чтобы он не выглядел идеально вертикальным.
        ctx.rotate(-0.15);

        ctx.beginPath();

        // Верхушка
        ctx.moveTo(0, -size * 1.4);

        // Правая сторона
        ctx.bezierCurveTo(
            size * 0.35,
            -size * 1.05,
            size * 0.75,
            -size * 0.55,
            size * 0.72,
            -size * 0.1,
        );

        ctx.bezierCurveTo(size * 0.7, size * 0.35, size * 0.35, size * 0.75, 0, size);

        // Левая сторона — чуть другая для естественной асимметрии
        ctx.bezierCurveTo(
            -size * 0.45,
            size * 0.65,
            -size * 0.65,
            size * 0.25,
            -size * 0.6,
            -size * 0.2,
        );

        ctx.bezierCurveTo(-size * 0.55, -size * 0.65, -size * 0.25, -size * 1.1, 0, -size * 1.4);

        ctx.closePath();

        ctx.fillStyle = color;

        ctx.shadowColor = 'rgba(120, 60, 10, 0.15)';
        ctx.shadowBlur = 1;

        ctx.fill();

        // Центральная прожилка
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(0, -size * 1.05);
        ctx.lineTo(0, size * 1.05);

        ctx.strokeStyle = 'rgba(100, 50, 15, 0.55)';
        ctx.lineWidth = Math.max(0.4, size * 0.06);
        ctx.stroke();

        // Две небольшие боковые прожилки
        ctx.strokeStyle = 'rgba(100, 50, 15, 0.3)';
        ctx.lineWidth = Math.max(0.3, size * 0.04);

        ctx.beginPath();
        ctx.moveTo(0, -size * 0.3);
        ctx.lineTo(size * 0.4, -size * 0.6);

        ctx.moveTo(0, size * 0.15);
        ctx.lineTo(size * 0.4, -size * 0.05);

        ctx.moveTo(0, -size * 0.3);
        ctx.lineTo(-size * 0.35, -size * 0.55);

        ctx.moveTo(0, size * 0.15);
        ctx.lineTo(-size * 0.35, 0);

        ctx.stroke();

        // Черешок
        ctx.beginPath();
        ctx.moveTo(0, size * 0.85);
        ctx.lineTo(size * 0.08, size * 1.35);

        ctx.strokeStyle = '#754019';
        ctx.lineWidth = Math.max(0.5, size * 0.07);
        ctx.stroke();

        ctx.restore();
    }

    private drawMapleLeaf(ctx: CanvasRenderingContext2D, size: number, color: string): void {
        ctx.save();

        ctx.beginPath();

        // Верхняя центральная вершина
        ctx.moveTo(0, -size * 1.6);

        // Правая верхняя часть
        ctx.lineTo(size * 0.22, -size * 0.85);
        ctx.lineTo(size * 0.65, -size * 1.05);

        // Правая большая лопасть
        ctx.lineTo(size * 0.5, -size * 0.45);
        ctx.lineTo(size * 1.15, -size * 0.55);

        // Правая средняя лопасть
        ctx.lineTo(size * 0.7, -size * 0.05);
        ctx.lineTo(size * 1.05, size * 0.35);

        // Правая нижняя часть
        ctx.lineTo(size * 0.45, size * 0.25);
        ctx.lineTo(size * 0.3, size * 0.85);

        // Основание
        ctx.lineTo(0, size * 0.65);

        // Левая нижняя часть
        ctx.lineTo(-size * 0.3, size * 0.85);
        ctx.lineTo(-size * 0.45, size * 0.25);

        // Левая средняя лопасть
        ctx.lineTo(-size * 1.05, size * 0.35);
        ctx.lineTo(-size * 0.7, -size * 0.05);

        // Левая большая лопасть
        ctx.lineTo(-size * 1.15, -size * 0.55);
        ctx.lineTo(-size * 0.5, -size * 0.45);

        // Левая верхняя часть
        ctx.lineTo(-size * 0.65, -size * 1.05);
        ctx.lineTo(-size * 0.22, -size * 0.85);

        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        // Центральная прожилка
        ctx.beginPath();

        ctx.moveTo(0, -size * 1.2);
        ctx.lineTo(0, size * 1.15);

        ctx.strokeStyle = 'rgba(90, 45, 10, 0.5)';
        ctx.lineWidth = Math.max(0.4, size * 0.06);

        ctx.stroke();

        // Боковые прожилки
        ctx.lineWidth = Math.max(0.3, size * 0.04);
        ctx.strokeStyle = 'rgba(90, 45, 10, 0.3)';

        ctx.beginPath();

        ctx.moveTo(0, -size * 0.35);
        ctx.lineTo(size * 0.7, -size * 0.6);

        ctx.moveTo(0, -size * 0.35);
        ctx.lineTo(-size * 0.7, -size * 0.6);

        ctx.moveTo(0, 0);
        ctx.lineTo(size * 0.65, size * 0.15);

        ctx.moveTo(0, 0);
        ctx.lineTo(-size * 0.65, size * 0.15);

        ctx.stroke();

        // Черешок
        ctx.beginPath();

        ctx.moveTo(0, size * 0.55);
        ctx.lineTo(size * 0.08, size * 1.35);

        ctx.strokeStyle = '#754019';
        ctx.lineWidth = Math.max(0.5, size * 0.07);

        ctx.stroke();

        ctx.restore();
    }
}
