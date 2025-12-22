# RentRedi - Tenant & Landlord Management Platform

A full-stack web application for managing tenants and landlords with real-time geolocation tracking and Firebase integration.

## Overview

This project is an SRE assessment demonstrating:
- **Full-stack development** with React frontend and Node.js backend
- **Firebase Realtime Database** for data persistence
- **Firebase Authentication** with Google Sign-In
- **OpenWeather API integration** for automatic geolocation data
- **Real-time updates** with Firebase listeners
- **Professional UI/UX** with modern design patterns
- **SRE principles** including error handling, retries, and observability

## Features

### Frontend (React)
- **Authentication**: Google Sign-In with Firebase Auth
- **Dashboard**: Real-time statistics and recent users overview
- **User Management**: Full CRUD operations (Create, Read, Update, Delete)
- **Search**: Filter users by name or ZIP code
- **Responsive Design**: Mobile-friendly interface
- **Client-side validation**: Using Zod schemas

### Backend (Node.js + Express)
- **RESTful API**: CRUD endpoints for user management
- **Firebase Realtime Database**: NoSQL data storage
- **OpenWeather API Integration**: Automatic geolocation lookup
- **Error Handling**: Comprehensive error messages and validation
- **Retry Logic**: Resilient API calls with exponential backoff
- **CORS Support**: Cross-origin requests enabled

## Tech Stack

### Frontend
- React 19
- React Router DOM (navigation)
- Firebase SDK (auth & database)
- Zod (validation)
- CSS3 (styling)

### Backend
- Node.js
- Express.js
- Firebase Admin SDK
- Axios with retry logic
- Zod (validation)

## Project Structure

```
rent-redi-homework/
├── backend/
│   ├── server.js                 # Main Express server
│   ├── services/
│   │   ├── weatherService.js     # OpenWeather API integration
│   │   └── weatherCircuitBreaker.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js          # Authentication UI
│   │   │   ├── Dashboard.js      # Statistics dashboard
│   │   │   └── UserManagement.js # CRUD interface
│   │   ├── hooks/
│   │   │   ├── useAuth.js        # Authentication hook
│   │   │   └── useUsers.js       # Users data hook
│   │   ├── repositories/
│   │   │   └── UserRepository.js # Data access layer
│   │   ├── shared/
│   │   │   └── schemas.js        # Validation schemas
│   │   ├── App.js                # Main app with routing
│   │   └── firebaseConfig.js     # Firebase configuration
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 14+ and npm
- Firebase project with Realtime Database
- OpenWeather API key (already included: `7afa46f2e91768e7eeeb9001ce40de19`)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. The Firebase database URL is already configured in `server.js`

4. Start the backend server:
```bash
node server.js
```

The backend will run on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update Firebase configuration in `src/firebaseConfig.js` with your Firebase project credentials

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Backend API (http://localhost:8080)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create new user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Request/Response Examples

**Create User:**
```bash
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "zip": "10001"
}

Response:
{
  "id": "unique-id",
  "name": "John Doe",
  "zip": "10001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timezone": -18000,
  "locationName": "New York",
  "createdAt": 1234567890
}
```

## User Data Model

Each user has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (auto-generated) |
| name | string | User's full name (min 2 chars) |
| zip | string | 5-digit US ZIP code |
| latitude | number | Geographic latitude (from OpenWeather) |
| longitude | number | Geographic longitude (from OpenWeather) |
| timezone | number | UTC offset in seconds |
| locationName | string | City/location name |
| createdAt | timestamp | Creation timestamp |

## Features Highlights

### SRE Principles Implemented

1. **Resilience**: Automatic retry logic with exponential backoff for API calls
2. **Error Handling**: Comprehensive error messages for debugging
3. **Validation**: Input validation at both client and server
4. **Observability**: Structured logging for monitoring
5. **Defense in Depth**: Multiple layers of validation and security

### UI/UX Features

- **Modern Design**: Gradient backgrounds, smooth animations, and professional styling
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Automatic UI refresh when data changes
- **User Feedback**: Loading states, error messages, and confirmation dialogs
- **Search & Filter**: Easy user lookup by name or ZIP code

## Firebase Configuration

The project uses Firebase for:
- **Authentication**: Google Sign-In provider
- **Realtime Database**: User data storage with real-time listeners

To configure your own Firebase project:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Google Authentication
3. Enable Realtime Database
4. Update `frontend/src/firebaseConfig.js` with your project credentials
5. The backend uses the public database URL (no service account needed for demo)

## Environment Variables (Optional)

You can optionally use environment variables:

**Backend (.env):**
```env
OPENWEATHER_API_KEY=7afa46f2e91768e7eeeb9001ce40de19
PORT=8080
```

**Frontend (.env):**
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-domain
REACT_APP_FIREBASE_DATABASE_URL=your-db-url
```

## Testing the Application

1. Start both backend and frontend servers
2. Navigate to `http://localhost:3000`
3. Click "Continue with Google" to authenticate
4. Explore the Dashboard to see statistics
5. Navigate to "Users" to manage user records:
   - Click "Add User" to create new users
   - Click edit icon to modify user details
   - Click delete icon to remove users
   - Use search bar to filter users

## Key Implementation Details

### OpenWeather API Integration
When creating or updating a user with a ZIP code, the backend:
1. Validates the ZIP code format (5 digits)
2. Calls OpenWeather API to fetch geolocation data
3. Stores latitude, longitude, timezone, and location name
4. Handles errors gracefully (invalid ZIP, API limits, network issues)

### Real-time Data Sync
The frontend uses Firebase listeners to automatically update the UI when:
- New users are created
- Users are updated
- Users are deleted

This provides a seamless real-time experience without manual page refreshes.

### Form Validation
Client and server both validate:
- Name: Minimum 2 characters
- ZIP code: Exactly 5 digits

Validation errors are displayed inline in the UI.

## Future Enhancements

Potential improvements for production:
- [ ] Unit tests (Jest, React Testing Library)
- [ ] Integration tests for API endpoints
- [ ] Role-based access control (landlord vs tenant)
- [ ] Pagination for large user lists
- [ ] Advanced search and filtering
- [ ] User profile management
- [ ] Property management features
- [ ] Lease tracking
- [ ] Payment processing
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Export data to CSV/PDF

## Credits

**Developer**: Javier Prieto
**Purpose**: RentRedi SRE Assessment
**API**: OpenWeather API for geolocation data
**Database**: Firebase Realtime Database
**Framework**: React + Node.js + Express

## License

ISC

---

**Note**: This project demonstrates full-stack development skills, SRE principles, and modern web development practices for the RentRedi technical assessment.
