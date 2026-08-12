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
      const wantCacheControl = isImmutable
        ? "public, max-age=31536000, immutable"
        : "no-store, must-revalidate";
      // Next prerender หน้า client-component เป็น static shell แล้วยัด
      // "Cache-Control: s-maxage=31536000" ทำให้ reverse proxy แคช HTML เก่าไว้ยาว ๆ
      // พอ deploy ใหม่ chunk hash เปลี่ยน แต่ HTML เก่าที่ถูกแคชยังชี้ chunk ที่ถูกลบ
      // ไปแล้ว -> ChunkLoadError. เราต้องบังคับ HTML เป็น no-store ให้ proxy เลิกแคช.
      // Next set header นี้ทั้งทาง res.setHeader และผ่าน args ของ writeHead จึงต้องดัก
      // ลบของเดิมออกจาก args ด้วย แล้วค่อย set ของเราตอน writeHead (ให้เราชนะเสมอ)
      const origWriteHead = res.writeHead;
      res.writeHead = function (statusCode, ...rest) {
        for (const arg of rest) {
          if (arg && typeof arg === "object") {
            if (Array.isArray(arg)) {
              // รูปแบบ [k1, v1, k2, v2, ...]
              for (let i = 0; i < arg.length - 1; i += 2) {
                if (String(arg[i]).toLowerCase() === "cache-control") {
                  arg.splice(i, 2);
                  i -= 2;
                }
              }
            } else {
              for (const k of Object.keys(arg)) {
                if (k.toLowerCase() === "cache-control") delete arg[k];
              }
            }
          }
        }
        res.setHeader("Cache-Control", wantCacheControl);
        return origWriteHead.call(res, statusCode, ...rest);
      };
      handle(req, res);
    })
    .listen(port, hostname, () => {
      console.log(`HTTPS Next.js ready: https://${hostname}:${port}`);
    });
});
