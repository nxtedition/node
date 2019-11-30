'use strict';
const common = require('../common');
const assert = require('assert');

const stream = require('stream');

class MyWritable extends stream.Writable {
  _write(chunk, encoding, callback) {
    assert.notStrictEqual(chunk, null);
    callback();
  }
}

{
  const m = new MyWritable({ objectMode: true });
  m.write(null, common.expectsError({
    code: 'ERR_STREAM_NULL_VALUES',
    type: TypeError,
    message: 'May not write null values to stream'
  }));
  m.on('error', common.expectsError({
    code: 'ERR_STREAM_NULL_VALUES',
    type: TypeError,
    message: 'May not write null values to stream'
  }));
}

{ // Should not throw.
  const m = new MyWritable({ objectMode: true }).on('error', assert);
  m.write(null, assert);
}

{
  const m = new MyWritable({ objectMode: false });
  m.write(false, common.expectsError({
    code: 'ERR_INVALID_ARG_TYPE',
    type: TypeError,
  }));
  m.on('error', common.expectsError({
    code: 'ERR_INVALID_ARG_TYPE',
    type: TypeError,
  }));
}

{ // Should not throw.
  const m = new MyWritable().on('error', assert);
  m.write(false, assert);
}

{ // Should not throw.
  const m = new MyWritable({ objectMode: true });
  m.write(false, assert.ifError);
}

{ // Should not throw.
  const m = new MyWritable({ objectMode: true }).on('error', (e) => {
    assert.ifError(e || new Error('should not get here'));
  });
  m.write(false, assert.ifError);
}
