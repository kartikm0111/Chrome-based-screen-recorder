/*!
 * ScreenForge — UI wiring
 * Connects the DOM controls to the Recorder core.
 */

(function () {
    "use strict";

    const $ = (sel) => document.querySelector(sel);

    // ---- Element refs ----
    const els = {
        micToggle:      $("#micToggle"),
        sysAudioToggle: $("#sysAudioToggle"),
        quality:        $("#qualitySelect"),
        mime:           $("#mimeSelect"),

        startBtn:       $("#startBtn"),
        pauseBtn:       $("#pauseBtn"),
        resumeBtn:      $("#resumeBtn"),
        stopBtn:        $("#stopBtn"),

        downloadBtn:    $("#downloadBtn"),
        newBtn:         $("#newBtn"),

        preview:        $("#preview"),
        overlay:        $("#previewOverlay"),
        recBadge:       $("#recBadge"),

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

    const recorder = new window.ScreenForge.Recorder();
    let currentPayload = null;
    let toastTimer = null;

    // ---- Helpers ----

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

        // Toggle Pause / Resume visibility
        if (paused) {
            els.pauseBtn.hidden  = true;
            els.resumeBtn.hidden = false;
            els.resumeBtn.disabled = false;
        } else {
            els.pauseBtn.hidden  = false;
            els.resumeBtn.hidden = true;
            els.resumeBtn.disabled = true;
        }

        // Freeze source toggles during a run
        els.micToggle.disabled       = running;
        els.sysAudioToggle.disabled  = running;
        els.quality.disabled         = running;
        els.mime.disabled            = running;

        els.recBadge.hidden = !running || paused;
    }

    function tsFilename() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return `screenforge-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.webm`;
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
        els.newBtn.disabled = true;
        els.fileMeta.hidden = true;
        els.fileMeta.textContent = "";
        els.timer.textContent = "00:00:00";
    }

    // ---- Feature detection ----

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
        }
    })();

    // ---- Recorder events ----

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
        els.timer.textContent = window.ScreenForge.util.msToClock(ms);
    });

    recorder.on("error", (err) => {
        console.error(err);
        toast(err.message || "Something went wrong.", "error");
    });

    recorder.on("micerror", () => {
        toast("Microphone unavailable — continuing without it.", "error");
    });

    recorder.on("stopped", (payload) => {
        currentPayload = payload;
        els.preview.src = payload.url;
        els.preview.classList.add("is-visible");
        els.overlay.style.display = "none";
        els.downloadBtn.disabled = false;
        els.newBtn.disabled = false;
        els.fileMeta.hidden = false;
        els.fileMeta.textContent = `${payload.sizeText} · ${payload.durationText} · ${payload.mimeType.split(";")[0]}`;
        toast("Recording ready — preview and download below.");
    });

    // ---- Control wiring ----

    els.startBtn.addEventListener("click", async () => {
        resetPreview();
        try {
            await recorder.start({
                mic:         els.micToggle.checked,
                systemAudio: els.sysAudioToggle.checked,
                height:      parseInt(els.quality.value, 10) || 720,
                mimeType:    els.mime.value
            });
        } catch (err) {
            console.warn(err);
            toast(err.message || "Could not start recording.", "error");
            setStatus("Idle", "idle");
            setRunningUI(false, false);
        }
    });

    els.pauseBtn.addEventListener("click", () => recorder.pause());
    els.resumeBtn.addEventListener("click", () => recorder.resume());
    els.stopBtn.addEventListener("click", () => recorder.stop());

    els.downloadBtn.addEventListener("click", () => {
        if (!currentPayload) return;
        const a = document.createElement("a");
        a.href = currentPayload.url;
        a.download = tsFilename();
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

    // Keyboard shortcuts: R = start/stop, Space = pause/resume
    document.addEventListener("keydown", (e) => {
        if (e.target && ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        if (e.key.toLowerCase() === "r") {
            e.preventDefault();
            if (recorder.state === "idle" || recorder.state === "ready") els.startBtn.click();
            else els.stopBtn.click();
        } else if (e.key === " ") {
            if (recorder.state === "recording") { e.preventDefault(); els.pauseBtn.click(); }
            else if (recorder.state === "paused") { e.preventDefault(); els.resumeBtn.click(); }
        }
    });

    // Warn on tab-close if a recording is active or unsaved.
    window.addEventListener("beforeunload", (e) => {
        if (recorder.state === "recording" || recorder.state === "paused" || currentPayload) {
            e.preventDefault();
            e.returnValue = "";
        }
    });

    // Boot
    setStatus("Idle", "idle");
    setRunningUI(false, false);
})();
