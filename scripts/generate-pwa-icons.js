#!/usr/bin/env node

/**
 * Script para generar iconos PWA de diferentes tamaños
 * Basado en el SVG base, genera PNGs para todos los tamaños necesarios
 */

import fs from 'fs';
import path from 'path';

// Tamaños de iconos necesarios para PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Función para crear iconos SVG de diferentes tamaños
function generateIconSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f0f9ff;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="${size/256}" dy="${size/128}" stdDeviation="${size/170}" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <rect width="${size}" height="${size}" rx="${size/6.4}" ry="${size/6.4}" fill="url(#bg)"/>
  
  <circle cx="${size/2}" cy="${size/2}" r="${size/2.56}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="${size/256}"/>
  
  <text x="${size/2}" y="${size*0.39}" font-family="Arial, sans-serif" font-size="${size*0.156}" font-weight="bold" 
        text-anchor="middle" fill="url(#text)" filter="url(#shadow)">La</text>
  
  <text x="${size/2}" y="${size*0.547}" font-family="Arial, sans-serif" font-size="${size*0.117}" font-weight="300" 
        text-anchor="middle" fill="url(#text)" filter="url(#shadow)">IA</text>
  
  <g transform="translate(${size/2}, ${size*0.625})" fill="url(#text)" filter="url(#shadow)">
    <path d="M${-size*0.039},${-size*0.0195} L${-size*0.039},${size*0.0586} M${-size*0.049},${-size*0.0195} L${-size*0.049},0 M${-size*0.029},${-size*0.0195} L${-size*0.029},0 M${-size*0.039},0 L${-size*0.039},${-size*0.029}" 
          stroke="url(#text)" stroke-width="${size*0.0059}" fill="none" stroke-linecap="round"/>
    
    <path d="M${size*0.039},${-size*0.0195} L${size*0.039},${size*0.0586} M${size*0.029},${-size*0.0195} L${size*0.049},${-size*0.0098} L${size*0.039},0" 
          stroke="url(#text)" stroke-width="${size*0.0059}" fill="none" stroke-linecap="round"/>
    
    <ellipse cx="0" cy="${size*0.078}" rx="${size*0.0586}" ry="${size*0.0156}" fill="none" stroke="url(#text)" stroke-width="${size*0.0039}"/>
  </g>
  
  <path d="M ${size*0.156},${size*0.156} Q ${size*0.352},${size*0.234} ${size*0.547},${size*0.156} Q ${size*0.742},${size*0.234} ${size*0.938},${size*0.156} L ${size*0.938},${size*0.234} Q ${size*0.742},${size*0.313} ${size*0.547},${size*0.234} Q ${size*0.352},${size*0.313} ${size*0.156},${size*0.234} Z" 
        fill="rgba(255,255,255,0.1)"/>
</svg>`;
}

// Crear iconos SVG para cada tamaño
console.log('🎨 Generando iconos PWA...');

const iconsDir = './public/icons';

ICON_SIZES.forEach(size => {
  const svgContent = generateIconSVG(size);
  const fileName = `icon-${size}x${size}.svg`;
  const filePath = path.join(iconsDir, fileName);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Generado: ${fileName}`);
});

// Crear iconos especiales
const specialIcons = {
  'apple-touch-icon.svg': generateIconSVG(180),
  'favicon.svg': generateIconSVG(32),
  'badge-72x72.svg': generateIconSVG(72)
};

Object.entries(specialIcons).forEach(([fileName, content]) => {
  const filePath = path.join(iconsDir, fileName);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Generado: ${fileName}`);
});

// Crear favicon ICO placeholder
const faviconIco = fs.readFileSync('./public/icons/icon-base.svg');
fs.writeFileSync('./public/favicon.ico', faviconIco);

console.log('🎉 ¡Iconos PWA generados exitosamente!');
console.log(`📱 ${ICON_SIZES.length + Object.keys(specialIcons).length} iconos creados`);

// Generar instrucciones para convertir a PNG (si es necesario)
console.log(`
🔧 NOTA: Los iconos están en formato SVG para máxima calidad.
Si necesitas PNGs, puedes usar herramientas como:
- https://cloudconvert.com/svg-to-png
- ImageMagick: convert icon.svg icon.png
- GIMP o cualquier editor gráfico

Los iconos creados:
${ICON_SIZES.map(size => `- icon-${size}x${size}.svg`).join('\n')}
${Object.keys(specialIcons).map(name => `- ${name}`).join('\n')}
`);
