import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { NewVote } from './newVote/newVote';
import { History } from './history/history';
import { Info } from './info/info';

export default function App() {
  return (
    <BrowserRouter>
      <div className="body bg-white text-dark">
        <header className="container-fluid">
          <nav className="navbar fixed-top navbar-dark bg-primary">
            <div className="navbar-brand">GroupVote</div>
            <menu className="navbar-nav">
              <li className="nav-item">
                <NavLink end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/">
                  New Vote
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/history">
                  History
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/info">
                  Info
                </NavLink>
              </li>
            </menu>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<NewVote />} />
          <Route path="/history" element={<History />} />
          <Route path="/info" element={<Info />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <footer className="bg-primary text-white">
          <div className="container-fluid">
            <span className="text-reset">Author: Xinwei Zhu</span>
            <a className="text-reset" href="https://github.com/EasonZhuu/startup">
              GitHub Repository
            </a>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return <main className="container-fluid bg-secondary text-center">404: Page not found.</main>;
}