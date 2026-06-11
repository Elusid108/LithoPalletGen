const Eyedropper = (() => {
    let active = false;
    let targetColorId = null;
    let targetLayer = null;
    let boxSize = 64;

    const overlay = document.getElementById('eyedropper-overlay');
    const box = document.getElementById('eyedropper-box');
    const previewEl = document.getElementById('eyedropper-preview');
    const previewSwatch = document.getElementById('preview-swatch');
    const previewValue = document.getElementById('preview-value');
    const viewport = document.getElementById('image-viewport');

    function init() {
        overlay.addEventListener('mousemove', onMouseMove);
        overlay.addEventListener('click', onCommit);
        overlay.addEventListener('contextmenu', (e) => { e.preventDefault(); deactivate(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && active) deactivate();
        });
    }

    function activate(colorId, layer) {
        if (!ImageViewer.getOffscreenCanvas()) {
            UIComponents.toast('No image loaded', 'error');
            return;
        }
        targetColorId = colorId;
        targetLayer = layer;
        active = true;
        overlay.hidden = false;
        document.body.style.cursor = 'crosshair';

        document.querySelectorAll('.btn-eyedropper').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(
            `.btn-eyedropper[data-color-id="${colorId}"][data-layer="${layer}"]`
        );
        if (activeBtn) activeBtn.classList.add('active');
    }

    function deactivate() {
        active = false;
        targetColorId = null;
        targetLayer = null;
        overlay.hidden = true;
        document.body.style.cursor = '';
        document.querySelectorAll('.btn-eyedropper').forEach(btn => btn.classList.remove('active'));
    }

    function setBoxSize(size) {
        boxSize = size;
    }

    function getBoxSize() {
        return boxSize;
    }

    function onMouseMove(e) {
        if (!active) return;
        const canvasRect = ImageViewer.getCanvasRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        const halfBox = boxSize / 2;
        box.style.width = boxSize + 'px';
        box.style.height = boxSize + 'px';
        box.style.left = (e.clientX - viewport.getBoundingClientRect().left - halfBox) + 'px';
        box.style.top = (e.clientY - viewport.getBoundingClientRect().top - halfBox) + 'px';

        previewEl.style.left = (e.clientX - viewport.getBoundingClientRect().left + 20) + 'px';
        previewEl.style.top = (e.clientY - viewport.getBoundingClientRect().top - 40) + 'px';

        const color = sampleArea(x, y);
        previewSwatch.style.background = color;
        previewValue.textContent = color;
    }

    function sampleArea(centerX, centerY) {
        const offscreen = ImageViewer.getOffscreenCanvas();
        const offCtx = ImageViewer.getOffscreenCtx();
        if (!offscreen || !offCtx) return '#000000';

        const halfBox = boxSize / 2;
        const startX = Math.max(0, Math.floor(centerX - halfBox));
        const startY = Math.max(0, Math.floor(centerY - halfBox));
        const endX = Math.min(offscreen.width, Math.ceil(centerX + halfBox));
        const endY = Math.min(offscreen.height, Math.ceil(centerY + halfBox));
        const w = endX - startX;
        const h = endY - startY;

        if (w <= 0 || h <= 0) return '#000000';

        let imageData;
        try {
            imageData = offCtx.getImageData(startX, startY, w, h);
        } catch (e) {
            return '#000000';
        }

        const data = imageData.data;
        let r = 0, g = 0, b = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }

        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);

        return rgbToHex(r, g, b);
    }

    function onCommit(e) {
        if (!active) return;
        e.preventDefault();
        const canvasRect = ImageViewer.getCanvasRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;
        const color = sampleArea(x, y);

        if (targetColorId && targetLayer) {
            PaletteState.setLayerValue(targetColorId, targetLayer, color);
        }

        deactivate();
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    function isActive() {
        return active;
    }

    return { init, activate, deactivate, setBoxSize, getBoxSize, isActive };
})();
