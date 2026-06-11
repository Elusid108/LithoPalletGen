# LithoPalletGen v1.0.0

Palette generator for PIXEstl-based color lithophane apps. A browser-based tool that lets you upload reference images, sample colors with an area-averaging eyedropper, and export structured palette JSON files.

**Live App:** [https://elusid108.github.io/LithoPalletGen/](https://elusid108.github.io/LithoPalletGen/)

## Features

- **Image Management** - Upload images from file or URL, stored locally in IndexedDB with thumbnail gallery
- **Area Eyedropper** - Configurable sampling box (32/64/128/256px) that averages all pixels in the region for accurate color picking
- **Palette Builder** - Add base colors with named layers, collapsible UI, active/inactive toggle
- **Dual Export** - Generate PIXEstl-compatible JSON in either HSL or hex format
- **Import** - Load existing palette JSON files to edit or extend
- **Drag & Drop** - Drop images directly onto the viewport
- **Responsive** - Split pane on desktop, stacked on tablet, tabbed on mobile
- **Dark/Light Theme** - Toggle between themes with persistent preference

## Usage

1. Upload a reference image (photo of printed color swatches)
2. Add base colors to your palette and name them
3. Set the desired number of layers per color
4. For each layer, click the eyedropper icon and click on the image to sample the averaged color
5. Export as JSON when all layers are filled

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Left Arrow` | Previous image |
| `Right Arrow` | Next image |
| `N` | Add new color |
| `Escape` | Cancel eyedropper |

## Deployment

Static site with no build step required. Enable GitHub Pages from the `main` branch root to deploy.

## JSON Output Formats

### HSL Mode
```json
{
  "#0086D6": {
    "name": "Cyan[PLA Basic]",
    "active": true,
    "layers": {
      "1": { "H": 201.9, "S": 96.4, "L": 78.2 },
      "2": { "H": 199.5, "S": 100, "L": 64.3 }
    }
  }
}
```

### Hex Mode
```json
{
  "#0086D6": {
    "name": "Cyan[PLA Basic]",
    "active": true,
    "layers": {
      "1": { "hexcode": "#c0e0f7" },
      "2": { "hexcode": "#9adcff" }
    }
  }
}
```

## Version History

- **v1.0.0** - Initial release: image management, palette builder, area-averaging eyedropper, HSL/hex export, import, responsive layout, dark/light theme
