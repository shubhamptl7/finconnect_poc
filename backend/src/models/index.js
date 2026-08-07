import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import process from 'process';

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const configFile = await import('../config/database.cjs');
const configSource = configFile.default || configFile;
const environment = process.env.NODE_ENV || 'development';
const config = configSource[environment] || configSource.development;

if (!config || !config.dialect) {
  throw new Error(
    `Database config is missing or invalid for NODE_ENV=${environment}. Ensure dialect is defined.`
  );
}

const db = {};

let sequelize = new Sequelize(config.database, config.username, config.password, config);

const files = fs
  .readdirSync(__dirname)
  .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js');

for (const file of files) {
  const { default: modelDef } = await import(`file://${path.join(__dirname, file)}`);
  if (typeof modelDef !== 'function') {
    throw new TypeError(`Invalid model export in ${file}: default export must be a function`);
  }
  const model = modelDef(sequelize, Sequelize.DataTypes);
  if (!model) {
    console.error(`Model returned undefined from ${file}`);
  }

  db[model.name] = model;
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
