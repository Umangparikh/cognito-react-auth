import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Auth } from "aws-amplify";
import awsExports from "../aws-exports";
Auth.configure(awsExports);

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState(1);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!email || !password || !name || !gender || !city) {
      setMessage("Please fill in all required fields");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long");
      return;
    }

    try {
      console.log("Attempting signup with:", { email, name, gender, city });
      
      const result = await Auth.signUp({ 
        username: email, 
        password, 
        attributes: { 
          email: email,
          name: name
        } 
      });
      
      console.log("Signup result:", result);
      setStage(2);
      setMessage("Signup successful! Check your email for the verification code.");
    } catch (err) {
      console.error("Signup error:", err);
      
      if (err.code === 'UsernameExistsException') {
        setMessage("An account with this email already exists. Please try logging in instead.");
      } else if (err.code === 'InvalidPasswordException') {
        setMessage("Password does not meet requirements. Must be at least 8 characters.");
      } else if (err.code === 'InvalidParameterException') {
        setMessage("Invalid email format. Please enter a valid email address.");
      } else {
        setMessage(`Signup failed: ${err.message}`);
      }
    }
  };

  const handleConfirm = async () => {
    try {
      await Auth.confirmSignUp(email, code);
      
      // After successful Cognito confirmation, create profile in MongoDB
      try {
        const session = await Auth.currentSession();
        const token = session.getIdToken().getJwtToken();
        localStorage.setItem("token", token);
        
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name,
            gender,
            city
          })
        });
        
        if (response.ok) {
          setMessage("Email verified and profile created! You can now log in.");
        } else {
          setMessage("Email verified! You can now log in. (Profile creation failed - you can update it later)");
        }
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
        setMessage("Email verified! You can now log in. (Profile creation failed - you can update it later)");
      }
      
      setStage(1);
      // Navigate to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="auth-box">
      <h2>Sign Up</h2>
      {stage === 1 ? (
        <>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder="Full Name *" 
            value={name}
            onChange={(e) => setName(e.target.value)} 
          />
          <select 
            value={gender}
            onChange={(e) => setGender(e.target.value)} 
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Select Gender *</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
          <input 
            type="text" 
            placeholder="City *" 
            value={city}
            onChange={(e) => setCity(e.target.value)} 
          />
          <button onClick={handleSignup}>Sign Up</button>
        </>
      ) : (
        <>
          <h3>Verify Your Email</h3>
          <p>We've sent a verification code to your email address.</p>
          <input 
            placeholder="Verification Code" 
            value={code}
            onChange={(e) => setCode(e.target.value)} 
          />
          <button onClick={handleConfirm}>Confirm Signup</button>
          <button 
            onClick={() => setStage(1)}
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
            Back to Signup
          </button>
        </>
      )}
      
      <p style={{ color: message.includes('Error') || message.includes('failed') ? 'red' : 'green' }}>
        {message}
      </p>
      
      <p style={{ marginTop: '20px' }}>
        Already have an account? <Link to="/login" style={{ color: '#667eea', textDecoration: 'none' }}>Log in</Link>
      </p>
    </div>
  );
}

export default Signup;
