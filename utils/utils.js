const fs = require('fs');
const path = require('path');

exports.exitsFolder = async function (reaPath) {
    const absPath = path.resolve(__dirname, reaPath);
    
    fs.stat(absPath, function (err, stats) {
        if (!stats) {
            fs.mkdir(absPath, {recursive: true}, err => {
                if (err) throw err;
            }); //Create dir in case not found
        }
    });

}