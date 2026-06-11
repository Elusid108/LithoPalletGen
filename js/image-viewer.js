const ImageViewer = (() => {
    let images = [];
    let currentIndex = -1;
    let currentImage = null;
    let offscreenCanvas = null;
    let offscreenCtx = null;

    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d');
    const viewport = document.getElementById('image-viewport');
    const emptyState = document.getElementById('empty-state');
    const thumbnailStrip = document.getElementById('thumbnail-strip');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    function init() {
        btnPrev.addEventListener('click', () => navigate(-1));
        btnNext.addEventListener('click', () => navigate(1));
        window.addEventListener('resize', () => { if (currentImage) render(); });
    }

    async function loadImages() {
        images = await ImageStorage.getAll();
        renderThumbnails();
        updateNavButtons();
        if (images.length > 0 && currentIndex === -1) {
            showImage(images.length - 1);
        } else if (images.length === 0) {
            currentIndex = -1;
            currentImage = null;
            canvas.style.display = 'none';
            emptyState.style.display = '';
            offscreenCanvas = null;
            offscreenCtx = null;
        }
    }

    function showImage(index) {
        if (index < 0 || index >= images.length) return;
        currentIndex = index;
        const record = images[index];
        const img = new Image();
        const url = URL.createObjectURL(record.blob);
        img.onload = () => {
            currentImage = img;
            URL.revokeObjectURL(url);
            render();
            emptyState.style.display = 'none';
            canvas.style.display = 'block';
            updateNavButtons();
            highlightThumbnail();
        };
        img.src = url;
    }

    function render() {
        if (!currentImage) return;
        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;
        const iw = currentImage.naturalWidth;
        const ih = currentImage.naturalHeight;
        const scale = Math.min(vw / iw, vh / ih, 1);
        const dw = Math.floor(iw * scale);
        const dh = Math.floor(ih * scale);

        canvas.width = dw;
        canvas.height = dh;
        ctx.drawImage(currentImage, 0, 0, dw, dh);

        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = dw;
        offscreenCanvas.height = dh;
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
        offscreenCtx.drawImage(currentImage, 0, 0, dw, dh);
    }

    function navigate(dir) {
        const next = currentIndex + dir;
        if (next >= 0 && next < images.length) {
            showImage(next);
        }
    }

    function updateNavButtons() {
        btnPrev.disabled = currentIndex <= 0;
        btnNext.disabled = currentIndex >= images.length - 1;
    }

    function renderThumbnails() {
        thumbnailStrip.innerHTML = '';
        images.forEach((record, i) => {
            const item = document.createElement('div');
            item.className = 'thumbnail-item' + (i === currentIndex ? ' active' : '');
            item.dataset.index = i;
            const img = document.createElement('img');
            img.src = record.thumbnail;
            img.alt = record.filename;
            item.appendChild(img);
            item.addEventListener('click', () => showImage(i));
            thumbnailStrip.appendChild(item);
        });
    }

    function highlightThumbnail() {
        const items = thumbnailStrip.querySelectorAll('.thumbnail-item');
        items.forEach((item, i) => {
            item.classList.toggle('active', i === currentIndex);
        });
        const activeThumb = thumbnailStrip.querySelector('.thumbnail-item.active');
        if (activeThumb) {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    async function addImage(blob, filename) {
        const record = await ImageStorage.add(blob, filename);
        await loadImages();
        showImage(images.length - 1);
        return record;
    }

    function getOffscreenCanvas() {
        return offscreenCanvas;
    }

    function getOffscreenCtx() {
        return offscreenCtx;
    }

    function getCanvasRect() {
        return canvas.getBoundingClientRect();
    }

    function getCurrentImages() {
        return images;
    }

    function getCurrentIndex() {
        return currentIndex;
    }

    return {
        init,
        loadImages,
        showImage,
        addImage,
        navigate,
        getOffscreenCanvas,
        getOffscreenCtx,
        getCanvasRect,
        getCurrentImages,
        getCurrentIndex
    };
})();
