function tag(tag, inner){
  //throw `{${tag}}${inner}{/${tag}}`
  return `{${tag}}${inner}{/${tag}}`;
}

export function showDiff(a, b, newString, position, active) {
  if (position < 0 || position + b.length > newString.length) {
    throw new Error('Invalid position provided');
  }

  const prefix = newString.slice(0, position);
  const suffix = active ? 
    newString.slice(position + b.length) :
    newString.slice(position + a.length);
  
  let aWrapper = 'red-fg';
  let arrowWrapper = 'red-fg';
  let bWrapper = 'green-fg';
  if (!active){
    b = '';
  } else {
    a = '';
  }
    
  //let arrow = active ? '->' : ''
  let arrow = '';
  return `${prefix}${tag(aWrapper, a)}${arrow}${tag(bWrapper, b)}${suffix}`;
}

export function trimToContext(str, position, context) {
  if (position < 0 || position >= str.length) {
    throw new Error('Invalid position provided');
  }

  const lines = str.split('\n');
  let currentPos = 0;
  let targetLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (currentPos + line.length >= position) {
      targetLineIndex = i;
      break;
    }
    // Adding 1 for the newline character
    currentPos += line.length + 1;
  }

  if (targetLineIndex === -1) {
    throw new Error('Failed to find the target line');
  }

  const start = Math.max(0, targetLineIndex - context);
  const end = Math.min(lines.length, targetLineIndex + context + 1);

  return lines.slice(start, end).join('\n');
}