const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 4000;

const users = [];
let voteHistory = [];
let currentVote = createDefaultVote('Guest');

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.send({ status: 'ok' });
});

app.post('/api/auth', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).send({ msg: 'Missing email or password' });
  }

  if (getUser('email', email)) {
    return res.status(409).send({ msg: 'Existing user' });
  }

  const user = await createUser(email, password);
  setAuthCookie(res, user);
  return res.send({ email: user.email });
});

app.put('/api/auth', async (req, res) => {
  const { email, password } = req.body || {};
  const user = getUser('email', email);
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }

  setAuthCookie(res, user);
  return res.send({ email: user.email });
});

app.delete('/api/auth', (req, res) => {
  const token = req.cookies.auth;
  const user = getUser('token', token);
  if (user) {
    clearAuthCookie(res, user);
  }

  return res.send({});
});

app.get('/api/user/me', authMiddleware, (req, res) => {
  return res.send({ email: req.user.email });
});

app.get('/api/protected/ping', authMiddleware, (req, res) => {
  return res.send({ msg: 'Authorized', email: req.user.email });
});

app.get('/api/votes/current', (req, res) => {
  return res.send(currentVote);
});

app.get('/api/votes/history', (req, res) => {
  return res.send(voteHistory);
});

app.post('/api/votes/current', authMiddleware, (req, res) => {
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

  if (currentVote) {
    const archivedAt = new Date().toISOString();
    const totalVotes = currentVote.options.reduce((sum, option) => sum + (Number(option.votes) || 0), 0);
    voteHistory = [
      {
        id: currentVote.id,
        question: currentVote.question,
        options: currentVote.options,
        createdBy: currentVote.createdBy,
        createdAt: currentVote.createdAt,
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

  return res.send(currentVote);
});

app.post('/api/votes/current/vote', authMiddleware, (req, res) => {
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
  users.push(user);
  return user;
}

function getUser(field, value) {
  if (!value) {
    return null;
  }

  return users.find((user) => user[field] === value);
}

function authMiddleware(req, res, next) {
  const token = req.cookies.auth;
  const user = getUser('token', token);
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }

  req.user = user;
  return next();
}

function setAuthCookie(res, user) {
  user.token = uuid.v4();
  res.cookie('auth', user.token, {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  });
}

function clearAuthCookie(res, user) {
  delete user.token;
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
