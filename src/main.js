import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);

async function main(a, b) {
  let files = await allMatchingFiles(a, './testdir');
  for (let file of files) {
    //let indexes = file.matches.map(match => match.index);
    let indexes = [0, 2, 3];
    const result = replaceOccurences(a, b, file.fileContents, indexes);
    file = {
      ...file,
      ...result,
    };
    console.log(file);
  }
}

main('aa', 'bbb');

// Wrapper function to search for a string in a directory using ripgrep
async function pathsWithMatches(searchString, directoryPath) {
  const resolvedPath = path.resolve(directoryPath);
  
  let stdout;
  try {
    const result = await execFileAsync('rg',
      [
        '-i',
        '-l',
        searchString,
        resolvedPath,
      ]);
    stdout = result.stdout;
  } catch (err) {
    if (err.code === 1)
      return [];
    else
      throw err;
  }
  
  return stdout
    .split('\n')
    .filter(Boolean);
}

function indexMatchesInString(searchString, fileContents) {
  const regex = new RegExp(searchString, 'gi');
  let match;
  const matches = [];

  while ((match = regex.exec(fileContents)) !== null) {
    matches.push({
      match: match[0],
      position: match.index,
      index: matches.length,
    });

    // Break the loop if the regex position doesn't advance
    if (regex.lastIndex === match.index) {
      regex.lastIndex++;
    }
  }

  return matches;
}

async function allMatchingFiles(searchString, directoryPath) {
  const filePaths = await pathsWithMatches(searchString, directoryPath);

  const indexedFiles = [];
  for (const filePath of filePaths) {
    const fileContents = await fs.promises.readFile(filePath, 'utf-8');
    const matches = await indexMatchesInString(searchString, fileContents);
    indexedFiles.push({
      filePath: filePath,
      fileContents,
      matches: matches,
    });
  }

  return indexedFiles;
}

function replaceOccurences(oldSubstring, newSubstring, oldString, indexes) {
  const regex = new RegExp(oldSubstring, 'gi');
  let match;
  const matches = [];
  let replacements = [];

  while ((match = regex.exec(oldString)) !== null) {
    matches.push({
      match: match[0],
      position: match.index,
      index: matches.length,
    });

    // Break the loop if the regex position doesn't advance
    if (regex.lastIndex === match.index) {
      regex.lastIndex++;
    }
  }

  let newContents = oldString;

  for (const index of indexes.reverse()) {
    const match = matches[index];
    if (match) {
      const oldLength = match.match.length;
      const newLength = newSubstring.length;

      const newPosition = match.position;

      newContents = newContents.slice(0, newPosition) +
        newSubstring +
        newContents.slice(newPosition + oldLength);

      // Update the positions of the remaining matches
      for (let i = index + 1; i < matches.length; i++) {
        matches[i].position += newLength - oldLength;
      }
    }
  }

  // Find the positions of the new substring in the new contents
  const newSubstringRegex = new RegExp(newSubstring, 'gi');
  
  while ((match = newSubstringRegex.exec(newContents)) !== null) {
    replacements.push({
      replacement: newSubstring,
      position: match.index,
      index: indexes.reverse()[replacements.length],
    });

    // Break the loop if the regex position doesn't advance
    if (newSubstringRegex.lastIndex === match.index) {
      newSubstringRegex.lastIndex++;
    }
  }

  return {
    newContents,
    replacements,
  };
}
