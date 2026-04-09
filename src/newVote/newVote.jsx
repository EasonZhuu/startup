import React from 'react';
import { createWebSocketClient } from '../websocketClient';
import './newVote.css';

export function NewVote({ userName, isLoggedIn, onLogin, onRegister, onLogout }) {
  const [loginName, setLoginName] = React.useState(userName || '');
  const [loginMessage, setLoginMessage] = React.useState('');
  const [currentVote, setCurrentVote] = React.useState(null);
  const [voteMessage, setVoteMessage] = React.useState('');
  const [liveUpdates, setLiveUpdates] = React.useState([]);
  const [wsStatus, setWsStatus] = React.useState('reconnecting');
  const [draftQuestion, setDraftQuestion] = React.useState('');
  const [draftOptions, setDraftOptions] = React.useState(['', '', '', '']);
  const [draftMessage, setDraftMessage] = React.useState('');

  React.useEffect(() => {
    if (isLoggedIn && userName) {
      setLoginName(userName);
      setLoginMessage('');
    }
  }, [isLoggedIn, userName]);

  React.useEffect(() => {
    setVoteMessage('');
  }, [currentVote?.id]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/votes/current');
        const data = await safeJson(response);
        if (!cancelled && response.ok) {
          setCurrentVote(data);
        }
      } catch {
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let reconnectTimerId = null;
    const websocketClient = createWebSocketClient();

    function scheduleReconnect() {
      if (cancelled) {
        return;
      }

      setWsStatus('reconnecting');

      if (reconnectTimerId) {
        clearTimeout(reconnectTimerId);
      }

      reconnectTimerId = setTimeout(() => {
        if (!cancelled) {
          websocketClient.connect();
        }
      }, 2000);
    }

    websocketClient.onOpen(() => {
      if (cancelled) {
        return;
      }

      setWsStatus('connected');
      websocketClient.send({
        type: 'join',
        from: (userName || 'Guest').trim() || 'Guest',
      });
    });

    websocketClient.onClose(() => {
      if (cancelled) {
        return;
      }

      setWsStatus('disconnected');
      scheduleReconnect();
    });

    websocketClient.onError(() => {
      if (cancelled) {
        return;
      }

      scheduleReconnect();
    });

    websocketClient.onMessage((message) => {
      if (!message || typeof message !== 'object') {
        return;
      }

      const timeText = new Date().toLocaleTimeString();
      const updateText = message.text || 'Live update received';

      if (message.type === 'vote-update' && message.payload) {
        setCurrentVote(message.payload);
      }

      if (message.type === 'vote-update' || message.type === 'system') {
        setLiveUpdates((previousUpdates) => [`${timeText} - ${updateText}`, ...previousUpdates].slice(0, 10));
      }
    });

    setWsStatus('reconnecting');
    websocketClient.connect();

    return () => {
      cancelled = true;
      if (reconnectTimerId) {
        clearTimeout(reconnectTimerId);
      }
      websocketClient.close();
    };
  }, [userName]);

  function getPasswordValue() {
    return String(document.getElementById('password-box')?.value || '');
  }

  function validateLoginInput() {
    const trimmedUserName = loginName.trim();
    const passwordValue = getPasswordValue();

    if (!trimmedUserName) {
      setLoginMessage('Please enter a username.');
      return { ok: false, userName: '', password: '' };
    }

    if (!passwordValue) {
      setLoginMessage('Please enter a password.');
      return { ok: false, userName: '', password: '' };
    }

    return { ok: true, userName: trimmedUserName, password: passwordValue };
  }

  async function handleLoginClick() {
    const check = validateLoginInput();
    if (!check.ok) {
      return;
    }

    setLoginMessage('');
    setVoteMessage('');
    setDraftMessage('');

    if (typeof onLogin === 'function') {
      const result = await onLogin(check.userName, check.password);
      if (result && !result.ok) {
        setLoginMessage(result.msg || 'Login failed.');
      }
    }
  }

  async function handleCreateAccountClick() {
    const check = validateLoginInput();
    if (!check.ok) {
      return;
    }

    setLoginMessage('');
    setVoteMessage('');
    setDraftMessage('');

    if (typeof onRegister === 'function') {
      const result = await onRegister(check.userName, check.password);
      if (result && !result.ok) {
        setLoginMessage(result.msg || 'Create account failed.');
      }
    }
  }

  async function handleLogoutClick() {
    setLoginMessage('');
    setVoteMessage('');
    setDraftMessage('');
    if (typeof onLogout === 'function') {
      await onLogout();
    }
  }

  async function handleVoteClick(optionId) {
    if (!isLoggedIn || !userName) {
      setVoteMessage('Please log in to cast a vote.');
      return;
    }

    if (!currentVote || !Array.isArray(currentVote.options)) {
      return;
    }

    const existingVotes = currentVote.userVotes && typeof currentVote.userVotes === 'object' ? currentVote.userVotes : {};
    const previousOptionId = existingVotes[userName];

    if (previousOptionId === optionId) {
      const selectedOption = currentVote.options.find((option) => option.id === optionId);
      setVoteMessage(`You already voted for ${selectedOption ? selectedOption.label : 'this option'}.`);
      return;
    }

    try {
      const response = await fetch('/api/votes/current/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });

      const data = await safeJson(response);
      if (!response.ok) {
        setVoteMessage(data.msg || 'Vote failed.');
        return;
      }

      setCurrentVote(data);
      setVoteMessage(previousOptionId ? 'Vote updated successfully.' : 'Vote submitted successfully.');
    } catch {
      setVoteMessage('Cannot reach service.');
    }
  }

  function handleDraftOptionChange(index, value) {
    setDraftMessage('');
    setDraftOptions((previousOptions) =>
      previousOptions.map((option, optionIndex) => (optionIndex === index ? value : option))
    );
  }

  async function handleDraftSubmit(event) {
    event.preventDefault();

    if (!isLoggedIn || !userName) {
      setDraftMessage('Please log in before creating a new vote.');
      return;
    }

    const cleanedQuestion = draftQuestion.trim();
    const filledOptions = draftOptions.map((option) => option.trim()).filter((option) => option);

    if (!cleanedQuestion) {
      setDraftMessage('Please enter a question for the new vote.');
      return;
    }

    if (filledOptions.length < 2) {
      setDraftMessage('Please enter at least 2 options.');
      return;
    }

    try {
      const response = await fetch('/api/votes/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: cleanedQuestion, options: filledOptions }),
      });

      const data = await safeJson(response);
      if (!response.ok) {
        setDraftMessage(data.msg || 'Create vote failed.');
        return;
      }

      setCurrentVote(data);
      setLiveUpdates([]);
      setVoteMessage('');
      setDraftQuestion('');
      setDraftOptions(['', '', '', '']);
      setDraftMessage(`Created a new vote: "${cleanedQuestion}".`);
    } catch {
      setDraftMessage('Cannot reach service.');
    }
  }

  return (
    <main className="container-fluid">
      <div className="page-shell">
        <div className="row g-4">
          <section id="login-section" className="col-12 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="card-title h5">User Login</h2>

                <div className="input-group mb-3">
                  <span className="input-group-text">@</span>
                  <input
                    id="username-input"
                    className="form-control"
                    type="text"
                    placeholder="Username"
                    value={loginName}
                    onChange={(event) => setLoginName(event.target.value)}
                  />
                </div>

                <div className="input-group mb-3">
                  <span className="input-group-text">#</span>
                  <input id="password-box" className="form-control" type="password" placeholder="Password" />
                </div>

                {!isLoggedIn ? (
                  <div className="d-flex gap-2">
                    <button id="login-button" className="btn btn-primary flex-fill" type="button" onClick={handleLoginClick}>
                      Login
                    </button>
                    <button
                      id="create-button"
                      className="btn btn-outline-primary flex-fill"
                      type="button"
                      onClick={handleCreateAccountClick}
                    >
                      Create
                    </button>
                  </div>
                ) : (
                  <button id="logout-button" className="btn btn-outline-secondary w-100" type="button" onClick={handleLogoutClick}>
                    Logout
                  </button>
                )}

                <div id="login-status" className="alert alert-info mt-3 mb-0">
                  {loginMessage ? (
                    <span>{loginMessage}</span>
                  ) : (
                    <>
                      Logged in as: <strong>{isLoggedIn ? userName : 'Guest'}</strong>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="col-12 col-lg-7">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h2 className="card-title h5">Create New Vote (Draft)</h2>
                <form onSubmit={handleDraftSubmit}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="draft-question">
                      Question
                    </label>
                    <input
                      id="draft-question"
                      className="form-control"
                      type="text"
                      placeholder="Where should we go this weekend?"
                      value={draftQuestion}
                      onChange={(event) => {
                        setDraftMessage('');
                        setDraftQuestion(event.target.value);
                      }}
                    />
                  </div>

                  {draftOptions.map((option, index) => (
                    <div className="mb-2" key={`draft-option-${index}`}>
                      <label className="form-label" htmlFor={`draft-option-${index}`}>
                        Option {index + 1}
                      </label>
                      <input
                        id={`draft-option-${index}`}
                        className="form-control"
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(event) => handleDraftOptionChange(index, event.target.value)}
                      />
                    </div>
                  ))}

                  <button className="btn btn-outline-primary mt-2" type="submit" disabled={!isLoggedIn}>
                    Create Vote
                  </button>
                </form>

                {draftMessage && <div className="alert alert-secondary mt-3 mb-0">{draftMessage}</div>}
                {!isLoggedIn && !draftMessage && <p className="text-muted mt-3 mb-0">Log in to create a new vote.</p>}
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <h2 id="vote-title" className="card-title h5">
                  Current Vote
                </h2>
                <p className="mb-2">
                  <span className="badge bg-primary">Question</span> {currentVote ? currentVote.question : 'Loading current vote...'}
                </p>
                <div id="vote-options">
                  {currentVote ? (
                    currentVote.options.map((option) => (
                      <button
                        key={option.id}
                        id={`vote-${option.id}`}
                        className={`btn ${
                          currentVote.userVotes && currentVote.userVotes[userName] === option.id ? 'btn-primary' : 'btn-outline-primary'
                        } vote-button`}
                        type="button"
                        disabled={!isLoggedIn || !currentVote}
                        onClick={() => handleVoteClick(option.id)}
                        aria-pressed={Boolean(currentVote.userVotes && currentVote.userVotes[userName] === option.id)}
                      >
                        {option.label}
                      </button>
                    ))
                  ) : (
                    <p className="text-muted mb-0">Loading options...</p>
                  )}
                </div>
                {!isLoggedIn && <p className="text-muted mt-3 mb-0">Log in to vote on the current question.</p>}
                {voteMessage && <p className="text-muted mt-2 mb-0">{voteMessage}</p>}
              </div>
            </div>
          </section>
        </div>

        <div className="row g-4 mt-0">
          <section className="col-12 col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <h3 id="results-title" className="card-title h5">
                  Vote Results
                </h3>
                <table className="table table-striped table-sm">
                  <thead className="table-dark">
                    <tr>
                      <th>Option</th>
                      <th>Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVote ? (
                      currentVote.options.map((option) => (
                        <tr key={`result-${option.id}`}>
                          <td>{option.label}</td>
                          <td>{Number(option.votes) || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2}>Loading vote results...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="col-12 col-lg-6">
            <div className="card shadow-sm h-auto">
              <div className="card-body">
                <h3 className="card-title h5 d-flex align-items-center justify-content-between">
                  <span>Live Updates</span>
                  <span className={`badge ${getWsStatusBadgeClass(wsStatus)}`}>{getWsStatusLabel(wsStatus)}</span>
                </h3>
                <div id="realtime-placeholder" className={`alert ${getWsStatusAlertClass(wsStatus)} mb-0`}>
                  {liveUpdates.length ? (
                    liveUpdates.map((update, index) => <div key={`${index}-${update}`}>{update}</div>)
                  ) : (
                    getWsStatusPlaceholder(wsStatus)
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}


function getWsStatusLabel(status) {
  if (status === 'connected') {
    return 'connected';
  }

  if (status === 'disconnected') {
    return 'disconnected';
  }

  return 'reconnecting';
}

function getWsStatusBadgeClass(status) {
  if (status === 'connected') {
    return 'bg-success';
  }

  if (status === 'disconnected') {
    return 'bg-danger';
  }

  return 'bg-warning text-dark';
}

function getWsStatusAlertClass(status) {
  if (status === 'connected') {
    return 'alert-success';
  }

  if (status === 'disconnected') {
    return 'alert-danger';
  }

  return 'alert-warning';
}

function getWsStatusPlaceholder(status) {
  if (status === 'connected') {
    return 'Connected. Waiting for new live vote updates...';
  }

  if (status === 'disconnected') {
    return 'Disconnected from live updates. Trying to reconnect...';
  }

  return 'Reconnecting to live updates...';
}
async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}



