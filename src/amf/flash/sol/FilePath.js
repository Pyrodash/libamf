'use strict';

/* Credits to Gabriel Mariani for SOL [https://github.com/gmariani] */

const ByteArray = require('bytearray-node');

class FilePath {
    constructor(path, header) {
        if(typeof path !== 'string') {
            header = path;
            path = null;
        }
        
        this.path = path;
        this.header = header;
    }

    read(ctx) {
        super.read(ctx);

        this.path = ctx.byteArray.readUTFBytes(ctx.byteArray.readUnsignedShort());
    }
    
    write(ctx) {
        const baBody = new ByteArray();
        //baBody.endian = false;

        baBody.writeUTF(this.path);

        const ba = ctx && ctx.byteArray ? ctx.byteArray : new ByteArray();
        
        ba.writeByte(0x00);
        ba.writeByte(0xff);

        ba.writeUnsignedInt(baBody.position);
        ba.writeBytes(baBody);

        return ba;
    }
}

module.exports = FilePath;