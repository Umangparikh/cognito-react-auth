# Cognito Express Auth Backend

A Node.js/Express backend API that integrates AWS Cognito authentication with MongoDB for user profile management.

## Features

- 🔐 AWS Cognito JWT token verification
- 📊 MongoDB integration for user profiles
- 🛡️ Security middleware (Helmet, CORS, Rate Limiting)
- 📝 Comprehensive error handling
- 🔄 CRUD operations for user profiles
- 📱 RESTful API design

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- AWS Cognito User Pool configured

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
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
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/cognito-auth-db
   
   # AWS Cognito Configuration
   COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   COGNITO_CLIENT_ID=4j281pep09ukticm9336kd7k97
   AWS_REGION=us-east-1
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

### Running the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/verify` | Verify JWT token | Yes |
| GET | `/me` | Get current user info | Yes |
| GET | `/health` | Health check | No |

### Profile Routes (`/api/profile`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create user profile | Yes |
| GET | `/` | Get user profile | Yes |
| PUT | `/` | Update user profile | Yes |
| DELETE | `/` | Delete user profile | Yes |
| GET | `/:userId` | Get public profile | No |

## API Usage Examples

### Create User Profile

```bash
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "gender": "male",
    "city": "New York",
    "phone": "+1234567890",
    "bio": "Software developer"
  }'
```

### Get User Profile

```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update User Profile

```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Smith",
    "city": "San Francisco"
  }'
```

## Database Schema

### UserProfile Model

```javascript
{
  cognitoUserId: String (required, unique),
  name: String (required),
  gender: String (enum: ['male', 'female', 'other', 'prefer-not-to-say']),
  city: String (required),
  email: String (required),
  phone: String (optional),
  dateOfBirth: Date (optional),
  bio: String (optional, max 500 chars),
  preferences: {
    theme: String (enum: ['light', 'dark']),
    notifications: {
      email: Boolean,
      push: Boolean
    }
  },
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

- `NO_AUTH_HEADER` - Missing Authorization header
- `NO_TOKEN` - Missing JWT token
- `TOKEN_EXPIRED` - JWT token has expired
- `INVALID_TOKEN` - Invalid JWT token
- `EMAIL_NOT_VERIFIED` - Email not verified
- `PROFILE_NOT_FOUND` - User profile not found
- `MISSING_REQUIRED_FIELDS` - Required fields missing
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Security Features

- **JWT Verification**: All protected routes verify AWS Cognito JWT tokens
- **CORS Protection**: Configured for specific frontend origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers protection
- **Input Validation**: Mongoose schema validation
- **Error Handling**: No sensitive data exposed in errors

## Development

### Project Structure

```
backend/
├── models/
│   └── UserProfile.js      # MongoDB user profile schema
├── routes/
│   ├── auth.js            # Authentication routes
│   └── profile.js         # Profile management routes
├── middleware/
│   └── auth.js            # JWT verification middleware
├── app.js                 # Main Express application
├── package.json           # Dependencies and scripts
├── env.example            # Environment variables template
└── README.md             # This file
```

### Adding New Features

1. **New Routes**: Add route files in the `routes/` directory
2. **New Models**: Add Mongoose models in the `models/` directory
3. **New Middleware**: Add middleware in the `middleware/` directory
4. **Update app.js**: Import and use new routes

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=4j281pep09ukticm9336kd7k97
AWS_REGION=us-east-1
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check `MONGODB_URI` in `.env`
   - Ensure MongoDB is running
   - Verify network connectivity

2. **JWT Verification Failed**
   - Check `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`
   - Ensure token is valid and not expired
   - Verify AWS region configuration

3. **CORS Errors**
   - Check `FRONTEND_URL` in `.env`
   - Ensure frontend URL matches exactly

### Logs

The application logs important events to the console:
- Server startup
- Database connections
- API requests
- Errors and warnings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC
