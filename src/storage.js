const STORAGE_KEYS = {
  userName: 'groupvote.userName',
  currentVote: 'groupvote.currentVote',
  voteHistory: 'groupvote.voteHistory',
};

function getBrowserStorage() {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return null;
}

function readString(key, fallbackValue = '') {
  const storage = getBrowserStorage();
  if (!storage) {
    return fallbackValue;
  }

  try {
    const value = storage.getItem(key);
    return value ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeString(key, value) {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch {
  }
}

function readJson(key, fallbackValue) {
  const storage = getBrowserStorage();
  if (!storage) {
    return fallbackValue;
  }

  try {
    const value = storage.getItem(key);
    if (!value) {
      return fallbackValue;
    }

    return JSON.parse(value);
  } catch {
    return fallbackValue;
  }
}

function writeJson(key, value) {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

export function loadUserName() {
  const userName = readString(STORAGE_KEYS.userName, '');
  return typeof userName === 'string' ? userName : '';
}

export function saveUserName(userName) {
  writeString(STORAGE_KEYS.userName, String(userName ?? ''));
}

export function clearUserName() {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(STORAGE_KEYS.userName);
  } catch {
  }
}

export function loadCurrentVote() {
  const vote = readJson(STORAGE_KEYS.currentVote, null);
  return vote && typeof vote === 'object' ? vote : null;
}

export function saveCurrentVote(vote) {
  if (!vote || typeof vote !== 'object') {
    return;
  }
  writeJson(STORAGE_KEYS.currentVote, vote);
}

export function loadVoteHistory() {
  const history = readJson(STORAGE_KEYS.voteHistory, []);
  return Array.isArray(history) ? history : [];
}

export function saveVoteHistory(history) {
  writeJson(STORAGE_KEYS.voteHistory, Array.isArray(history) ? history : []);
}

export function createDefaultVote(createdBy = 'Guest') {
  const timestamp = Date.now();
  const isoDate = new Date(timestamp).toISOString();

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
    createdAt: isoDate,
    updatedAt: isoDate,
  };
}

