import { spawn } from 'node:child_process';
import chokidar from 'chokidar';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const buildScript = `${__dirname}/build.mjs`;
const serverScript = `${__dirname}/dev-server.mjs`;

let building = false;
let pending = false;

function runBuild() {
  if (building) {
    pending = true;
    return Promise.resolve();
  }

  building = true;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [buildScript], { stdio: 'inherit' });
    child.on('exit', (code) => {
      building = false;
      if (code === 0) {
        resolve();
      } else {
        pending = false;
        reject(new Error(`build exited with ${code}`));
      }
      if (pending) {
        pending = false;
        runBuild();
      }
    });
    child.on('error', (err) => {
      building = false;
      pending = false;
      reject(err);
    });
  });
}

async function main() {
  await runBuild();

  const server = spawn(process.execPath, [serverScript], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT ?? '3000',
    },
  });

  const watcher = chokidar.watch(['src', 'content', 'assets', 'scripts'], {
    ignoreInitial: true,
  });

  const scheduleBuild = () => {
    runBuild().catch((error) => {
      console.error('Rebuild failed:', error);
    });
  };

  watcher.on('all', scheduleBuild);

  const cleanUp = () => {
    watcher.close();
    if (!server.killed) {
      server.kill();
    }
    process.exit();
  };

  process.on('SIGINT', cleanUp);
  process.on('SIGTERM', cleanUp);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
