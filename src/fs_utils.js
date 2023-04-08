import fs from 'fs';

export async function readFiles(paths) {
  const files = [];
  for (const filePath of paths) {
    files.push({
      filePath,
      fileContents: await fs.promises.readFile(filePath, 'utf-8'),
    });
  }

  return files;
}