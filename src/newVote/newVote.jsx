import React from 'react';
import './newVote.css';

export function NewVote() {
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
                  <input id="username-input" className="form-control" type="text" placeholder="Username" />
                </div>

                <div className="input-group mb-3">
                  <span className="input-group-text">#</span>
                  <input id="password-box" className="form-control" type="password" placeholder="Password" />
                </div>

                <button id="login-button" className="btn btn-primary w-100">
                  Login
                </button>

                <div id="login-status" className="alert alert-info mt-3 mb-0">
                  Logged in as: <strong>Guest</strong>
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
                  {' '}Where should we eat tonight?
                </p>
                <div id="vote-options">
                  <button id="vote-a" className="btn btn-outline-primary vote-button">
                    Option A
                  </button>
                  <button id="vote-b" className="btn btn-outline-primary vote-button">
                    Option B
                  </button>
                  <button id="vote-c" className="btn btn-outline-primary vote-button">
                    Option C
                  </button>
                  <button id="vote-d" className="btn btn-outline-primary vote-button">
                    Option D
                  </button>
                </div>
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
                    <tr>
                      <td>Option A</td>
                      <td>3</td>
                    </tr>
                    <tr>
                      <td>Option B</td>
                      <td>8</td>
                    </tr>
                    <tr>
                      <td>Option C</td>
                      <td>5</td>
                    </tr>
                    <tr>
                      <td>Option D</td>
                      <td>7</td>
                    </tr>
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