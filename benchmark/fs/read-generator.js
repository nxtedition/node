// Test the throughput of the fs.WriteStream class.
'use strict';

const path = require('path');
const common = require('../common.js');
const fs = require('fs');
const assert = require('assert');

const tmpdir = require('../../test/common/tmpdir');
tmpdir.refresh();
const filename = path.resolve(tmpdir.path,
                              `.removeme-benchmark-garbage-${process.pid}`);

let encodingType, encoding, size, filesize, type;

const bench = common.createBenchmark(main, {
  encodingType: ['buf'],
  filesize: [1000 * 1024 * 1024],
  size: [4096],
  type: ['stream', 'generator']
});

function main(conf) {
  encodingType = conf.encodingType;
  size = conf.size;
  filesize = conf.filesize;
  type = conf.type;

  switch (encodingType) {
    case 'buf':
      encoding = null;
      break;
    case 'asc':
      encoding = 'ascii';
      break;
    case 'utf':
      encoding = 'utf8';
      break;
    default:
      throw new Error(`invalid encodingType: ${encodingType}`);
  }

  makeFile();
}

async function runTest() {
  assert(fs.statSync(filename).size === filesize);

  let started = false;

  const src = type === 'stream' ?
    fs.createReadStream(filename, { highWaterMark: size }) :
    fs.createReadIterable(filename, { highWaterMark: size });

  let bytes = 0;
  for await (const chunk of src) {
    if (!started) {
      started = true;
      bench.start();
    }
    bytes += chunk.length;
  }
  try { fs.unlinkSync(filename); } catch {}
  // MB/sec
  bench.end(bytes / (1024 * 1024));
}

function makeFile() {
  const buf = Buffer.allocUnsafe(filesize / 1024);
  if (encoding === 'utf8') {
    // ü
    for (let i = 0; i < buf.length; i++) {
      buf[i] = i % 2 === 0 ? 0xC3 : 0xBC;
    }
  } else if (encoding === 'ascii') {
    buf.fill('a');
  } else {
    buf.fill('x');
  }

  try { fs.unlinkSync(filename); } catch {}
  let w = 1024;
  const ws = fs.createWriteStream(filename);
  ws.on('close', runTest);
  ws.on('drain', write);
  write();
  function write() {
    do {
      w--;
    } while (false !== ws.write(buf) && w > 0);
    if (w === 0)
      ws.end();
  }
}
