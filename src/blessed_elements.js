export const appContainerDefaults = {
  scrollable: true,
  alwaysScroll: true,
  padding: 0,
  left: 0,
  tags: true,
  width: '100%',
  height: '100%',
  border: {
    type: 'bg'
  },
  style: {
    border: {
      fg: 'white',
    },
  },
}

export const fileBoxDefaults = {
  padding: 1,
  left: 0,
  width: '100%-2',
  scrollable: true,
  height: '100%',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: 'blue',
    },
  },
}

export const diffBoxDefaults = {
  left: 8,
  tags: true,
  width: '100%-11',
  scrollable: true,
}

export const diffTextDefaults = {
  top: 1,
  left: 2,
  width: '100%',
  tags: true,
}