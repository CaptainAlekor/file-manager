import { Writable } from 'stream';

export class ConsoleLogStream extends Writable {
    constructor(options) {
        super(options);
    }

    _write(chunk, encoding, callback) {
        console.log(chunk.toString());
        callback();
    }
}