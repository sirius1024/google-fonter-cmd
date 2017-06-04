#!/usr/bin/env node


var fs = require('fs')
var path = require('path')
var program = require('commander')
var request = require('request-promise');
var requestNative = require('request');
var Promise = require('bluebird');
var _exit = process.exit
var pkg = require('./package.json')

var version = pkg.version

process.exit = exit


program
    .version(version, '    --version')
    .option('-f, --font <font>', 'google font url')
    .option('-p, --path <path>', 'local path')
    .parse(process.argv)

if (!exit.exited) {
    main()
}


//bll
function download(fontUrl, localPath) {
    var url = fontUrl;
    var localtion = localPath;

    //request option, if don't cannot get full html.
    var option = {
        uri: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        method: 'GET'
    }
    var rst = {};
    request(option)
        .then(function (htmlStr) {
            if (!htmlStr) {
                throw new Error('(0)get null front code.');
            }
            //get google fonts resource file
            rst.frontCss = htmlStr;
            //regex woff files
            var woffReg = /https:\/\/.+\.woff2*/gi;
            var regRst = rst.frontCss.match(woffReg);
            if (!(regRst && regRst.length > 0)) {
                throw new Error('(1)no woff file matched.');
            }
            rst.woffs = regRst;

            var downloadWoff = [];

            rst.woffs.forEach(function (woffItem) {
                var woffItemInfo = path.parse(woffItem);
                downloadWoff.push(new Promise(function (resolve, reject) {
                    requestNative(woffItem).pipe(fs.createWriteStream(localtion + woffItemInfo.name + woffItemInfo.ext)).on('close', function (err) {
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
        .then(function (woffFilePath) {
            woffFilePath.forEach(function (i) {
                console.log(i.toString() + " downloaded.");
            })
            //write main css
            var cssNameReg = /font-family\s*:\s*['"](\w+\s*\w*)['"]/gi;
            var cssName = cssNameReg.exec(rst.frontCss)[1]; //| "fontMain";
            cssName = cssName.replace(/\s/g, '') + ".css";
            return new Promise(function (resolve, reject) {
                rst.woffs.forEach(function (woff) {
                    rst.frontCss = rst.frontCss.replace(woff, './' + (woff.match(/[A-Za-z0-9_-]+\.woff2*/i)[0]).toString());
                })
                fs.writeFile(localtion + cssName, rst.frontCss, function (errMainFile) {
                    if (errMainFile) {
                        reject(errMainFile);
                    } else {
                        resolve(localtion + cssName);
                    }
                })
            })
        })
        .then(function (mainFilePath) {
            console.log(mainFilePath.toString() + " created.");
        })
        .catch(function (err) {
            console.error(err);
        })
}


function exit(code) {
    function done() {
        if (!(draining--)) _exit(code)
    }

    var draining = 0
    var streams = [process.stdout, process.stderr]

    exit.exited = true

    streams.forEach(function (stream) {
        draining += 1
        stream.write('', done)
    })
    done()
}


/**
 * Main program.
 */
function main() {
    var destinationPath = program.path;
    var font = program.font;

    console.log('google font is: %j', font);
    console.log('local path is: %j', destinationPath);
    console.log('downloading...');
    download(font, destinationPath);
}
