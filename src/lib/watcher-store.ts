import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { homedir, tmpdir } from 'os';
import path from 'path';
import type { WatcherCapture, WatcherInbox } from './types';

const DATA_DIR = path.join(process.cwd(), '.bugroom');
const INBOX_PATH = path.join(DATA_DIR, 'watcher-inbox.json');
const DEFAULT_WATCH_DIR = path.join(homedir(), 'Pictures', 'Screenshots');
const COMMON_WATCH_DIRS = [
  path.join(homedir(), 'Desktop'),
  path.join(homedir(), 'Pictures', 'Screenshots'),
  path.join(homedir(), 'Pictures'),
];
const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const SCREENSHOT_NAME_PATTERN = /^(screenshot(?: from)?|screen shot|snapshot)/i;

function ensureDataDir() {
  mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeDir(dirPath: string) {
  return path.resolve(dirPath.replace(/^~(?=$|\/)/, homedir()));
}

function isSupportedScreenshotFile(name: string) {
  const ext = path.extname(name).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext) && SCREENSHOT_NAME_PATTERN.test(path.basename(name, ext));
}

function getExplicitWatchDir() {
  return process.env.BUGROOM_WATCH_DIR ? normalizeDir(process.env.BUGROOM_WATCH_DIR) : null;
}

function getCandidateWatchDirs() {
  const explicit = getExplicitWatchDir();
  if (explicit) return [explicit];

  const candidates = COMMON_WATCH_DIRS.map(normalizeDir).filter((dir, index, values) => values.indexOf(dir) === index);
  const existing = candidates.filter((dir) => existsSync(dir));
  return existing.length ? existing : [normalizeDir(DEFAULT_WATCH_DIR)];
}

function getLatestScreenshotTimestamp(dirPath: string) {
  if (!existsSync(dirPath)) return 0;
  try {
    let latest = 0;
    for (const name of readdirSync(dirPath)) {
      if (!isSupportedScreenshotFile(name)) continue;
      const fullPath = path.join(dirPath, name);
      const stats = statSync(fullPath);
      if (stats.isFile()) {
        latest = Math.max(latest, stats.mtimeMs);
      }
    }
    return latest;
  } catch {
    return 0;
  }
}

function resolvePreferredWatchDir() {
  const explicit = getExplicitWatchDir();
  if (explicit) return explicit;

  const candidates = getCandidateWatchDirs();
  let preferred = candidates[0] ?? normalizeDir(DEFAULT_WATCH_DIR);
  let latest = getLatestScreenshotTimestamp(preferred);

  for (const candidate of candidates.slice(1)) {
    const candidateLatest = getLatestScreenshotTimestamp(candidate);
    if (candidateLatest > latest) {
      preferred = candidate;
      latest = candidateLatest;
    }
  }

  return preferred;
}

function isProjectTestCaptureDir(dirPath: string) {
  const normalized = normalizeDir(dirPath);
  return normalized.startsWith(path.join(DATA_DIR, 'test-captures'));
}

function sanitizeInbox(inbox: WatcherInbox) {
  const preferredWatchDir = resolvePreferredWatchDir();
  const currentWatchDir = inbox.watchDir ? normalizeDir(inbox.watchDir) : null;

  if (
    !currentWatchDir ||
    getExplicitWatchDir() ||
    isProjectTestCaptureDir(currentWatchDir) ||
    !existsSync(currentWatchDir) ||
    currentWatchDir !== preferredWatchDir
  ) {
    return {
      ...inbox,
      watchDir: preferredWatchDir,
    };
  }

  return inbox;
}

function sortWatcherCaptures(captures: WatcherCapture[]) {
  return [...captures].sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));
}

function createEmptyInbox(): WatcherInbox {
  return {
    watchDir: resolvePreferredWatchDir(),
    captures: [],
    updatedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
  };
}

export function getInboxPath() {
  ensureDataDir();
  return INBOX_PATH;
}

export function getDefaultWatchDir() {
  return resolvePreferredWatchDir();
}

