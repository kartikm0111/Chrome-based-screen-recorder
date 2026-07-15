/*!
 * ScreenForge — Recorder core (v1.1)
 * A tiny event-driven wrapper around getDisplayMedia / getUserMedia / MediaRecorder.
 *
 * v1.1 additions:
 *   - Webcam picture-in-picture overlay composited onto the recording (canvas pipeline)
 *   - MP4 export where the browser's MediaRecorder supports it
 *   - Screenshot capture (PNG) of the shared screen
 *   - Trim helper (re-encode a time range of the recorded blob)
 *
 * Emits:
 *   'statechange'  → 'idle' | 'recording' | 'paused' | 'ready' | 'error'
 *   'dataavailable'
 *   'tick'         → elapsed ms
 *   'error'        → Error
 *   'micerror'     → Error (non-fatal)
 *   'camerror'     → Error (non-fatal)
 *   'stopped'      → { blob, url, mimeType, ext, sizeBytes, durationMs, ... }
 */

(function (global) {
    "use strict";

    class Emitter {
        constructor() { this._h = {}; }
        on(evt, fn)   { (this._h[evt] = this._h[evt] || []).push(fn); return this; }
        off(evt, fn)  { if (!this._h[evt]) return this; this._h[evt] = this._h[evt].filter(x => x !== fn); return this; }
        emit(evt, p)  { (this._h[evt] || []).forEach(fn => { try { fn(p); } catch (e) { console.error(e); } }); }
    }

    /**
     * Merge display + mic audio into a single track using WebAudio.
     * Returns { tracks, cleanup } — the merged audio tracks (possibly empty).
     */
    function mergeAudio(displayStream, micStream) {
        const AC = window.AudioContext || window.webkitAudioContext;

        const displayAudioTracks = displayStream.getAudioTracks();
        const micAudioTracks     = micStream ? micStream.getAudioTracks() : [];

        if (!AC || (displayAudioTracks.length === 0 && micAudioTracks.length === 0)) {
            return {
                tracks: [...displayAudioTracks, ...micAudioTracks],
                cleanup: () => {}
            };
        }

        const ctx  = new AC();
        const dest = ctx.createMediaStreamDestination();

        if (displayAudioTracks.length) {
            const src  = ctx.createMediaStreamSource(new MediaStream(displayAudioTracks));
            const gain = ctx.createGain();
            gain.gain.value = 0.9;
            src.connect(gain).connect(dest);
        }

        if (micAudioTracks.length) {
            const src  = ctx.createMediaStreamSource(new MediaStream(micAudioTracks));
            const gain = ctx.createGain();
            gain.gain.value = 1.0;
            src.connect(gain).connect(dest);
        }

        return {
            tracks: dest.stream.getAudioTracks(),
            cleanup: () => { try { ctx.close(); } catch (_) {} }
        };
    }

    /** Ordered candidates for a given container preference. */
    function mimeCandidates(preferred) {
        const webm = [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm;codecs=h264,opus",
            "video/webm"
        ];
        const mp4 = [
            "video/mp4;codecs=avc1.64003E,mp4a.40.2",
            "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
            "video/mp4"
        ];
        if (!preferred) return webm;
        if (preferred.startsWith("video/mp4")) return [preferred, ...mp4, ...webm];
        return [preferred, ...webm];
    }

    /** Pick the best supported mime type, falling back gracefully. */
    function pickMimeType(preferred) {
        for (const type of mimeCandidates(preferred)) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
        }
        return "";
    }

    /** True if this browser's MediaRecorder can produce MP4 directly. */
    function supportsMp4() {
        return !!(window.MediaRecorder && (
            MediaRecorder.isTypeSupported("video/mp4") ||
            MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E,mp4a.40.2")
        ));
    }

    function extForMime(mime) {
        return (mime || "").startsWith("video/mp4") ? "mp4" : "webm";
    }

    function bytesToHuman(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
        const u = ["B", "KB", "MB", "GB"];
        const i = Math.min(u.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
        return (bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0) + " " + u[i];
    }

    function msToClock(ms) {
        const total = Math.max(0, Math.floor(ms / 1000));
        const h = String(Math.floor(total / 3600)).padStart(2, "0");
        const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
        const s = String(total % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    }

    /* ------------------------------------------------------------------ *
     *  Webcam PiP compositor
     *  Draws screen + webcam bubble onto a canvas at 30fps and returns
     *  the canvas capture stream's video track.
     * ------------------------------------------------------------------ */
    class PipCompositor {
        constructor(displayTrack, camStream, position) {
            this.position = position || "bottom-right";
            this._raf = null;
            this._running = false;

            this.screenVideo = document.createElement("video");
            this.screenVideo.srcObject = new MediaStream([displayTrack]);
            this.screenVideo.muted = true;
            this.screenVideo.playsInline = true;

            this.camVideo = document.createElement("video");
            this.camVideo.srcObject = camStream;
            this.camVideo.muted = true;
            this.camVideo.playsInline = true;

            const settings = displayTrack.getSettings();
            this.canvas = document.createElement("canvas");
            this.canvas.width  = settings.width  || 1280;
            this.canvas.height = settings.height || 720;
            this.ctx = this.canvas.getContext("2d");
        }

        async start() {
            await Promise.all([this.screenVideo.play(), this.camVideo.play()]);

            const vw = this.screenVideo.videoWidth;
            const vh = this.screenVideo.videoHeight;
            if (vw && vh) { this.canvas.width = vw; this.canvas.height = vh; }

            this._running = true;
            const draw = () => {
                if (!this._running) return;
                const { canvas, ctx } = this;

                ctx.drawImage(this.screenVideo, 0, 0, canvas.width, canvas.height);

                const camW = this.camVideo.videoWidth  || 640;
                const camH = this.camVideo.videoHeight || 480;
                const dia  = Math.max(96, Math.round(canvas.width * 0.18));
                const pad  = Math.round(canvas.width * 0.02);

                let x = pad, y = canvas.height - dia - pad;
                if (this.position.includes("right")) x = canvas.width - dia - pad;
                if (this.position.includes("top"))   y = pad;

                // Cover-fit the webcam into a circular clip.
                const scale = Math.max(dia / camW, dia / camH);
                const sw = dia / scale, sh = dia / scale;
                const sx = (camW - sw) / 2, sy = (camH - sh) / 2;

                ctx.save();
                ctx.beginPath();
                ctx.arc(x + dia / 2, y + dia / 2, dia / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.strokeStyle = "rgba(255,255,255,0.85)";
                ctx.lineWidth = Math.max(2, dia * 0.02);
                ctx.stroke();
                ctx.clip();
                ctx.drawImage(this.camVideo, sx, sy, sw, sh, x, y, dia, dia);
                ctx.restore();

                this._raf = requestAnimationFrame(draw);
            };
            draw();

            const stream = this.canvas.captureStream(30);
            return stream.getVideoTracks()[0];
        }

        stop() {
            this._running = false;
            if (this._raf) cancelAnimationFrame(this._raf);
            [this.screenVideo, this.camVideo].forEach(v => {
                try { v.pause(); v.srcObject = null; } catch (_) {}
            });
        }
    }

    /* ------------------------------------------------------------------ *
     *  Recorder
     * ------------------------------------------------------------------ */
    class Recorder extends Emitter {
        constructor() {
            super();
            this.state = "idle";
            this._chunks = [];
            this._mediaRecorder = null;
            this._displayStream = null;
            this._micStream = null;
            this._camStream = null;
            this._compositor = null;
            this._cleanupAudio = () => {};
            this._tickHandle = null;
            this._elapsedMs = 0;
            this._resumeTs = 0;
            this._mimeType = "";
        }

        get isRecording() { return this.state === "recording"; }
        get isPaused()    { return this.state === "paused"; }

        _setState(s) {
            if (this.state === s) return;
            this.state = s;
            this.emit("statechange", s);
        }

        _startTick() {
            this._resumeTs = performance.now();
            const loop = () => {
                if (this.state !== "recording") return;
                const now = performance.now();
                const elapsed = this._elapsedMs + (now - this._resumeTs);
                this.emit("tick", elapsed);
                this._tickHandle = requestAnimationFrame(loop);
            };
            this._tickHandle = requestAnimationFrame(loop);
        }

        _stopTick(commit) {
            if (this._tickHandle) cancelAnimationFrame(this._tickHandle);
            this._tickHandle = null;
            if (commit) {
                this._elapsedMs += (performance.now() - this._resumeTs);
            }
        }

        /**
         * Begin a new recording.
         * @param {object}  opts
         * @param {string}  opts.mode        'screen' (default) | 'webcam' — webcam-only skips screen share
         * @param {boolean} opts.mic
         * @param {boolean} opts.systemAudio
         * @param {boolean} opts.webcam      composite a webcam PiP bubble (screen mode only)
         * @param {string}  opts.webcamPos   'bottom-right'|'bottom-left'|'top-right'|'top-left'
         * @param {number}  opts.height      preferred video height (e.g. 720)
         * @param {string}  opts.mimeType    preferred mime type ('video/mp4...' allowed)
         */
        async start(opts = {}) {
            if (this.state === "recording" || this.state === "paused") {
                throw new Error("Recorder is already active.");
            }

            const webcamOnly = opts.mode === "webcam";

            if (!navigator.mediaDevices ||
                (!webcamOnly && !navigator.mediaDevices.getDisplayMedia) ||
                (webcamOnly && !navigator.mediaDevices.getUserMedia)) {
                throw new Error("This browser doesn't support the required capture APIs.");
            }

            const mime = pickMimeType(opts.mimeType);
            if (!mime) {
                throw new Error("No supported recording codec found in this browser.");
            }
            this._mimeType = mime;

            // 1. Primary video source — screen share, or the webcam itself.
            let displayStream;
            if (webcamOnly) {
                try {
                    displayStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            frameRate: { ideal: 30 },
                            height:    { ideal: opts.height || 720 },
                            facingMode: "user"
                        },
                        audio: false
                    });
                } catch (err) {
                    if (err && (err.name === "NotAllowedError" || err.name === "AbortError")) {
                        throw new Error("Webcam access was denied.");
                    }
                    throw err;
                }
            } else {
                const displayConstraints = {
                    video: {
                        frameRate: { ideal: 30, max: 60 },
                        height:    { ideal: opts.height || 720 }
                    },
                    audio: !!opts.systemAudio
                };

                try {
                    displayStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
                } catch (err) {
                    if (err && (err.name === "NotAllowedError" || err.name === "AbortError")) {
                        throw new Error("Screen capture was cancelled.");
                    }
                    throw err;
                }
            }
            this._displayStream = displayStream;

            // 2. Microphone (optional, non-fatal)
            let micStream = null;
            if (opts.mic) {
                try {
                    micStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl:  true
                        }
                    });
                    this._micStream = micStream;
                } catch (err) {
                    console.warn("[recorder] microphone unavailable:", err);
                    this.emit("micerror", err);
                }
            }

            // 3. Webcam PiP (optional, non-fatal; screen mode only — pointless over the webcam itself)
            let videoTrack = displayStream.getVideoTracks()[0];
            if (opts.webcam && !webcamOnly) {
                try {
                    const camStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
                    });
                    this._camStream = camStream;
                    this._compositor = new PipCompositor(videoTrack, camStream, opts.webcamPos);
                    videoTrack = await this._compositor.start();
                } catch (err) {
                    console.warn("[recorder] webcam unavailable:", err);
                    this.emit("camerror", err);
                }
            }

            // 4. Merge audio (mic + system) into single-track audio
            const mixed = mergeAudio(displayStream, micStream);
            this._cleanupAudio = mixed.cleanup;

            const workingStream = new MediaStream([videoTrack, ...mixed.tracks]);

            // 5. MediaRecorder
            let mr;
            try {
                mr = new MediaRecorder(workingStream, {
                    mimeType: mime,
                    videoBitsPerSecond: 3_500_000,
                    audioBitsPerSecond: 128_000
                });
            } catch (err) {
                await this._teardownStreams();
                throw new Error("Failed to initialise MediaRecorder: " + err.message);
            }
            this._mediaRecorder = mr;
            this._chunks = [];
            this._elapsedMs = 0;

            mr.ondataavailable = (evt) => {
                if (evt.data && evt.data.size > 0) {
                    this._chunks.push(evt.data);
                    this.emit("dataavailable", evt.data);
                }
            };

            mr.onerror = (evt) => {
                this._setState("error");
                this.emit("error", evt.error || new Error("MediaRecorder error"));
            };

            mr.onstop = () => this._finalise();

            // If the user hits the browser's "Stop sharing" bar, wrap up.
            displayStream.getVideoTracks().forEach(t => {
                t.addEventListener("ended", () => {
                    if (this.state === "recording" || this.state === "paused") this.stop();
                });
            });

            mr.start(1000);
            this._setState("recording");
            this._startTick();
        }

        pause() {
            if (this.state !== "recording") return;
            this._mediaRecorder.pause();
            this._stopTick(true);
            this._setState("paused");
        }

        resume() {
            if (this.state !== "paused") return;
            this._mediaRecorder.resume();
            this._setState("recording");
            this._startTick();
        }

        stop() {
            if (this.state !== "recording" && this.state !== "paused") return;
            if (this.state === "recording") this._stopTick(true);
            try { this._mediaRecorder.stop(); }
            catch (e) { console.warn("[recorder] stop failed:", e); }
        }

        /**
         * Grab a still PNG of the live shared screen (only while recording/paused).
         * Resolves { blob, url }.
         */
        async screenshot() {
            const track = this._displayStream && this._displayStream.getVideoTracks()[0];
            if (!track || track.readyState !== "live") {
                throw new Error("No live screen to capture. Start a recording first.");
            }

            const video = document.createElement("video");
            video.srcObject = new MediaStream([track]);
            video.muted = true;
            video.playsInline = true;
            await video.play();

            const canvas = document.createElement("canvas");
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext("2d").drawImage(video, 0, 0);
            video.pause(); video.srcObject = null;

            const blob = await new Promise((res, rej) =>
                canvas.toBlob(b => b ? res(b) : rej(new Error("Screenshot failed.")), "image/png"));
            return { blob, url: URL.createObjectURL(blob) };
        }

        async _finalise() {
            const blob = new Blob(this._chunks, { type: this._mimeType });
            const url  = URL.createObjectURL(blob);
            const payload = {
                blob,
                url,
                mimeType: this._mimeType,
                ext: extForMime(this._mimeType),
                sizeBytes: blob.size,
                durationMs: this._elapsedMs,
                sizeText: bytesToHuman(blob.size),
                durationText: msToClock(this._elapsedMs)
            };
            await this._teardownStreams();
            this._setState("ready");
            this.emit("stopped", payload);
        }

        async _teardownStreams() {
            if (this._compositor) { try { this._compositor.stop(); } catch (_) {} this._compositor = null; }
            try { this._cleanupAudio(); } catch (_) {}
            [this._displayStream, this._micStream, this._camStream].forEach(s => {
                if (!s) return;
                s.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
            });
            this._displayStream = null;
            this._micStream = null;
            this._camStream = null;
            this._mediaRecorder = null;
        }

        reset() {
            this._chunks = [];
            this._elapsedMs = 0;
            this._setState("idle");
        }
    }

    /* ------------------------------------------------------------------ *
     *  Trim — re-encode a [startMs, endMs] slice of a recorded blob by
     *  playing it through a hidden <video> and re-capturing in real time.
     *  Reports progress via onProgress(0..1).
     * ------------------------------------------------------------------ */
    async function trimRecording(srcBlob, startMs, endMs, onProgress) {
        if (endMs - startMs < 250) throw new Error("Selection is too short to trim.");

        const srcUrl = URL.createObjectURL(srcBlob);
        const video  = document.createElement("video");
        video.src = srcUrl;
        video.playsInline = true;
        video.style.position = "fixed";
        video.style.left = "-9999px";
        video.style.width = "2px";
        document.body.appendChild(video);

        const cleanup = () => {
            try { video.pause(); } catch (_) {}
            video.remove();
            URL.revokeObjectURL(srcUrl);
        };

        try {
            await new Promise((res, rej) => {
                video.onloadedmetadata = res;
                video.onerror = () => rej(new Error("Could not open the recording for trimming."));
            });

            video.currentTime = startMs / 1000;
            await new Promise((res) => { video.onseeked = res; });

            const capture = video.captureStream ? video.captureStream() : video.mozCaptureStream();
            const mime = pickMimeType(srcBlob.type) || "video/webm";
            const rec  = new MediaRecorder(capture, { mimeType: mime, videoBitsPerSecond: 3_500_000 });
            const chunks = [];
            rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

            const done = new Promise((res, rej) => {
                rec.onstop  = res;
                rec.onerror = (e) => rej(e.error || new Error("Trim encoder failed."));
            });

            rec.start(250);
            // Play silently for the user but keep audio in the capture stream.
            video.muted = false;
            video.volume = 0.0001;
            await video.play();

            await new Promise((res) => {
                const tick = () => {
                    const t = video.currentTime * 1000;
                    if (onProgress) onProgress(Math.min(1, (t - startMs) / (endMs - startMs)));
                    if (t >= endMs || video.ended) { res(); return; }
                    requestAnimationFrame(tick);
                };
                tick();
            });

            rec.stop();
            video.pause();
            await done;

            const blob = new Blob(chunks, { type: mime });
            return {
                blob,
                url: URL.createObjectURL(blob),
                mimeType: mime,
                ext: extForMime(mime),
                sizeBytes: blob.size,
                durationMs: endMs - startMs,
                sizeText: bytesToHuman(blob.size),
                durationText: msToClock(endMs - startMs)
            };
        } finally {
            cleanup();
        }
    }

    global.ScreenForge = {
        Recorder,
        trimRecording,
        util: { pickMimeType, supportsMp4, extForMime, bytesToHuman, msToClock }
    };
})(window);
