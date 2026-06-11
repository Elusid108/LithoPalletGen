const UIComponents = (() => {
    let toastContainer = null;

    function init() {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);

        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('dialog').close();
            });
        });
    }

    function toast(message, type = 'info') {
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = message;
        toastContainer.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }

    function renderPaletteList() {
        const list = document.getElementById('palette-list');
        const colors = PaletteState.getColors();
        const layerCount = PaletteState.getLayerCount();
        list.innerHTML = '';

        colors.forEach(color => {
            const card = document.createElement('div');
            card.className = 'base-color-card' + (color.collapsed ? ' collapsed' : '');
            card.dataset.id = color.id;

            card.innerHTML = `
                <div class="base-color-header">
                    <svg class="collapse-icon" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
                    <div class="base-color-swatch" style="background:${color.baseHex}"></div>
                    <span class="base-color-name">${escapeHtml(color.name)}</span>
                    <div class="base-color-actions">
                        <button class="toggle-active ${color.active ? 'active' : ''}" data-action="toggle-active" title="${color.active ? 'Active' : 'Inactive'}"></button>
                        <button class="btn-remove-color" data-action="remove" title="Remove Color">
                            <svg class="icon" viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="base-color-edit">
                    <input type="text" value="${escapeHtml(color.name)}" placeholder="Color name" data-action="rename">
                    <input type="text" class="hex-input" value="${color.baseHex}" placeholder="#FFFFFF" data-action="base-hex">
                    <input type="color" value="${color.baseHex}" data-action="color-picker">
                </div>
                <div class="layers-container">
                    ${renderLayers(color, layerCount)}
                </div>
            `;

            bindCardEvents(card, color);
            list.appendChild(card);
        });

        updateCompletion();
    }

    function renderLayers(color, layerCount) {
        let html = '';
        for (let i = 1; i <= layerCount; i++) {
            const layerHex = (color.layers[i] && color.layers[i].hex) || '';
            const swatchStyle = layerHex ? `background:${layerHex}` : '';
            const filledClass = layerHex ? ' filled' : '';
            html += `
                <div class="layer-row">
                    <span class="layer-number">${i}</span>
                    <div class="layer-swatch${filledClass}" style="${swatchStyle}"></div>
                    <input type="text" class="layer-hex" value="${layerHex}" placeholder="#000000" 
                           data-color-id="${color.id}" data-layer="${i}">
                    <button class="btn-eyedropper" data-color-id="${color.id}" data-layer="${i}" title="Pick from image">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12a1 1 0 00.01-1.42zM6.92 19L5 17.08l8.06-8.06 1.92 1.92L6.92 19z"/></svg>
                    </button>
                </div>
            `;
        }
        return html;
    }

    function bindCardEvents(card, color) {
        const header = card.querySelector('.base-color-header');
        header.addEventListener('click', (e) => {
            if (e.target.closest('[data-action]')) return;
            PaletteState.toggleCollapse(color.id);
        });

        card.querySelector('[data-action="toggle-active"]').addEventListener('click', (e) => {
            e.stopPropagation();
            PaletteState.toggleActive(color.id);
        });

        card.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Remove "${color.name}"?`)) {
                PaletteState.removeColor(color.id);
            }
        });

        const nameInput = card.querySelector('[data-action="rename"]');
        nameInput.addEventListener('change', () => {
            PaletteState.updateColor(color.id, { name: nameInput.value });
        });

        const hexInput = card.querySelector('[data-action="base-hex"]');
        const colorPicker = card.querySelector('[data-action="color-picker"]');

        hexInput.addEventListener('change', () => {
            const val = hexInput.value;
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                PaletteState.updateColor(color.id, { baseHex: val });
                colorPicker.value = val;
            }
        });

        colorPicker.addEventListener('input', () => {
            hexInput.value = colorPicker.value;
            PaletteState.updateColor(color.id, { baseHex: colorPicker.value });
        });

        card.querySelectorAll('.layer-hex').forEach(input => {
            input.addEventListener('change', () => {
                const cid = input.dataset.colorId;
                const layer = input.dataset.layer;
                let val = input.value.trim();
                if (val && !val.startsWith('#')) val = '#' + val;
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                    PaletteState.setLayerValue(cid, layer, val);
                } else if (val === '') {
                    PaletteState.setLayerValue(cid, layer, '');
                }
            });
        });

        card.querySelectorAll('.btn-eyedropper').forEach(btn => {
            btn.addEventListener('click', () => {
                const cid = btn.dataset.colorId;
                const layer = btn.dataset.layer;
                Eyedropper.activate(cid, layer);
            });
        });
    }

    function updateCompletion() {
        const { total, filled, complete } = PaletteState.getCompletionStatus();
        const badge = document.getElementById('completion-badge');
        const text = document.getElementById('completion-text');
        const btn = document.getElementById('btn-export');

        text.textContent = `${filled}/${total} layers`;
        badge.classList.toggle('complete', complete);
        btn.disabled = !complete || total === 0;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init, toast, renderPaletteList, updateCompletion };
})();
