'use strict';

const {parse, j2xParser} = require('fast-xml-parser');

const options = {
    ignoreAttributes: false,
    attributeNamePrefix: '@'
};
const XMLParser = new j2xParser(options);

// TODO: XML Builder?

class XML {
    constructor(data = {}, legacy = false) {
        this.data = data;
        this.legacy = legacy;
    }

    stringify() {
        return XMLParser.parse(this.data);
    }
}

function format(obj) {
    for (var i in obj) {
        const val = obj[i];

        if (typeof val === 'object') {
            format(val);
        } else {
            if (!isNaN(val) && val !== null) {
                obj[i] = Number(val);
            }
        }
    }
}

XML.ParseNumbers = false;
XML.parse = function(...data) {
    const opts = typeof data[data.length - 1] !== 'object' ? options : data.pop();
    const res = new XML(parse(data.shift(), opts), ...data);

    if(XML.ParseNumbers) {
        format(res.data);
    }

    return res;
};

module.exports = XML;