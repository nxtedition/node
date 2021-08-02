'use strict';
const {
  Transform,
  Writable,
  pipeline,
} = require('stream');
const assert = require('assert');

function createTransformStream(tf, context) {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,

    transform(chunk, encoding, done) {
      tf(chunk, context, done);
    }
  });
}

const write = new Writable({
  write(data, enc, cb) {
    cb();
  }
});

const ts = createTransformStream((chunk, _, done) => {
  return done(new Error('Artificial error'));
});

pipeline(ts, write, (err) => {
  assert.ok(err, 'should have an error');
  console.log(err);
});

ts.write('test');
