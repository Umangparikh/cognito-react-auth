# Cognito React Auth Frontend

A React frontend application with AWS Cognito authentication and MongoDB profile integration.

## Features

- 🔐 AWS Cognito authentication (Login, Signup, Forgot Password)
- 📊 User profile management with MongoDB backend
- 🎨 Modern, responsive UI design
- 🔄 Real-time profile updates
- 🛡️ Secure JWT token handling
- 📱 Mobile-friendly interface

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Backend API running on port 5000
- AWS Cognito User Pool configured

### Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Configure Environment Variables:**
   ```env
   # Backend API URL
   REACT_APP_API_URL=http://localhost:5000
   
   # AWS Cognito Configuration (if needed for frontend)
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_USER_POOL_ID=us-east-1_XXXXXXXXX
   REACT_APP_USER_POOL_WEB_CLIENT_ID=4j281pep09ukticm9336kd7k97
   ```

### Running the Application

**Development mode:**
```bash
npm start
```

The application will start on `http://localhost:3000`

## Application Structure

### Components

- **Login.js** - User authentication with forgot password functionality
- **Signup.js** - User registration with profile fields (name, gender, city)
- **Home.js** - Dashboard after successful login
- **Profile.js** - User profile management and editing
- **App.js** - Main application with routing

### Features

#### Authentication Flow
1. **Signup**: Users register with email, password, name, gender, and city
2. **Email Verification**: AWS Cognito sends verification code
3. **Profile Creation**: After verification, profile is saved to MongoDB
4. **Login**: Users authenticate with email/password
5. **Forgot Password**: Password reset with verification code

#### Profile Management
- View and edit personal information
- Real-time updates to MongoDB
- Secure API calls with JWT tokens
- Responsive form validation

#### Security Features
- JWT token storage and management
- Automatic token refresh
- Secure API communication
- Protected routes

## API Integration

The frontend communicates with the backend API for:

- **Profile Operations**: Create, read, update user profiles
- **Authentication**: Token validation and user info
- **Data Persistence**: All profile data stored in MongoDB

### API Endpoints Used

- `POST /api/profile` - Create user profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/me` - Get current user info

## Styling

The application uses custom CSS with:
- Modern gradient backgrounds
- Responsive design
- Clean form layouts
- Consistent color scheme
- Mobile-friendly interface

## Development

### Project Structure

```
frontend/
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── components/
│   │   ├── Login.js         # Login component
│   │   ├── Signup.js        # Signup component
│   │   ├── Home.js          # Home/Dashboard component
│   │   └── Profile.js       # Profile management component
│   ├── App.js               # Main application component
│   ├── aws-exports.js       # AWS Cognito configuration
│   ├── index.js             # Application entry point
│   └── index.css            # Global styles
├── package.json             # Dependencies and scripts
├── env.example              # Environment variables template
└── README.md               # This file
```

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **New Routes**: Update `App.js` with new routes
3. **Styling**: Modify `src/index.css` or add component-specific styles
4. **API Integration**: Update components to use new backend endpoints

## Deployment

### Environment Variables for Production

```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_USER_POOL_WEB_CLIENT_ID=4j281pep09ukticm9336kd7k97
```

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Check `REACT_APP_API_URL` in `.env`
   - Ensure backend server is running
   - Verify CORS configuration in backend

2. **AWS Cognito Errors**
   - Check `aws-exports.js` configuration
   - Verify User Pool ID and Client ID
   - Ensure User Pool is properly configured

3. **Profile Not Loading**
   - Check JWT token in localStorage
   - Verify backend API endpoints
   - Check browser console for errors

### Debug Mode

Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC
