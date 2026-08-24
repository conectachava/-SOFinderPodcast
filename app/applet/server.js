// app/applet/server.js
// Minimal custom Next.js server compatible with Node (CommonJS).
// Starts Next in a custom Node server so the project can use "start: node server.js"
// Includes a basic /healthz endpoint for load balancers and readiness checks.

const next = require("next");
const http = require("http");
const url = require("url");
const path = require("path");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
// Use the directory of this file as the Next app root. This assumes npm start is run from app/applet.
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      try {
        const parsed = url.parse(req.url, true);
        // lightweight health endpoint for Cloud Run / LB
        if (parsed.pathname === "/healthz") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          return res.end("ok");
        }

        // Add any custom middleware here (headers, auth, proxying) before handing to Next
        // Example: add a small response header
        res.setHeader("X-SourceFinder-Server", "custom-node-server");

        return handle(req, res);
      } catch (err) {
        console.error("Server error:", err);
        try {
          res.statusCode = 500;
          res.end("Internal Server Error");
        } catch (e) {
          // noop
        }
      }
    });

    server.listen(port, "0.0.0.0", (err) => {
      if (err) throw err;
      console.log(`> Next.js server listening on http://0.0.0.0:${port} (dev=${dev})`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log("Shutting down...");
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  })
  .catch((err) => {
    console.error("Failed to prepare Next app:", err);
    process.exit(1);
  });
