const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 4000;

const users = [];

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

app.get('/api/user/me', (req, res) => {
  const token = req.cookies.auth;
  const user = getUser('token', token);
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }

  return res.send({ email: user.email });
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

app.listen(port, () => {
  console.log(`Service listening on port ${port}`);
});
