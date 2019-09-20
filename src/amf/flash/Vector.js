'use strict';

const Utils = require('../../utils/Utils');
const Data  = new WeakMap(); // We use a weak map to store the type of a vector so that it does not as one of the contents of the vector

class Vector extends Array {
    constructor(type) {
        super();

        if(!type) {
            type = 'dynamic';
        }

        Data.set(this, {});
        this.type = type;
    }

    set type(type) {
        const data = Data.get(this);

        if(!data.type || data.type.toLowerCase() === 'dynamic') {
            data.type = type;
            data.constructor = Utils.getConstructor(type);
        }
    }

    get type() {
        return Data.get(this).type;
    }

    push(...args) {
        var data = Data.get(this);

        return super.push(...args.filter(inst => {
            const InvalidTypeError = new Error('Invalid type ' + inst.constructor.name + ' for vector of type ' + data.constructor.name + '.');

            if(!(inst.constructor === data.constructor)) {
                throw InvalidTypeError;
            }

            if(constructor === Object) {
                if(!data.keys) {
                    // Assume the first object is the right structure for this vector
                    data.keys = Object.keys(inst);
                } else {
                    for(const key of data.keys) {
                        if(inst[key] === undefined) {
                            throw InvalidTypeError;
                        }
                    }

                    for(const key of Object.keys(inst)) {
                        if(!data.keys.includes(key)) {
                            throw InvalidTypeError;
                        }
                    }
                }
            }

            return true;
        }));
    }
}

module.exports = Vector;