export function readWatcherInbox(): WatcherInbox {
  ensureDataDir();
  if (!existsSync(INBOX_PATH)) {
    const empty = createEmptyInbox();
    writeFileSync(INBOX_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  try {
    const inbox = sanitizeInbox(JSON.parse(readFileSync(INBOX_PATH, 'utf8')) as WatcherInbox);
    writeFileSync(INBOX_PATH, JSON.stringify(inbox, null, 2));
    return inbox;
  } catch {
    const empty = createEmptyInbox();
    writeFileSync(INBOX_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
}

export function writeWatcherInbox(inbox: WatcherInbox) {
  ensureDataDir();
  const nextInbox = sanitizeInbox(inbox);
  writeFileSync(INBOX_PATH, JSON.stringify({ ...nextInbox, updatedAt: new Date().toISOString() }, null, 2));
}

export function listWatcherCaptures() {
  const inbox = readWatcherInbox();
  const watchDirs = getCandidateWatchDirs();
  let changed = false;

  for (const watchDir of watchDirs) {
    if (!watchDir || !existsSync(watchDir)) continue;

    try {
      const files = readdirSync(watchDir);
      for (const name of files) {
        if (!isSupportedScreenshotFile(name)) continue;

        const fullPath = path.join(watchDir, name);
        try {
          const stats = statSync(fullPath);
          if (!stats.isFile()) continue;

          const modifiedAt = new Date(stats.mtimeMs).toISOString();
          const existing = inbox.captures.find(
            (capture) => capture.filePath === fullPath && capture.modifiedAt === modifiedAt,
          );

          if (!existing) {
            inbox.captures.unshift({
              id: `${stats.mtimeMs}-${name}`,
              filePath: fullPath,
              fileName: name,
              detectedAt: modifiedAt,
              modifiedAt,
              sizeBytes: stats.size,
              status: 'pending',
              source: 'watcher',
            });
            changed = true;
          }
        } catch {
          // Ignore files in transition or locked
        }
      }
    } catch (error) {
      console.error('[watcher-store] failed to scan watchDir:', watchDir, error);
    }
  }

  const preferredWatchDir = resolvePreferredWatchDir();
  if (inbox.watchDir !== preferredWatchDir) {
    inbox.watchDir = preferredWatchDir;
    changed = true;
  }

  if (changed) {
    inbox.captures = sortWatcherCaptures(inbox.captures).slice(0, 50);
    writeWatcherInbox(inbox);
  }

  return sortWatcherCaptures(inbox.captures);
}

export function getWatcherCapture(captureId: string) {
  return readWatcherInbox().captures.find((capture) => capture.id === captureId) ?? null;
}

export function upsertWatcherCapture(capture: WatcherCapture) {
  const inbox = readWatcherInbox();
  const index = inbox.captures.findIndex((item) => item.id === capture.id || item.filePath === capture.filePath);
  if (index >= 0) {
    inbox.captures[index] = capture;
  } else {
    inbox.captures.unshift(capture);
  }
  inbox.captures = sortWatcherCaptures(inbox.captures).slice(0, 50);
  writeWatcherInbox(inbox);
  return capture;
}

export function markWatcherCapture(captureId: string, patch: Partial<WatcherCapture>) {
  const inbox = readWatcherInbox();
  const index = inbox.captures.findIndex((item) => item.id === captureId);
  if (index < 0) return null;
  inbox.captures[index] = { ...inbox.captures[index], ...patch };
  writeWatcherInbox(inbox);
  return inbox.captures[index];
}

export function removeWatcherCapture(captureId: string) {
  const inbox = readWatcherInbox();
  const next = inbox.captures.filter((item) => item.id !== captureId);
  if (next.length === inbox.captures.length) return false;
  writeWatcherInbox({ ...inbox, captures: next });
  return true;
}

export function normalizeCapturePath(filePath: string) {
  return path.resolve(filePath.replace(/^~(?=$|\/)/, homedir()));
}

export function buildWatcherCapture(filePath: string): WatcherCapture {
  const resolved = normalizeCapturePath(filePath);
  const stats = statSync(resolved);
  const modifiedAt = new Date(stats.mtimeMs).toISOString();
  return {
    id: `${stats.mtimeMs}-${path.basename(resolved)}`,
    filePath: resolved,
    fileName: path.basename(resolved),
    detectedAt: modifiedAt,
    modifiedAt,
    sizeBytes: stats.size,
    status: 'pending',
    source: 'watcher',
  };
}

export function getWatcherMeta() {
  const captures = listWatcherCaptures();
  return {
    watchDir: resolvePreferredWatchDir(),
    inboxPath: INBOX_PATH,
    captureCount: captures.length,
    pendingCount: captures.filter((capture) => capture.status === 'pending').length,
    updatedAt: readWatcherInbox().updatedAt,
  };
}

export function getStableTempDir() {
  return path.join(tmpdir(), 'bugroom');
}
