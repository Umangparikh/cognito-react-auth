import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Auth } from "aws-amplify";
import awsExports from "../aws-exports";
Auth.configure(awsExports);


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please enter both email and password");
      return;
    }

    try {
      console.log("Attempting login with:", { email, passwordLength: password.length });
      
      // Try login with email as username (since Cognito is configured for EMAIL username)
      const user = await Auth.signIn(email, password);
      
      console.log("Login successful:", user);
      
      // Get the session and token
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      localStorage.setItem("token", token);
      
      console.log("Token saved to localStorage:", token.substring(0, 20) + "...");
      
      setMessage("Login successful!");
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);
      
      // Provide more specific error messages
      if (err.code === 'UserNotFoundException') {
        setMessage("User not found. Please check your email or sign up first.");
      } else if (err.code === 'NotAuthorizedException') {
        setMessage("Incorrect password. Please try again.");
      } else if (err.code === 'UserNotConfirmedException') {
        setMessage("Please verify your email before logging in. Check your inbox for a verification code.");
      } else {
        setMessage(`Login failed: ${err.message}`);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("Please enter your email address first");
      return;
    }
    
    try {
      await Auth.forgotPassword(email);
      setMessage("Password reset code sent to your email. Please check your inbox and enter the code below.");
      setIsForgotPassword(true);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleConfirmPasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match");
      return;
    }
  
    if (!verificationCode || !newPassword || !confirmPassword) {
      setMessage("Please enter both verification code and new password");
      return;
    }
  
    try {
      await Auth.forgotPasswordSubmit(email, verificationCode, newPassword);
      setMessage("Password reset successful! You can now login with your new password.");
      setIsForgotPassword(false);
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage("Password reset failed: " + err.message);
    }
  };

  return (
    <div className="auth-box">
      <h2>Login</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      
      {!isForgotPassword ? (
        <>
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Login</button>
          <button 
            onClick={handleForgotPassword} 
            style={{ 
              marginTop: '10px', 
              backgroundColor: '#6c757d', 
              border: 'none', 
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Forgot Password?
          </button>
        </>
      ) : (
        <>
          <h3>Reset Password</h3>
          <input 
            type="text" 
            placeholder="Verification Code" 
            onChange={(e) => setVerificationCode(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="New Password" 
            onChange={(e) => setNewPassword(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            onChange={(e) => setConfirmPassword(e.target.value)} 
          />
          <button onClick={handleConfirmPasswordReset}>Reset Password</button>
          <button 
            onClick={() => setIsForgotPassword(false)}
            style={{ 
              marginTop: '10px', 
              backgroundColor: '#dc3545', 
              border: 'none', 
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </>
      )}
      
      <p style={{ color: message.includes('Error') || message.includes('failed') ? 'red' : 'green' }}>
        {message}
      </p>
      
      <p style={{ marginTop: '20px' }}>
        Don't have an account? <Link to="/signup" style={{ color: '#667eea', textDecoration: 'none' }}>Sign up</Link>
      </p>
    </div>
  );
}

export default Login;
