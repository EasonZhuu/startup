import React from 'react';
import './history.css';
import { loadVoteHistory } from '../storage';

export function History() {
  const [voteHistory, setVoteHistory] = React.useState([]);

  React.useEffect(() => {
    setVoteHistory(loadVoteHistory());
  }, []);

  function formatDate(value) {
    if (!value) {
      return 'Unknown time';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  }

  return (
    <main className="container-fluid">
      <div className="container py-4">
        <div className="row g-4">
          {voteHistory.map((vote, index) => (
            <section className="col-12 col-lg-6" key={`${vote.id || 'vote'}-${index}`}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h3 className="card-title h5">Vote #{index + 1}</h3>
                  <p className="mb-2">
                    <span className="badge bg-primary">Question</span>
                    {' '}
                    {vote.question || 'Untitled vote'}
                  </p>
                  <ul className="list-group list-group-flush">
                    {(Array.isArray(vote.options) ? vote.options : []).map((option) => (
                      <li className="list-group-item d-flex justify-content-between" key={`${vote.id}-${option.id}`}>
                        <span>{option.label}</span>
                        <span>{option.votes} votes</span>
                      </li>
                    ))}
                  </ul>
                  <p className="history-note text-muted mt-3 mb-0">
                    <em>
                      Archived {formatDate(vote.archivedAt)} | Total votes: {vote.totalVotes ?? 0}
                    </em>
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
