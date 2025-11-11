#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const manifestPath = process.argv[2] || path.resolve('src/data/manifest.json');
const outputDir = process.argv[3] || path.resolve('images/mirrored');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode && response.statusCode >= 400) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch {}
          reject(new Error(`Failed to download ${url} - HTTP ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (error) => {
        file.close();
        fs.unlink(dest, () => reject(error));
      });
  });
}

async function run() {
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  ensureDir(outputDir);

  const downloads = [];
  for (const item of raw) {
    const src = item.src;
    if (!src || src.startsWith('images/')) continue;
    const url = new URL(src);
    const filename = path.basename(url.pathname);
    const dest = path.join(outputDir, filename);
    if (!fs.existsSync(dest)) {
      downloads.push(download(src, dest).then(() => ({ id: item.code || item.id || filename, dest })));
    }
  }

  const results = await Promise.allSettled(downloads);
  const summary = {
    total: results.length,
    fulfilled: results.filter((result) => result.status === 'fulfilled').length,
    rejected: results.filter((result) => result.status === 'rejected').length,
  };

  console.log('Mirror complete:', summary);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
