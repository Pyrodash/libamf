'use strict';

 // This is literally the Map class with a different name for serialization purposes

class Dictionary extends Map {
    toJSON() {
        return JSON.stringify([...this]);
    }
}

module.exports = Dictionary;