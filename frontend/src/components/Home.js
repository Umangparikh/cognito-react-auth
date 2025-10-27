import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Auth } from "aws-amplify";

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      localStorage.setItem("token", token);
      
      const userInfo = await Auth.currentUserInfo();
      setUser(userInfo);
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      localStorage.removeItem("token");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="auth-box">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      <nav className="navigation">
        <div className="nav-container">
          <h2 style={{ color: '#667eea', margin: 0 }}>Cognito React Auth</h2>
          <div className="nav-links">
            <Link to="/home">Home</Link>
            <Link to="/profile">Profile</Link>
            <button 
              onClick={handleLogout}
              style={{ 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="profile-container">
        <div className="profile-header">
          <h1>Welcome to Your Dashboard!</h1>
          <p>You're successfully authenticated with AWS Cognito</p>
        </div>

        <div className="auth-box">
          <h2>User Information</h2>
          {user && (
            <div style={{ textAlign: 'left' }}>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.attributes?.email}</p>
              <p><strong>Email Verified:</strong> {user.attributes?.email_verified ? 'Yes' : 'No'}</p>
            </div>
          )}
          
          <div style={{ marginTop: '30px' }}>
            <button 
              onClick={() => navigate("/profile")}
              style={{ 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '16px',
                marginRight: '10px'
              }}
            >
              View Profile
            </button>
            
          </div>
        </div>

        <div className="auth-box">
          <h2>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <button 
              onClick={() => navigate("/profile")}
              style={{ 
                backgroundColor: '#667eea', 
                color: 'white', 
                border: 'none', 
                padding: '15px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Manage Profile
            </button>
            
            <button 
              onClick={handleLogout}
              style={{ 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                padding: '15px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
