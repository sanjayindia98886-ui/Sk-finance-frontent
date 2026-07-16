import React from 'react';

const PasswordField = ({ label, name, placeholder, value, onChange, showPassword, toggleShowPassword }) => {
  return (
    <div style={styles.inputGroup}>
      {label && <label style={styles.label}>{label}</label>}
      <div style={styles.passwordWrapper}>
        <input 
          type={showPassword ? "text" : "password"} 
          name={name} 
          placeholder={placeholder} 
          value={value} 
          onChange={onChange} 
          required 
          style={styles.input} 
        />
        <button type="button" onClick={toggleShowPassword} style={styles.eyeButton}>
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  inputGroup: { 
    marginBottom: '15px' 
  },
  label: { 
    display: 'block', 
    marginBottom: '5px', 
    fontSize: '13px', 
    color: '#94a3b8',
    fontFamily: 'sans-serif'
  },
  passwordWrapper: { 
    position: 'relative', 
    display: 'flex', 
    alignItems: 'center', 
    width: '100%' 
  },
  input: { 
    width: '100%', 
    padding: '10px', 
    borderRadius: '5px', 
    border: '1px solid #334155', 
    background: '#1e293b', 
    color: '#fff', 
    boxSizing: 'border-box' 
  },
  eyeButton: { 
    position: 'absolute', 
    right: '10px', 
    background: 'none', 
    border: 'none', 
    color: '#94a3b8', 
    cursor: 'pointer', 
    fontSize: '18px' 
  }
};

export default PasswordField;