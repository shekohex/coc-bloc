import * as yaml from 'js-yaml';
import { getPubspecPath } from './get-pubspec-path';
import { workspace, Uri } from 'coc.nvim';

export async function getPubspec(): Promise<Record<string, any> | undefined> {
  const pubspecPath = getPubspecPath();
  if (pubspecPath) {
    try {
      const content = await workspace.readFile(Uri.file(pubspecPath).fsPath);
      return yaml.load(content.toString()) as Record<string, any>;
    } catch (_) {}
  }
}
