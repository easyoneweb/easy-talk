import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import * as path from 'path';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Easy Talk',
    executableName: 'easy-talk',
    asar: true,
    icon: path.resolve(__dirname, '..', 'assets', 'icon'),
  },
  makers: [
    new MakerSquirrel({
      name: 'easy-talk',
      iconUrl: path.resolve(__dirname, '..', 'assets', 'favicon.ico'),
      setupIcon: path.resolve(__dirname, '..', 'assets', 'favicon.ico'),
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
