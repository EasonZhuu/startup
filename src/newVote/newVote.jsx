import React from 'react';
import './newVote.css';
import { createDefaultVote, loadCurrentVote, saveCurrentVote } from '../storage';

export function NewVote({ userName, isLoggedIn, onLogin, onLogout }) {
  const [loginName, setLoginName] = React.useState(userName || '');
  const [loginMessage, setLoginMessage] = React.useState('');
  const [currentVote, setCurrentVote] = React.useState(null);

  React.useEffect(() => {
    if (isLoggedIn && userName) {
      setLoginName(userName);
      setLoginMessage('');
    }
  }, [isLoggedIn, userName]);

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

  function handleLoginClick() {
    const trimmedUserName = loginName.trim();
    if (!trimmedUserName) {
      setLoginMessage('Please enter a username.');
      return;
    }

    setLoginMessage('');
    if (typeof onLogin === 'function') {
      onLogin(trimmedUserName);
    }
  }

  function handleLogoutClick() {
    setLoginMessage('');
    if (typeof onLogout === 'function') {
      onLogout();
    }
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
            <div className="card shadow-sm h-100">
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
                        className="btn btn-outline-primary vote-button"
                        type="button"
                        disabled={!isLoggedIn}
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
              </div>
            </div>
          </section>

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
                          <td>{option.votes}</td>
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
            <div className="card shadow-sm">
              <div className="card-body">
                <h3 className="card-title h5">Live Updates</h3>
                <div id="realtime-placeholder" className="alert alert-warning mb-0">
                  Waiting for real_time vote updates...(web socket)
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
