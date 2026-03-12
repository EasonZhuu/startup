const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 4000;

const users = [];

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.send({ status: 'ok' });
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

app.listen(port, () => {
  console.log(`Service listening on port ${port}`);
});
