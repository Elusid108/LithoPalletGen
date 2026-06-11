const ExportEngine = (() => {

    function hexToHSL(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            H: Math.round(h * 360 * 10) / 10,
            S: Math.round(s * 100 * 10) / 10,
            L: Math.round(l * 100 * 10) / 10
        };
    }

    function generateJSON(format) {
        const colors = PaletteState.getColors();
        const layerCount = PaletteState.getLayerCount();
        const output = {};

        colors.forEach(color => {
            const key = color.baseHex.toUpperCase();
            const layers = {};

            for (let i = 1; i <= layerCount; i++) {
                const layerHex = color.layers[i] && color.layers[i].hex;
                if (!layerHex) continue;

                if (format === 'hsl') {
                    layers[String(i)] = hexToHSL(layerHex);
                } else {
                    layers[String(i)] = { hexcode: layerHex.toLowerCase() };
                }
            }

            output[key] = {
                name: color.name,
                active: color.active,
                layers: layers
            };
        });

        return output;
    }

    function exportFile(format) {
        const json = generateJSON(format);
        const str = JSON.stringify(json, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `palette-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        UIComponents.toast('Palette exported successfully', 'success');
    }

    return { generateJSON, exportFile, hexToHSL };
})();
