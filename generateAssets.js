import can from 'canvas';
import fs from 'fs';

const size = 512;

const canvas = can.createCanvas(size, size);
const context = canvas.getContext('2d');

const projectsAssetPath = './_srcassets/projects/';
const outputPath = './assets/projects/';

const files = fs.readdirSync(projectsAssetPath);

files.forEach(file => {
    console.log(file);
    can.loadImage(projectsAssetPath + file).then(image => {
        const maxSide = Math.max(image.width, image.height);
        const scale = size / maxSide;
        const w = image.width * scale;
        const h = image.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;

        context.fillStyle = '#000000ff';
        context.fillRect(0, 0, size, size);
        context.drawImage(image, x, y, w, h);
        const buffer = canvas.toBuffer(file.endsWith('png') ? 'image/png' : 'image/jpeg');
        fs.writeFileSync(outputPath + "/" + file, buffer);
    });
});



