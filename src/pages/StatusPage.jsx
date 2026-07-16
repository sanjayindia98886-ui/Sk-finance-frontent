import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const StatusPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { status, message } = location.state || { 
        status: 'PENDING_APPROVAL', 
        message: 'Please wait or contact the administrator.' 
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {status === 'PENDING_APPROVAL' ? (
                    <div>
                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>⏳</div>
                        <h2 style={styles.title}>Account Approval Pending</h2>
                        <p style={styles.message}>{message}</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>💳</div>
                        <h2 style={{ ...styles.title, color: '#f87171' }}>Payment Required</h2>
                        <p style={styles.message}>{message}</p>
                        
                        <button style={styles.payButton} onClick={() => alert('Your QR code or payment gateway will load here!')}>
                            Pay Now
                        </button>
                    </div>
                )}
                
                <button style={styles.backButton} onClick={() => navigate('/login')}>
                    Back to Login
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#0f172a', 
        color: '#fff', 
        fontFamily: 'sans-serif' 
    },
    card: { 
        background: 'rgba(255, 255, 255, 0.05)', 
        padding: '40px', 
        borderRadius: '15px', 
        width: '380px', 
        textAlign: 'center', 
        border: '1px solid #334155',
        boxSizing: 'border-box'
    },
    title: { 
        fontSize: '22px', 
        marginBottom: '15px',
        color: '#3b82f6'
    },
    message: { 
        fontSize: '15px', 
        color: '#94a3b8', 
        lineHeight: '1.6',
        marginBottom: '25px'
    },
    payButton: { 
        width: '100%', 
        padding: '12px', 
        borderRadius: '5px', 
        border: 'none', 
        background: '#10b981', 
        color: '#fff', 
        cursor: 'pointer', 
        fontWeight: 'bold',
        fontSize: '15px',
        marginBottom: '15px'
    },
    backButton: { 
        background: 'none', 
        border: 'none', 
        color: '#60a5fa', 
        cursor: 'pointer', 
        textDecoration: 'underline',
        fontSize: '14px',
        marginTop: '10px'
    }
};

export default StatusPage;