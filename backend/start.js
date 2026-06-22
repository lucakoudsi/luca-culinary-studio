import 'dotenv/config';

//Infrastructure
import ExpressManager from "./infra/express.js";
import ReadlineManager from "./infra/readline.js";
import Database  from "./infra/db.js";

//Endpoints
import RezeptEndpoint from './endpoints/rezepte.js';

const endpoints = {
    rezepte: RezeptEndpoint,
};

const expressManager = new ExpressManager();
const readlineManager = new ReadlineManager();
const db = new Database(expressManager);
await db.ready

const infra = {
    expressManager: expressManager,
    readlineManager: readlineManager,
    databaseManager: db,
};

for (const [name, EndpointClass] of Object.entries(endpoints)) {
    new EndpointClass(infra);
}

expressManager.app.listen(process.env.PORT, () => {
    console.log(`[SERVER]   Express server running on  127.0.0.1:${process.env.PORT}`);
});

console.log('Routen:\n - ' + Object.keys(expressManager.routes).join('\n - '));