# Fullstack React + Node.js Application

## Project Structure

```
projectfinal/
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── App.jsx    # Main React component
│   │   ├── main.jsx   # Entry point
│   │   └── index.css  # Styling
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/           # Express.js API server
│   ├── server.js      # Main server file
│   └── package.json
├── package.json       # Root package.json with workspaces
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

Install all dependencies:
```bash
npm run install:all
```

This will install dependencies for the root, frontend, and backend packages.

### Running the Application

**Option 1: Run both frontend and backend together**
```bash
npm run dev
```

**Option 2: Run frontend only**
```bash
npm run start:frontend
```

**Option 3: Run backend only**
```bash
npm run start:backend
```

## Frontend Details

- **Framework**: React 18
- **Build Tool**: Vite
- **Port**: http://localhost:5173
- **Entry Point**: `frontend/src/main.jsx`

The frontend is configured with a proxy to the backend API on `/api` routes.

## Backend Details

- **Framework**: Express.js
- **Port**: http://localhost:3000
- **Entry Point**: `backend/server.js`

### Available API Endpoints

- `GET /api/hello` - Returns a greeting message
- `GET /api/data` - Returns sample data array
- `POST /api/message` - Accepts a message and echoes it back
- `GET /api/health` - Health check endpoint

## Building for Production

Build the frontend:
```bash
npm run build
```

## Environment Variables

Create a `.env` file in the backend folder if you need any environment-specific configuration:
```
PORT=3000
NODE_ENV=development
```

## Next Steps

1. Install dependencies: `npm run install:all`
2. Start the dev server: `npm run dev`
3. Open http://localhost:5173 in your browser
4. The React app will fetch a message from the backend
5. Customize the components in `frontend/src/` and add more API routes in `backend/server.js`
