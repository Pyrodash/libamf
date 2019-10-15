const _module = require('module');
const path = require('path');
const fs = require('fs');

module.exports = {
    isPacketArray: arr => arr && arr.constructor === Array && !(arr.find(item => !(item instanceof Packet))),
    getPath: function (myMdl) {
        const constructor = Object.getPrototypeOf(myMdl).constructor;

        for (var i in _module._cache) {
            const mdl = _module._cache[i];

            if (constructor === mdl.exports)
                return mdl.filename.replace(path.extname(mdl.filename), '');
        }
    },
    formatServiceName: function(name) {
        if(Service.ForceSuffix) {
            if(!name.endsWith('-service')) {
                name += '-service';
            }
        }

        return name;
    },
    readFile: function(...args) {
        return new Promise((resolve, reject) => {
            fs.readFile(...args, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }
};

const Service = require('./Service');