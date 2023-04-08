export function replaceSubstringsWithIndexes(oldSubstring, newSubstring, oldString, excludeIndexes) {
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

  for (const [i, match] of matches.entries()) {
    if (!excludeIndexes.includes(i)) {
      const oldLength = match.match.length;
      const newLength = newSubstring.length;

      const newPosition = match.position;

      newContents = newContents.slice(0, newPosition) +
        newSubstring +
        newContents.slice(newPosition + oldLength);

      // Update the positions of the remaining matches
      for (let j = i + 1; j < matches.length; j++) {
        matches[j].position += newLength - oldLength;
      }
    }
  }

  // Find the positions of the new substring in the new contents
  const appliedIndexes = new Set(excludeIndexes);

  for (const [i, match] of matches.entries()) {
    const applied = !appliedIndexes.has(i);
    replacements.push({
      oldSubstring: match.match,
      newSubstring,
      position: match.position,
      index: i,
      applied: applied,
    });
  }

  return {
    newContents,
    replacements,
  };
}
