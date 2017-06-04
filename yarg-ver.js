const program = require('yargs');
const request = require('request-promise');
const requestNative = require('request');
const fs = require('fs');
const path = require('path');
const cmdInfo = require('./package.json');

const download = function (fontUrl, localPath) {
    let url = fontUrl;
    let localtion = localPath;

    //request option, if don't cannot get full html.
    let option = {
        uri: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        method: 'GET'
    }
    let rst = {};
    request(option)
        .then((htmlStr) => {
            if (!htmlStr) {
                throw new Error('(0)get null front code.');
            }
            //get google fonts resource file
            rst.frontCss = htmlStr;
            //regex woff files
            let woffReg = /https:\/\/.+\.woff2*/gi;
            let regRst = rst.frontCss.match(woffReg);
            if (!(regRst && regRst.length > 0)) {
                throw new Error('(1)no woff file matched.');
            }
            rst.woffs = regRst;

            let downloadWoff = [];

            rst.woffs.forEach((woffItem) => {
                let woffItemInfo = path.parse(woffItem);
                downloadWoff.push(new Promise((resolve, reject) => {
                    requestNative(woffItem).pipe(fs.createWriteStream(localtion + woffItemInfo.name + woffItemInfo.ext)).on('close', (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(localtion + woffItemInfo.name + woffItemInfo.ext);
                        }
                    })
                }));
            })
            return Promise.all(downloadWoff);
        })
        .then(woffFilePath => {
            woffFilePath.forEach(i => {
                console.log(i.toString() + " downloaded.");
            })
            //write main css
            let cssNameReg = /font-family\s*:\s*['"](\w+\s*\w*)['"]/gi;
            let cssName = cssNameReg.exec(rst.frontCss)[1]; //| "fontMain";
            cssName = cssName.replace(/\s/g, '') + ".css";
            return new Promise((resolve, reject) => {
                rst.woffs.forEach(woff => {
                    rst.frontCss = rst.frontCss.replace(woff, './' + (woff.match(/[A-Za-z0-9_-]+\.woff2*/i)[0]).toString());
                })
                fs.writeFile(localtion + cssName, rst.frontCss, (errMainFile) => {
                    if (errMainFile) {
                        reject(errMainFile);
                    } else {
                        resolve(localtion + cssName);
                    }
                })
            })
        })
        .then(mainFilePath => {
            console.log(mainFilePath.toString() + " created.");
        })
        .catch((err) => {
            console.error(err);
        })
}

let argv = program
    .option('f', {
        alias: 'fonter',
        demand: true,
        describe: 'google font url',
        type: 'string(url)'
    })
    .option('p', {
        alias: 'path',
        demand: true,
        describe: 'local path to save google font files',
        type: 'string(path)'
    })
    .usage('Usage: gfc -f [google fonter] -p [local path]')
    .help('h')
    .alias('h', 'help')
    .version(cmdInfo.version)
    .argv;

console.log('google font is: %j', argv.f);
console.log('local path is: %j', argv.p);
console.log('downloading...');
download(argv.f, argv.p);