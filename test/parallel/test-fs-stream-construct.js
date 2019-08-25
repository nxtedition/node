'use strict';

const common = require('../common');
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const tmpdir = require('../common/tmpdir');
const fixtures = require('../common/fixtures');

const examplePath = fixtures.path('x.txt');
const dummyPath = path.join(tmpdir.path, 'x.txt');

tmpdir.refresh();

{
  // Compat with old node.

  function ReadStream(...args) {
    fs.ReadStream.call(this, ...args);
  }
  Object.setPrototypeOf(ReadStream.prototype, fs.ReadStream.prototype);
  Object.setPrototypeOf(ReadStream, fs.ReadStream);

  ReadStream.prototype.open = common.mustCall(function() {
    fs.open(this.path, this.flags, this.mode, (er, fd) => {
      if (er) {
        if (this.autoClose) {
          this.destroy();
        }
        this.emit('error', er);
        return;
      }

      this.fd = fd;
      this.emit('open', fd);
      this.emit('ready');
    });
  });

  let readyCalled = false;
  let ticked = false;
  const r = new ReadStream(examplePath)
    .on('ready', common.mustCall(() => {
      readyCalled = true;
      assert.strictEqual(r.readableReady, true);
      // Make sure 'ready' is emitted in same tick as 'open'.
      assert.strictEqual(ticked, false);
    }))
    .on('open', common.mustCall((fd) => {
      process.nextTick(() => {
        ticked = true;
      });
      assert.strictEqual(readyCalled, false);
      assert.strictEqual(fd, r.fd);
    }));
  assert.strictEqual(r.readableReady, false);
}

{
  // Compat with old node.

  function WriteStream(...args) {
    fs.WriteStream.call(this, ...args);
  }
  Object.setPrototypeOf(WriteStream.prototype, fs.WriteStream.prototype);
  Object.setPrototypeOf(WriteStream, fs.WriteStream);

  WriteStream.prototype.open = common.mustCall(function() {
    fs.open(this.path, this.flags, this.mode, (er, fd) => {
      if (er) {
        if (this.autoClose) {
          this.destroy();
        }
        this.emit('error', er);
        return;
      }

      this.fd = fd;
      this.emit('open', fd);
      this.emit('ready');
    });
  });

  let readyCalled = false;
  let ticked = false;
  const w = new WriteStream(dummyPath)
    .on('ready', common.mustCall(() => {
      readyCalled = true;
      assert.strictEqual(w.writableReady, true);
      // Make sure 'ready' is emitted in same tick as 'open'.
      assert.strictEqual(ticked, false);
    }))
    .on('open', common.mustCall((fd) => {
      process.nextTick(() => {
        ticked = true;
      });
      assert.strictEqual(readyCalled, false);
      assert.strictEqual(fd, w.fd);
    }));
  assert.strictEqual(w.writableReady, false);
}

{
  // Compat with graceful-fs.

  function ReadStream(...args) {
    fs.ReadStream.call(this, ...args);
  }
  Object.setPrototypeOf(ReadStream.prototype, fs.ReadStream.prototype);
  Object.setPrototypeOf(ReadStream, fs.ReadStream);

  ReadStream.prototype.open = common.mustCall(function ReadStream$open() {
    const that = this;
    fs.open(that.path, that.flags, that.mode, (err, fd) => {
      if (err) {
        if (that.autoClose)
          that.destroy();

        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
        that.read();
      }
    });
  });

  let readyCalled = false;
  let ticked = false;
  const r = new ReadStream(examplePath)
    .on('ready', common.mustCall(() => {
      readyCalled = true;
      assert.strictEqual(r.readableReady, true);
      // Make sure 'ready' is emitted in same tick as 'open'.
      assert.strictEqual(ticked, false);
    }))
    .on('open', common.mustCall((fd) => {
      process.nextTick(() => {
        ticked = true;
      });
      assert.strictEqual(readyCalled, false);
      assert.strictEqual(fd, r.fd);
    }));
}


{
  // Compat with graceful-fs.

  function WriteStream(...args) {
    fs.WriteStream.call(this, ...args);
  }
  Object.setPrototypeOf(WriteStream.prototype, fs.WriteStream.prototype);
  Object.setPrototypeOf(WriteStream, fs.WriteStream);

  WriteStream.prototype.open = common.mustCall(function WriteStream$open() {
    const that = this;
    fs.open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy();
        that.emit('error', err);
      } else {
        that.fd = fd
        that.emit('open', fd);
      }
    });
  });

  let readyCalled = false;
  let ticked = false;
  const w = new WriteStream(dummyPath)
    .on('ready', common.mustCall(() => {
      readyCalled = true;
      assert.strictEqual(w.writableReady, true);
      // Make sure 'ready' is emitted in same tick as 'open'.
      assert.strictEqual(ticked, false);
    }))
    .on('open', common.mustCall((fd) => {
      process.nextTick(() => {
        ticked = true;
      });
      assert.strictEqual(readyCalled, false);
      assert.strictEqual(fd, w.fd);
    }));
}

{
  // Compat error.

  function ReadStream(...args) {
    fs.ReadStream.call(this, ...args);
  }
  Object.setPrototypeOf(ReadStream.prototype, fs.ReadStream.prototype);
  Object.setPrototypeOf(ReadStream, fs.ReadStream);

  ReadStream.prototype.open = common.mustCall(function ReadStream$open() {
    const that = this;
    fs.open(that.path, that.flags, that.mode, (err, fd) => {
      that.emit('error', new Error('test'));
    });
  });

  new ReadStream(examplePath)
    .on('error', common.expectsError({
      type: Error,
      message: 'test'
    }));
}

{
  // Compat error.

  function WriteStream(...args) {
    fs.WriteStream.call(this, ...args);
  }
  Object.setPrototypeOf(WriteStream.prototype, fs.WriteStream.prototype);
  Object.setPrototypeOf(WriteStream, fs.WriteStream);

  WriteStream.prototype.open = common.mustCall(function WriteStream$open() {
    const that = this;
    fs.open(that.path, that.flags, that.mode, (err, fd) => {
      that.emit('error', new Error('test'));
    });
  });

  new WriteStream(examplePath)
    .on('error', common.expectsError({
      type: Error,
      message: 'test'
    }));
}
