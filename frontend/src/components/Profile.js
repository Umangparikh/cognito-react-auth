import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// import FileUpload from "./File";
// import { Auth } from "aws-amplify";
import { Auth, Storage, Amplify } from "aws-amplify";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    gender: '',
    city: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage("");
      setFileUrl("");
    }
  };

  // Upload to S3
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Upload file
      const result = await Storage.put(file.name, file, {
        contentType: file.type, // important for correct MIME type
      });

      // Get file URL
      const url = await Storage.get(result.key, { level: "public" });
      setFileUrl(url);
      setMessage("File uploaded successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };


  const fetchProfile = async () => {
    try {
      // First, try to get a fresh session and token from Cognito
      let token;
      let currentUser;
      
      try {
        const session = await Auth.currentSession();
        token = session.getIdToken().getJwtToken();
        localStorage.setItem("token", token);
        currentUser = await Auth.currentUserInfo();
        console.log("Current user info:", currentUser);
        console.log("Fresh token obtained:", token.substring(0, 20) + "...");
      } catch (authError) {
        console.error("Auth check failed:", authError);
        
        // Try to get token from localStorage as fallback
        token = localStorage.getItem("token");
        if (!token) {
          console.log("No valid session and no token found, redirecting to login");
          setMessage("Session expired. Please log in again.");
          navigate("/login");
          return;
        }
        
        // Try to get user info without session (this might work if token is still valid)
        try {
          currentUser = await Auth.currentUserInfo();
          console.log("Current user info from fallback:", currentUser);
        } catch (userInfoError) {
          console.error("Could not get user info:", userInfoError);
          // Continue with token-only authentication
        }
      }

      console.log("Fetching profile with token:", token.substring(0, 20) + "...");

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Profile response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        console.log("Profile fetched successfully:", data.profile);
      } else if (response.status === 404) {
        // Profile doesn't exist yet, show empty form
        console.log("Profile not found, showing empty form");
        setProfile({
          name: '',
          gender: '',
          city: '',
          email: currentUser?.attributes?.email || '',
          phone: '',
          bio: ''
        });
      } else if (response.status === 401) {
        console.log("Unauthorized - token might be invalid, trying to refresh session");
        try {
          // Try to refresh the session
          const session = await Auth.currentSession();
          const newToken = session.getIdToken().getJwtToken();
          localStorage.setItem("token", newToken);
          
          // Retry the request with the new token
          const retryResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setProfile(data.profile);
            console.log("Profile fetched successfully after token refresh:", data.profile);
            return;
          }
        } catch (refreshError) {
          console.error("Failed to refresh session:", refreshError);
        }
        
        console.log("Token refresh failed, redirecting to login");
        setMessage("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error("Profile fetch error:", errorData);
        setMessage(`Error fetching profile: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setMessage("Error fetching profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const method = profile._id ? 'PUT' : 'POST';
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/profile`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          gender: profile.gender,
          city: profile.city,
          phone: profile.phone,
          bio: profile.bio
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsEditing(false);
        setMessage("Profile saved successfully!");
      } else {
        const errorData = await response.json();
        setMessage("Error saving profile: " + (errorData.error || response.statusText));
      }
    } catch (error) {
      setMessage("Error saving profile: " + error.message);
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    // Only check for required fields - let AWS Cognito handle password policy
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = "Password must contain uppercase, lowercase, and number";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = "New password must be different from current password";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, passwordData.currentPassword, passwordData.newPassword);
      
      setMessage("Password changed successfully!");
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      setShowPasswordReset(false);
      
    } catch (error) {
      console.error("Password change error:", error);
      
      // Handle AWS Cognito specific errors
      if (error.code === 'NotAuthorizedException') {
        setPasswordErrors({ currentPassword: "Current password is incorrect" });
        setMessage("");
      } else if (error.code === 'InvalidPasswordException') {
        // AWS Cognito will provide specific password policy requirements
        setPasswordErrors({ newPassword: error.message || "Password does not meet AWS Cognito requirements" });
        setMessage("");
      } else if (error.code === 'LimitExceededException') {
        setMessage("Too many attempts. Please try again later.");
        setPasswordErrors({});
      } else if (error.code === 'InvalidParameterException') {
        setPasswordErrors({ newPassword: error.message || "Invalid password format" });
        setMessage("");
      } else {
        // Generic error handling
        setMessage(`Error changing password: ${error.message}`);
        setPasswordErrors({});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (error) {
      setMessage("Error logging out: " + error.message);
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
          <h1>User Profile</h1>
          <p>Manage your personal information and preferences</p>
        </div>

        <div className="auth-box">
          <h2>Profile Information</h2>
          <p style={{ 
            color: isEditing ? '#28a745' : '#dc3545', 
            fontSize: '14px', 
            marginBottom: '10px',
            fontWeight: 'bold',
            padding: '5px',
            backgroundColor: isEditing ? '#d4edda' : '#f8d7da',
            border: `1px solid ${isEditing ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px'
          }}>
            {isEditing ? 'EDIT MODE ACTIVE' : 'VIEW MODE'}
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
            <input 
              type="email" 
              value={profile.email} 
              disabled 
              style={{ 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                backgroundColor: '#f5f5f5',
                width: '100%',
                marginBottom: '15px'
              }} 
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name:</label>
            <input 
              type="text" 
              value={profile.name} 
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              disabled={!isEditing}
              style={{ 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                width: '100%',
                marginBottom: '15px'
              }} 
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Gender:</label>
            <select 
              value={profile.gender} 
              onChange={(e) => setProfile({...profile, gender: e.target.value})}
              disabled={!isEditing}
              style={{ 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                width: '100%',
                marginBottom: '15px'
              }}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>City:</label>
            <input 
              type="text" 
              value={profile.city} 
              onChange={(e) => setProfile({...profile, city: e.target.value})}
              disabled={!isEditing}
              style={{ 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                width: '100%',
                marginBottom: '15px'
              }} 
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone:</label>
            <input 
              type="text" 
              value={profile.phone || ''} 
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              disabled={!isEditing}
              placeholder="Optional"
              style={{ 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                width: '100%',
                marginBottom: '15px'
              }} 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bio:</label>
            <textarea 
              value={profile.bio || ''} 
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              disabled={!isEditing}
              placeholder="Tell us about yourself..."
              rows="4"
              style={{ 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                width: '100%',
                marginBottom: '15px',
                resize: 'vertical'
              }} 
            />
          </div>

     <h3>Upload Profile Image</h3>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {message && <p>{message}</p>}
      {fileUrl && (
        <div>
          <p>Uploaded Image:</p>
          <img
            src={fileUrl}
            alt="Profile"
            style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "50%" }}
          />
        </div>
      )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            {!isEditing ? (
              <button 
                  onClick={() => {
                    console.log("Edit Profile button clicked, current isEditing:", isEditing);
                    setIsEditing(true);
                    setMessage("Edit mode activated!");
                    console.log("Setting isEditing to true");
                    // Clear message after 3 seconds
                    setTimeout(() => {
                      setMessage("");
                    }, 3000);
                  }}
                style={{ 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: '3px solid #0056b3', 
                  padding: '15px 30px', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
              EDIT PROFILE
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSave}
                  style={{ 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 20px', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setMessage(""); // Clear the edit mode message
                    fetchProfile(); // Reset to original values
                  }}
                  style={{ 
                    backgroundColor: '#6c757d', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 20px', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          <button 
            onClick={() => navigate("/home")}
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Back to Home
          </button>

          <p style={{ marginTop: '15px', color: message.includes('Error') ? 'red' : 'green' }}>
            {message}
          </p>
        </div>

        {/* Password Reset Section */}
        <div className="auth-box" style={{ marginTop: '20px' }}>
          <h2>Change Password</h2>
          
          {!showPasswordReset ? (
            <div>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Click the button below to change your password
              </p>
              <button 
                onClick={() => setShowPasswordReset(true)}
                style={{ 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Change Password
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Current Password:
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  disabled={loading}
                  style={{
                    padding: '10px',
                    borderRadius: '4px',
                    border: `1px solid ${passwordErrors.currentPassword ? '#dc3545' : '#ccc'}`,
                    width: '100%',
                    fontSize: '14px'
                  }}
                  placeholder="Enter your current password"
                />
                {passwordErrors.currentPassword && (
                  <p style={{ color: '#dc3545', fontSize: '12px', margin: '5px 0 0 0' }}>
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  New Password:
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  disabled={loading}
                  style={{
                    padding: '10px',
                    borderRadius: '4px',
                    border: `1px solid ${passwordErrors.newPassword ? '#dc3545' : '#ccc'}`,
                    width: '100%',
                    fontSize: '14px'
                  }}
                  placeholder="Enter your new password"
                />
                {passwordErrors.newPassword && (
                  <p style={{ color: '#dc3545', fontSize: '12px', margin: '5px 0 0 0' }}>
                    {passwordErrors.newPassword}
                  </p>
                )}
                <p style={{ color: '#666', fontSize: '12px', margin: '5px 0 0 0' }}>
                  Password must meet AWS Cognito requirements (will be validated when you submit)
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Confirm New Password:
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  disabled={loading}
                  style={{
                    padding: '10px',
                    borderRadius: '4px',
                    border: `1px solid ${passwordErrors.confirmPassword ? '#dc3545' : '#ccc'}`,
                    width: '100%',
                    fontSize: '14px'
                  }}
                  placeholder="Confirm your new password"
                />
                {passwordErrors.confirmPassword && (
                  <p style={{ color: '#dc3545', fontSize: '12px', margin: '5px 0 0 0' }}>
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    flex: 1
                  }}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setPasswordData({currentPassword: '', newPassword: '', confirmPassword: ''});
                    setPasswordErrors({});
                  }}
                  disabled={loading}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    flex: 1
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
