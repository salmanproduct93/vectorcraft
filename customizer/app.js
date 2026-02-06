const elements = {
  dropzone: document.getElementById("dropzone"),
  imageUpload: document.getElementById("imageUpload"),
  imageUploadAlt: document.getElementById("imageUploadAlt"),
  originalImage: document.getElementById("originalImage"),
  vectorOutput: document.getElementById("vectorOutput"),
  originalPanel: document.getElementById("originalPanel"),
  vectorPanel: document.getElementById("vectorPanel"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  statusText: document.getElementById("statusText"),
  statusMeta: document.getElementById("statusMeta"),
  presetSelect: document.getElementById("presetSelect"),
  colorMode: document.getElementById("colorMode"),
  colorCount: document.getElementById("colorCount"),
  detailLevel: document.getElementById("detailLevel"),
  smoothing: document.getElementById("smoothing"),
  transparentBg: document.getElementById("transparentBg"),
  traceButton: document.getElementById("traceButton"),
  downloadSvg: document.getElementById("downloadSvg"),
  downloadSvgAlt: document.getElementById("downloadSvgAlt"),
  resetAll: document.getElementById("resetAll"),
};

const state = {
  sourceDataUrl: null,
  svgString: null,
  currentTab: "original",
};

const presetMap = {
  logo: { detail: 4, smoothing: 7, colors: 4 },
  illustration: { detail: 6, smoothing: 4, colors: 8 },
  detail: { detail: 9, smoothing: 2, colors: 12 },
};

function setStatus(message, meta = "") {
  elements.statusText.textContent = message;
  elements.statusMeta.textContent = meta;
}

function setTab(tab) {
  state.currentTab = tab;
  elements.tabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  elements.originalPanel.classList.toggle("active", tab === "original");
  elements.vectorPanel.classList.toggle("active", tab === "vector");
}

function setTraceEnabled(enabled) {
  elements.traceButton.disabled = !enabled;
  if (enabled) {
    elements.traceButton.removeAttribute("disabled");
  }
}

function setDownloadEnabled(enabled) {
  elements.downloadSvg.disabled = !enabled;
  elements.downloadSvgAlt.disabled = !enabled;
}

function updatePreviewState() {
  if (!state.sourceDataUrl) {
    elements.dropzone.style.opacity = 1;
    elements.originalImage.removeAttribute("src");
    elements.vectorOutput.innerHTML = "";
    setTraceEnabled(true);
    setDownloadEnabled(false);
    setStatus("Waiting for upload.");
    return;
  }

  elements.dropzone.style.opacity = 0;
  elements.originalImage.src = state.sourceDataUrl;
  setTraceEnabled(true);
  setDownloadEnabled(Boolean(state.svgString));
}

function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.sourceDataUrl = reader.result;
    state.svgString = null;
    setStatus("Image loaded. Ready to trace.", `${Math.round(file.size / 1024)} KB`);
    setTraceEnabled(true);
    updatePreviewState();
    setTab("original");
  };
  reader.readAsDataURL(file);
}

function buildTraceOptions() {
  const detail = Number(elements.detailLevel.value);
  const smoothing = Number(elements.smoothing.value);
  const colors = Number(elements.colorCount.value);
  const isMono = elements.colorMode.value === "mono";

  const ltres = 1 + (10 - detail) * 0.6;
  const qtres = 1 + (10 - detail) * 0.4;
  const pathomit = 2 + smoothing;

  return {
    ltres,
    qtres,
    pathomit,
    colorsampling: isMono ? 0 : 2,
    numberofcolors: isMono ? 2 : colors,
    mincolorratio: 0.02,
    colorquantcycles: 2,
    rightangleenhance: detail < 7,
    blurradius: smoothing * 0.5,
    scale: 1,
  };
}

function applyPreset(presetKey) {
  const preset = presetMap[presetKey];
  if (!preset) return;
  elements.detailLevel.value = preset.detail;
  elements.smoothing.value = preset.smoothing;
  elements.colorCount.value = preset.colors;
}

function ensureTracerAvailable() {
  return typeof ImageTracer !== "undefined";
}

async function loadImageTracer() {
  if (ensureTracerAvailable()) return true;
  const sources = [
    "https://unpkg.com/imagetracerjs@1.2.6/imagetracer_v1.2.6.js",
    "https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js",
  ];

  for (const src of sources) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      if (ensureTracerAvailable()) return true;
    } catch (_) {
      // Try the next CDN.
    }
  }

  setStatus("Vector engine not loaded.", "Please allow the CDN or try another network.");
  return false;
}

async function traceToSvg() {
  if (!state.sourceDataUrl) {
    setStatus("Upload an image to trace.");
    return;
  }
  const tracerReady = await loadImageTracer();
  if (!tracerReady) return;

  setStatus("Tracing in progress...", "This can take a few seconds.");
  elements.traceButton.disabled = true;

  const options = buildTraceOptions();

  ImageTracer.imageToSVG(state.sourceDataUrl, options, (svgString) => {
    state.svgString = svgString;

    if (elements.transparentBg.checked) {
      svgString = svgString.replace(/<rect[^>]*fill=\"#[0-9a-fA-F]{6}\"[^>]*><\/rect>/, "");
    }

    elements.vectorOutput.innerHTML = svgString;
    setTab("vector");
    setStatus("Vector ready.", `Nodes optimized: ${options.pathomit}`);
    setDownloadEnabled(true);
    setTraceEnabled(true);
  });
}

function downloadSvg() {
  if (!state.svgString) return;
  const blob = new Blob([state.svgString], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "vectorcraft-output.svg";
  link.click();
  URL.revokeObjectURL(link.href);
}

function resetWorkspace() {
  state.sourceDataUrl = null;
  state.svgString = null;
  elements.presetSelect.value = "logo";
  elements.colorMode.value = "color";
  applyPreset("logo");
  elements.transparentBg.checked = true;
  setTab("original");
  updatePreviewState();
}

function bindEvents() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setTab(tab.dataset.tab));
  });

  [elements.imageUpload, elements.imageUploadAlt].forEach((input) => {
    input.addEventListener("change", (event) => handleFile(event.target.files[0]));
  });

  elements.dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.dropzone.style.opacity = 0.9;
  });

  elements.dropzone.addEventListener("dragleave", () => {
    elements.dropzone.style.opacity = 1;
  });

  elements.dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    elements.dropzone.style.opacity = 0;
    const file = event.dataTransfer.files[0];
    handleFile(file);
  });

  elements.presetSelect.addEventListener("change", (event) => {
    applyPreset(event.target.value);
  });

  elements.traceButton.addEventListener("click", traceToSvg);
  elements.downloadSvg.addEventListener("click", downloadSvg);
  elements.downloadSvgAlt.addEventListener("click", downloadSvg);
  elements.resetAll.addEventListener("click", resetWorkspace);
}

applyPreset("logo");
bindEvents();
updatePreviewState();
setTab("original");
setTraceEnabled(true);
