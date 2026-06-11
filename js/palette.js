const PaletteState = (() => {
    const STORAGE_KEY = 'lithopallet_palette';
    let colors = [];
    let layerCount = 5;
    let onChange = null;

    function init(callback) {
        onChange = callback;
        load();
    }

    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                colors = data.colors || [];
                layerCount = data.layerCount || 5;
            }
        } catch (e) {
            colors = [];
            layerCount = 5;
        }
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ colors, layerCount }));
    }

    function notify() {
        save();
        if (onChange) onChange();
    }

    function addColor(name, hex) {
        const layers = {};
        for (let i = 1; i <= layerCount; i++) {
            layers[i] = { hex: '' };
        }
        colors.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: name || 'New Color',
            baseHex: hex || '#ffffff',
            active: true,
            collapsed: false,
            layers: layers
        });
        notify();
    }

    function removeColor(id) {
        colors = colors.filter(c => c.id !== id);
        notify();
    }

    function updateColor(id, updates) {
        const color = colors.find(c => c.id === id);
        if (!color) return;
        Object.assign(color, updates);
        notify();
    }

    function setLayerValue(colorId, layerNum, hex) {
        const color = colors.find(c => c.id === colorId);
        if (!color) return;
        if (!color.layers[layerNum]) {
            color.layers[layerNum] = {};
        }
        color.layers[layerNum].hex = hex;
        notify();
    }

    function getLayerCount() {
        return layerCount;
    }

    function setLayerCount(count) {
        count = Math.max(1, Math.min(20, count));
        if (count === layerCount) return;
        const oldCount = layerCount;
        layerCount = count;
        colors.forEach(color => {
            if (count > oldCount) {
                for (let i = oldCount + 1; i <= count; i++) {
                    if (!color.layers[i]) color.layers[i] = { hex: '' };
                }
            } else {
                for (let i = count + 1; i <= oldCount; i++) {
                    delete color.layers[i];
                }
            }
        });
        notify();
    }

    function getColors() {
        return colors;
    }

    function getCompletionStatus() {
        let total = 0;
        let filled = 0;
        colors.forEach(color => {
            for (let i = 1; i <= layerCount; i++) {
                total++;
                if (color.layers[i] && color.layers[i].hex) filled++;
            }
        });
        return { total, filled, complete: total > 0 && filled === total };
    }

    function replaceAll(newColors, newLayerCount) {
        colors = newColors;
        layerCount = newLayerCount || layerCount;
        notify();
    }

    function mergeColors(newColors, newLayerCount) {
        if (newLayerCount) {
            layerCount = newLayerCount;
        }
        newColors.forEach(nc => {
            const existing = colors.find(c => c.baseHex.toLowerCase() === nc.baseHex.toLowerCase());
            if (existing) {
                existing.name = nc.name;
                existing.active = nc.active;
                existing.layers = nc.layers;
            } else {
                colors.push(nc);
            }
        });
        notify();
    }

    function toggleCollapse(id) {
        const color = colors.find(c => c.id === id);
        if (color) {
            color.collapsed = !color.collapsed;
            notify();
        }
    }

    function toggleActive(id) {
        const color = colors.find(c => c.id === id);
        if (color) {
            color.active = !color.active;
            notify();
        }
    }

    return {
        init,
        addColor,
        removeColor,
        updateColor,
        setLayerValue,
        getLayerCount,
        setLayerCount,
        getColors,
        getCompletionStatus,
        replaceAll,
        mergeColors,
        toggleCollapse,
        toggleActive,
        save,
        load
    };
})();
