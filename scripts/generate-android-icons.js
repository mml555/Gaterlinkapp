const fs = require('fs');
const path = require('path');

// Android icon sizes for different densities
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Create a simple GaterLink icon as SVG (since we can't easily convert the complex one)
const createGaterLinkIcon = (size) => {
  const padding = size * 0.1;
  const iconSize = size - (padding * 2);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2E7D32;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <g transform="translate(${padding}, ${padding})">
    <!-- Door icon -->
    <rect x="${iconSize * 0.2}" y="${iconSize * 0.1}" width="${iconSize * 0.6}" height="${iconSize * 0.8}" 
          rx="${iconSize * 0.05}" fill="white" opacity="0.9"/>
    <!-- Door handle -->
    <circle cx="${iconSize * 0.75}" cy="${iconSize * 0.5}" r="${iconSize * 0.08}" fill="white" opacity="0.9"/>
    <!-- Link symbol -->
    <path d="M ${iconSize * 0.3} ${iconSize * 0.85} L ${iconSize * 0.7} ${iconSize * 0.85} M ${iconSize * 0.4} ${iconSize * 0.75} L ${iconSize * 0.6} ${iconSize * 0.75}" 
          stroke="white" stroke-width="${iconSize * 0.03}" opacity="0.9"/>
  </g>
</svg>`;
};

// Create Android resource directories and icons
const createAndroidIcons = () => {
  const androidResPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
  
  Object.entries(iconSizes).forEach(([folder, size]) => {
    const folderPath = path.join(androidResPath, folder);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Create the icon SVG
    const iconSvg = createGaterLinkIcon(size);
    const iconPath = path.join(folderPath, 'ic_launcher.svg');
    
    fs.writeFileSync(iconPath, iconSvg);
    console.log(`Created ${folder}/ic_launcher.svg (${size}x${size})`);
  });
  
  console.log('\n✅ Android icons generated successfully!');
  console.log('📝 Note: You may need to convert these SVGs to PNG format for Android.');
  console.log('💡 Consider using an online tool or Android Studio to convert SVGs to PNGs.');
};

// Run the script
createAndroidIcons();
