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
    .createServer(httpsOptions, (req, res) => {
      const isImmutable = req.url && req.url.startsWith("/_next/static/");
      // แทรกตอน writeHead เพื่อ "ทับ" Cache-Control ที่ Next ตั้งมาเอง หน้า static ของ
      // Next บางทีตั้ง s-maxage ทำให้ reverse proxy แคช HTML เก่าไว้ พอ deploy ใหม่ chunk
      // hash เปลี่ยน แต่ HTML เก่าที่ถูกแคชยังชี้ chunk เก่าที่ถูกลบไปแล้ว -> ChunkLoadError.
      // บังคับ HTML/ทุกอย่างที่ไม่ใช่ static เป็น no-store เพื่อให้โหลด HTML สดเสมอ
      const origWriteHead = res.writeHead;
      res.writeHead = function (...args) {
        if (isImmutable) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "no-store, must-revalidate");
        }
        return origWriteHead.apply(res, args);
      };
      handle(req, res);
    })
    .listen(port, hostname, () => {
      console.log(`HTTPS Next.js ready: https://${hostname}:${port}`);
    });
});
