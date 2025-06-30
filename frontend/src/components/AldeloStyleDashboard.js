import React from 'react';
import './AldeloStyleDashboard.css';

const buttons = [
  ['Pick Up', 'To Go', 'Delivery'],
  ['Recall', 'Driver', 'Delivery Status', 'Void'],
  ['Settle', 'No Sale', 'Pay Out', 'Refund'],
  ['Cashier In', 'Cashier Out'],
  ['Operations', 'Back Office', 'Exit Program']
];

const AldeloStyleDashboard = () => {
  return (
    <div className="aldelo-dashboard">
      {buttons.map((row, i) => (
        <div key={i} className="button-row">
          {row.map((label, j) => (
            <button key={j} className="dashboard-button">{label}</button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default AldeloStyleDashboard;
