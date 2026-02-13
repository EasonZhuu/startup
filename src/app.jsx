import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

export default function App() {
  return (
    <div className="body bg-white text-dark">
      <header className="container-fluid">
        <nav className="navbar fixed-top navbar-dark bg-primary">
          <a className="navbar-brand" href="#">
            GroupVote
          </a>
          <menu className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link active" href="#">
                New Vote
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                History
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Info
              </a>
            </li>
          </menu>
        </nav>
      </header>

      <main className="container-fluid">
        <div className="container py-4">App components go here</div>
      </main>

      <footer className="bg-primary text-white">
        <div className="container-fluid">
          <span className="text-reset">Author: Xinwei Zhu</span>
          <a className="text-reset" href="https://github.com/EasonZhuu/startup">
            GitHub Repository
          </a>
        </div>
      </footer>
    </div>
  );
}