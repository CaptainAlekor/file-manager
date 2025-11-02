import * as path from 'node:path';
import * as os from 'node:os';

const commands = {
    'up': (_, currentDirectory) => {
        return path.join(currentDirectory, '..');
    }
}

function runFileManager() {
    let currentDirectory = os.homedir();

    printCurrentDirectory(currentDirectory);

    process.stdin.on('data', (data) => {
        currentDirectory = handleUserInput(data.toString().trim(), currentDirectory);
        printCurrentDirectory(currentDirectory);
    });
}

function handleUserInput(input, currentDirectory) {
    const command = input.split(' ')[0];
    const processCommand = commands[command];
    if (processCommand) {
        currentDirectory = processCommand(input, currentDirectory);
    } else {
        console.log(`Unknown command: ${command}`);
    }
    return currentDirectory;
}

function printCurrentDirectory(currentDirectory) {
    console.log(`You are currently in ${currentDirectory}\n`);
}

export { runFileManager };