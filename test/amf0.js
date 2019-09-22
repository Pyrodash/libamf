const it = require('tape');
const AMF    = require('../src/');

const encoding = AMF.ENCODING.AMF0;

function test(data, expected, serialize = false, tape) {
    if(!tape && expected.constructor.name === 'Test') {
        tape = expected;
        expected = null;
    }
    if(!tape && serialize.constructor.name === 'Test') {
        tape = serialize;
        serialize = null;
    }
    if(!expected) expected = data;

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

it('can read/write strict arrays', (tape) => {
    const arr = [1, 2, 3, { id: 2 }];

    sTest(arr, tape);
    tape.end();
});

it('can read/write ecma arrays', (tape) => {
    const map = new Map();

    map.set('test', 'lol');
    map.set(1, 'lol');

    sTest(map, tape);
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