import readline from 'readline';

class ReadlineManager {
    constructor() {
        this.readline = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.commands = {};

        this.registerCommand('help', () => {console.log('Available commands:', Object.keys(this.commands).join(', '))});
    }

    registerCommand(command, handler) {
        this.commands[command] = handler;
        this.readline.on('line', (line) => {
            if (line.trim() === command) {
                handler();
            }
        });
    }
}

export default ReadlineManager;
