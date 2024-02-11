import can from 'canvas';
import fs from 'fs';

const size = 512;

const canvas = can.createCanvas(size, size);
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

function resizeImage(image){
    const maxSide = Math.max(image.width, image.height);
    const scale = size / maxSide;
    const w = image.width * scale;
    const h = image.height * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;

    context.fillStyle = '#000000ff';
    context.fillRect(0, 0, size, size);
    context.drawImage(image, x, y, w, h);

    return canvas.toBuffer('image/png');
}

const dirs = getChildren(projectsAssetPath, true);

ensureDirSync(outputPath);

dirs.forEach(dir => {
    const year = dir;
    const files = getChildren(projectsAssetPath+dir, false);
    files.forEach(file => {
        try {
            can.loadImage(projectsAssetPath + year + "/" + file).then(image => {
                const buffer = resizeImage(image)
                if (file.endsWith("jpg")) {
                    file = file.replace("jpg", "png");
                }
                if (file.endsWith("-img.png")) {
                    file = file.replace("-img.png", "-img0.png");
                }
                if (file.endsWith("-ss.png")) {
                    file = file.replace("-ss.png", "-img1.png");
                }
                const path = outputPath + year + "-" + file;
                console.log(`success: ${path}`)
                fs.writeFileSync(path, buffer);
            });
        }catch(e){
            console.log(`failed: ${file}`)
        }
    });
});



