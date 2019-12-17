'use strict';

const common = require('../common');
const Transform = require('stream').Transform;

const bench = common.createBenchmark(main, {
  n: [1e6]
});

function main({ n }) {
  const s = Transform.by(async function*(source) {
    for await (const chunk of source) {
      yield chunk.toUpperCase();
    }
  });
  s.resume();

  bench.start();
  for (var k = 0; k < n; ++k) {
    s.write(String.fromCharCode(n % 64 + 64));
  }
  s.end(() => bench.end(n));
}
