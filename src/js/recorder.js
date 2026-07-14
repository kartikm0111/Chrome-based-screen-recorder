/*!
 * ScreenForge — Recorder core
 * A tiny event-driven wrapper around getDisplayMedia / getUserMedia / MediaRecorder.
 *
 * Emits:
 *   'statechange'  → 'idle' | 'recording' | 'paused' | 'ready' | 'error'
 *   'dataavailable'
 *   'tick'         → elapsed ms
 *   'error'        → Error
 *   'stopped'      → { blob, url, mimeType, sizeBytes, durationMs }
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
     * Returns { stream, cleanup } — stream carries the merged audio + video.
     */
    function mergeAudio(displayStream, micStream) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return { stream: displayStream, cleanup: () => {} };

        const displayAudioTracks = displayStream.getAudioTracks();
        const micAudioTracks     = micStream ? micStream.getAudioTracks() : [];

        // Nothing to merge — return the display stream (with mic tracks added, if any).
        if (displayAudioTracks.length === 0 && micAudioTracks.length === 0) {
            return { stream: displayStream, cleanup: () => {} };
        }

        const ctx  = new AC();
        const dest = ctx.createMediaStreamDestination();

        if (displayAudioTracks.length) {
            const src = ctx.createMediaStreamSource(new MediaStream(displayAudioTracks));
            const gain = ctx.createGain();
            gain.gain.value = 0.9;
            src.connect(gain).connect(dest);
        }

        if (micAudioTracks.length) {
            const src = ctx.createMediaStreamSource(new MediaStream(micAudioTracks));
            const gain = ctx.createGain();
            gain.gain.value = 1.0;
            src.connect(gain).connect(dest);
        }

        // Compose final stream: display video + merged audio.
        const merged = new MediaStream();
        displayStream.getVideoTracks().forEach(t => merged.addTrack(t));
        dest.stream.getAudioTracks().forEach(t => merged.addTrack(t));

        return {
            stream: merged,
            cleanup: () => { try { ctx.close(); } catch (_) {} }
        };
    }

    /** Pick the best supported mime type, falling back gracefully. */
    function pickMimeType(preferred) {
        const candidates = [
            preferred,
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm;codecs=h264,opus",
            "video/webm"
        ].filter(Boolean);

        for (const type of candidates) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
        }
        return "";
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

    class Recorder extends Emitter {
        constructor() {
            super();
            this.state = "idle";
            this._chunks = [];
            this._mediaRecorder = null;
            this._displayStream = null;
            this._micStream = null;
            this._workingStream = null;
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
         * @param {object} opts
         * @param {boolean} opts.mic
         * @param {boolean} opts.systemAudio
         * @param {number}  opts.height          preferred video height (e.g. 720)
         * @param {string}  opts.mimeType        preferred mime type
         */
        async start(opts = {}) {
            if (this.state === "recording" || this.state === "paused") {
                throw new Error("Recorder is already active.");
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error("This browser doesn't support screen capture (getDisplayMedia).");
            }

            const mime = pickMimeType(opts.mimeType);
            if (!mime) {
                throw new Error("No supported WebM codec found in this browser.");
            }
            this._mimeType = mime;

            // 1. Ask for display media
            const displayConstraints = {
                video: {
                    frameRate: { ideal: 30, max: 60 },
                    height:    { ideal: opts.height || 720 }
                },
                audio: !!opts.systemAudio
            };

            let displayStream;
            try {
                displayStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
            } catch (err) {
                if (err && (err.name === "NotAllowedError" || err.name === "AbortError")) {
                    throw new Error("Screen capture was cancelled.");
                }
                throw err;
            }
            this._displayStream = displayStream;

            // 2. Optionally grab the mic
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
                    // Don't kill the whole flow — carry on without the mic.
                    console.warn("[recorder] microphone unavailable:", err);
                    this.emit("micerror", err);
                }
            }

            // 3. Merge audio (mic + system) into a single stream
            const merged = mergeAudio(displayStream, micStream);
            this._workingStream = merged.stream;
            this._cleanupAudio  = merged.cleanup;

            // 4. Fire up MediaRecorder
            let mr;
            try {
                mr = new MediaRecorder(this._workingStream, {
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

            // If the user hits Chrome's "Stop sharing" button, wrap things up.
            displayStream.getVideoTracks().forEach(t => {
                t.addEventListener("ended", () => {
                    if (this.state === "recording" || this.state === "paused") this.stop();
                });
            });

            mr.start(1000); // 1s time-slices
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

        async _finalise() {
            const blob = new Blob(this._chunks, { type: this._mimeType });
            const url  = URL.createObjectURL(blob);
            const payload = {
                blob,
                url,
                mimeType: this._mimeType,
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
            try { this._cleanupAudio(); } catch (_) {}
            [this._displayStream, this._micStream, this._workingStream].forEach(s => {
                if (!s) return;
                s.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
            });
            this._displayStream = null;
            this._micStream = null;
            this._workingStream = null;
            this._mediaRecorder = null;
        }

        reset() {
            this._chunks = [];
            this._elapsedMs = 0;
            this._setState("idle");
        }
    }

    global.ScreenForge = {
        Recorder,
        util: { pickMimeType, bytesToHuman, msToClock }
    };
})(window);
