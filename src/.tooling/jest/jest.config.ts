import { defaults as tsjPreset } from 'ts-jest/presets';

const jestConfig = {
  rootDir: './../../src',
  transform: {
    ...tsjPreset.transform
    // [...]
  }
};

export default jestConfig;
