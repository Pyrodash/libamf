const it = require('tape');
const AMF = require('../src/');

const encoding = AMF.ENCODING.AMF3;

function test(data, expected, serialize = false, tape) {
    if (!tape && expected.constructor.name === 'Test') {
        tape = expected;
        expected = null;
    }
    if (!tape && serialize.constructor.name === 'Test') {
        tape = serialize;
        serialize = null;
    }
    if (!expected) expected = data;

    const actual = serialize ? AMF.deserialize(AMF.serialize(data, encoding), encoding) : AMF.deserialize(data, encoding);

    return tape.deepEqual(actual, expected);
}

function sTest(data, expected, tape) {
    test(data, expected, true, tape);
}

it('can read/write strings', (tape) => {
    const str = 'lmao';

    sTest(str, tape);
    tape.end();
});

it('can read/write numbers', (tape) => {
    const intA = 16;
    const intB = 1.6;
    const intC = -1.6;

    sTest(intA, tape);
    sTest(intB, tape);
    sTest(intC, tape);

    tape.end();
});

it('can read/write dates', (tape) => {
    const date = new Date();

    sTest(date, tape);
    tape.end();
});

it('can read/write normal arrays', (tape) => {
    const arr = [1, 2, 3, { id: 2 }];

    sTest(arr, tape);
    tape.end();
});

it('can read/write ecma arrays (maps)', (tape) => {
    const map = new Map();

    map.set('test', 'lol');
    map.set(1, 'wtf');

    sTest(map, tape);
    tape.end();
});

it('can read/write typed objects', (tape) => {
    class Person {
        constructor(name, age) {
            this.name = name;
            this.age = age;
        }

        greet() {
            console.log("Hello! My name is " + this.name + " and I'm " + this.age + " yrs old.");
        }
    }

    AMF.registerClassAlias('com.Person', Person);

    const zaseth = new Person('Daan', 17);
    const res = AMF.deserialize(AMF.serialize(zaseth));

    //res.greet();

    tape.deepEqual(zaseth, res);
    tape.end();
});

it('can read/write dictionaries', (tape) => {
    const dict = new AMF.Dictionary();
    
    dict.set('A', 'Tent');
    dict.set('B', 'Preston');

    sTest(dict, tape);
    tape.end();
});

it('can read/write vectors', (tape) => {
    class Person {
        constructor(name, age) {
            this.name = name;
            this.age = age;
        }

        greet() {
            console.log("Hello! My name is " + this.name + " and I'm " + this.age + " yrs old.");
        }
    }

    AMF.registerClassAlias('com.Person', Person);

    const intV = new AMF.Vector(Number);
    intV.push(1, 2, 5, 8);

    const personV = new AMF.Vector(Person);
    personV.push(new Person('Zaseth', 17), new Person('Jackie', 16), new Person('Tent', 18));

    sTest(intV, tape);
    sTest(personV, tape);
    
    tape.end();
});

it('can read/write xml', (tape) => {
    const xml = new AMF.XML({
        person: {
            '@name': 'Tent',
            '@age': '18',
            friend: {
                '@name': 'Jackie',
                '@age': '16'
            }
        }
    });

    sTest(xml, tape);
    tape.end();
});

it('can read/write ByteArray', (tape) => {
    const ba = new AMF.ByteArray();
    ba.writeShort(5);

    sTest(ba, tape);
    tape.end();
});

// todo: better tests that use static outputs generated in flash