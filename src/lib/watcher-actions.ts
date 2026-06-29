import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { filePathToDataUri } from './image';
import { getWatcherCapture, markWatcherCapture, normalizeCapturePath, removeWatcherCapture } from './watcher-store';

export function importWatcherCapture(captureId: string) {
  const capture = getWatcherCapture(captureId);
  if (!capture) {
    throw new Error('Capture not found');
  }
  const filePath = normalizeCapturePath(capture.filePath);
  if (!existsSync(filePath)) {
    throw new Error('Screenshot file no longer exists on disk');
  }
  const imageDataUri = filePathToDataUri(filePath);
  const updated = markWatcherCapture(captureId, {
    status: 'imported',
    importedAt: new Date().toISOString(),
  });
  return {
    capture: updated ?? capture,
    imageDataUri,
    screenshotLabel: capture.fileName,
  };
}

export function openWatcherCapture(captureId: string) {
  const capture = getWatcherCapture(captureId);
  if (!capture) {
    throw new Error('Capture not found');
  }
  const filePath = normalizeCapturePath(capture.filePath);
  if (!existsSync(filePath)) {
    throw new Error('Screenshot file no longer exists on disk');
  }

  const child = spawn('xdg-open', [filePath], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  return markWatcherCapture(captureId, {
    status: 'opened',
    openedAt: new Date().toISOString(),
  });
}

export function dismissWatcherCapture(captureId: string) {
  const capture = getWatcherCapture(captureId);
  if (!capture) {
    throw new Error('Capture not found');
  }
  const updated = markWatcherCapture(captureId, {
    status: 'dismissed',
    dismissedAt: new Date().toISOString(),
  });
  if (!updated) {
    removeWatcherCapture(captureId);
  }
  return updated ?? capture;
}
