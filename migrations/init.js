'use strict';

const dbUser = process.env.MONGODB_USERNAME;
const dbPassword = process.env.MONGODB_PASSWORD;
const host = process.env.MONGODB_HOST;
const port = process.env.MONGODB_PORT;
const dbName = process.env.MONGODB_NAME;

const mongodb = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
const EJSON = require('mongodb-extjson');
const MongoClient = mongodb.MongoClient;

let uri = `mongodb://${host}:${port}/${dbName}`;
if (dbUser && dbPassword) {
  uri = `mongodb://${dbUser}:${dbPassword}@${host}:${port}`;
}

module.exports.up = async next => {
    console.log('Exporting from: ', uri);
    const client = await MongoClient.connect(uri);
    let db = client.db(dbName);
    let collection = db.collection('items');
    let result = await collection.find({});
    const docs = await result.toArray();
    await fs.writeFile(path.resolve( __dirname, '..', 'db-data', 'items.js'), EJSON.stringify(docs));
    next();
};

module.exports.down = function (next) {
  next();
};
