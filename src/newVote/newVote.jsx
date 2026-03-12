import React from 'react';
import './newVote.css';
import { createDefaultVote, loadCurrentVote, loadVoteHistory, saveCurrentVote, saveVoteHistory } from '../storage';

export function NewVote({ userName, isLoggedIn, onLogin, onLogout }) {
  const [loginName, setLoginName] = React.useState(userName || '');
  const [loginMessage, setLoginMessage] = React.useState('');
  const [currentVote, setCurrentVote] = React.useState(null);
  const [voteMessage, setVoteMessage] = React.useState('');
  const [liveUpdates, setLiveUpdates] = React.useState([]);
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
    const storedVote = loadCurrentVote();
    if (storedVote) {
      setCurrentVote(storedVote);
      return;
    }

    const defaultVote = createDefaultVote();
    setCurrentVote(defaultVote);
    saveCurrentVote(defaultVote);
  }, []);

  React.useEffect(() => {
    if (!currentVote || !Array.isArray(currentVote.options) || currentVote.options.length === 0) {
      return undefined;
    }

    const mockUsers = ['Alex', 'Mia', 'Noah', 'Priya', 'Kai', 'Sam'];

    const intervalId = setInterval(() => {
      setCurrentVote((previousVote) => {
        if (!previousVote || !Array.isArray(previousVote.options) || previousVote.options.length === 0) {
          return previousVote;
        }

        const existingVotes =
          previousVote.userVotes && typeof previousVote.userVotes === 'object' ? previousVote.userVotes : {};
        const mockUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const previousOptionId = existingVotes[mockUser];

        const candidateOptions =
          previousVote.options.length > 1 && previousOptionId
            ? previousVote.options.filter((option) => option.id !== previousOptionId)
            : previousVote.options;

        const selectedOption = candidateOptions[Math.floor(Math.random() * candidateOptions.length)];
        if (!selectedOption) {
          return previousVote;
        }

        const nextOptions = previousVote.options.map((option) => {
          const safeVotes = Number(option.votes) || 0;
          if (option.id === previousOptionId) {
            return { ...option, votes: Math.max(0, safeVotes - 1) };
          }

          if (option.id === selectedOption.id) {
            return { ...option, votes: safeVotes + 1 };
          }

          return option;
        });

        const nextVote = {
          ...previousVote,
          options: nextOptions,
          userVotes: { ...existingVotes, [mockUser]: selectedOption.id },
          updatedAt: new Date().toISOString(),
        };

        saveCurrentVote(nextVote);

        const actionText = previousOptionId ? 'changed vote to' : 'voted for';
        const timeText = new Date().toLocaleTimeString();
        setLiveUpdates((previousUpdates) =>
          [`${timeText} - ${mockUser} ${actionText} ${selectedOption.label}`, ...previousUpdates].slice(0, 10)
        );

        return nextVote;
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [currentVote?.id]);

  async function handleLoginClick() {
    const trimmedUserName = loginName.trim();
    const passwordValue = String(document.getElementById('password-box')?.value || '');
    if (!trimmedUserName) {
      setLoginMessage('Please enter a username.');
      return;
    }

    if (!passwordValue) {
      setLoginMessage('Please enter a password.');
      return;
    }

    setLoginMessage('');
    setVoteMessage('');
    setDraftMessage('');
    if (typeof onLogin === 'function') {
      const result = await onLogin(trimmedUserName, passwordValue);
      if (result && !result.ok) {
        setLoginMessage(result.msg || 'Login failed.');
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
  function handleVoteClick(optionId) {
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

    const nextVote = {
      ...currentVote,
      options: nextOptions,
      userVotes: { ...existingVotes, [userName]: optionId },
      updatedAt: new Date().toISOString(),
    };

    setCurrentVote(nextVote);
    saveCurrentVote(nextVote);
    setVoteMessage(previousOptionId ? 'Vote updated successfully.' : 'Vote submitted successfully.');
  }

  function handleDraftOptionChange(index, value) {
    setDraftMessage('');
    setDraftOptions((previousOptions) =>
      previousOptions.map((option, optionIndex) => (optionIndex === index ? value : option))
    );
  }

  function handleDraftSubmit(event) {
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

    const nowIso = new Date().toISOString();

    if (currentVote && Array.isArray(currentVote.options)) {
      const archivedVote = {
        id: currentVote.id,
        question: currentVote.question,
        options: currentVote.options.map((option) => ({ ...option })),
        createdBy: currentVote.createdBy || 'Guest',
        createdAt: currentVote.createdAt || nowIso,
        archivedAt: nowIso,
        totalVotes: currentVote.options.reduce((sum, option) => sum + (Number(option.votes) || 0), 0),
      };

      const nextHistory = [archivedVote, ...loadVoteHistory()].slice(0, 20);
      saveVoteHistory(nextHistory);
    }

    const timestamp = Date.now();
    const nextVote = {
      id: `vote-${timestamp}`,
      question: cleanedQuestion,
      options: filledOptions.map((optionLabel, index) => ({
        id: `opt-${index + 1}`,
        label: optionLabel,
        votes: 0,
      })),
      userVotes: {},
      createdBy: userName,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setCurrentVote(nextVote);
    saveCurrentVote(nextVote);
    setLiveUpdates([]);
    setVoteMessage('');
    setDraftQuestion('');
    setDraftOptions(['', '', '', '']);
    setDraftMessage(`Created a new vote: "${cleanedQuestion}".`);
  }

  return (
    <main className="container-fluid">
      <div className="container py-4">
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
                  <button id="login-button" className="btn btn-primary w-100" type="button" onClick={handleLoginClick}>
                    Login
                  </button>
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

                {draftMessage && (
                  <div className="alert alert-secondary mt-3 mb-0">{draftMessage}</div>
                )}
                {!isLoggedIn && !draftMessage && (
                  <p className="text-muted mt-3 mb-0">Log in to create a new vote.</p>
                )}
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <h2 id="vote-title" className="card-title h5">
                  Current Vote
                </h2>
                <p className="mb-2">
                  <span className="badge bg-primary">Question</span>
                  {' '}
                  {currentVote ? currentVote.question : 'Loading current vote...'}
                </p>
                <div id="vote-options">
                  {currentVote ? (
                    currentVote.options.map((option) => (
                      <button
                        key={option.id}
                        id={`vote-${option.id}`}
                        className={`btn ${
                          currentVote.userVotes && currentVote.userVotes[userName] === option.id
                            ? 'btn-primary'
                            : 'btn-outline-primary'
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
                {!isLoggedIn && (
                  <p className="text-muted mt-3 mb-0">Log in to vote on the current question.</p>
                )}
                {voteMessage && (
                  <p className="text-muted mt-2 mb-0">{voteMessage}</p>
                )}
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
                <h3 className="card-title h5">Live Updates</h3>
                <div id="realtime-placeholder" className="alert alert-warning mb-0">
                  {liveUpdates.length ? (
                    liveUpdates.map((update, index) => (
                      <div key={`${index}-${update}`}>{update}</div>
                    ))
                  ) : (
                    'Waiting for real-time vote updates (mock WebSocket)...'
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


