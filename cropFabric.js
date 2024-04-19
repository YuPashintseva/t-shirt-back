import { fabric } from 'fabric';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Derive directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Convert local path to URL
const svgPath = path.join(__dirname, 'fox_output.svg');
const svgURL = new URL(`file://${svgPath}`);

fabric.loadSVGFromURL(svgURL.href, (objects, options) => {
  const canvas = new fabric.StaticCanvas(null, { width: 800, height: 600 });
  const svg = fabric.util.groupSVGElements(objects, options);
  canvas.add(svg);
  svg.center();

  const clipRect = new fabric.Rect({
    left: 100,
    top: 100,
    width: 200,
    height: 200,
    fill: '#fff',
    absolutePositioned: true,
  });

  svg.clipPath = clipRect;
  canvas.renderAll();

  // Export and save the modified SVG
  const svgOutput = canvas.toSVG();
  fs.writeFileSync('output_fox_2.svg', svgOutput);
  console.log('SVG saved as output.svg');
});
