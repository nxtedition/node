'use strict';
const common = require('../common');
const net = require('net');

const server = net.createServer().listen(0, common.mustCall(() => {
  const client = net.connect(server.address().port, common.mustCall(() => {
    client.write('broken', 'buffer', common.expectsError({
      type: TypeError,
      code: 'ERR_INVALID_ARG_TYPE',
      message: 'Second argument must be a buffer'
    }));
    client.on('error', common.expectsError({
      type: TypeError,
      code: 'ERR_INVALID_ARG_TYPE',
      message: 'Second argument must be a buffer'
    }));
    client.destroy();
    server.close();
  }));
}));
