import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        uid: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        role: 'customer'
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/register', formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create an Account</h2>
                <p className="subtitle">Join Kodbank to manage your finances elegantly.</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>UID</label>
                        <input type="text" name="uid" className="form-input" required onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" name="username" className="form-input" required onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" className="form-input" required onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input type="text" name="phone" className="form-input" required onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" className="form-input" required onChange={handleChange} />
                    </div>
                    <button type="submit" className="primary-btn">Register</button>
                </form>
                <p className="toggle-link">
                    Already have an account? <Link to="/login"><span>Sign In</span></Link>
                </p>
            </div>
        </div>
    );
}
