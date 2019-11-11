'use strict';

/* Credits to Gabriel Mariani for SOL [https://github.com/gmariani] */

const Markers = require('../../Markers').SOL;

class Header {
    constructor() {}

    read(ctx) {
        const ba = ctx.byteArray;
        const start = ba.position;
        const tagTypeAndLength = ba.readUnsignedShort();

        this.contentLength = tagTypeAndLength & 0x3f;

        if(this.contentLength === 0x3f) {
            this.contentLength = ba.readInt();
        }

        this.type = tagTypeAndLength >> 6;
        this.headerLength = ba.position - start;
        this.tagLength = this.headerLength + this.contentLength;
        
        for(var i in Markers) {
            if(Markers[i] === this.type) {
                this.name = i;

                break;
            }
        }

        return this;
    }
}

module.exports = Header;