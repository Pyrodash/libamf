'use strict';

class ObjectProxy{
	
    readExternal(AMF3, traits) {
        const source = AMF3.read();
        Object.assign(this,source);
    }

    writeExternal(AMF3, traits) {
       AMF3.write(this);
    }
}

module.exports = ObjectProxy;