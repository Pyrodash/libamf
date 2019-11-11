const it                = require('tape');
const AMF               = require('../src/');
const {convertToBuffer} = require('../src/utils/Utils');

const data = convertToBuffer([0, 191, 0, 0, 0, 191, 84, 67, 83, 79, 0, 4, 0, 0, 0, 0, 0, 29, 112, 108, 97, 121, 46, 99, 112, 114, 101, 119, 114, 105, 116, 116, 101, 110, 46, 110, 101, 116, 47, 115, 101, 116, 116, 105, 110, 103, 115, 0, 0, 0, 0, 0, 5, 97, 108, 108, 111, 119, 1, 0, 0, 0, 6, 97, 108, 119, 97, 121, 115, 1, 0, 0, 0, 11, 97, 108, 108, 111, 119, 115, 101, 99, 117, 114, 101, 1, 0, 0, 0, 12, 97, 108, 119, 97, 121, 115, 115, 101, 99, 117, 114, 101, 1, 0, 0, 0, 6, 107, 108, 105, 109, 105, 116, 0, 64, 89, 0, 0, 0, 0, 0, 0, 0, 0, 11, 104, 115, 116, 115, 69, 110, 97, 98, 108, 101, 100, 1, 0, 0, 0, 10, 104, 115, 116, 115, 77, 97, 120, 65, 103, 101, 2, 0, 1, 48, 0, 0, 16, 104, 115, 116, 115, 73, 110, 99, 83, 117, 98, 68, 111, 109, 97, 105, 110, 1, 0, 0, 0, 13, 104, 115, 116, 115, 83, 116, 97, 114, 116, 84, 105, 109, 101, 2, 0, 1, 48, 0]);
const obj = {
    header: {
        contentLength: 191,
        type: 2,
        headerLength: 6,
        tagLength: 197,
        name: 'LSO'
    },
    body: {
        allow: false,
        always: false,
        allowsecure: false,
        alwayssecure: false,
        klimit: 100,
        hstsEnabled: false,
        hstsMaxAge: '0',
        hstsIncSubDomain: false,
        hstsStartTime: '0'
    }
};

it('can read LSOs', (tape) => {
    tape.deepEqual(AMF.SOL.read(data), obj);
    tape.end();
});

it('can write LSOs', (tape) => {
    const lso = new AMF.SOL.LSO(obj.body);

    lso.filename = 'play.cprewritten.net/settings';
    lso.version = 0;

    const res = lso.write();

    tape.deepEqual(res, data);
    tape.end();
});