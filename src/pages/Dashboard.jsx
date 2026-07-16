import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { applyPlugin } from 'jspdf-autotable';
import API from '../api/Config';

applyPlugin(jsPDF);

const Dashboard = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientHistory, setSelectedClientHistory] = useState(null); 
  const [stats, setStats] = useState({ totalOutflow: 0, totalInflow: 0, netProfit: 0, totalPending: 0 });
  const [formData, setFormData] = useState({ 
    clientName: '', 
    loanType: 'Daily', 
    totalLoanAmount: '', 
    totalReturnAmount: '', 
    dailyInstallment: '', 
    totalDays: '' 
  });

  const [userRole, setUserRole] = useState(''); 
  const [allUsers, setAllUsers] = useState([]); 
  const [adminLoading, setAdminLoading] = useState(true);

  const [companyName, setCompanyName] = useState(''); 
  const [currentFilter, setCurrentFilter] = useState('All'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const loadAllUsersForAdmin = async () => {
    try {
      const res = await API.get('/api/admin/pending');
      setAllUsers(res.data);
      setAdminLoading(false);
    } catch (err) {
      console.error("Admin users fetch error", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
    try {
  const profileRes = await API.get('/api/profile');
  const userData = profileRes.data.user || profileRes.data;

  setUserRole(userData.role);

  if (userData.companyName) {
    setCompanyName(userData.companyName);
  } else {
    setCompanyName('sp-finance');
  }
  
  if (userData.role === 'admin') {
    loadAllUsersForAdmin();
  }

  const res = await API.get('/clients/all');
  setClients(res.data.clients || []);
  setStats(res.data.stats || { totalOutflow: 0, totalInflow: 0, netProfit: 0, totalPending: 0 });
}
    };
    fetchData();
  }, [navigate]);

  const handleEditCompanyName = async () => {
    const newName = prompt("Enter your Company/Business Name:", companyName);
    if (!newName) return;
    try {
      await API.put('/api/update-company', { companyName: newName });
      setCompanyName(newName);
      alert('Business name updated successfully!');
    } catch (err) {
      alert('Failed to update name: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApproveAndPay = async (userId) => {
    try {
      await API.post('/api/admin/action', {
        userId: userId,
        action: 'approve'
      });
      
      alert('User successfully approved!');
      loadAllUsersForAdmin(); 
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBlockUser = async (userId) => {
    if (window.confirm("Are you sure you want to block this user's access?")) {
        try {
            await API.post('/api/admin/action', {
                userId: userId,
                action: 'block'
            });
            
            alert('User access blocked successfully!');
            loadAllUsersForAdmin(); 
        } catch (err) {
            alert('Block failed: ' + (err.response?.data?.message || err.message));
        }
    }
  };

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = " @media (max-width: 768px) { .desktop-table-view { display: none !important; } .mobile-cards-view { display: flex !important; } } @media (min-width: 769px) { .desktop-table-view { display: table !important; } .mobile-cards-view { display: none !important; } } ";
    document.head.appendChild(styleTag);
  }, []);

  const getFilteredClients = () => {
    let result = clients.filter((c) => c.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (currentFilter === 'Active') {
      result = result.filter((c) => (c.pendingBalance ?? ((c.totalReturnAmount || c.totalLoanAmount) - (c.collectedAmount || 0))) > 0);
    } else if (currentFilter === 'Cleared') {
      result = result.filter((c) => (c.pendingBalance ?? ((c.totalReturnAmount || c.totalLoanAmount) - (c.collectedAmount || 0))) <= 0);
    } else if (currentFilter === 'Late') {
      result = result.filter((c) => c.pendingDays <= 0 && (c.pendingBalance ?? ((c.totalReturnAmount || c.totalLoanAmount) - (c.collectedAmount || 0))) > 0);
    }
    return result;
  };

  const filteredClients = getFilteredClients();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const handleFilterChange = (filterName) => {
    setCurrentFilter(filterName);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const downloadPDF = (c) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(companyName + " - Account Receipt", 14, 15);
    doc.autoTable({
      startY: 22,
      head: [['Field', 'Details']],
      body: [
        ['Client Name', c.clientName],
        ['Loan Amount', 'Rs. ' + c.totalLoanAmount],
        ['Return Amount', 'Rs. ' + (c.totalReturnAmount || c.totalLoanAmount)],
        ['Collected Amount', 'Rs. ' + (c.collectedAmount || 0)],
        ['Pending Balance', 'Rs. ' + (c.pendingBalance || 0)],
        ['Pending Days', c.pendingDays || '-'],
        ['Total Penalty', 'Rs. ' + (c.penalty || 0)]
      ],
      theme: 'striped'
    });

    if (c.penaltyHistory && c.penaltyHistory.length > 0) {
      doc.setFontSize(12);
      doc.text("Penalty History Details:", 14, doc.lastAutoTable.finalY + 15);
      const penaltyRows = c.penaltyHistory.map(p => [
        new Date(p.date).toLocaleDateString('en-US'),
        'Rs. ' + p.amount,
        p.reason || 'Late Installment'
      ]);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Date', 'Amount', 'Reason']],
        body: penaltyRows,
        theme: 'grid',
        headStyles: { fillColor: '#ef4444' }
      });
    }
    doc.save(c.clientName + "_receipt.pdf");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/clients/add', formData);
      window.location.reload();
    } catch (err) {
      alert("Error adding client: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCollect = async (id) => {
    if (!id || id === 'undefined') { alert("Client ID not found!"); return; }
    const amount = prompt("Enter collected amount:");
    if (!amount) return;
    try {
      await API.put('/clients/collect/' + id, { amountReceived: amount });
      window.location.reload();
    } catch (err) {
      alert("Collection error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddPenalty = async (id) => {
    if (!id || id === 'undefined') { alert("Invalid Client ID."); return; }
    const amount = prompt("Enter penalty amount (₹):");
    if (!amount) return;
    const reason = prompt("Enter reason for penalty:", "Late Installment");
    if (reason === null) return; 
    try {
      await API.put('/clients/add-penalty/' + id, { amount, reason });
      window.location.reload();
    } catch (err) {
      alert("Penalty error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!id || id === 'undefined') { alert("Invalid ID."); return; }
    if (window.confirm("Are you sure you want to delete this client account?")) {
      try {
        await API.delete('/clients/delete/' + id);
        window.location.reload();
      } catch (err) {
        alert("Delete error: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('token'); 
        navigate('/login'); 
    }
  };

  return (
   <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>{companyName ||'Loading...'}</h2>
          <button 
            onClick={handleEditCompanyName}
            style={{ marginLeft: '15px', background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            ✏️ Edit Name
          </button>
        </div>
        
        <button 
          onClick={handleLogout}
          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
        >
          Logout 🚪
        </button>
      </div>
      
      <div style={styles.statsWrapper}>
        <div style={{...styles.statsCard, borderLeft: '5px solid #3b82f6'}}>
          <p style={styles.statsTitle}>Total Outflow (Investment)</p>
          <h3 style={styles.statsNumber}>₹{stats.totalOutflow}</h3>
        </div>
        <div style={{...styles.statsCard, borderLeft: '5px solid #10b981'}}>
          <p style={styles.statsTitle}>Total Inflow (Recovery)</p>
          <h3 style={styles.statsNumber}>₹{stats.totalInflow}</h3>
        </div>
        <div style={{...styles.statsCard, borderLeft: '5px solid #f59e0b'}}>
          <p style={styles.statsTitle}>Net Profit (Interest)</p>
          <h3 style={styles.statsNumber}>₹{stats.netProfit}</h3>
        </div>
        <div style={{...styles.statsCard, borderLeft: '5px solid #ef4444'}}>
          <p style={styles.statsTitle}>Total Outstanding (Pending)</p>
          <h3 style={styles.statsNumber}>₹{stats.totalPending}</h3>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input type="text" placeholder="Search by name..." onChange={handleSearchChange} style={{...styles.input, width: '280px', margin: 0}} />
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Active', 'Cleared', 'Late'].map((filter) => (
            <button 
              key={filter}
              onClick={() => handleFilterChange(filter)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                backgroundColor: currentFilter === filter ? '#3b82f6' : '#334155',
                color: '#fff',
                transition: 'all 0.2s ease'
              }}
            >
              {filter} Accounts
            </button>
          ))}
        </div>
      </div>
      
      <div style={styles.contentWrapper}>
        <div style={styles.formCard}>
          <h4 style={{margin: '0 0 10px 0', color: '#60a5fa'}}>Open New Account</h4>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Client Name" onChange={(e) => setFormData({...formData, clientName: e.target.value})} style={styles.input} required />
            <select onChange={(e) => setFormData({...formData, loanType: e.target.value})} style={styles.select}>
              <option value="Daily">Daily Recovery</option>
              <option value="Fixed">Fixed Date</option>
            </select>
            <input type="number" placeholder="Loan Amount (₹)" onChange={(e) => setFormData({...formData, totalLoanAmount: e.target.value})} style={styles.input} required />
            <input type="number" placeholder="Return Amount (₹)" onChange={(e) => setFormData({...formData, totalReturnAmount: e.target.value})} style={styles.input} required />
            <input type="number" placeholder="Daily Installment" onChange={(e) => setFormData({...formData, dailyInstallment: e.target.value})} style={styles.input} />
            <input type="number" placeholder="Total Days" onChange={(e) => setFormData({...formData, totalDays: e.target.value})} style={styles.input} />
            <button type="submit" style={styles.submitBtn}>Start Account</button>
          </form>
        </div>

        <div style={styles.tableCard}>
          <div className="mobile-cards-view" style={styles.mobileCardsView}>
            {currentItems.length > 0 ? currentItems.map((c) => (
              <div key={c._id || c.id} style={styles.mobileCard}>
                <div style={styles.cardHeader}>
                  <strong style={{fontSize: '18px'}}>{c.clientName}</strong>
                  <button onClick={() => setSelectedClientHistory(c)} style={styles.histBtn}>History</button>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardRow}><span>Loan Amount:</span> <strong>₹{c.totalLoanAmount}</strong></div>
                  <div style={styles.cardRow}><span>Return Amount:</span> <strong>₹{c.totalReturnAmount || c.totalLoanAmount}</strong></div>
                  <div style={styles.cardRow}><span>Collected:</span> <strong style={{color: '#3b82f6'}}>₹{c.collectedAmount || 0}</strong></div>
                  <div style={styles.cardRow}><span>Outstanding:</span> <strong style={{color: '#10b981'}}>₹{c.pendingBalance ?? ((c.totalReturnAmount || c.totalLoanAmount) - (c.collectedAmount || 0))}</strong></div>
                  <div style={styles.cardRow}><span>Days Left:</span> <strong style={{color: c.pendingDays <= 0 ? '#ef4444' : '#fff'}}>{c.pendingDays ?? '-'}</strong></div>
                  <div style={styles.cardRow}><span>Penalty:</span> <strong style={{color: '#f59e0b'}}>₹{c.penalty || 0}</strong></div>
                </div>
                <div style={styles.cardActions}>
                  <button onClick={() => handleCollect(c._id || c.id)} style={{...styles.payBtn, flex: 1}}>Collect</button>
                  <button onClick={() => downloadPDF(c)} style={styles.pdfBtn}>PDF</button>
                  <button onClick={() => handleAddPenalty(c._id || c.id)} style={styles.penaltyBtn}>Penalty</button>
                  <button onClick={() => handleDelete(c._id || c.id)} style={styles.delBtn}>Delete</button>
                </div>
              </div>
            )) : <p style={{color: '#94a3b8', textAlign: 'center'}}>No accounts found.</p>}
          </div>

          <table className="desktop-table-view" style={styles.desktopTable}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Loan Amount</th>
                <th style={styles.th}>Return Amount</th>
                <th style={styles.th}>Collected</th>
                <th style={styles.th}>Outstanding</th>
                <th style={styles.th}>Days Left</th>
                <th style={styles.th}>Penalty</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map((c) => (
                <tr key={c._id || c.id}>
                  <td style={styles.td}>
                    {c.clientName} 
                    <button onClick={() => setSelectedClientHistory(c)} style={styles.histBtn}>History</button>
                  </td>
                  <td style={styles.td}>₹{c.totalLoanAmount}</td>
                  <td style={styles.td}>₹{c.totalReturnAmount || c.totalLoanAmount}</td>
                  <td style={styles.td}>₹{c.collectedAmount || 0}</td>
                  <td style={{...styles.td, color: '#10b981'}}>₹{c.pendingBalance ?? ((c.totalReturnAmount || c.totalLoanAmount) - (c.collectedAmount || 0))}</td>
                  <td style={{...styles.td, color: c.pendingDays <= 0 ? '#ef4444' : '#fff'}}>{c.pendingDays ?? '-'}</td>
                  <td style={{...styles.td, color: '#f59e0b'}}>₹{c.penalty || 0}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleCollect(c._id || c.id)} style={styles.payBtn}>Collect</button>
                    <button onClick={() => downloadPDF(c)} style={styles.pdfBtn}>PDF</button>
                    <button onClick={() => handleAddPenalty(c._id || c.id)} style={styles.penaltyBtn}>Penalty</button>
                    <button onClick={() => handleDelete(c._id || c.id)} style={styles.delBtn}>Delete</button>
                  </td>
                </tr>
              )) : <tr><td colSpan="8" style={{color: '#94a3b8', textAlign: 'center', padding: '20px'}}>No accounts found.</td></tr>}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: currentPage === 1 ? '#475569' : '#3b82f6',
                  color: '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Previous
              </button>
              
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: currentPage === totalPages ? '#475569' : '#3b82f6',
                  color: '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {userRole === 'admin' && (
        <div style={{ marginTop: '40px', background: '#1e293b', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>Super Admin Control Panel</h3>
          {adminLoading ? (
            <p style={{ color: '#94a3b8' }}>Loading requests...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Name</th>
                    <th style={{ padding: '12px' }}>Email</th>
                    <th style={{ padding: '12px' }}>Role</th>
                    <th style={{ padding: '12px' }}>Approval Status</th>
                    <th style={{ padding: '12px' }}>Payment Status</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.length > 0 ? allUsers.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px' }}>{u.name}</td>
                      <td style={{ padding: '12px' }}>{u.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#334155', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px', color: u.isApproved ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                        {u.isApproved ? 'Approved' : 'Pending'}
                      </td>
                      <td style={{ padding: '12px', color: u.paymentStatus === 'Paid' ? '#10b981' : '#f87171', fontWeight: 'bold' }}>
                        {u.paymentStatus}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {!u.isApproved ? (
                          <button 
                            onClick={() => handleApproveAndPay(u._id)}
                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}
                          >
                            Approve
                          </button>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: 'bold', marginRight: '10px' }}>Approved ✅</span>
                        )}
                        <button 
                          onClick={() => handleBlockUser(u._id)}
                          style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Block
                        </button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="6" style={{ padding: '12px', color: '#94a3b8', textAlign: 'center' }}>No pending approval notifications.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedClientHistory && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Payment History for {selectedClientHistory.clientName}</h3>
            <hr style={{borderColor: '#334155'}}/>
            <div style={{maxHeight: '200px', overflowY: 'auto', margin: '15px 0'}}>
              {selectedClientHistory.history && selectedClientHistory.history.length > 0 ? (
                <ul style={{listStyleType: 'none', padding: 0}}>
                  {selectedClientHistory.history.map((h, index) => (
                    <li key={index} style={styles.historyItem}>
                      <span>{new Date(h.date).toLocaleString('en-US')}</span>
                      <strong style={{color: '#10b981'}}> ₹{h.amount}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{color: '#94a3b8'}}>No payments collected yet.</p>
              )}
            </div>
            <button onClick={() => setSelectedClientHistory(null)} style={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '20px', fontFamily: 'sans-serif' },
  statsWrapper: { display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' },
  statsCard: { background: '#1e293b', padding: '15px 20px', borderRadius: '8px', minWidth: '200px', flex: '1 1 200px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  statsTitle: { color: '#94a3b8', fontSize: '14px', margin: '0 0 5px 0' },
  statsNumber: { fontSize: '24px', margin : 0, fontWeight: 'bold' },
  contentWrapper: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  formCard: { background: '#1e293b', padding: '20px', borderRadius: '10px', width: '100%', maxWidth: '300px', flex: '1 1 300px', height: 'fit-content' },
  input: { width: '100%', padding: '10px', margin: '5px 0', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', margin: '5px 0', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '10px', margin: '10px 0 0 0', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', boxSizing: 'border-box' },
  tableCard: { background: '#1e293b', padding: '20px', borderRadius: '10px', flex: '1 1 600px' },
  mobileCardsView: { flexDirection: 'column', gap: '15px' },
  mobileCard: { background: '#334155', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #475569', paddingBottom: '8px' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  cardRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#cbd5e1' },
  cardActions: { display: 'flex', gap: '8px' },
  desktopTable: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 15px' },
  td: { padding: '15px', background: '#334155', borderRadius: '5px' },
  th: { padding: '15px', textAlign: 'left', color: '#94a3b8' }, 
  payBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', marginRight: '5px', cursor: 'pointer', borderRadius: '4px' },
  pdfBtn: { background: '#8b5cf6', color: '#fff', border: 'none', padding: '5px 10px', marginRight: '5px', cursor: 'pointer', borderRadius: '4px' },
  penaltyBtn: { background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 10px', marginRight: '5px', cursor: 'pointer', borderRadius: '4px' },
  delBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' },
  histBtn: { background: 'transparent', color: '#94a3b8', border: '1px solid #475569', padding: '2px 6px', fontSize: '11px', marginLeft: '8px', cursor: 'pointer', borderRadius: '4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '10px' },
  modalContent: { background: '#1e293b', padding: '25px', borderRadius: '10px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', color: '#fff', boxSizing: 'border-box' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#334155', marginBottom: '5px', borderRadius: '4px', fontSize: '13px' },
  closeBtn: { background: '#64748b', color: '#fff', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px', width: '100%', fontWeight: 'bold', marginTop: '10px' }
};

export default Dashboard;