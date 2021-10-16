import { Injectable } from '@nestjs/common';
import { once } from 'events';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { Readable } from 'stream';
import { createGunzip } from 'zlib';

interface ReadByLineOptions {
  path: string;
  gzip?: boolean;
}

@Injectable()
export class FileService {
  /**
   * Reads provided file line by line using streams
   * @param options The read options
   * @param cb The line callback
   */
  public readByLine(
    { path, gzip }: ReadByLineOptions,
    cb: (line: string, index: number) => void
  ) {
    let inputFile: Readable = createReadStream(path);

    if (gzip ?? true) {
      inputFile = inputFile.pipe(createGunzip());
    }

    const readInterface = createInterface({
      input: inputFile,
      crlfDelay: Infinity,
    });

    let index = 0;
    readInterface.on('line', (line) => cb(line, index++));

    return once(readInterface, 'close');
  }
}
