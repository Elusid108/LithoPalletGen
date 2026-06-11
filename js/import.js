const ImportEngine = (() => {

    function parseJSON(text) {
        const data = JSON.parse(text);
        const colors = [];
        let detectedLayerCount = 0;

        for (const [hexKey, entry] of Object.entries(data)) {
            if (typeof entry !== 'object' || !entry.layers) continue;

            const layers = {};
            let format = null;

            for (const [num, layerData] of Object.entries(entry.layers)) {
                const layerNum = parseInt(num);
                if (isNaN(layerNum)) continue;
                if (layerNum > detectedLayerCount) detectedLayerCount = layerNum;

                if (layerData.hexcode) {
                    format = 'hex';
                    layers[layerNum] = { hex: layerData.hexcode };
                } else if (layerData.H !== undefined || layerData.S !== undefined || layerData.L !== undefined) {
                    format = 'hsl';
                    layers[layerNum] = { hex: hslToHex(layerData.H, layerData.S, layerData.L) };
                }
            }

            colors.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                name: entry.name || hexKey,
                baseHex: hexKey,
                active: entry.active !== undefined ? entry.active : true,
                collapsed: false,
                layers: layers
            });
        }

        return { colors, layerCount: detectedLayerCount || 5 };
    }

    function hslToHex(h, s, l) {
        s = s / 100;
        l = l / 100;
        const a = s * Math.min(l, 1 - l);
        const f = (n) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    function loadFile() {
        return new Promise((resolve) => {
            const input = document.getElementById('json-input');
            input.value = '';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) { resolve(null); return; }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const result = parseJSON(ev.target.result);
                        resolve(result);
                    } catch (err) {
                        UIComponents.toast('Invalid palette JSON file', 'error');
                        resolve(null);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });
    }

    return { parseJSON, loadFile, hslToHex };
})();
