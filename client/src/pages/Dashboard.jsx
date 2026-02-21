import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { LayoutDashboard, BarChart2, CreditCard, Briefcase, User, Settings, LogOut, Download, Send, MessageSquare, X, Loader2 } from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([{ sender: 'kodbanker', text: 'Hi! I am Kodbanker. How can I assist you with your finances today?' }]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/chat', { message: userMsg }, { withCredentials: true });
            let botResponse = res.data.response;
            if (botResponse.startsWith(userMsg)) {
                botResponse = botResponse.replace(userMsg, '').trim();
            }
            setChatMessages(prev => [...prev, { sender: 'kodbanker', text: botResponse }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { sender: 'kodbanker', text: 'Sorry, I am having trouble connecting.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    useEffect(() => {
        const storedName = localStorage.getItem('username');
        if (!storedName) {
            navigate('/login');
        } else {
            setUsername(storedName);
        }
    }, [navigate]);

    const handleCheckBalance = async () => {
        try {
            setError('');
            const res = await axios.get('http://localhost:5000/api/balance', {
                withCredentials: true // send cookie containing JWT
            });
            setBalance(res.data.balance);

            // Wonderful background animation (party popper)
            triggerConfetti();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to fetch balance');
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login'); // Redirect to login if token invalid/expired
            }
        }
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ff5e00', '#ff3366', '#ffffff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ff5e00', '#ff3366', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/api/logout', {}, { withCredentials: true });
            localStorage.removeItem('username');
            navigate('/login');
        } catch (err) {
            console.error(err);
            navigate('/login');
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="logo-container">
                    <div className="logo-dot"></div>
                    <div className="logo-text">Kodbank</div>
                </div>

                <div className="nav-links">
                    <div className="nav-item active"><LayoutDashboard size={20} /> Dashboard</div>
                    <div className="nav-item"><BarChart2 size={20} /> Analytics</div>
                    <div className="nav-item"><CreditCard size={20} /> Cards</div>
                    <div className="nav-item"><Briefcase size={20} /> Assets</div>
                    <div className="nav-item"><User size={20} /> Profile</div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <div
                        className="nav-item chat-btn-sidebar"
                        onClick={() => setIsChatOpen(!isChatOpen)}
                    >
                        <MessageSquare size={20} /> Chat with Kodbanker
                    </div>
                    <div className="nav-item"><Settings size={20} /> Settings</div>
                    <div className="nav-item" onClick={handleLogout}><LogOut size={20} /> Logout</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="top-header">
                    <div className="greeting">
                        <h1>Welcome back, {username}</h1>
                        <p>Here's what's happening with your finances today.</p>
                    </div>
                    <div className="header-actions">
                        <button className="outline-btn" onClick={handleCheckBalance}>Check Balance</button>
                        <button className="primary-btn" style={{ margin: 0, width: 'auto', padding: '10px 20px' }}>Send Money</button>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                {balance !== null && (
                    <div className="balance-result">
                        Your balance is ${balance.toLocaleString()}
                    </div>
                )}

                {/* Dummy Stats Grid for visual styling */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: '#ffb142' }}>$</div>
                        <div className="stat-title">Total Balance</div>
                        <div className="stat-value">$45,231.89</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: '#ff5252' }}>↗</div>
                        <div className="stat-title">Monthly Income</div>
                        <div className="stat-value">$8,432.50</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: '#34ace0' }}>~</div>
                        <div className="stat-title">Monthly Expenses</div>
                        <div className="stat-value">$3,120.45</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ color: '#ffb142' }}><CreditCard size={20} /></div>
                        <div className="stat-title">Total Savings</div>
                        <div className="stat-value">$12,450</div>
                    </div>
                </div>

                {/* Lower dummy section */}
                <div className="dashboard-lower">
                    <div className="panel">
                        <h3>Spending Analytics</h3>
                        {/* Visual placeholder for graph */}
                        <div style={{
                            width: '100%', height: '200px',
                            background: 'linear-gradient(to top, rgba(255,100,50,0.2) 0%, transparent 100%)',
                            borderBottom: '2px solid #ff5e00',
                            borderRadius: '8px',
                            position: 'relative'
                        }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, display: 'block' }}>
                                <path d="M0 50 Q 25 20, 50 35 T 100 10 L 100 50 Z" fill="rgba(255, 94, 0, 0.2)" />
                                <path d="M0 50 Q 25 20, 50 35 T 100 10" fill="none" stroke="#ff5e00" strokeWidth="1" />
                            </svg>
                        </div>
                    </div>

                    <div className="panel">
                        <h3>Recent Transactions</h3>
                        <div className="transaction-item">
                            <div className="tx-info">
                                <div className="tx-icon"><LayoutDashboard size={16} /></div>
                                <div className="tx-details">
                                    <h4>Apple Store</h4>
                                    <p>Technology • Feb 20, 2026</p>
                                </div>
                            </div>
                            <div className="tx-amount tx-negative">
                                <h4>-$999.00</h4>
                                <p>Completed</p>
                            </div>
                        </div>

                        <div className="transaction-item">
                            <div className="tx-info">
                                <div className="tx-icon"><LayoutDashboard size={16} /></div>
                                <div className="tx-details">
                                    <h4>Starbucks</h4>
                                    <p>Food & Drink • Feb 19, 2026</p>
                                </div>
                            </div>
                            <div className="tx-amount tx-negative">
                                <h4>-$15.50</h4>
                                <p>Completed</p>
                            </div>
                        </div>

                        <div className="transaction-item">
                            <div className="tx-info">
                                <div className="tx-icon" style={{ color: '#2ecc71', background: 'rgba(46,204,113,0.1)' }}>↓</div>
                                <div className="tx-details">
                                    <h4>Salary Deposit</h4>
                                    <p>Income • Feb 18, 2026</p>
                                </div>
                            </div>
                            <div className="tx-amount tx-positive">
                                <h4>+$5000.00</h4>
                                <p>Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Chatbot Window */}
            {isChatOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <div className="chat-title">
                            <div className="chat-avatar">K</div>
                            <div>
                                <h4>Kodbanker</h4>
                                <span>Online</span>
                            </div>
                        </div>
                        <button className="chat-close" onClick={() => setIsChatOpen(false)}><X size={20} /></button>
                    </div>

                    <div className="chat-messages">
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="chat-bubble bot loading">
                                <Loader2 className="spinner" size={16} /> Typing...
                            </div>
                        )}
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button type="submit" disabled={isChatLoading || !chatInput.trim()}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
