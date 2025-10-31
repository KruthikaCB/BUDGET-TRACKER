import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Income from './components/Income';
import IncomeDetails from './components/IncomeDetails';
import Expense from './components/Expense';
import ExpenseDetails from './components/ExpenseDetails';
import Budget from './components/Budget';
import BudgetEntry from './components/BudgetEntry';
import logo from './logo.jpeg'; // Add your logo file

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userEmail, setUserEmail] = useState('');
   const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token) {
      setIsAuthenticated(true);
      setUserEmail(email);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (data) => {
  setIsAuthenticated(true);
  setUserEmail(data.email);
  showToast("Login Successful!"); // <-- show toast
};

const handleSignup = (data) => {
  setIsAuthenticated(true);
  setUserEmail(data.email);
  showToast("Signup Successful!"); // <-- show toast
};

// ADD THIS FUNCTION BELOW handleLogin / handleSignup
const showToast = (message) => {
  setToastMessage(message);
  setTimeout(() => setToastMessage(""), 1000); // hide after 1 second
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    setIsAuthenticated(false);
    setUserEmail('');
    setActiveTab('dashboard');
  };

  const renderContent = () => {
  switch (activeTab) {
    case "dashboard":
      return <Dashboard />;
    case "income":
      return <Income />;
    case "income-details":
      return <IncomeDetails />;
    case "expense":
      return <Expense />;
    case "expense-details":
      return <ExpenseDetails />;
    case "budget":
      return <Budget />;
    case "budget-entry":
      return <BudgetEntry />;
    default:
      return <Dashboard />;
  }
};

  if (!isAuthenticated) {
    return showLogin ? (
      <Login 
        onLogin={handleLogin} 
        switchToSignup={() => setShowLogin(false)} 
      />
    ) : (
      <Signup 
        onSignup={handleSignup} 
        switchToLogin={() => setShowLogin(true)} 
      />
    );
  }

  return (
    <div className="App">
       {/* 3️⃣ Toast notification */}
    {toastMessage && (
      <div className="toast">
        {toastMessage}
      </div>
    )}

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-circle">
            <img src={logo} alt="Budget Tracker Logo" className="logo-image" />
          </div>
          <h2>Budget Tracker</h2>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Home
          </div>
          <div 
            className={`nav-item ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            <span className="nav-icon">💵</span>
            Income Entry
          </div>
          <div 
            className={`nav-item ${activeTab === 'income-details' ? 'active' : ''}`}
            onClick={() => setActiveTab('income-details')}
          >
            <span className="nav-icon">📝</span>
            Income Details
          </div>
          <div 
            className={`nav-item ${activeTab === 'expense' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense')}
          >
            <span className="nav-icon">💳</span>
            Expense Entry
          </div>
          <div 
            className={`nav-item ${activeTab === 'expense-details' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense-details')}
          >
            <span className="nav-icon">📋</span>
            Expense Details
          </div>
          <div 
            className={`nav-item ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            <span className="nav-icon">➕</span>
            Budget Entry
          </div>
          <div 
            className={`nav-item ${activeTab === 'budget-entry' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget-entry')}
          >
            <span className="nav-icon">🎯</span>
            Budget Management
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {renderContent()}
      </div>

      {/* Footer */}
      <div className="app-footer">
        <p>© Copyright 2025</p>
      </div>
    </div>
  );
}

export default App;
