import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { NewVote } from './newVote/newVote';
import { History } from './history/history';
import { Info } from './info/info';

export default function App() {
  const [userName, setUserName] = React.useState('');
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/user/me');
        if (!res.ok) {
          return;
        }

        const data = await safeJson(res);
        const email = String(data.email || '').trim();
        if (!cancelled && email) {
          setUserName(email);
          setIsLoggedIn(true);
        }
      } catch {
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(nextUserName, password) {
    const email = String(nextUserName || '').trim();
    const rawPassword = String(password || '');
    if (!email || !rawPassword) {
      return { ok: false, msg: 'Please enter both username and password.' };
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: rawPassword }),
      });

      const data = await safeJson(response);
      if (!response.ok) {
        return { ok: false, msg: data.msg || 'Login failed.' };
      }

      const resolvedEmail = String(data.email || email).trim() || email;
      setUserName(resolvedEmail);
      setIsLoggedIn(true);
      return { ok: true, msg: 'Logged in.' };
    } catch {
      return { ok: false, msg: 'Cannot reach service.' };
    }
  }

  async function handleRegister(nextUserName, password) {
    const email = String(nextUserName || '').trim();
    const rawPassword = String(password || '');
    if (!email || !rawPassword) {
      return { ok: false, msg: 'Please enter both username and password.' };
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: rawPassword }),
      });

      const data = await safeJson(response);
      if (!response.ok) {
        return { ok: false, msg: data.msg || 'Create account failed.' };
      }

      const resolvedEmail = String(data.email || email).trim() || email;
      setUserName(resolvedEmail);
      setIsLoggedIn(true);
      return { ok: true, msg: 'Account created and logged in.' };
    } catch {
      return { ok: false, msg: 'Cannot reach service.' };
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch {
    }

    setUserName('');
    setIsLoggedIn(false);
    return { ok: true };
  }

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
          <Route
            path="/"
            element={
              <NewVote
                userName={userName}
                isLoggedIn={isLoggedIn}
                onLogin={handleLogin}
                onRegister={handleRegister}
                onLogout={handleLogout}
              />
            }
          />
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

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function NotFound() {
  return <main className="container-fluid bg-secondary text-center">404: Page not found.</main>;
}
