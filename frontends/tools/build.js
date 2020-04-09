/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import cp from 'child_process';
import run from './run';
import clean from './clean';
import messages from './messages';
import copy from './copy';
import bundle from './bundle';
import render from './render';
import pkg from '../package.json';

const sourceFolderIndex = process.argv.indexOf('--source-folder');
const sourceFolder =
  sourceFolderIndex > -1 &&
  sourceFolderIndex + 1 <= process.argv.length &&
  process.argv[sourceFolderIndex + 1];

/**
 * Compiles the project from source files into a distributable
 * format and copies it to the output (build) folder.
 */
async function build() {
  await run(clean);
  await run(messages, sourceFolder);
  await run(copy, sourceFolder);
  await run(bundle, sourceFolder);

  if (process.argv.includes('--static')) {
    await run(render);
  }

  if (process.argv.includes('--docker')) {
    cp.spawnSync('docker', ['build', '-t', pkg.name, '.'], {
      stdio: 'inherit',
    });
  }
}

export default build;
