import * as path from 'node:path';
import * as os from 'node:os';

function runFileManager() {
    let currentDirectory = os.homedir();

    printCurrentDirectory(currentDirectory);

    process.stdin.on('data', (data) => {
        currentDirectory = handleUserInput(data.toString().trim(), currentDirectory);
        printCurrentDirectory(currentDirectory);
    });
}

function handleUserInput(input, currentDirectory) {
    return currentDirectory;
}

function printCurrentDirectory(currentDirectory) {
    console.log(`You are currently in ${currentDirectory}\n`);
}

export { runFileManager };