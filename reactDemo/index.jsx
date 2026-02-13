import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [bgColor, setBgColor] = React.useState('white');

  const handleClick = () => {
    setBgColor(bgColor === 'white' ? 'yellow' : 'white');
  };

  return (
    <div
      onClick={handleClick}
      style={{
        backgroundColor: bgColor,
        height: '100vh',
        font: 'bold 20vh Arial',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div>Hello React</div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
