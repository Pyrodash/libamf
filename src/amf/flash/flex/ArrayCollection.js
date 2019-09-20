'use strict';

class ArrayCollection extends Array {
    readExternal(AMF3) {
        this.empty();
        const source = AMF3.read();

        for(var i in source) {
            this.push(source[i]);
        }
    }

    writeExternal(AMF3) {
        this.writeObject(AMF3, true);
    }

    empty() {
        this.splice(0, this.length);
    }
}

module.exports = ArrayCollection;