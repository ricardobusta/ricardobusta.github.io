import can from 'canvas';
import fs from 'fs';
import sharp from 'sharp';

const sizeX = 378
const sizeY = 300
const aspect = sizeX / sizeY;

const canvas = can.createCanvas(sizeX, sizeY);
const context = canvas.getContext('2d');

const projectsAssetPath = './_srcassets/projects/';
const outputPath = './assets/projects/';

function getChildren(path, isDirectory) {
    return fs.readdirSync(path).filter(function(file){
        return fs.statSync(`${path}/${file}`).isDirectory() === isDirectory;
    })
}

function ensureDirSync (dirpath) {
    try {
        return fs.mkdirSync(dirpath)
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}

function getAverageRGB(image) {
    resizeImage(image, false, '#000000ff')

    let data = context.getImageData(0, 0, image.width, image.height);

    let length = data.data.length;
    let i = 0;
    let r = 0, g = 0, b = 0;

    while ( i < length ) {
        r += data.data[i];
        g += data.data[i+1];
        b += data.data[i+2];
        i += 4;
    }

    let count = length / 4;

    r = ~~(r/count);
    g = ~~(g/count);
    b = ~~(b/count);

    let rgb = "#" + r.toString(16) + g.toString(16) + b.toString(16) + "ff";
    return rgb;
}

function resizeImage(image, max, color){
    let side = 0;
    let scale = 1;
    let imgAspect = image.width / image.height;
    if(max){
        if(imgAspect > aspect){
            side = image.width;
            scale = sizeX / side;
        }else{
            side = image.height;
            scale = sizeY / side;
        }
    }else{
        if(imgAspect > aspect){
            side = image.height;
            scale = sizeY / side;
        }else{
            side = image.width;
            scale = sizeX / side;
        }
    }
    const w = image.width * scale;
    const h = image.height * scale;
    const x = (sizeX - w) / 2;
    const y = (sizeY - h) / 2;

    context.fillStyle = color;
    context.fillRect(0, 0, sizeX, sizeY);
    context.drawImage(image, x, y, w, h);
}

const dirs = getChildren(projectsAssetPath, true);

ensureDirSync(outputPath);

dirs.forEach(dir => {
    const year = dir;
    const files = getChildren(projectsAssetPath+dir, false);
    files.forEach(file => {
        const filePath = projectsAssetPath + year + "/" + file;

        const loadImage = async () => {
            try {
                let image;

                if (file.endsWith(".webp")) {
                    const pngBuffer = await sharp(filePath).png().toBuffer();
                    image = new can.Image();
                    image.src = pngBuffer;
                } else {
                    image = await can.loadImage(filePath);
                }

                const rgb = getAverageRGB(image);
                resizeImage(image, true, rgb);
                const buffer = canvas.toBuffer('image/png'); // old way

// Save as webp with sharp
                let newFile = file;
                if (newFile.endsWith("jpg")) {
                    newFile = newFile.replace("jpg", "webp");
                }
                if (newFile.endsWith("png")) {
                    newFile = newFile.replace("png", "webp");
                }
                if (newFile.endsWith("-img.webp")) {
                    newFile = newFile.replace("-img.webp", "-img0.webp");
                }
                if (newFile.endsWith("-ss.webp")) {
                    newFile = newFile.replace("-ss.webp", "-img1.webp");
                }
                if (newFile.endsWith("webp")) {
                    newFile = newFile.replace("webp", "webp");
                }

                const outPath = outputPath + year + "-" + newFile;
                console.log(`success: ${outPath}`);

// ✅ Use sharp to write WebP
                await sharp(buffer)
                    .webp({ quality: 90 })  // optional: tweak quality, lossless: true
                    .toFile(outPath);

            } catch (e) {
                console.log(`failed: ${file}`);
                console.error(e);
            }
        }

        loadImage();
    });
});
