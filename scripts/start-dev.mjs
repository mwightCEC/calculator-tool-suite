// `npm start`: runs the dev server (`npm run dev`) and opens it in the default
// browser once it is ready. The browser decides how: a new tab when it is
// already open, otherwise a new window. The URL is read from Next's output
// rather than assumed, so a PORT setting is followed too.

import { spawn } from 'node:child_process';

// Matches Next's "- Local:   http://localhost:3000" line.
const LOCAL_URL = /Local:\s+(https?:\/\/\S+)/;
// Colour codes, removed before matching.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/** Hands the URL to the operating system, which opens the default browser. */
function openBrowser(url) {
  const [command, args] =
    process.platform === 'win32'
      ? // `start` treats its first quoted argument as a window title, hence the empty one.
        ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]];
  const opener = spawn(command, args, { stdio: 'ignore', detached: true });
  opener.on('error', () => console.log(`\nOpen ${url} in your browser.`));
  opener.unref();
}

const dev = spawn('npm', ['run', 'dev'], {
  // npm is a .cmd file on Windows, which needs a shell to run.
  shell: process.platform === 'win32',
  stdio: ['inherit', 'pipe', 'inherit'],
  // Keep Next's colours even though its output goes through this script.
  env: { ...process.env, FORCE_COLOR: '1' },
});

let devExited = false;

/**
 * Opens the browser once the server answers. Next prints its URL (and even
 * "Ready") before it checks for another dev server in this folder and quits,
 * so the URL alone doesn't mean the server is up.
 */
async function openWhenServing(url) {
  while (!devExited) {
    try {
      await fetch(url, { method: 'HEAD' });
      openBrowser(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

let urlFound = false;
dev.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  const match = !urlFound && LOCAL_URL.exec(chunk.toString().replace(ANSI, ''));
  if (match) {
    urlFound = true;
    void openWhenServing(match[1]);
  }
});

// Ctrl+C reaches the dev server directly; wait for it to stop, then exit with its code.
process.on('SIGINT', () => {});
dev.on('exit', (code) => {
  devExited = true;
  process.exit(code ?? 0);
});
