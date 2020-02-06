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

  let k = 0;
  function run() {
    while (k++ < n && s.write(b));
    if (k >= n)
      s.end();
  }
  s.on('drain', run);
  s.on('finish', () => bench.end(n));
  run();
}
