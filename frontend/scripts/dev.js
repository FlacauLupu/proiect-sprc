import net from "net";
import { spawn } from "child_process";
import "dotenv/config";

const basePort = Number(process.env.VITE_PORT) || 5173;

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

async function findPort(port) {
  while (!(await isPortFree(port))) {
    console.log(`Port ${port} in use, trying ${port + 1}`);
    port++;
  }
  return port;
}

(async () => {
  const port = await findPort(basePort);

  console.log(`Starting Vite on port ${port}`);

  spawn("vite", ["--port", port], {
    stdio: "inherit",
    shell: true,
  });
})();
