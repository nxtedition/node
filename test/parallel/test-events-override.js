'use strict';

const common = require('../common');
const { EventEmitter: EE } = require('events');

{
  class A extends EE {};
  A.prototype.on = common.mustCall();
  new A().addListener('test', () => {});
}

{
  class A extends EE {};
  A.prototype.addListener = common.mustCall();
  new A().on('test', () => {});
}

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
