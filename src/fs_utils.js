import fs from 'fs';

export async function readFiles(paths) {
  const files = [];
  for (const filePath of paths) {
    files.push({
      filePath,
      fileContents: await fs.promises.readFile(filePath, 'utf-8'),
      excludedIndexes: [],
    });
  }

  return files;
}

export async function overwriteFile(path, data) {
  await fs.promises.writeFile(path, data);
}