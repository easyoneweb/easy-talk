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
    icon: path.resolve(process.cwd(), 'assets', 'icon'),
    ignore: [
      // Ignore everything by default, then allow only what Electron needs
      /^\/(?!(dist-electron|dist|assets|package\.json)($|\/))/,
    ],
  },
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      const fs = await import('fs');
      const pathMod = await import('path');
      const pkgPath = pathMod.join(buildPath, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      pkg.main = 'dist-electron/main.js';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    },
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
