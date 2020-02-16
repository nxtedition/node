'use strict';

const fs = require('fs');
const { promisify } = require('internal/util');
const { validateNumber } = require('internal/validators');
const { Buffer } = require('buffer');
const { toPathIfFileURL } = require('internal/url');
const {
  ERR_OUT_OF_RANGE
} = require('internal/errors').codes;

const {
  MathMin,
  NumberIsInteger,
  NumberIsSafeInteger
} = primordials;

const openAsync = promisify(fs.open);
const readAsync = promisify(fs.read);
const closeAsync = promisify(fs.close);

function checkPosition(pos, name) {
  if (!NumberIsSafeInteger(pos)) {
    validateNumber(pos, name);
    if (!NumberIsInteger(pos))
      throw new ERR_OUT_OF_RANGE(name, 'an integer', pos);
    throw new ERR_OUT_OF_RANGE(name, '>= 0 and <= 2 ** 53 - 1', pos);
  }
  if (pos < 0) {
    throw new ERR_OUT_OF_RANGE(name, '>= 0 and <= 2 ** 53 - 1', pos);
  }
}

async function* createReadIterable(path, options) {
  options = options || {};

  path = toPathIfFileURL(path);

  const highWaterMark = options.highWaterMark || 64 * 1024;
  const flags = options.flags === undefined ? 'r' : options.flags;
  const mode = options.mode === undefined ? 0o666 : options.mode;
  const start = options.start;
  const end = options.end !== undefined ? options.end : Infinity;

  let fd = options.fd === undefined ? null : options.fd;
  let pos = 0;

  if (start !== undefined) {
    checkPosition(start, 'start');

    pos = start;
  }

  if (end !== Infinity) {
    checkPosition(end, 'end');

    if (start !== undefined && start > end) {
      throw new ERR_OUT_OF_RANGE(
        'start',
        `<= "end" (here: ${end})`,
        start
      );
    }
  }

  try {
    if (typeof fd !== 'string') {
      fd = await openAsync(path, flags, mode);
    }

    while (true) {
      const len = MathMin(end - pos + 1, highWaterMark);
      const buf = Buffer.allocUnsafe(len);
      const { bytesRead } = await readAsync(fd, buf, 0, len, pos);
      if (bytesRead === 0) {
        return;
      }
      pos += bytesRead;
      yield buf.slice(0, bytesRead);
    }
  } finally {
    await closeAsync(fd);
  }
}

module.exports = {
  createReadIterable
};
