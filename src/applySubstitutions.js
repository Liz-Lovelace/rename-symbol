import { overwriteFile } from './fs_utils.js';

export async function applySubstitutions(fileStates) {
  for (let file of fileStates) {
    await overwriteFile(file.filePath, file.newContents);
  }
  //console.log(fileState)
}