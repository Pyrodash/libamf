const path = require('path');

module.exports = {
    isPacketArray: arr => arr && arr.constructor === Array && !(arr.find(item => !(item instanceof Packet))),
    getPath: function (myMdl) {
        const _module = require('module');

        for (var i in _module._cache) {
            const mdl = _module._cache[i];

            if (Object.getPrototypeOf(myMdl).constructor === mdl.exports)
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
    }
};

const Service = require('./Service');