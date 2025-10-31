import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const API_BASE = "http://localhost:5000";

function Dashboard() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const now = new Date();
  const currentMonthName = months[now.getMonth()];

  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [activeView, setActiveView] = useState('monthly');
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    budget: 0,
    balance: 0,
    cumulativeSavings: 0
  });
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [incomeRes, expenseRes, budgetRes] = await Promise.all([
        axios.get(`${API_BASE}/income`, config),
        axios.get(`${API_BASE}/expense`, config),
        axios.get(`${API_BASE}/budget`, config)
      ]);

      const selectedMonthIndex = months.indexOf(selectedMonth);

      // Current month data
      const monthlyIncome = incomeRes.data
        .filter(item => new Date(item.income_date).getMonth() === selectedMonthIndex)
        .reduce((sum, item) => sum + item.amount, 0);

      const monthlyExpense = expenseRes.data
        .filter(item => new Date(item.expense_date).getMonth() === selectedMonthIndex)
        .reduce((sum, item) => sum + item.amount, 0);

      const monthlyBudget = budgetRes.data
        .filter(item => new Date(item.budgetMonth).getMonth() === selectedMonthIndex)
        .reduce((sum, item) => sum + item.budgetAmount, 0);

      const monthlyBalance = monthlyIncome - monthlyExpense;

      // Calculate cumulative savings across all months
      const allIncome = incomeRes.data.reduce((sum, item) => sum + item.amount, 0);
      const allExpense = expenseRes.data.reduce((sum, item) => sum + item.amount, 0);
      const cumulativeSavings = allIncome - allExpense;

      setDashboardData({
        totalIncome: monthlyIncome,
        totalExpense: monthlyExpense,
        budget: monthlyBudget,
        balance: monthlyBalance,
        cumulativeSavings: cumulativeSavings
      });

      setIncomeData(processMonthlyData(incomeRes.data));
      setExpenseData(processMonthlyData(expenseRes.data));
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const processMonthlyData = (data) => {
    const monthlyTotals = {};
    data.forEach(item => {
      const date = new Date(item.income_date || item.expense_date);
      const monthName = months[date.getMonth()];
      monthlyTotals[monthName] = (monthlyTotals[monthName] || 0) + item.amount;
    });

    return months.map(month => ({
      month: month.substring(0, 3),
      amount: monthlyTotals[month] || 0
    }));
  };

  const monthlyChartData = [
    {
      name: selectedMonth,
      Income: dashboardData.totalIncome,
      Expense: dashboardData.totalExpense,
      Savings: dashboardData.balance
    }
  ];

  const yearlyChartData = months.map((month, index) => {
    const monthIncome = incomeData[index]?.amount || 0;
    const monthExpense = expenseData[index]?.amount || 0;
    return {
      month: month.substring(0, 3),
      Savings: monthIncome - monthExpense
    };
  });

  const renderChart = () => {
    switch(activeView) {
      case 'monthly':
        return (
          <div className="chart-section">
            <h3>Monthly Overview - {selectedMonth}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Income" fill="#4ade80" />
                <Bar dataKey="Expense" fill="#f87171" />
                <Bar dataKey="Savings" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'income':
        return (
          <div className="chart-section">
            <h3>Income Overview (Yearly)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Income (₹)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#4ade80" strokeWidth={3} dot={{ fill: '#4ade80', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      case 'expense':
        return (
          <div className="chart-section">
            <h3>Expense Overview (Yearly)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Expense (₹)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#f87171" strokeWidth={3} dot={{ fill: '#f87171', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      case 'yearly':
        return (
          <div className="chart-section">
            <h3>Yearly Savings Overview</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Savings (₹)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Savings" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="new-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="month-selector">
          <label>Month: </label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income-card">
          <h4>Total Income</h4>
          <p className="amount">₹{dashboardData.totalIncome.toFixed(2)}</p>
          <small>for {selectedMonth}</small>
        </div>
        <div className="summary-card expense-card">
          <h4>Total Expense</h4>
          <p className="amount">₹{dashboardData.totalExpense.toFixed(2)}</p>
          <small>for {selectedMonth}</small>
        </div>
        <div className="summary-card budget-card">
          <h4>Budget</h4>
          <p className="amount">₹{dashboardData.budget.toFixed(2)}</p>
          <small>for {selectedMonth}</small>
          
          {/* Budget Status Indicator */}
          {dashboardData.budget > 0 && (
            <div className="budget-status">
              {dashboardData.totalExpense > dashboardData.budget ? (
                <div className="status-warning">
                  <span className="status-icon">⚠️</span>
                  <span className="status-text">Over Budget!</span>
                </div>
              ) : (
                <div className="status-success">
                  <span className="status-icon">✅</span>
                  <span className="status-text">Under Budget</span>
                </div>
              )}
              
              {/* Progress Bar */}
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar ${
                    dashboardData.totalExpense > dashboardData.budget 
                      ? 'over-budget' 
                      : 'under-budget'
                  }`}
                  style={{
                    width: `${Math.min((dashboardData.totalExpense / dashboardData.budget) * 100, 100)}%`
                  }}
                >
                  <span className="progress-text">
                    {((dashboardData.totalExpense / dashboardData.budget) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              {/* Remaining Budget */}
              <div className="budget-remaining">
                {dashboardData.totalExpense <= dashboardData.budget ? (
                  <span className="remaining-positive">
                    ₹{(dashboardData.budget - dashboardData.totalExpense).toFixed(2)} remaining
                  </span>
                ) : (
                  <span className="remaining-negative">
                    ₹{(dashboardData.totalExpense - dashboardData.budget).toFixed(2)} over budget
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="summary-card balance-card">
          <h4>Monthly Balance</h4>
          <p className={`amount ${dashboardData.balance >= 0 ? 'positive' : 'negative'}`}>
            ₹{dashboardData.balance.toFixed(2)}
          </p>
          <small>for {selectedMonth}</small>
        </div>
        <div className="summary-card savings-card">
          <h4>Total Savings</h4>
          <p className={`amount ${dashboardData.cumulativeSavings >= 0 ? 'positive' : 'negative'}`}>
            ₹{dashboardData.cumulativeSavings.toFixed(2)}
          </p>
          <small>Cumulative (All Months)</small>
        </div>
      </div>

      {/* Tabs */}
      <div className="view-tabs">
        <button className={activeView === 'monthly' ? 'active' : ''} onClick={() => setActiveView('monthly')}>Monthly Overview</button>
        <button className={activeView === 'income' ? 'active' : ''} onClick={() => setActiveView('income')}>Income Overview</button>
        <button className={activeView === 'expense' ? 'active' : ''} onClick={() => setActiveView('expense')}>Expense Overview</button>
        <button className={activeView === 'yearly' ? 'active' : ''} onClick={() => setActiveView('yearly')}>Yearly Savings</button>
      </div>

      {/* Charts */}
      {renderChart()}
    </div>
  );
}

export default Dashboard;
