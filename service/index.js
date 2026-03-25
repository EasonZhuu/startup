const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const DB = require('./database');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 4000;

let voteHistory = [];
let currentVote = null;

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

DB.testConnection();
initializeCurrentVote();

app.get('/api/health', (req, res) => {
  res.send({ status: 'ok' });
});

app.post('/api/auth', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).send({ msg: 'Missing email or password' });
  }

  const existingUser = await DB.getUserByEmail(email);
  if (existingUser) {
    return res.status(409).send({ msg: 'Existing user' });
  }

  const user = await createUser(email, password);
  const updatedUser = await setAuthCookie(res, user);
  return res.send({ email: updatedUser ? updatedUser.email : user.email });
});

app.put('/api/auth', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await DB.getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }

  const updatedUser = await setAuthCookie(res, user);
  return res.send({ email: updatedUser ? updatedUser.email : user.email });
});

app.delete('/api/auth', async (req, res) => {
  const { token, user } = await getAuthFromCookie(req);
  if (user) {
    await clearAuthCookie(res, token);
  }

  return res.send({});
});

app.get('/api/user/me', authMiddleware, (req, res) => {
  return res.send({ email: req.user.email });
});

app.get('/api/protected/ping', authMiddleware, (req, res) => {
  return res.send({ msg: 'Authorized', email: req.user.email });
});

app.get('/api/votes/current', async (req, res) => {
  const vote = await ensureCurrentVoteLoaded();
  return res.send(vote);
});

app.get('/api/votes/history', (req, res) => {
  return res.send(voteHistory);
});

app.post('/api/votes/current', authMiddleware, async (req, res) => {
  const previousVote = await ensureCurrentVoteLoaded();
  const { question, options } = req.body || {};
  const cleanQuestion = String(question || '').trim();
  const cleanOptions = Array.isArray(options)
    ? options.map((option) => String(option || '').trim()).filter((option) => option)
    : [];

  if (!cleanQuestion) {
    return res.status(400).send({ msg: 'Missing question' });
  }

  if (cleanOptions.length < 2) {
    return res.status(400).send({ msg: 'At least 2 options required' });
  }

  if (previousVote) {
    const archivedAt = new Date().toISOString();
    const totalVotes = previousVote.options.reduce((sum, option) => sum + (Number(option.votes) || 0), 0);
    voteHistory = [
      {
        id: previousVote.id,
        question: previousVote.question,
        options: previousVote.options,
        createdBy: previousVote.createdBy,
        createdAt: previousVote.createdAt,
        archivedAt,
        totalVotes,
      },
      ...voteHistory,
    ].slice(0, 20);
  }

  const now = new Date().toISOString();
  const timestamp = Date.now();
  currentVote = {
    id: `vote-${timestamp}`,
    question: cleanQuestion,
    options: cleanOptions.map((label, index) => ({ id: `opt-${index + 1}`, label, votes: 0 })),
    userVotes: {},
    createdBy: req.user.email,
    createdAt: now,
    updatedAt: now,
  };

  await DB.saveCurrentVote(currentVote);
  return res.send(currentVote);
});

app.post('/api/votes/current/vote', authMiddleware, async (req, res) => {
  await ensureCurrentVoteLoaded();

  const { optionId } = req.body || {};
  if (!currentVote || !Array.isArray(currentVote.options)) {
    return res.status(404).send({ msg: 'No active vote' });
  }

  const targetOption = currentVote.options.find((option) => option.id === optionId);
  if (!targetOption) {
    return res.status(400).send({ msg: 'Invalid optionId' });
  }

  const previousOptionId = currentVote.userVotes[req.user.email];
  if (previousOptionId === optionId) {
    return res.send(currentVote);
  }

  const nextOptions = currentVote.options.map((option) => {
    const safeVotes = Number(option.votes) || 0;
    if (option.id === previousOptionId) {
      return { ...option, votes: Math.max(0, safeVotes - 1) };
    }
    if (option.id === optionId) {
      return { ...option, votes: safeVotes + 1 };
    }
    return option;
  });

  currentVote = {
    ...currentVote,
    options: nextOptions,
    userVotes: { ...currentVote.userVotes, [req.user.email]: optionId },
    updatedAt: new Date().toISOString(),
  };

  return res.send(currentVote);
});

async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { email, password: passwordHash };
  await DB.addUser(user);
  return user;
}

async function initializeCurrentVote() {
  await ensureCurrentVoteLoaded();
}

async function ensureCurrentVoteLoaded() {
  if (currentVote) {
    return currentVote;
  }

  const savedVote = await DB.getCurrentVote();
  if (savedVote) {
    currentVote = savedVote;
    return currentVote;
  }

  currentVote = createDefaultVote('Guest');
  await DB.saveCurrentVote(currentVote);
  return currentVote;
}

async function authMiddleware(req, res, next) {
  const { user } = await getAuthFromCookie(req);
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }

  req.user = user;
  return next();
}

async function getAuthFromCookie(req) {
  const token = req.cookies?.auth;
  if (!token) {
    return { token: '', user: null };
  }

  const user = await DB.getUserByToken(token);
  return { token, user };
}

async function setAuthCookie(res, user) {
  const token = uuid.v4();
  const updatedUser = await DB.updateUserToken(user.email, token);
  res.cookie('auth', token, {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  });
  return updatedUser;
}

async function clearAuthCookie(res, token) {
  await DB.clearUserToken(token);
  res.clearCookie('auth');
}

function createDefaultVote(createdBy) {
  const timestamp = Date.now();
  const now = new Date().toISOString();
  return {
    id: `vote-${timestamp}`,
    question: 'Where should we eat tonight?',
    options: [
      { id: 'opt-1', label: 'Pizza', votes: 0 },
      { id: 'opt-2', label: 'Burgers', votes: 0 },
      { id: 'opt-3', label: 'Sushi', votes: 0 },
      { id: 'opt-4', label: 'Tacos', votes: 0 },
    ],
    userVotes: {},
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

app.listen(port, () => {
  console.log(`Service listening on port ${port}`);
});



