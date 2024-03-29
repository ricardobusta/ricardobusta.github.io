import can from 'canvas';
import fs from 'fs';

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
        try {
            can.loadImage(projectsAssetPath + year + "/" + file).then(image => {
                var rgb = getAverageRGB(image)
                resizeImage(image, true, rgb);
                const buffer = canvas.toBuffer('image/png');
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



