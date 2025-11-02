import * as os from 'node:os';
import { commands, MSG_INVALID_INPUT, MSG_OPERATION_FAILED } from './commands.js';

function runFileManager() {
    let currentDirectory = os.homedir();

    printCurrentDirectory(currentDirectory);

    process.stdin.on('data', async (data) => {
        currentDirectory = await handleUserInput(data.toString().trim(), currentDirectory);
        printCurrentDirectory(currentDirectory);
    });
}

async function handleUserInput(input, currentDirectory) {
    const commandParts = input.split(' ');
    const command = commandParts[0];
    const processCommand = commands[command];
    if (processCommand) {
        try {
            currentDirectory = await processCommand(commandParts.slice(1), currentDirectory) ?? currentDirectory;
        } catch (_) {
            console.log(MSG_OPERATION_FAILED);
        }
    } else {
        console.log(MSG_INVALID_INPUT);
    }
    return currentDirectory;
}

function printCurrentDirectory(currentDirectory) {
    console.log(`You are currently in ${currentDirectory}\n`);
}

export { runFileManager };