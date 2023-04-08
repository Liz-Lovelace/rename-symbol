import { pathsWithMatches } from './ripgrep.js';
import { readFiles } from './fs_utils.js';
import { replaceSubstringsWithIndexes } from './replaceSubstringsWithIndexes.js';
import { showDiff, trimToContext } from './string_formatters.js';
import blessed from 'blessed';

async function getData(a, b) {
  let filePaths = await pathsWithMatches(a, './testdir');
  let files = await readFiles(filePaths);
  let fileStates = [];
  for (let file of files) {
    let excludeIndexes = [0, 2, 3];
    //let excludeIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    //let excludeIndexes = [];
    const result = replaceSubstringsWithIndexes(a, b, file.fileContents, excludeIndexes);
    for (let i = 0; i < result.replacements.length; i++) {
      result.replacements[i].diff = showDiff(
        result.replacements[i].oldSubstring,
        result.replacements[i].newSubstring,
        result.newContents,
        result.replacements[i].position,
        result.replacements[i].applied
      );
      result.replacements[i].diff = trimToContext(
        result.replacements[i].diff, 
        result.replacements[i].position,
        2
      )
    }
    fileStates.push({
      ...file,
      ...result,
    });
  }
  return fileStates;
}

let fileStates = await getData('newSubstringRegex', 'oldRegex');

// Create a blessed screen object.
const screen = blessed.screen({
  smartCSR: true,
  debug: true,
  autoPadding: true,
});

function calculateTop(index, boxes) {
  let top = 0; // Start from position 1 to account for the title.
  for (let i = 0; i < index; i++) {
    top += boxes[i].height; // Add the height of the previous box plus 1 for spacing.
  }
  return top;
}

const biggestBox = blessed.box({
  //top: 0,
  scrollable: true,
  alwaysScroll: true,
  padding: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'red',
    },
  },
  label: ` main `,
});

let fileBoxes = [];

fileStates.forEach((file, fileIndex) => {
  const fileBox = blessed.box({
    top: calculateTop(fileIndex, fileBoxes),
    padding: 1,
    left: 0,
    width: '100%',
    scrollable: true,
    //alwaysScroll: true,
    height: '100%',
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: 'cyan',
      },
    },
    label: ` ${file.filePath} `,
  });

  let diffBoxes = []
  // Iterate over the replacements for the current file
  file.replacements.forEach((replacement, index) => {
    const diff = replacement.diff;
    
    const diffBox = blessed.box({
      top: calculateTop(index, diffBoxes),
      left: 1,
      width: '100%',
      scrollable: true,
      height: diff.split('\n').length + 2,
      border: {
        type: replacement.applied ? 'line' : 'bg',
        ch: '.'
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: replacement.applied ? 'green' : 'white',
        },
      }
    });

    const line = blessed.text({
    top: 0,
    left: 2,
    width: '100%',
    tags: true,
    style: {
      fg: 'white',
      bg: 'black'
    },
    content: `${diff}`
    });
    
    diffBox.append(line);
    fileBox.append(diffBox);
    diffBoxes.push(diffBox)
  });

  fileBox.height = diffBoxes.reduce((acc, elem) => acc + elem.height + 1, 0);

  fileBoxes.push(fileBox);
  biggestBox.append(fileBox);
});

screen.append(biggestBox)

screen.key(['escape', 'q', 'C-c'], () => {
  return process.exit(0);
});

screen.key(['k'], () => {
  biggestBox.scroll(1)
  //fileBoxes.forEach(fb => fb.scroll(-1))
});

screen.key(['l'], () => {
  biggestBox.scroll(-1)
});

screen.render();