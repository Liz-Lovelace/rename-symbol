import { pathsWithMatches } from './ripgrep.js';
import { readFiles } from './fs_utils.js';
import { replaceSubstringsWithIndexes } from './replaceSubstringsWithIndexes.js';
import { showDiff, trimToContext } from './string_formatters.js';
import { appContainerDefaults, fileBoxDefaults, diffBoxDefaults, diffTextDefaults } from './blessed_elements.js';
import blessed from 'blessed';
import { applySubstitutions } from './applySubstitutions.js';

let [a, b] = ['best', 'test'];

let files = await readFiles(await pathsWithMatches(a, './testdir'));

async function getData(a, b, files) {
  let fileStates = [];
  let diffIndex = 0;
  for (let file of files) {
    const result = replaceSubstringsWithIndexes(a, b, file.fileContents, file.excludedIndexes);
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
        1
      )
      result.replacements[i].diffIndex = diffIndex++;
    }
    fileStates.push({
      ...file,
      ...result,
    });
  }
  return fileStates;
}

let fileStates = await getData(a, b, files);
let UIState = {
  focusedDiff: 3,
  scroll: 0,
}

let screen = blessed.screen({
  smartCSR: true,
  debug: true,
  autoPadding: true,
});

renderUI(fileStates, UIState)

function calculateTop(index, boxes) {
  let top = 0; // Start from position 1 to account for the title.
  for (let i = 0; i < index; i++) {
    top += boxes[i].height; // Add the height of the previous box plus 1 for spacing.
  }
  return top;
}

function renderUI(fileStates, UIState){
  const appContainer = blessed.box({
    ...appContainerDefaults,
    label: `{red-fg}${a}{/red-fg}->{green-fg}${b}{/green-fg}`,
  });

  let fileBoxes = [];

  fileStates.forEach((file, fileIndex) => {
    const fileBox = blessed.box({
      ...fileBoxDefaults,
      top: calculateTop(fileIndex, fileBoxes),
      label: ` ${file.filePath} `,
    });

    let diffBoxes = []
    // Iterate over the replacements for the current file
    file.replacements.forEach((replacement, index) => {
      let isFocused = replacement.diffIndex === UIState.focusedDiff;

      let height = replacement.diff.split('\n').length + 4
      
      const diffBox = blessed.box({
        ...diffBoxDefaults,
        top: calculateTop(index, diffBoxes),
        height,
        border: {
          type: 'line',
        },
        label: replacement.applied ? '{green-fg;bold}APPLY{/green-fg;bold}' : 'skip',
        style: {
          border: {
            fg: replacement.applied ? 'green' : 'white',
          },
        }
      });
      
      const checkBox = blessed.box({
        top: calculateTop(index, diffBoxes),
        left: 1,
        scrollable: true,
        height,
        width: 6,
        ch: replacement.applied ? '>' : '.',
        style: {
          fg: replacement.applied ? 'green' : 'white',
          inverse: isFocused,
        },
      })

      const diffText = blessed.text({
        ...diffTextDefaults,
        content: replacement.diff,
        //style: {
        //  bold: isFocused,
        //},
      });
      if (isFocused){
        UIState.focusedFile = file;
        UIState.focusedLocalDiff = replacement.index;
        UIState.focusedDiffElem = diffBox;
      }
      
      diffBox.append(diffText);
      fileBox.append(diffBox);
      fileBox.append(checkBox);
      diffBoxes.push(diffBox)

    });

    fileBox.height = diffBoxes.reduce((acc, elem) => acc + elem.height + 1, 0);

    fileBoxes.push(fileBox);
    appContainer.append(fileBox);
  });


  screen.append(appContainer)
  appContainer.setScroll(UIState.scroll)

  screen.render();
  appContainer.setScroll(UIState.focusedDiffElem.atop - 10);
  screen.children.forEach(child => child.destroy())
}

screen.key(['escape', 'q', 'C-c'], () => {
  return process.exit(0);
});

screen.key(['k'], () => {
  UIState.focusedDiff += 1;
  renderUI(fileStates, UIState);
});

screen.key(['l'], () => {
  UIState.focusedDiff -= 1;
  renderUI(fileStates, UIState)
});

screen.key(['j', ';', 'space'], async () => {
  UIState.focusedDiff
  let file = fileStates.find(file => file === UIState.focusedFile)
  let index = file.excludedIndexes.indexOf(UIState.focusedLocalDiff);
  if (index !== -1)
    file.excludedIndexes.splice(index, 1)
  else
    file.excludedIndexes.push(UIState.focusedLocalDiff)
  fileStates = await getData(a, b, fileStates);
  renderUI(fileStates, UIState)
});

screen.key(['enter'], async () => {
  await applySubstitutions(fileStates)
  process.exit(0);
});