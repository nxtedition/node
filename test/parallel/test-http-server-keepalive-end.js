'use strict';

const common = require('../common');
const { createServer } = require('http');
const { connect } = require('net');
const assert = require('assert');

const server = createServer(common.mustCall((req, res) => {
  let closeEmitted = false;
  req.on('close', () => {
    closeEmitted = true;
  })
  req.on('end', common.mustCall(() => {
    assert.strictEqual(closeEmitted, false);
  }));
  res.end('hello world');
}));

server.unref();

server.listen(0, common.mustCall(() => {

  const client = connect(server.address().port);

  const req = [
    'POST / HTTP/1.1',
    `Host: localhost:${server.address().port}`,
    'Connection: keep-alive',
    'Content-Length: 11',
    '',
    'hello world',
    ''
  ].join('\r\n');

  client.end(req);
}));
