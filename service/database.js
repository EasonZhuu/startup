const { MongoClient } = require('mongodb');

let config;
try {
  config = require('./dbConfig.json');
} catch {
  config = require('./dbConfig.example.json');
}

const url =
  config.connectionString && String(config.connectionString).trim().length > 0
    ? config.connectionString
    : `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;

const client = new MongoClient(url);
const db = client.db('startup');
const userCollection = db.collection('user');
const voteCollection = db.collection('vote');
const historyCollection = db.collection('history');

async function testConnection() {
  try {
    await db.command({ ping: 1 });
    console.log('Connected to MongoDB');
  } catch (error) {
    const safeUrl = String(url).replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    console.log(`Unable to connect to database with ${safeUrl} because ${error.message}`);
  }
}

module.exports = {
  testConnection,
  userCollection,
  voteCollection,
  historyCollection,
};
