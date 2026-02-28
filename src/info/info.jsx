import React from 'react';
import './info.css';

export function Info() {
  const [isLoadingTip, setIsLoadingTip] = React.useState(true);
  const [votingTip, setVotingTip] = React.useState(null);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setVotingTip({
        source: 'Mock 3rd-party suggestion service',
        category: 'Group decision tip',
        text: 'Limit the vote to 4 options and set a clear deadline so everyone responds faster.',
        updatedAt: new Date().toLocaleString(),
      });
      setIsLoadingTip(false);
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className="container-fluid">
      <div className="container py-4">
        <div className="row g-4 align-items-start">
          <div className="col-12 col-lg-5">
            <div id="picture" className="picture-box card shadow-sm">
              <img src="/vote.png" className="card-img-top" alt="Group voting" />
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <section className="card shadow-sm mb-4">
              <div className="card-body">
                <h2 className="card-title h5">What is GroupVote?</h2>
                <p className="mb-0">
                  GroupVote is a web application that allows groups to make decisions together using real-time voting.
                </p>
              </div>
            </section>

            <section className="card shadow-sm mb-4">
              <div className="card-body">
                <h2 className="card-title h5">How it works</h2>
                <ol className="list-group list-group-numbered">
                  <li className="list-group-item">Users log in</li>
                  <li className="list-group-item">A vote is created</li>
                  <li className="list-group-item">Users submit votes</li>
                  <li className="list-group-item">Results update in real time</li>
                </ol>
              </div>
            </section>

            <section id="thirdparty-section" className="card shadow-sm">
              <div className="card-body">
                <h2 className="card-title h5">External Services / 3rd-party</h2>
                {isLoadingTip ? (
                  <p className="info-note mb-0">Loading mock third-party voting tip...</p>
                ) : (
                  <div>
                    <p className="mb-2">
                      <span className="badge bg-primary">{votingTip?.category || 'Tip'}</span>
                    </p>
                    <p className="mb-2">{votingTip?.text}</p>
                    <p className="info-note mb-0">
                      {votingTip?.source || 'Mock service'} | Updated {votingTip?.updatedAt || 'unknown'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
