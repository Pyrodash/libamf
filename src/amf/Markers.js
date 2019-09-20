module.exports = {
    AMF3: {
        UNDEFINED: 0x00,
        NULL: 0x01,
        FALSE: 0x02,
        TRUE: 0x03,
        INT: 0x04,
        DOUBLE: 0x05,
        STRING: 0x06,
        XML_DOC: 0x07,
        DATE: 0x08,
        ARRAY: 0x09,
        OBJECT: 0x0A,
        XML: 0x0B,
        BYTE_ARRAY: 0x0C,
        VECTOR_INT: 0x0D,
        VECTOR_UINT: 0x0E,
        VECTOR_DOUBLE: 0x0F,
        VECTOR_OBJECT: 0x10,
        DICTIONARY: 0x11
    },

    AMF0: {
        NUMBER: 0x00,
        BOOLEAN: 0x01,
        STRING: 0x02,
        OBJECT: 0x03,
        MOVIECLIP: 0x04,
        NULL: 0x05,
        UNDEFINED: 0x06,
        REFERENCE: 0x07,
        ECMA_ARRAY: 0x08,
        OBJECT_END: 0x09,
        STRICT_ARRAY: 0x0A,
        DATE: 0x0B,
        LONG_STRING: 0x0C,
        UNSUPPORTED: 0x0D,
        RECORDSET: 0x0E,
        XML_DOC: 0x0F,
        TYPED_OBJECT: 0x10,
        AVMPLUS: 0x11
    },

    FLEX: {
        // AbstractMessage
        HAS_NEXT_FLAG: 128,
        BODY_FLAG: 1,
        CLIENT_ID_FLAG: 2,
        DESTINATION_FLAG: 4,
        HEADERS_FLAG: 8,
        MESSAGE_ID_FLAG: 16,
        TIMESTAMP_FLAG: 32,
        TIME_TO_LIVE_FLAG: 64,
        CLIENT_ID_BYTES_FLAG: 1,
        MESSAGE_ID_BYTES_FLAG: 2,
        // AsyncMessage
        CORRELATION_ID_FLAG: 1,
        CORRELATION_ID_BYTES_FLAG: 2,
        // CommandMessage
        OPERATION_FLAG: 1
    }
}