'use strict';

class ArrayCollection extends Array {
    readExternal(AMF3, traits) {
        this.empty();
        
        const source = AMF3.read();
        
        for(var i in source) {
            this.push(source[i]);
        }
    }

    writeExternal(AMF3, traits) {
        AMF3.write([...this]);
    }

    empty() {
        this.splice(0, this.length);
    }
}

module.exports = ArrayCollection;