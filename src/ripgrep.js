import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

export async function pathsWithMatches(searchString, directoryPath) {
  const resolvedPath = path.resolve(directoryPath);

  let stdout;
  try {
    const result = await execFileAsync('rg', ['-i', '-l', searchString, resolvedPath]);
    stdout = result.stdout;
  } catch (err) {
    if (err.code === 1) return [];
    else throw err;
  }

  return stdout.split('\n').filter(Boolean);
}