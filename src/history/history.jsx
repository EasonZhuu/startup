import React from 'react';
import './history.css';

export function History() {
  return (
    <main className="container-fluid">
      <div className="container py-4">
        <div className="row g-4">
          <section className="col-12 col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h3 className="card-title h5">Vote #1</h3>
                <p className="mb-2">
                  <span className="badge bg-primary">Question</span>
                  {' '}Where should we eat?
                </p>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between"><span>Pizza</span><span>5 votes</span></li>
                  <li className="list-group-item d-flex justify-content-between"><span>Burgers</span><span>3 votes</span></li>
                  <li className="list-group-item d-flex justify-content-between"><span>Sushi</span><span>7 votes</span></li>
                </ul>
                <p className="history-note text-muted mt-3 mb-0">
                  <em>Stored in database</em>
                </p>
              </div>
            </div>
          </section>

          <section className="col-12 col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h3 className="card-title h5">Vote #2</h3>
                <p className="mb-2">
                  <span className="badge bg-primary">Question</span>
                  {' '}What time should we meet?
                </p>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between"><span>10:00 AM</span><span>4 votes</span></li>
                  <li className="list-group-item d-flex justify-content-between"><span>12:00 PM</span><span>6 votes</span></li>
                  <li className="list-group-item d-flex justify-content-between"><span>2:00 PM</span><span>2 votes</span></li>
                </ul>
                <p className="history-note text-muted mt-3 mb-0">
                  <em>Stored in database</em>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}