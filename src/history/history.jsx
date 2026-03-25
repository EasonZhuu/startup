import React from 'react';
import './history.css';

export function History() {
  const [voteHistory, setVoteHistory] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/votes/history');
        const data = await safeJson(response);
        if (!cancelled && response.ok && Array.isArray(data)) {
          setVoteHistory(data);
        }
      } catch {
        if (!cancelled) {
          setVoteHistory([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
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

  const visibleHistory = [...voteHistory]
    .sort((left, right) => {
      const leftTime = new Date(left?.archivedAt || 0).getTime();
      const rightTime = new Date(right?.archivedAt || 0).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 20);

  return (
    <main className="container-fluid">
      <div className="page-shell">
        <div className="row g-4">
          {visibleHistory.length === 0 ? (
            <section className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h3 className="card-title h5 mb-2">No vote history yet</h3>
                  <p className="text-muted mb-0">Create a new vote in the New Vote page to archive the current one here.</p>
                </div>
              </div>
            </section>
          ) : (
            visibleHistory.map((vote, index) => (
              <section className="col-12 col-lg-6" key={`${vote.id || 'vote'}-${index}`}>
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <h3 className="card-title h5">Vote #{index + 1}</h3>
                    <p className="mb-2">
                      <span className="badge bg-primary">Question</span> {vote.question || 'Untitled vote'}
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
            ))
          )}
        </div>
      </div>
    </main>
  );
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return [];
  }
}
