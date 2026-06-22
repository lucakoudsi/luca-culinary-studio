import express from 'express';
import cors from 'cors';
import multer from 'multer';

class ExpressManager {
    constructor() {
        this.app = express();
            this.app.use(cors());
            this.app.use(express.json());

            this.app.use((req, res, next) => {
                console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
                next();
            });

            this.upload = multer({ storage: multer.memoryStorage() });

        this.routes = {};
    }

    #buildPath(path) {
        if (path.startsWith('/api/')) {
            return path;
        }
        
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        return `/api${path}`;
    }

    registerRoute(path, handler, method = 'get') {
        path = this.#buildPath(path);

        if (this.routes[path]) {
            console.warn(`Route ${path} wird bereits verwendet. Überschreiben übersprungen.`);
            return;
        }

        this.app[method](path, handler);
        this.routes[path] = handler;
    }

    registerUploadRoute(path, handler, method = 'post') {
        path = this.#buildPath(path);

        if (this.routes[path]) {
            console.warn(`Route ${path} wird bereits verwendet. Überschreiben übersprungen.`);
            return;
        }

        this.app[method](path, this.upload.single('file'), handler);
        this.routes[path] = handler;
    }
}

export default ExpressManager;