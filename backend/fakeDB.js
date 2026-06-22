import 'dotenv/config';
import { Op } from 'sequelize';

export const rezepte = [
  {
    name: "Spaghetti Napoli",
    description: "Klassische Tomatensauce mit Nudeln",
    cover: null,
    steps: [
      "Nudeln kochen",
      "Zwiebeln und Knoblauch anbraten",
      "Tomatensauce zubereiten",
      "Alles vermengen"
    ],
    zutaten: ["Nudeln", "Tomaten", "Zwiebeln", "Knoblauch", "Olivenöl", "Salz", "Pfeffer"]
  },
  {
    name: "Hähnchen Reis Pfanne",
    description: "Gebratenes Hähnchen mit Reis und Gemüse",
    cover: null,
    steps: [
      "Reis kochen",
      "Hähnchen anbraten",
      "Paprika und Zwiebeln dazugeben",
      "Alles mischen"
    ],
    zutaten: ["Hähnchen", "Reis", "Paprika", "Zwiebeln", "Olivenöl", "Salz", "Pfeffer"]
  },
  {
    name: "Knoblauch Pasta",
    description: "Einfache Pasta mit Knoblauch und Öl",
    cover: null,
    steps: [
      "Nudeln kochen",
      "Knoblauch in Öl anbraten",
      "Mit Nudeln mischen"
    ],
    zutaten: ["Nudeln", "Knoblauch", "Olivenöl", "Salz", "Pfeffer"]
  },
  {
    name: "Mediterranes Hähnchen",
    description: "Hähnchen mit Tomaten und Paprika",
    cover: null,
    steps: [
      "Hähnchen anbraten",
      "Tomaten und Paprika hinzufügen",
      "Würzen und köcheln lassen"
    ],
    zutaten: ["Hähnchen", "Tomaten", "Paprika", "Zwiebeln", "Olivenöl", "Salz"]
  },
  {
    name: "Gemüse Reis Bowl",
    description: "Vegetarische Reis Bowl mit Gemüse",
    cover: null,
    steps: [
      "Reis kochen",
      "Gemüse anbraten",
      "Alles zusammen in Bowl geben"
    ],
    zutaten: ["Reis", "Tomaten", "Paprika", "Zwiebeln", "Olivenöl", "Salz", "Pfeffer"]
  }
];

import DatabaseManager from "./infra/db.js";

const db = new DatabaseManager();
await db.ready;

const createRezept = async (rezept) => {
    const { name, description, cover, steps, zutaten } = rezept;
    try {
        const newRezept = await db.Rezepte.model.create({ name, description, cover, steps });
        if (zutaten && Array.isArray(zutaten)) {
            const zutatInstances = await db.Zutaten.model.findAll({
                where: {
                    name: {
                        [Op.in]: zutaten
                    }
                }
            });
            await newRezept.addZutaten(zutatInstances);
        }
        console.log(`Rezept "${name}" erfolgreich erstellt.`);
    } catch (error) {
        console.error('Error creating rezept:', error);
    }
}

for (const rezept of rezepte) {
    await createRezept(rezept);
}
