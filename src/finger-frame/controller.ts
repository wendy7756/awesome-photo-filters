import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

import { HAND_MODEL_URL, WASM_URL } from "./constants";
import { stylizeVideo } from "./gemini";
import { drawOutline, drawWindow, FrameTracker } from "./tracker";

export interface FingerFrameState {
  videoFile: File | null;
  videoName: string;
  status: string;
  isWorking: boolean;
  haveAi: boolean;
  usePlaceholder: boolean;
  canPreview: boolean;
  geminiKey: string;
  rememberKey: boolean;
  styleKey: string;
  customStyle: string;
}

export class FingerFrameController {
  private landmarker: HandLandmarker | null = null;
  private tracker: FrameTracker | null = null;
  private orig = document.createElement("video");
  private sty = document.createElement("video");
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private recorder: MediaRecorder | null = null;
  private exporting = false;
  private lastVideoTime = -1;
  private rafId = 0;

  state: FingerFrameState = {
    videoFile: null,
    videoName: "",
    status: "",
    isWorking: false,
    haveAi: false,
    usePlaceholder: false,
    canPreview: false,
    geminiKey: "",
    rememberKey: false,
    styleKey: "movie3d",
    customStyle: "",
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.orig.muted = true;
    this.orig.playsInline = true;
    this.sty.muted = true;
    this.sty.playsInline = true;
  }

  setStatus(message: string): void {
    this.state.status = message;
    this.state.isWorking = /…\s*$/.test(message);
    this.onChange?.();
  }

  onChange?: () => void;

  async loadVideo(file: File): Promise<void> {
    this.stopLoop();
    this.tracker?.reset();
    this.state.videoFile = file;
    this.state.videoName = file.name;
    this.state.haveAi = false;
    this.state.usePlaceholder = false;
    this.state.canPreview = false;
    this.orig.src = URL.createObjectURL(file);
    await new Promise<void>((resolve) => {
      this.orig.onloadedmetadata = () => resolve();
    });
    this.canvas.width = this.orig.videoWidth;
    this.canvas.height = this.orig.videoHeight;
    this.tracker = new FrameTracker(this.orig.videoWidth, this.orig.videoHeight);
    await this.drawPoster();
    if (!this.landmarker) await this.initLandmarker();
    this.setStatus(
      `Loaded ${file.name} (${this.orig.videoWidth}×${this.orig.videoHeight}, ${this.orig.duration.toFixed(1)}s). Generate AI video or try placeholder.`
    );
  }

  private async drawPoster(): Promise<void> {
    this.orig.currentTime = 0.01;
    await new Promise<void>((resolve) => {
      this.orig.onseeked = () => {
        this.orig.onseeked = null;
        this.ctx.drawImage(this.orig, 0, 0, this.canvas.width, this.canvas.height);
        resolve();
      };
    });
  }

  private async initLandmarker(): Promise<void> {
    this.setStatus("Loading hand tracker…");
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    this.landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.3,
      minHandPresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });
    this.setStatus("Hand tracker ready.");
  }

  enablePlaceholder(): void {
    if (!this.state.videoFile) return;
    this.state.usePlaceholder = true;
    this.state.haveAi = false;
    this.state.canPreview = true;
    this.setStatus("Placeholder style active — preview or export, no key needed.");
  }

  async generateAi(): Promise<void> {
    if (!this.state.videoFile) return;
    if (!this.state.geminiKey.trim()) {
      this.setStatus("Add your Gemini API key first (or use placeholder).");
      return;
    }

    this.state.isWorking = true;
    this.onChange?.();
    try {
      const blob = await stylizeVideo({
        apiKey: this.state.geminiKey.trim(),
        videoFile: this.state.videoFile,
        styleKey: this.state.styleKey,
        customPrompt: this.state.customStyle,
        onStatus: (msg) => this.setStatus(msg),
      });
      this.sty.src = URL.createObjectURL(blob);
      await new Promise<void>((resolve) => {
        this.sty.onloadedmetadata = () => resolve();
      });
      this.state.haveAi = true;
      this.state.usePlaceholder = false;
      this.state.canPreview = true;
      this.setStatus("AI video ready — preview or export.");
    } catch (error) {
      this.setStatus(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.state.isWorking = false;
      this.onChange?.();
    }
  }

  private renderFrame(): void {
    this.ctx.drawImage(this.orig, 0, 0, this.canvas.width, this.canvas.height);

    if (this.landmarker && this.orig.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.orig.currentTime;
      const result = this.landmarker.detectForVideo(this.orig, performance.now());
      const hands = (result.landmarks ?? []).map((hand) =>
        hand.map((lm) => ({ x: lm.x, y: lm.y }))
      );
      this.tracker?.update(hands);
    }

    if (this.state.haveAi && Math.abs(this.sty.currentTime - this.orig.currentTime) > 0.15) {
      this.sty.currentTime = this.orig.currentTime;
    }

    const quad = this.tracker?.getCorners();
    const presence = this.tracker?.getPresence() ?? 0;
    if (quad && presence > 0.01 && (this.state.haveAi || this.state.usePlaceholder)) {
      drawWindow(
        this.ctx,
        quad,
        presence,
        this.orig,
        this.state.haveAi ? this.sty : null,
        this.state.usePlaceholder
      );
      drawOutline(this.ctx, quad, presence, this.orig.currentTime);
    }
  }

  private loop = (): void => {
    if (!this.orig.paused && !this.orig.ended) {
      this.renderFrame();
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private stopLoop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  async playPreview(): Promise<void> {
    if (this.exporting || !this.state.canPreview) return;
    this.tracker?.reset();
    this.stopLoop();
    this.orig.currentTime = 0;
    if (this.state.haveAi) {
      this.sty.currentTime = 0;
      void this.sty.play();
    }
    this.setStatus("Previewing…");
    await this.orig.play();
    this.loop();
  }

  async exportVideo(): Promise<void> {
    if (this.exporting || !this.state.canPreview) return;
    this.exporting = true;
    this.state.isWorking = true;
    this.onChange?.();
    this.setStatus("Exporting — playing through once…");

    const stream = this.canvas.captureStream(30);
    const mime =
      ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find(
        (m) => MediaRecorder.isTypeSupported(m)
      ) ?? "video/webm";
    const isMp4 = mime.startsWith("video/mp4");

    this.recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
    const chunks: Blob[] = [];

    await new Promise<void>((resolve) => {
      this.recorder!.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      this.recorder!.onstop = () => {
        const ext = isMp4 ? "mp4" : "webm";
        const blob = new Blob(chunks, { type: isMp4 ? "video/mp4" : "video/webm" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `finger-frame.${ext}`;
        link.click();
        this.setStatus(
          isMp4
            ? `Exported finger-frame.${ext}.`
            : `Exported finger-frame.${ext}. Convert with: ffmpeg -i finger-frame.webm -c:v libx264 out.mp4`
        );
        resolve();
      };

      this.orig.onended = () => {
        this.orig.onended = null;
        this.recorder?.stop();
      };

      this.recorder!.start();
      void this.playPreview();
    });

    this.exporting = false;
    this.state.isWorking = false;
    this.onChange?.();
  }
}
