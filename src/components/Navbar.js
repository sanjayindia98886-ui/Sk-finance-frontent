import React from 'react';

const Navbar = ({ companyName, onLogout, onEditName }) => {
  return (
    <nav style={styles.nav}>
      <div style={styles.brandWrapper}>
        <h2 style={styles.logo}>{companyName}</h2>
        {onEditName && (
          <button onClick={onEditName} style={styles.editBtn}>
            ✏️ Edit Name
          </button>
        )}
      </div>
      {onLogout && (
        <button onClick={onLogout} style={styles.logoutBtn}>
          Logout 🚪
        </button>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: '15px',
    marginBottom: '20px',
    borderBottom: '1px solid #1e293b',
    fontFamily: 'sans-serif'
  },
  brandWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  logo: {
    margin: 0,
    color: '#fff'
  },
  editBtn: {
    marginLeft: '15px',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  logoutBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default Navbar;