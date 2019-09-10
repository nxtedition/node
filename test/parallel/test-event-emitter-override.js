'use strict';

const common = require('../common');
const { EventEmitter: EE } = require('events');
const assert = require('assert')

{
  class A extends EE {};
  A.prototype.on = common.mustCall();
  new A().addListener('test', () => {});
}

// {
//   class A extends EE {};
//   const a = new A()
//   a.on = common.mustCall();
//   a.addListener('test', () => {});
// }

{
  class A extends EE {};
  const fn = common.mustCall();
  A.prototype.addListener = fn;
  const a = new A();
  assert.strictEqual(A.prototype.on, fn);
  assert.strictEqual(A.prototype.addListener, A.prototype.on);

  a.on('test', () => {});
}

// {
//   class A extends EE {};
//   const a = new A()
//   a.addListener = common.mustCall();
//   a.on('test', () => {});
// }

{
  class A extends EE {};
  A.prototype.removeListener = common.mustCall();
  new A().off('test', () => {});
}

{
  class A extends EE {};
  A.prototype.off = common.mustCall();
  new A().removeListener('test', () => {});
}

{
  class A extends EE {};
  A.prototype.off = common.mustNotCall();
  A.prototype.on = common.mustCall();
  class B extends A {};
  B.prototype.off = common.mustCall();
  new B().removeListener('test', () => {});
  new B().addListener('test', () => {});
}

{
  class A extends EE {};
  A.prototype.removeListener = common.mustNotCall();
  class B extends A {};
  B.prototype.off = common.mustCall();
  new B().removeListener('test', () => {});
  new B().addListener('test', () => {});
}

{
  class A extends EE {};
  A.prototype.off = common.mustNotCall();
  class B extends A {};
  B.prototype.removeListener = common.mustCall();
  new B().removeListener('test', () => {});
  new B().addListener('test', () => {});
}
