import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import type { UploaderConfig } from './types.js';

export type AnyUploaderConfig = UploaderConfig<unknown>;

const __dirname = dirname(fileURLToPath(import.meta.url));

// Auto-discover uploaders: each subfolder with config.ts/config.js is an uploader
async function loadUploaders(): Promise<Record<string, AnyUploaderConfig>> {
  const result: Record<string, AnyUploaderConfig> = {};
  const dirs = readdirSync(__dirname, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name);

  for (const id of dirs) {
    const dirPath = join(__dirname, id);
    const configPathTs = join(dirPath, 'config.ts');
    const configPathJs = join(dirPath, 'config.js');
    const configPath = existsSync(configPathTs) ? configPathTs : configPathJs;
    if (!existsSync(configPath)) continue;

    try {
      const mod = await import(pathToFileURL(configPath).href);
      const config = mod.default;
      if (config && typeof config === 'object' && config.id) {
        result[config.id as string] = config;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`Uploader ${id}: failed to load config`, err);
    }
  }

  return result;
}

// Load at module init (top-level await)
const uploadersMap = await loadUploaders();

export function getUploader(id: string): AnyUploaderConfig | undefined {
  return uploadersMap[id];
}

export function listUploaders() {
  return Object.values(uploadersMap).map((u) => ({
    id: u.id,
    displayName: u.displayName,
    acceptedFileTypes: u.acceptedFileTypes,
    formatHeaders: u.formatHeaders ?? [],
  }));
}

export function getUploaderFormat(id: string): { id: string; displayName: string; headers: string[] } | undefined {
  const u = uploadersMap[id];
  if (!u) return undefined;
  return {
    id: u.id,
    displayName: u.displayName,
    headers: u.formatHeaders ?? [],
  };
}
