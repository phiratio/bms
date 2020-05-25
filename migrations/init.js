'use strict';
const copy = require('recursive-copy');
const mongodb = require('mongodb');
const fsSync = require('fs');
const fs = require('fs').promises;
const path = require('path');
const bson = require('bson');
const MongoClient = mongodb.MongoClient;

const actionName = process.argv[process.argv.length-1];
const dbUser = process.env.MONGODB_USERNAME;
const dbPassword = process.env.MONGODB_PASSWORD;
const host = process.env.MONGODB_HOST;
const dbName = process.env.MONGODB_NAME;
const port = process.env.MONGODB_PORT;

let uri = `mongodb://${host}:${port}`;

if (dbUser && dbPassword) {
    uri = `mongodb://${dbUser}:${dbPassword}@${host}:${port}`;
}

const config = {
    uri,
    dbName: dbName,
    collections: [
        'items',
        'uploads',
        'tokens',
        'strapi_administrator',
        'users-permissions_user',
        'waitinglist',
        'core_store',
        'users-permissions_permission',
        'users-permissions_role',
    ],
    exportPath: path.resolve(__dirname, 'export'),
    importPath: path.resolve(__dirname, 'import'),
    exportFormat: 'json',
};

/**
 * Export collections from MongoDB
 * @param uri Connection string
 * @param dbName Database name
 * @param exportPath Path to a folder
 * @param collections List of collections to export
 * @param exportFormat Export file format
 * @returns {Promise<void>}
 */
const exportDB = async ({ uri, dbName, exportPath, collections, exportFormat }) => {
    if (!fsSync.existsSync(exportPath)) {
        fsSync.mkdirSync(exportPath, { recursive: true })
    }
    console.log(`Exporting from: ${dbName}`);
    console.log(`Exporting to: ${exportPath}`);
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);

    for (const col of collections) {
        console.log('Exporting collection: ', col);
        const collection = db.collection(col);
        const result = await collection.find({});
        const docs = await result.toArray();
        if (docs.length !== 0)
            await fs.writeFile(`${exportPath}/${col}.${exportFormat}`, bson.EJSON.stringify(docs));
    }

    return Promise.resolve();
};

/**
 * Import data from provided path to MongoDB
 * @param uri Connection String
 * @param dbName Database name
 * @param importPath Path where data is stored
 * @param exportFormat Database export format
 * @returns {Promise<void>}
 */
const importDB = async ({ uri, dbName, importPath, exportFormat }) => {
    console.log(`Importing from: ${importPath}`);
    console.log(`Importing to: ${dbName}`);
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);

    const importCollection = async (collectionName, collectionData) => {
        await db.createCollection(collectionName);
        await db.collection(collectionName).insertMany(collectionData, { ordered: false }).catch(e => e.code !== 11000 && console.error(e.message));
    };

    const files = await fs.readdir(importPath).then(files => files.filter(el => el.split('.').pop() === exportFormat));

    for (const file of files) {

        const data = JSON.parse(await fs.readFile(path.resolve(importPath, file), 'utf-8'));
        const collectionName = file.split('.').slice(0, -1).join('.');

        if (Array.isArray(data) && data.length > 0) {
            console.log('Importing collection: ', collectionName);
            await importCollection(collectionName, bson.EJSON.deserialize(data))
        }
    }
};

/**
 * Import demo data into database
 * @param uri Connection string
 * @param dbName Database Name
 * @param exportFormat Database export format
 * @returns {Promise<void>}
 */
const importDemo = async ({ uri, dbName, exportFormat }) => {
    await importDB({ uri, dbName, importPath: path.resolve(__dirname, 'default', 'db'), exportFormat });
    await importDB({ uri, dbName, importPath: path.resolve(__dirname, 'demo', 'db'), exportFormat });
    await copy(path.resolve(__dirname, 'demo', 'static'), path.resolve(__dirname, '..'), { overwrite: true });
};

/**
 * Import minimum data into database
 * @param uri Connection string
 * @param dbName Database Name
 * @param exportFormat Database export format
 * @returns {Promise<void>}
 */
const importDefault = async ({ uri, dbName, exportFormat }) => {
    await importDB({ uri, dbName, importPath: path.resolve(__dirname, 'default', 'db'), exportFormat });
    await copy(path.resolve(__dirname, 'demo', 'static'), path.resolve(__dirname, '..'), { overwrite: true });
};

const actions = {
    exportDB,
    importDB,
    importDemo,
};

if (process.mainModule.filename === __filename) {
    if (actionName in actions) {
        /**
         * Run action provided as last argument
         */
        actions[actionName](config)
            .then(() => process.exit(0))
            .catch(e => {
                console.error(e);
                process.exit(1);
            })
    }
}

module.exports = {
    exportDB,
    importDB,
    importDemo,
};