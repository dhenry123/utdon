#!/usr/bin/env node
/**
 * Minimal local HTTP proxy for running the Jest test suite without a
 * corporate proxy (see .envTest-sample).
 *
 * - Plain-HTTP targets: forwarded as absolute-form proxy requests
 *   (what http-proxy-agent sends).
 * - HTTPS targets: CONNECT tunneling (what https-proxy-agent sends).
 *   TLS stays end-to-end with the real target, so no CA certificate
 *   is needed and PROXYCA_CERT can stay empty.
 *
 * Usage: node test/tools/localProxy.mjs [port]      (default 3128)
 *        npm run startLocalProxy
 *
 * Listens on 127.0.0.1 only — do not expose it further.
 */
import http from "node:http";
import net from "node:net";

const port = Number(process.argv[2] ?? process.env.LOCALPROXY_PORT ?? 3128);

// headers that must not be forwarded between hops
const hopByHop = new Set([
  "connection",
  "proxy-connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const server = http.createServer((req, res) => {
  // absolute-form: "GET http://host/path HTTP/1.1"
  let target;
  try {
    target = new URL(req.url);
  } catch {
    res.writeHead(400);
    res.end("localProxy: expected absolute-form URL in proxy request");
    return;
  }
  if (target.protocol !== "http:") {
    res.writeHead(400);
    res.end(`localProxy: unsupported protocol ${target.protocol}`);
    return;
  }
  const headers = { ...req.headers };
  for (const name of Object.keys(headers)) {
    if (hopByHop.has(name.toLowerCase())) delete headers[name];
  }
  const upstream = http.request(
    {
      host: target.hostname,
      port: target.port || 80,
      method: req.method,
      path: `${target.pathname}${target.search}`,
      headers,
    },
    (upstreamRes) => {
      const outHeaders = { ...upstreamRes.headers };
      for (const name of Object.keys(outHeaders)) {
        if (hopByHop.has(name.toLowerCase())) delete outHeaders[name];
      }
      res.writeHead(upstreamRes.statusCode, outHeaders);
      upstreamRes.pipe(res);
    }
  );
  upstream.on("error", (error) => {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(`localProxy: upstream error: ${error.message}`);
  });
  req.pipe(upstream);
});

// CONNECT host:port — tunnel bytes untouched
server.on("connect", (req, clientSocket, head) => {
  const [host, portString] = req.url.split(":");
  const upstream = net.connect(Number(portString) || 443, host, () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    if (head.length > 0) upstream.write(head);
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });
  upstream.on("error", (error) => {
    clientSocket.end(`HTTP/1.1 502 localProxy: ${error.message}\r\n\r\n`);
    clientSocket.destroy();
  });
  clientSocket.on("error", () => upstream.destroy());
});

server.listen(port, "127.0.0.1", () => {
  console.log(`localProxy listening on http://127.0.0.1:${port}`);
});
