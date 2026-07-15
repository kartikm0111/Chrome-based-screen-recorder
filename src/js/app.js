/*!
 * ScreenForge — UI wiring (v1.1)
 * Connects the DOM controls to the Recorder core.
 *
 * v1.1 additions:
 *   - Countdown before recording starts
 *   - Webcam PiP toggle + position
 *   - MP4 option surfaced when the browser supports it
 *   - Screenshot (PNG) capture while recording
 *   - In-browser trim with dual sliders
 *   - Custom hotkey remapping
 *   - All preferences persisted to localStorage
 */

(function () {
    "use strict";

    const $ = (sel) => document.querySelector(sel);

    // ---- Element refs ----
    const els = {
        micToggle:      $("#micToggle"),
        sysAudioToggle: $("#sysAudioToggle"),
        camToggle:      $("#camToggle"),
        camPosField:    $("#camPosField"),
        camPosSelect:   $("#camPosSelect"),
        countdown:      $("#countdownSelect"),
        quality:        $("#qualitySelect"),
        mime:           $("#mimeSelect"),
        mp4Option:      $("#mp4Option"),

        startBtn:       $("#startBtn"),
        pauseBtn:       $("#pauseBtn"),
        resumeBtn:      $("#resumeBtn"),
        stopBtn:        $("#stopBtn"),
        shotBtn:        $("#shotBtn"),

        downloadBtn:    $("#downloadBtn"),
        downloadLabel:  $("#downloadLabel"),
        trimBtn:        $("#trimBtn"),
        newBtn:         $("#newBtn"),

        trimPanel:      $("#trimPanel"),
        trimStart:      $("#trimStart"),
        trimEnd:        $("#trimEnd"),
        trimRange:      $("#trimRange"),
        trimApplyBtn:   $("#trimApplyBtn"),
        trimCancelBtn:  $("#trimCancelBtn"),
        trimProgress:   $("#trimProgress"),

        preview:        $("#preview"),
        overlay:        $("#previewOverlay"),
        recBadge:       $("#recBadge"),
        countdownOverlay: $("#countdownOverlay"),
        countdownNum:   $("#countdownNum"),

        hotkeyRecordBtn: $("#hotkeyRecordBtn"),
        hotkeyPauseBtn:  $("#hotkeyPauseBtn"),

        statusText:     $("#statusText"),
        statusDot:      $("#statusDot"),
        timer:          $("#timer"),
        fileMeta:       $("#fileMeta"),
        toast:          $("#toast")
    };

    if (!("ScreenForge" in window)) {
        console.error("Recorder core failed to load.");
        return;
    }

    const util = window.ScreenForge.util;
    const recorder = new window.ScreenForge.Recorder();
    let currentPayload = null;
    let toastTimer = null;
    let countdownAbort = null;

    /* ------------------------------------------------------------------ *
     *  Preferences (localStorage)
     * ------------------------------------------------------------------ */
    const PREFS_KEY = "screenforge:prefs:v1";

    const defaultPrefs = {
        mic: true,
        systemAudio: true,
        webcam: false,
        webcamPos: "bottom-right",
        countdown: 3,
        quality: "720",
        mime: "video/webm;codecs=vp9,opus",
        hotkeyRecord: "r",
        hotkeyPause: " "
    };

    function loadPrefs() {
        try {
            const raw = localStorage.getItem(PREFS_KEY);
            return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : { ...defaultPrefs };
        } catch (_) {
            return { ...defaultPrefs };
        }
    }

    function savePrefs() {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (_) {}
    }

    const prefs = loadPrefs();

    function keyLabel(k) {
        if (k === " ") return "Space";
        if (k.length === 1) return k.toUpperCase();
        return k.charAt(0).toUpperCase() + k.slice(1); // e.g. Enter, Escape
    }

    function applyPrefsToUI() {
        els.micToggle.checked      = prefs.mic;
        els.sysAudioToggle.checked = prefs.systemAudio;
        els.camToggle.checked      = prefs.webcam;
        els.camPosSelect.value     = prefs.webcamPos;
        els.camPosField.hidden     = !prefs.webcam;
        els.countdown.value        = String(prefs.countdown);
        els.quality.value          = prefs.quality;

        // Only restore the mime if it's still a valid, visible option.
        const opt = [...els.mime.options].find(o => o.value === prefs.mime && !o.hidden);
        els.mime.value = opt ? prefs.mime : "video/webm;codecs=vp9,opus";

        els.hotkeyRecordBtn.textContent = keyLabel(prefs.hotkeyRecord);
        els.hotkeyPauseBtn.textContent  = keyLabel(prefs.hotkeyPause);
    }

    /* ------------------------------------------------------------------ *
     *  Helpers
     * ------------------------------------------------------------------ */

    function setStatus(label, kind) {
        els.statusText.textContent = label;
        els.statusDot.className = `status__dot status__dot--${kind}`;
    }

    function toast(msg, kind) {
        els.toast.textContent = msg;
        els.toast.classList.add("is-visible");
        els.toast.classList.toggle("toast--error", kind === "error");
        els.toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            els.toast.classList.remove("is-visible");
            setTimeout(() => { els.toast.hidden = true; }, 300);
        }, 3200);
    }

    function setRunningUI(running, paused) {
        els.startBtn.disabled = running;
        els.pauseBtn.disabled = !running || paused;
        els.stopBtn.disabled  = !running;
        els.shotBtn.disabled  = !running;

        if (paused) {
            els.pauseBtn.hidden  = true;
            els.resumeBtn.hidden = false;
            els.resumeBtn.disabled = false;
        } else {
            els.pauseBtn.hidden  = false;
            els.resumeBtn.hidden = true;
            els.resumeBtn.disabled = true;
        }

        [els.micToggle, els.sysAudioToggle, els.camToggle,
         els.camPosSelect, els.countdown, els.quality, els.mime]
            .forEach(el => { el.disabled = running; });

        els.recBadge.hidden = !running || paused;
    }

    function tsFilename(ext) {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return `screenforge-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.${ext}`;
    }

    function revokePreview() {
        if (currentPayload && currentPayload.url) {
            try { URL.revokeObjectURL(currentPayload.url); } catch (_) {}
        }
        currentPayload = null;
    }

    function resetPreview() {
        revokePreview();
        els.preview.removeAttribute("src");
        els.preview.classList.remove("is-visible");
        els.overlay.style.display = "";
        els.downloadBtn.disabled = true;
        els.trimBtn.disabled = true;
        els.newBtn.disabled = true;
        els.fileMeta.hidden = true;
        els.fileMeta.textContent = "";
        els.timer.textContent = "00:00:00";
        els.trimPanel.hidden = true;
    }

    function showPayload(payload, message) {
        currentPayload = payload;
        els.preview.src = payload.url;
        els.preview.classList.add("is-visible");
        els.overlay.style.display = "none";
        els.downloadBtn.disabled = false;
        els.trimBtn.disabled = false;
        els.newBtn.disabled = false;
        els.downloadLabel.textContent = `Download ${payload.ext.toUpperCase()}`;
        els.fileMeta.hidden = false;
        els.fileMeta.textContent = `${payload.sizeText} · ${payload.durationText} · ${payload.mimeType.split(";")[0]}`;
        if (message) toast(message);
    }

    /* ------------------------------------------------------------------ *
     *  Feature detection
     * ------------------------------------------------------------------ */

    (function featureCheck() {
        const hasDisplay = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
        const hasRecord  = "MediaRecorder" in window;

        if (!hasDisplay || !hasRecord) {
            els.startBtn.disabled = true;
            setStatus("Unsupported browser", "error");
            toast(
                "Your browser doesn't support screen recording. Try the latest Chrome, Edge, or Firefox.",
                "error"
            );
            return;
        }

        // Surface the MP4 option only when the browser can actually record it.
        if (util.supportsMp4()) {
            els.mp4Option.hidden = false;
        }
    })();

    /* ------------------------------------------------------------------ *
     *  Recorder events
     * ------------------------------------------------------------------ */

    recorder.on("statechange", (state) => {
        switch (state) {
            case "recording":
                setStatus("Recording", "recording");
                setRunningUI(true, false);
                break;
            case "paused":
                setStatus("Paused", "paused");
                setRunningUI(true, true);
                break;
            case "ready":
                setStatus("Ready", "ready");
                setRunningUI(false, false);
                break;
            case "idle":
                setStatus("Idle", "idle");
                setRunningUI(false, false);
                break;
            case "error":
                setStatus("Error", "error");
                setRunningUI(false, false);
                break;
        }
    });

    recorder.on("tick", (ms) => {
        els.timer.textContent = util.msToClock(ms);
    });

    recorder.on("error", (err) => {
        console.error(err);
        toast(err.message || "Something went wrong.", "error");
    });

    recorder.on("micerror", () => {
        toast("Microphone unavailable — continuing without it.", "error");
    });

    recorder.on("camerror", () => {
        toast("Webcam unavailable — continuing without the overlay.", "error");
    });

    recorder.on("stopped", (payload) => {
        showPayload(payload, "Recording ready — preview and download below.");
    });

    /* ------------------------------------------------------------------ *
     *  Countdown
     * ------------------------------------------------------------------ */

    function runCountdown(seconds) {
        return new Promise((resolve, reject) => {
            if (!seconds) { resolve(); return; }

            let n = seconds;
            els.countdownOverlay.hidden = false;
            els.overlay.style.display = "none";
            els.countdownNum.textContent = n;

            const interval = setInterval(() => {
                n -= 1;
                if (n <= 0) {
                    finish();
                    resolve();
                } else {
                    els.countdownNum.textContent = n;
                }
            }, 1000);

            function finish() {
                clearInterval(interval);
                els.countdownOverlay.hidden = true;
                if (!els.preview.classList.contains("is-visible")) {
                    els.overlay.style.display = "";
                }
                countdownAbort = null;
            }

            countdownAbort = () => {
                finish();
                reject(new Error("Countdown cancelled."));
            };
        });
    }

    /* ------------------------------------------------------------------ *
     *  Controls
     * ------------------------------------------------------------------ */

    els.startBtn.addEventListener("click", async () => {
        if (countdownAbort) return; // already counting down
        resetPreview();
        try {
            els.startBtn.disabled = true;
            els.stopBtn.disabled = false; // allow cancelling the countdown
            await runCountdown(parseInt(els.countdown.value, 10) || 0);
            await recorder.start({
                mic:         els.micToggle.checked,
                systemAudio: els.sysAudioToggle.checked,
                webcam:      els.camToggle.checked,
                webcamPos:   els.camPosSelect.value,
                height:      parseInt(els.quality.value, 10) || 720,
                mimeType:    els.mime.value
            });
        } catch (err) {
            console.warn(err);
            if (err.message !== "Countdown cancelled.") {
                toast(err.message || "Could not start recording.", "error");
            }
            els.stopBtn.disabled = true;
            setStatus("Idle", "idle");
            setRunningUI(false, false);
        }
    });

    els.pauseBtn.addEventListener("click", () => recorder.pause());
    els.resumeBtn.addEventListener("click", () => recorder.resume());
    els.stopBtn.addEventListener("click", () => {
        if (countdownAbort) { countdownAbort(); return; }
        recorder.stop();
    });

    els.shotBtn.addEventListener("click", async () => {
        try {
            const { blob, url } = await recorder.screenshot();
            const a = document.createElement("a");
            a.href = url;
            a.download = tsFilename("png");
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 5000);
            toast(`Screenshot saved (${util.bytesToHuman(blob.size)}).`);
        } catch (err) {
            toast(err.message, "error");
        }
    });

    els.downloadBtn.addEventListener("click", () => {
        if (!currentPayload) return;
        const a = document.createElement("a");
        a.href = currentPayload.url;
        a.download = tsFilename(currentPayload.ext);
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast("Download started.");
    });

    els.newBtn.addEventListener("click", () => {
        resetPreview();
        recorder.reset();
        setStatus("Idle", "idle");
    });

    /* ------------------------------------------------------------------ *
     *  Trim
     * ------------------------------------------------------------------ */

    let trimBusy = false;

    function fmtTrimRange() {
        if (!currentPayload) return;
        const total = currentPayload.durationMs;
        const s = (parseInt(els.trimStart.value, 10) / 1000) * total;
        const e = (parseInt(els.trimEnd.value, 10) / 1000) * total;
        els.trimRange.textContent = `${util.msToClock(s)} → ${util.msToClock(e)}`;
    }

    els.trimBtn.addEventListener("click", () => {
        if (!currentPayload) return;
        els.trimPanel.hidden = !els.trimPanel.hidden;
        els.trimStart.value = "0";
        els.trimEnd.value = "1000";
        fmtTrimRange();
    });

    els.trimStart.addEventListener("input", () => {
        if (parseInt(els.trimStart.value, 10) >= parseInt(els.trimEnd.value, 10)) {
            els.trimStart.value = String(parseInt(els.trimEnd.value, 10) - 1);
        }
        fmtTrimRange();
        if (currentPayload && Number.isFinite(els.preview.duration)) {
            els.preview.currentTime = (parseInt(els.trimStart.value, 10) / 1000) * els.preview.duration;
        }
    });

    els.trimEnd.addEventListener("input", () => {
        if (parseInt(els.trimEnd.value, 10) <= parseInt(els.trimStart.value, 10)) {
            els.trimEnd.value = String(parseInt(els.trimStart.value, 10) + 1);
        }
        fmtTrimRange();
        if (currentPayload && Number.isFinite(els.preview.duration)) {
            els.preview.currentTime = (parseInt(els.trimEnd.value, 10) / 1000) * els.preview.duration;
        }
    });

    els.trimCancelBtn.addEventListener("click", () => {
        if (trimBusy) return;
        els.trimPanel.hidden = true;
    });

    els.trimApplyBtn.addEventListener("click", async () => {
        if (!currentPayload || trimBusy) return;

        const total = currentPayload.durationMs;
        const startMs = (parseInt(els.trimStart.value, 10) / 1000) * total;
        const endMs   = (parseInt(els.trimEnd.value, 10) / 1000) * total;

        trimBusy = true;
        els.trimApplyBtn.disabled = true;
        els.trimProgress.hidden = false;
        els.trimProgress.textContent = "Trimming… 0%";
        setStatus("Trimming", "paused");

        try {
            const old = currentPayload;
            const trimmed = await window.ScreenForge.trimRecording(
                old.blob, startMs, endMs,
                (p) => { els.trimProgress.textContent = `Trimming… ${Math.round(p * 100)}%`; }
            );
            try { URL.revokeObjectURL(old.url); } catch (_) {}
            showPayload(trimmed, "Trim applied — the preview now shows the trimmed clip.");
            els.trimPanel.hidden = true;
            setStatus("Ready", "ready");
        } catch (err) {
            console.error(err);
            toast(err.message || "Trim failed.", "error");
            setStatus("Ready", "ready");
        } finally {
            trimBusy = false;
            els.trimApplyBtn.disabled = false;
            els.trimProgress.hidden = true;
        }
    });

    /* ------------------------------------------------------------------ *
     *  Hotkey remapping
     * ------------------------------------------------------------------ */

    let listeningBtn = null;

    function startListening(btn) {
        if (listeningBtn) stopListening();
        listeningBtn = btn;
        btn.classList.add("is-listening");
        btn.textContent = "…";
    }

    function stopListening() {
        if (!listeningBtn) return;
        listeningBtn.classList.remove("is-listening");
        listeningBtn.textContent = keyLabel(
            listeningBtn.dataset.action === "record" ? prefs.hotkeyRecord : prefs.hotkeyPause
        );
        listeningBtn = null;
    }

    [els.hotkeyRecordBtn, els.hotkeyPauseBtn].forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (listeningBtn === btn) { stopListening(); return; }
            startListening(btn);
        });
    });

    /* ------------------------------------------------------------------ *
     *  Keyboard shortcuts
     * ------------------------------------------------------------------ */

    document.addEventListener("keydown", (e) => {
        // Capture a new hotkey if a remap is in progress.
        if (listeningBtn) {
            e.preventDefault();
            const key = e.key.toLowerCase();
            if (key === "escape") { stopListening(); return; }

            const action = listeningBtn.dataset.action;
            const other  = action === "record" ? prefs.hotkeyPause : prefs.hotkeyRecord;
            if (key === other) {
                toast("That key is already used by the other shortcut.", "error");
                return;
            }
            if (action === "record") prefs.hotkeyRecord = key;
            else prefs.hotkeyPause = key;
            savePrefs();
            stopListening();
            toast(`Shortcut set to ${keyLabel(key)}.`);
            return;
        }

        if (e.target && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName)) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        const key = e.key.toLowerCase();

        if (key === prefs.hotkeyRecord) {
            e.preventDefault();
            if (recorder.state === "idle" || recorder.state === "ready") els.startBtn.click();
            else els.stopBtn.click();
        } else if (key === prefs.hotkeyPause) {
            if (recorder.state === "recording") { e.preventDefault(); els.pauseBtn.click(); }
            else if (recorder.state === "paused") { e.preventDefault(); els.resumeBtn.click(); }
        }
    });

    /* ------------------------------------------------------------------ *
     *  Preference persistence wiring
     * ------------------------------------------------------------------ */

    els.micToggle.addEventListener("change", () => { prefs.mic = els.micToggle.checked; savePrefs(); });
    els.sysAudioToggle.addEventListener("change", () => { prefs.systemAudio = els.sysAudioToggle.checked; savePrefs(); });
    els.camToggle.addEventListener("change", () => {
        prefs.webcam = els.camToggle.checked;
        els.camPosField.hidden = !prefs.webcam;
        savePrefs();
    });
    els.camPosSelect.addEventListener("change", () => { prefs.webcamPos = els.camPosSelect.value; savePrefs(); });
    els.countdown.addEventListener("change", () => { prefs.countdown = parseInt(els.countdown.value, 10) || 0; savePrefs(); });
    els.quality.addEventListener("change", () => { prefs.quality = els.quality.value; savePrefs(); });
    els.mime.addEventListener("change", () => { prefs.mime = els.mime.value; savePrefs(); });

    /* ------------------------------------------------------------------ *
     *  Unload guard + boot
     * ------------------------------------------------------------------ */

    window.addEventListener("beforeunload", (e) => {
        if (recorder.state === "recording" || recorder.state === "paused" || currentPayload) {
            e.preventDefault();
            e.returnValue = "";
        }
    });

    applyPrefsToUI();
    setStatus("Idle", "idle");
    setRunningUI(false, false);
})();
