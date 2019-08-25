'use strict';

const assert = require('assert');
const { Readable } = require('stream');

{
  const r = new Readable({
    read: ()=> {},
    highWaterMark: 32,
  });

  r.push('a');
  r.push('b');
  r.push('c');

  // buffer should be compacted.
  assert.strictEqual(r._readableState.buffer.length, 1);
}

{
  const r = new Readable({
    read: ()=> {},
    highWaterMark: 50,
  });

  r.push('a');
  r.push('b');

  // buffer should not compacted.
  assert.strictEqual(r._readableState.buffer.length, 2);
}
