'use strict';
// TLS records that are already buffered are emitted as one chunk rather than
// one chunk per record. A clean or failed end of the stream that arrives with
// them must still be reported after the data that precedes it.

const common = require('../common');
if (!common.hasCrypto)
  common.skip('missing crypto');

const assert = require('assert');
const net = require('net');
const tls = require('tls');
const fixtures = require('../common/fixtures');

const RECORD_SIZE = 512;
const RECORDS = 64;
const payload = Buffer.alloc(RECORD_SIZE * RECORDS);
for (let i = 0; i < RECORDS; i++)
  payload.fill(i & 0xff, i * RECORD_SIZE, (i + 1) * RECORD_SIZE);

const serverOptions = {
  key: fixtures.readKey('agent1-key.pem'),
  cert: fixtures.readKey('agent1-cert.pem'),
};
const clientOptions = {
  ca: fixtures.readKey('ca1-cert.pem'),
  servername: 'agent1',
};

// Writes the payload as small records in one go, so that they reach the client
// together, followed by close_notify.
function sendPayload(socket) {
  assert(socket.setMaxSendFragment(RECORD_SIZE));
  socket.end(payload);
}

// Buffered records are coalesced, and 'end' follows all of the data.
{
  const server = tls.createServer(serverOptions, common.mustCall(sendPayload));
  server.listen(0, common.mustCall(() => {
    const chunks = [];
    const client = tls.connect({
      ...clientOptions,
      port: server.address().port,
    });
    client.on('data', (chunk) => chunks.push(chunk));
    client.on('end', common.mustCall(() => {
      assert.deepStrictEqual(Buffer.concat(chunks), payload);
      assert(chunks.length < RECORDS,
             `${chunks.length} chunks for ${RECORDS} records`);
      server.close();
    }));
  }));
}

// A listener buffer smaller than a record still receives every byte.
{
  const server = tls.createServer(serverOptions, common.mustCall(sendPayload));
  server.listen(0, common.mustCall(() => {
    const received = [];
    const client = tls.connect({
      ...clientOptions,
      port: server.address().port,
      onread: {
        buffer: Buffer.alloc(100),
        callback(nread, buf) {
          received.push(Buffer.from(buf.subarray(0, nread)));
        },
      },
    });
    client.on('end', common.mustCall(() => {
      assert.deepStrictEqual(Buffer.concat(received), payload);
      server.close();
    }));
  }));
}

// A TLS error that arrives together with data is reported after that data.
{
  const server = tls.createServer(serverOptions, common.mustCall((socket) => {
    socket.once('data', common.mustCall(() => sendPayload(socket)));
  }));
  server.listen(0, common.mustCall(() => {
    // Forwards the handshake, then holds the response until the server ends
    // and delivers it at once with its last record (the encrypted
    // close_notify) corrupted.
    let holding = false;
    const held = [];
    const proxy = net.createServer(common.mustCall((socket) => {
      const upstream = net.connect(server.address().port);
      socket.pipe(upstream);
      socket.on('error', () => {});
      upstream.on('data', (chunk) => {
        if (holding)
          held.push(chunk);
        else
          socket.write(chunk);
      });
      upstream.on('end', common.mustCall(() => {
        const data = Buffer.concat(held);
        data[data.length - 1] ^= 1;
        socket.end(data);
      }));
    }));
    proxy.listen(0, common.mustCall(() => {
      const chunks = [];
      const client = tls.connect({
        ...clientOptions,
        port: proxy.address().port,
      }, common.mustCall(() => {
        holding = true;
        client.write('go');
      }));
      client.on('data', (chunk) => chunks.push(chunk));
      client.on('error', common.mustCall((err) => {
        assert.strictEqual(err.code,
                           'ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC');
        assert.deepStrictEqual(Buffer.concat(chunks), payload);
        proxy.close();
        server.close();
      }));
    }));
  }));
}
