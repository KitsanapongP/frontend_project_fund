const https = require("https");
const fs = require("fs");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

const keyPath = process.env.HTTPS_KEY_PATH;
const certPath = process.env.HTTPS_CERT_PATH;

if (!keyPath || !certPath) {
  throw new Error(
    "Missing HTTPS cert configuration. Set HTTPS_KEY_PATH and HTTPS_CERT_PATH."
  );
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  https
    .createServer(httpsOptions, (req, res) => handle(req, res))
    .listen(port, hostname, () => {
      console.log(`HTTPS Next.js ready: https://${hostname}:${port}`);
    });
});
