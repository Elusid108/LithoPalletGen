(() => {
    const APP_VERSION = '1.1.0';

    const Settings = {
        KEY: 'lithopallet_settings',
        defaults: {
            eyedropperSize: 64,
            exportFormat: 'hsl',
            theme: 'dark'
        },
        data: null,

        load() {
            try {
                this.data = { ...this.defaults, ...JSON.parse(localStorage.getItem(this.KEY)) };
            } catch (e) {
                this.data = { ...this.defaults };
            }
        },

        save() {
            localStorage.setItem(this.KEY, JSON.stringify(this.data));
        },

        get(key) {
            return this.data[key];
        },

        set(key, value) {
            this.data[key] = value;
            this.save();
        }
    };

    function initTheme() {
        const theme = Settings.get('theme');
        document.documentElement.setAttribute('data-theme', theme);
    }

    function toggleTheme() {
        const current = Settings.get('theme');
        const next = current === 'dark' ? 'light' : 'dark';
        Settings.set('theme', next);
        document.documentElement.setAttribute('data-theme', next);
    }

    function initSettings() {
        const sizeSelect = document.getElementById('setting-eyedropper-size');
        const formatSelect = document.getElementById('setting-export-format');

        sizeSelect.value = Settings.get('eyedropperSize');
        formatSelect.value = Settings.get('exportFormat');

        sizeSelect.addEventListener('change', () => {
            const size = parseInt(sizeSelect.value);
            Settings.set('eyedropperSize', size);
            Eyedropper.setBoxSize(size);
        });

        formatSelect.addEventListener('change', () => {
            Settings.set('exportFormat', formatSelect.value);
        });

        Eyedropper.setBoxSize(Settings.get('eyedropperSize'));

        document.getElementById('app-version').textContent = APP_VERSION;
    }

    function initUpload() {
        const fileInput = document.getElementById('file-input');
        const btnUpload = document.getElementById('btn-upload');
        const btnUrl = document.getElementById('btn-url');
        const modalUrl = document.getElementById('modal-url');
        const btnUrlLoad = document.getElementById('btn-url-load');
        const urlInput = document.getElementById('url-input');

        btnUpload.addEventListener('click', () => {
            fileInput.value = '';
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            await ImageViewer.addImage(file, file.name);
        });

        btnUrl.addEventListener('click', () => {
            urlInput.value = '';
            modalUrl.showModal();
            urlInput.focus();
        });

        btnUrlLoad.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            if (!url) return;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch');
                const blob = await response.blob();
                if (!blob.type.startsWith('image/')) throw new Error('Not an image');
                const filename = url.split('/').pop().split('?')[0] || 'url-image';
                await ImageViewer.addImage(blob, filename);
                modalUrl.close();
            } catch (err) {
                UIComponents.toast('Failed to load image from URL. It may be blocked by CORS.', 'error');
            }
        });

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btnUrlLoad.click();
        });
    }

    function initImageManager() {
        const btnManage = document.getElementById('btn-manage');
        const modal = document.getElementById('modal-manage');
        const grid = document.getElementById('image-grid');
        const selectAll = document.getElementById('select-all');
        const btnDelete = document.getElementById('btn-delete-selected');
        let selected = new Set();

        btnManage.addEventListener('click', async () => {
            selected.clear();
            selectAll.checked = false;
            btnDelete.disabled = true;
            await renderGrid();
            modal.showModal();
        });

        async function renderGrid() {
            const images = await ImageStorage.getAll();
            grid.innerHTML = '';
            images.forEach(record => {
                const item = document.createElement('div');
                item.className = 'image-grid-item';
                item.dataset.id = record.id;
                item.innerHTML = `
                    <div class="check-overlay"></div>
                    <img src="${record.thumbnail}" alt="${record.filename}">
                `;
                item.addEventListener('click', () => {
                    if (selected.has(record.id)) {
                        selected.delete(record.id);
                        item.classList.remove('selected');
                    } else {
                        selected.add(record.id);
                        item.classList.add('selected');
                    }
                    btnDelete.disabled = selected.size === 0;
                    selectAll.checked = selected.size === images.length;
                });
                grid.appendChild(item);
            });
        }

        selectAll.addEventListener('change', () => {
            const items = grid.querySelectorAll('.image-grid-item');
            if (selectAll.checked) {
                items.forEach(item => {
                    selected.add(item.dataset.id);
                    item.classList.add('selected');
                });
            } else {
                selected.clear();
                items.forEach(item => item.classList.remove('selected'));
            }
            btnDelete.disabled = selected.size === 0;
        });

        btnDelete.addEventListener('click', async () => {
            if (selected.size === 0) return;
            if (!confirm(`Delete ${selected.size} image(s)?`)) return;
            await ImageStorage.removeMultiple([...selected]);
            selected.clear();
            await ImageViewer.loadImages();
            await renderGrid();
            btnDelete.disabled = true;
            selectAll.checked = false;
        });
    }

    function initImport() {
        const btnImport = document.getElementById('btn-import');
        const modal = document.getElementById('modal-import');
        const btnReplace = document.getElementById('btn-import-replace');
        const btnMerge = document.getElementById('btn-import-merge');
        let pendingData = null;

        btnImport.addEventListener('click', async () => {
            const result = await ImportEngine.loadFile();
            if (!result) return;
            pendingData = result;
            modal.showModal();
        });

        btnReplace.addEventListener('click', () => {
            if (!pendingData) return;
            PaletteState.replaceAll(pendingData.colors, pendingData.layerCount);
            document.getElementById('layer-count').value = pendingData.layerCount;
            modal.close();
            pendingData = null;
            UIComponents.toast('Palette replaced', 'success');
        });

        btnMerge.addEventListener('click', () => {
            if (!pendingData) return;
            PaletteState.mergeColors(pendingData.colors, pendingData.layerCount);
            document.getElementById('layer-count').value = PaletteState.getLayerCount();
            modal.close();
            pendingData = null;
            UIComponents.toast('Palette merged', 'success');
        });
    }

    function initPalette() {
        PaletteState.init(() => {
            UIComponents.renderPaletteList();
        });

        const layerInput = document.getElementById('layer-count');
        layerInput.value = PaletteState.getLayerCount();
        layerInput.addEventListener('change', () => {
            PaletteState.setLayerCount(parseInt(layerInput.value) || 5);
            layerInput.value = PaletteState.getLayerCount();
        });

        document.getElementById('btn-add-color').addEventListener('click', () => {
            PaletteState.addColor();
        });

        document.getElementById('btn-export').addEventListener('click', () => {
            const format = Settings.get('exportFormat');
            ExportEngine.exportFile(format);
        });

        UIComponents.renderPaletteList();
    }

    function initDivider() {
        const divider = document.getElementById('divider');
        const panelImage = document.getElementById('panel-image');
        const panelToolbox = document.getElementById('panel-toolbox');
        let dragging = false;

        divider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = true;
            divider.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const container = document.querySelector('.app-main');
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const total = rect.width;
            const leftPercent = Math.max(20, Math.min(80, (x / total) * 100));
            panelImage.style.flex = 'none';
            panelImage.style.width = leftPercent + '%';
            panelToolbox.style.flex = 'none';
            panelToolbox.style.width = (100 - leftPercent) + '%';
        });

        document.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            divider.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        });
    }

    function initMobileTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const panelImage = document.getElementById('panel-image');
        const panelToolbox = document.getElementById('panel-toolbox');

        function setTab(tab) {
            tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
            if (tab === 'image') {
                panelImage.classList.remove('hidden-mobile');
                panelToolbox.classList.add('hidden-mobile');
            } else {
                panelImage.classList.add('hidden-mobile');
                panelToolbox.classList.remove('hidden-mobile');
            }
        }

        tabs.forEach(btn => {
            btn.addEventListener('click', () => setTab(btn.dataset.tab));
        });

        function checkMobile() {
            if (window.innerWidth <= 768) {
                const activeTab = document.querySelector('.tab-btn.active');
                setTab(activeTab ? activeTab.dataset.tab : 'image');
            } else {
                panelImage.classList.remove('hidden-mobile');
                panelToolbox.classList.remove('hidden-mobile');
            }
        }

        window.addEventListener('resize', checkMobile);
        checkMobile();
    }

    function initModals() {
        document.getElementById('btn-settings').addEventListener('click', () => {
            document.getElementById('modal-settings').showModal();
        });
        document.getElementById('btn-theme').addEventListener('click', toggleTheme);
    }

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            if (Eyedropper.isActive()) return;

            if (e.key === 'ArrowLeft') {
                ImageViewer.navigate(-1);
            } else if (e.key === 'ArrowRight') {
                ImageViewer.navigate(1);
            } else if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
                PaletteState.addColor();
            }
        });
    }

    function initDragDrop() {
        const viewport = document.getElementById('image-viewport');
        viewport.addEventListener('dragover', (e) => {
            e.preventDefault();
            viewport.style.outline = '2px dashed var(--accent)';
        });
        viewport.addEventListener('dragleave', () => {
            viewport.style.outline = '';
        });
        viewport.addEventListener('drop', async (e) => {
            e.preventDefault();
            viewport.style.outline = '';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                await ImageViewer.addImage(file, file.name);
            }
        });
    }

    async function boot() {
        Settings.load();
        initTheme();
        UIComponents.init();
        ImageViewer.init();
        Eyedropper.init();
        initSettings();
        initUpload();
        initImageManager();
        initImport();
        initPalette();
        initDivider();
        initMobileTabs();
        initModals();
        initKeyboardShortcuts();
        initDragDrop();
        await ImageViewer.loadImages();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
