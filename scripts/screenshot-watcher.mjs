#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, watch, writeFileSync } from 'fs';
import { dirname, extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { homedir } from 'os';

const projectRoot = process.cwd();
const dataDir = join(projectRoot, '.bugroom');
const inboxPath = join(dataDir, 'watcher-inbox.json');
const defaultWatchDir = join(homedir(), 'Pictures', 'Screenshots');
const commonWatchDirs = [
  join(homedir(), 'Desktop'),
  join(homedir(), 'Pictures', 'Screenshots'),
  join(homedir(), 'Pictures'),
];
const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const screenshotNamePattern = /^(screenshot(?: from)?|screen shot|snapshot)/i;
const seen = new Map();

mkdirSync(dataDir, { recursive: true });

function normalizeDir(dirPath) {
  return resolve(dirPath.replace(/^~(?=$|\/)/, homedir()));
}

function isSupportedScreenshotFile(fileName) {
  const ext = extname(fileName).toLowerCase();
  return allowed.has(ext) && screenshotNamePattern.test(fileName.slice(0, -ext.length));
}

function sortCaptures(captures) {
  return [...captures].sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));
}

function getWatchDirs() {
  if (process.env.BUGROOM_WATCH_DIR) {
    const explicit = normalizeDir(process.env.BUGROOM_WATCH_DIR);
    mkdirSync(explicit, { recursive: true });
    return [explicit];
  }

  const uniqueDirs = commonWatchDirs.map(normalizeDir).filter((dir, index, values) => values.indexOf(dir) === index);
  const existingDirs = [];

  for (const dir of uniqueDirs) {
    if (existsSync(dir)) {
      existingDirs.push(dir);
      continue;
    }

    try {
      mkdirSync(dir, { recursive: true });
      existingDirs.push(dir);
    } catch {
      // Ignore directories we cannot create.
    }
  }

  return existingDirs.length ? existingDirs : [normalizeDir(defaultWatchDir)];
}

const watchDirs = getWatchDirs();
const primaryWatchDir = watchDirs[0];

function readInbox() {
  if (!existsSync(inboxPath)) {
    return { watchDir: primaryWatchDir, captures: [], updatedAt: new Date().toISOString(), startedAt: new Date().toISOString() };
  }
  try {
    return JSON.parse(readFileSync(inboxPath, 'utf8'));
  } catch {
    return { watchDir: primaryWatchDir, captures: [], updatedAt: new Date().toISOString(), startedAt: new Date().toISOString() };
  }
}

function writeInbox(inbox) {
  writeFileSync(inboxPath, JSON.stringify({ ...inbox, updatedAt: new Date().toISOString() }, null, 2));
}

function queueFile(filePath) {
  const resolvedPath = resolve(filePath);
  const fileName = resolvedPath.split('/').pop() ?? '';
  if (!existsSync(resolvedPath) || !isSupportedScreenshotFile(fileName)) return;

  const stats = statSync(resolvedPath);
  if (!stats.isFile()) return;

  const key = `${resolvedPath}:${stats.mtimeMs}:${stats.size}`;
  if (seen.has(key)) return;
  seen.set(key, Date.now());

  const inbox = readInbox();
  const modifiedAt = new Date(stats.mtimeMs).toISOString();
  const existing = inbox.captures.find((capture) => capture.filePath === resolvedPath && capture.modifiedAt === modifiedAt);
  if (existing) return;

  inbox.captures.unshift({
    id: `${Date.now()}-${randomUUID().slice(0, 8)}`,
    filePath: resolvedPath,
    fileName,
    detectedAt: modifiedAt,
    modifiedAt,
    sizeBytes: stats.size,
    status: 'pending',
    source: 'watcher',
  });
  inbox.captures = sortCaptures(inbox.captures).slice(0, 50);
  inbox.watchDir = dirname(resolvedPath);
  writeInbox(inbox);
  console.log(`[bugroom-watcher] queued ${resolvedPath}`);
}

function scanExisting() {
  for (const watchDir of watchDirs) {
    if (!existsSync(watchDir)) continue;
    for (const name of readdirSync(watchDir)) {
      queueFile(join(watchDir, name));
    }
  }
}

for (const watchDir of watchDirs) {
  console.log(`[bugroom-watcher] watching ${watchDir}`);
}
console.log(`[bugroom-watcher] inbox ${inboxPath}`);
scanExisting();

for (const watchDir of watchDirs) {
  watch(watchDir, { persistent: true }, (_eventType, filename) => {
    if (!filename) return;
    const full = join(watchDir, filename.toString());
    setTimeout(() => queueFile(full), 350);
  });
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
