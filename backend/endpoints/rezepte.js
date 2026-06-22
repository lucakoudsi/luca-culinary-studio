class RezeptEndpoint {
    constructor({expressManager, databaseManager}) {
        this.expressManager = expressManager;
        this.databaseManager = databaseManager;

        this.expressManager.registerRoute('rezepte', this.listRezepte, 'get');
        this.expressManager.registerRoute('rezept/:id', this.getRezeptById, 'get');
        this.expressManager.registerRoute('rezepte/new', this.createRezept, 'post');
    }

    listRezepte = async (req, res) => {
        try {
            const rezepte = await this.databaseManager.Rezepte.model.findAll({
                attributes: ['name', 'cover', 'description']
            });
            res.json(rezepte);
        } catch (error) {
            console.error('Error fetching rezepte:', error);
            res.status(500).json({ error: 'Failed to fetch rezepte' });
        }
    }

    getRezeptById = async (req, res) => {
        const { id } = req.params;
        try {
            const rezept = await this.databaseManager.Rezepte.model.findByPk(id, {
                include: [{ model: this.databaseManager.Zutaten.model }]
            });
            if (!rezept) {
                return res.status(404).json({ error: 'Rezept not found' });
            }
            res.json(rezept);
        } catch (error) {
            console.error('Error fetching rezept:', error);
            res.status(500).json({ error: 'Failed to fetch rezept' });
        }
    }

    createRezept = async (req, res) => {
        const { name, description, cover, steps, zutaten } = req.body;
        try {
            const newRezept = await this.databaseManager.Rezepte.model.create({ name, description, cover, steps });
            if (zutaten && Array.isArray(zutaten)) {
                const zutatInstances = await this.databaseManager.Zutaten.model.findAll({
                    where: { name: zutaten }
                });
                await newRezept.addZutaten(zutatInstances);
            }
            res.status(201).json(newRezept);
        } catch (error) {
            console.error('Error creating rezept:', error);
            res.status(500).json({ error: 'Failed to create rezept' });
        }
    }
}

export default RezeptEndpoint;