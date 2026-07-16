import React, { useState, useEffect } from 'react';

const DateTimeBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };

  return (
    <div style={styles.bar}>
      <span style={styles.date}>
        📅 {currentTime.toLocaleDateString('en-US', formatOptions)}
      </span>
      <span style={styles.time}>
        ⏰ {currentTime.toLocaleTimeString('en-US')}
      </span>
    </div>
  );
};

const styles = {
  bar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid #334155',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontFamily: 'sans-serif',
    color: '#cbd5e1'
  },
  date: {
    fontWeight: '500',
    fontSize: '14px'
  },
  time: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#60a5fa'
  }
};

export default DateTimeBar;