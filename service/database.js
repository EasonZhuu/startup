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

async function getUserByEmail(email) {
  if (!email) {
    return null;
  }

  return userCollection.findOne({ email });
}

async function getUserByToken(token) {
  if (!token) {
    return null;
  }

  return userCollection.findOne({ token });
}

async function addUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  await userCollection.insertOne(user);
  return user;
}

async function updateUserToken(email, token) {
  if (!email || !token) {
    return null;
  }

  await userCollection.updateOne({ email }, { $set: { token } });
  return getUserByEmail(email);
}

async function clearUserToken(token) {
  if (!token) {
    return;
  }

  await userCollection.updateOne({ token }, { $unset: { token: '' } });
}

async function getCurrentVote() {
  return voteCollection.findOne({ _id: 'current' }, { projection: { _id: 0 } });
}

async function saveCurrentVote(vote) {
  if (!vote || typeof vote !== 'object') {
    return null;
  }

  const voteDocument = { ...vote, _id: 'current' };
  await voteCollection.replaceOne({ _id: 'current' }, voteDocument, { upsert: true });
  return getCurrentVote();
}

module.exports = {
  testConnection,
  userCollection,
  voteCollection,
  historyCollection,
  getUserByEmail,
  getUserByToken,
  addUser,
  updateUserToken,
  clearUserToken,
  getCurrentVote,
  saveCurrentVote,
};

