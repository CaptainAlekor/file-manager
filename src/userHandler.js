const USERNAME_ARG_IDENTIFIER = '--username=';

function handleUser() {
    const username = process.argv
        .slice(2)
        .find(arg => arg.startsWith(USERNAME_ARG_IDENTIFIER))
        .substring(USERNAME_ARG_IDENTIFIER.length);

    console.log(`Welcome to the File Manager, ${username}!`);

    process.on('exit', () => {
        console.log(`Thank you for using File Manager, ${username}, goodbye!`);
    })
}

export { handleUser };