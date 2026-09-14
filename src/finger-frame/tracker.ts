import {
  INDEX_TIP,
  JUMP_CONFIRM_FRAMES,
  MAX_LOST_FRAMES,
  MIDDLE_MCP,
  type Point,
  THUMB_TIP,
  WRIST,
} from "./constants";

type HandLandmarks = Array<{ x: number; y: number }>;

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerpPt(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function polygonArea(pts: Point[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    area += p.x * q.y - q.x * p.y;
  }
  return Math.abs(area / 2);
}

export class FrameTracker {
  private corners: Point[] | null = null;
  private presence = 0;
  private frameActive = false;
  private lostFrames = 0;
  private jumpFrames = 0;

  constructor(
    private width: number,
    private height: number
  ) {}

  reset(): void {
    this.corners = null;
    this.presence = 0;
    this.frameActive = false;
    this.lostFrames = 0;
    this.jumpFrames = 0;
  }

  getPresence(): number {
    return this.presence;
  }

  getCorners(): Point[] | null {
    return this.presence > 0.01 ? this.corners : null;
  }

  private toPixel(lm: { x: number; y: number }): Point {
    return { x: lm.x * this.width, y: lm.y * this.height };
  }

  private computeQuad(hands: HandLandmarks[]): Point[] | null {
    if (hands.length !== 2) return null;

    const info = hands.map((lm) => {
      const index = this.toPixel(lm[INDEX_TIP]);
      const thumb = this.toPixel(lm[THUMB_TIP]);
      const scale = dist(this.toPixel(lm[WRIST]), this.toPixel(lm[MIDDLE_MCP])) + 1;
      return { index, thumb, wristX: this.toPixel(lm[WRIST]).x, scale };
    });

    const needed = this.frameActive ? 0.2 : 0.75;
    for (const hd of info) {
      if (dist(hd.thumb, hd.index) < hd.scale * needed) return null;
    }

    info.sort((a, b) => a.wristX - b.wristX);
    const [a, b] = info;
    const pts = [a.index, b.index, b.thumb, a.thumb];
    const cx = pts.reduce((s, p) => s + p.x, 0) / 4;
    const cy = pts.reduce((s, p) => s + p.y, 0) / 4;
    const hull = [...pts].sort(
      (p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx)
    );
    const minArea = this.frameActive ? 0.0005 : 0.005;
    if (polygonArea(hull) < this.width * this.height * minArea) return null;
    return pts;
  }

  update(hands: HandLandmarks[]): Point[] | null {
    const target = hands.length ? this.computeQuad(hands) : null;

    if (target) {
      if (!this.corners) {
        this.lostFrames = 0;
        this.frameActive = true;
        this.jumpFrames = 0;
        this.corners = target;
        this.presence = Math.min(1, this.presence + 0.12);
      } else {
        const moved =
          target.reduce((s, p, i) => s + dist(p, this.corners![i]), 0) / 4;
        if (moved > this.width * 0.3 && ++this.jumpFrames < JUMP_CONFIRM_FRAMES) {
          if (++this.lostFrames > MAX_LOST_FRAMES) {
            this.presence = Math.max(0, this.presence - 0.05);
          }
        } else {
          this.lostFrames = 0;
          this.frameActive = true;
          this.jumpFrames = 0;
          const alpha = Math.min(0.85, Math.max(0.35, moved / (this.width * 0.05)));
          this.corners = this.corners.map((c, i) => lerpPt(c, target[i], alpha));
          this.presence = Math.min(1, this.presence + 0.12);
        }
      }
    } else if (this.corners && ++this.lostFrames <= MAX_LOST_FRAMES) {
      this.presence = Math.min(1, this.presence + 0.12);
    } else {
      this.presence = Math.max(0, this.presence - 0.05);
      if (this.presence === 0) {
        this.corners = null;
        this.frameActive = false;
        this.jumpFrames = 0;
      }
    }

    return this.getCorners();
  }
}

export function drawWindow(
  ctx: CanvasRenderingContext2D,
  quad: Point[],
  presence: number,
  source: CanvasImageSource,
  stylized: CanvasImageSource | null,
  usePlaceholder: boolean
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(quad[0].x, quad[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(quad[i].x, quad[i].y);
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = presence;
  if (stylized) {
    ctx.drawImage(stylized, 0, 0, ctx.canvas.width, ctx.canvas.height);
  } else if (usePlaceholder) {
    ctx.filter = "hue-rotate(140deg) saturate(1.7) contrast(1.15)";
    ctx.drawImage(source, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.filter = "none";
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawOutline(
  ctx: CanvasRenderingContext2D,
  quad: Point[],
  presence: number,
  t: number
): void {
  ctx.save();
  ctx.globalAlpha = presence;
  ctx.beginPath();
  ctx.moveTo(quad[0].x, quad[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(quad[i].x, quad[i].y);
  ctx.closePath();
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -t * 40;
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.shadowBlur = 0;

  quad.forEach((p, i) => {
    const r = 7 + Math.sin(t * 3 + i * 1.5) * 1.5;
    const halo = (t * 0.8 + i * 0.25) % 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + halo * 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - halo) * presence})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  ctx.restore();
}
