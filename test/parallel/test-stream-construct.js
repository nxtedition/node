'use strict';

const common = require('../common');
const { Writable, Readable } = require('stream');
const assert = require('assert');

{
  // Pass options as is to construct.

  const options2 = {
    test: 'foo',
    construct(options, callback) {
      assert.strictEqual(options, options2);
      callback();
    }
  };
  const w = new Writable(options2);
  w.on('ready', common.mustCall());
}

{
  // Pass options as is to construct.

  const options2 = {
    test: 'foo',
    construct(options, callback) {
      assert.strictEqual(options, options2);
      callback();
    },
    read() {}
  };
  const r = new Readable(options2);
  r.on('ready', common.mustCall());
}

{
  // Emit ready in next tick when sync construct.

  const w = new Writable({
    construct(options, callback) {
      callback();
    }
  });
  assert.strictEqual(w.writableReady, false);
  w.on('ready', common.mustCall(() => {
    assert.strictEqual(w.writableReady, true);
  }));
}

{
  // Emit ready in next tick when sync construct.

  const r = new Readable({
    construct(options, callback) {
      callback();
    },
    read() {}
  });
  assert.strictEqual(r.readableReady, false);
  r.on('ready', common.mustCall(() => {
    assert.strictEqual(r.readableReady, true);
  }));
}

{
  // Emit ready on async construct.

  const w = new Writable({
    construct(options, callback) {
      process.nextTick(callback);
    }
  });
  assert.strictEqual(w.writableReady, false);
  w.on('ready', common.mustCall(() => {
    assert.strictEqual(w.writableReady, true);
  }));
}

{
  // Emit ready on async construct.

  const r = new Readable({
    construct(options, callback) {
      process.nextTick(callback);
    },
    read() {}
  });
  assert.strictEqual(r.readableReady, false);
  r.on('ready', common.mustCall(() => {
    assert.strictEqual(r.readableReady, true);
  }));
}

{
  // No construct.

  const w = new Writable({
  });
  assert.strictEqual(w.writableReady, true);
  w.on('ready', common.mustNotCall());
}

{
  // No construct.

  const r = new Readable({
    read() {}
  });
  assert.strictEqual(r.readableReady, true);
  r.on('ready', common.mustNotCall());
}

{
  // Don't emit ready on destroy.

  const w = new Writable({
    construct(options, callback) {
      callback();
    }
  });
  w.on('ready', common.mustNotCall());
  w.destroy();
}

{
  // Don't emit ready on destroy.

  const r = new Readable({
    construct(options, callback) {
      callback();
    },
    read() {}
  });
  r.on('ready', common.mustNotCall());
  r.destroy();
}

{
  // Don't emit ready on destroy.

  let pending = true;
  const w = new Writable({
    construct(options, callback) {
      process.nextTick(() => {
        pending = false;
        callback();
      });
    },
    destroy() {
      // Don't destroy before constructed.
      assert.strictEqual(pending, false);
      // Not ready if destroy()ed before ready.
      assert.strictEqual(w.writableReady, false);
    }
  });
  w.on('ready', common.mustNotCall());
  w.destroy();
}

{
  // Don't emit ready on destroy.

  let pending = true;
  const r = new Readable({
    construct(options, callback) {
      process.nextTick(() => {
        pending = false;
        callback();
      });
    },
    destroy() {
      // Don't destroy before constructed.
      assert.strictEqual(pending, false);
      // Not ready if destroy()ed before ready.
      assert.strictEqual(r.readableReady, false);
    },
    read() {}
  });
  r.on('ready', common.mustNotCall());
  r.destroy();
}

{
  // Throw synchronously

  common.expectsError(function() {
    new Writable({
      construct(options, callback) {
        throw new Error('test');
      }
    });
  }, {
    type: Error,
    message: 'test'
  });
}

{
  // Throw synchronously

  common.expectsError(function() {
    new Readable({
      construct(options, callback) {
        throw new Error('test');
      }
    });
  }, {
    type: Error,
    message: 'test'
  });
}
