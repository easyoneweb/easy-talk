import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Easy Talk',
    executableName: 'easy-talk',
    asar: true,
  },
  makers: [
    new MakerSquirrel({
      name: 'easy-talk',
    }),
    new MakerDMG({
      format: 'ULFO',
    }),
    new MakerDeb({
      options: {
        maintainer: 'Easy Talk',
        homepage: 'https://github.com/easy-talk',
        name: 'easy-talk',
        productName: 'Easy Talk',
      },
    }),
    new MakerRpm({
      options: {
        name: 'easy-talk',
        productName: 'Easy Talk',
      },
    }),
  ],
};

export default config;
