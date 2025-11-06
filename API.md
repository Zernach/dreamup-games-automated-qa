# API Documentation

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-railway-app.railway.app`

## Authentication

For protected endpoints, include the API key in the request header:

\`\`\`
X-API-Key: your_api_key_here
\`\`\`

## Endpoints

### Health Check

#### GET /health

Check if the API server and database are healthy.

**Response:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "database": "connected",
  "uptime": 3600.5
}
\`\`\`

---

### Create Test

#### POST /api/test

Create a new test for a browser game. Test execution begins immediately.

**Request Body:**
\`\`\`json
{
  "gameUrl": "https://example.com/game",
  "options": {
    "timeout": 120000,
    "screenshotCount": 5
  }
}
\`\`\`

**Parameters:**
- `gameUrl` (string, required): Full HTTP/HTTPS URL of the game to test
- `options.timeout` (number, optional): Maximum test duration in milliseconds (10000-300000, default: 120000)
- `options.screenshotCount` (number, optional): Number of screenshots to capture (1-10, default: 5)

**Response (201 Created):**
\`\`\`json
{
  "testId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Test created successfully and queued for execution"
}
\`\`\`

**Error Responses:**
- `400 Bad Request`: Invalid URL or parameters
- `429 Too Many Requests`: Rate limit exceeded
- `401 Unauthorized`: Missing or invalid API key (if auth enabled)

---

### Get Test Results

#### GET /api/test/:id

Retrieve detailed results for a specific test.

**Parameters:**
- `id` (string, required): Test UUID

**Response (200 OK):**
\`\`\`json
{
  "test": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "gameUrl": "https://example.com/game",
    "status": "completed",
    "playabilityScore": 85.5,
    "grade": "B",
    "confidence": 92.0,
    "duration": 95000,
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:01:35.000Z",
    "scoreComponents": {
      "visual": 90,
      "stability": 85,
      "interaction": 80,
      "load": 95
    },
    "reasoning": "Game loads successfully with minor UI issues detected.",
    "screenshots": [
      {
        "id": "...",
        "label": "initial-load",
        "filePath": "/data/testId/screenshots/initial-load.png",
        "fileSize": 125000,
        "timestamp": "2024-01-15T12:00:10.000Z"
      }
    ],
    "issues": [
      {
        "id": "...",
        "severity": "minor",
        "type": "rendering",
        "description": "Slight text clipping in menu",
        "confidence": 75,
        "timestamp": "2024-01-15T12:01:00.000Z"
      }
    ],
    "consoleLogs": [],
    "networkErrors": []
  }
}
\`\`\`

**Status Values:**
- `pending`: Test created, awaiting execution
- `running`: Test currently executing
- `completed`: Test finished successfully
- `failed`: Test failed due to error
- `partial`: Test partially completed

**Grade Values:**
- `A`: 90-100 (Excellent)
- `B`: 80-89 (Good)
- `C`: 70-79 (Fair)
- `D`: 60-69 (Poor)
- `F`: 0-59 (Failed)

**Error Responses:**
- `404 Not Found`: Test with specified ID not found

---

### List Tests

#### GET /api/tests

Retrieve a paginated list of tests.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Results per page (default: 20, max: 100)
- `status` (string, optional): Filter by status (pending|running|completed|failed|partial)

**Example:**
\`\`\`
GET /api/tests?page=1&limit=10&status=completed
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "tests": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "gameUrl": "https://example.com/game",
      "status": "completed",
      "playabilityScore": 85.5,
      "grade": "B",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:01:35.000Z",
      "_count": {
        "issues": 3,
        "screenshots": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
\`\`\`

---

### Get Statistics

#### GET /api/statistics

Retrieve aggregate statistics across all tests.

**Response (200 OK):**
\`\`\`json
{
  "totalTests": 150,
  "averageScore": 78.5,
  "passRate": 65.3,
  "testsLast7Days": 23
}
\`\`\`

**Fields:**
- `totalTests`: Total number of tests executed
- `averageScore`: Average playability score (0-100)
- `passRate`: Percentage of tests with score >= 70
- `testsLast7Days`: Number of tests in the last 7 days

---

## Error Response Format

All error responses follow this format:

\`\`\`json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "statusCode": 400,
  "details": {
    // Additional error details
  }
}
\`\`\`

## Rate Limiting

- **With API Key**: 100 requests per hour
- **Without API Key**: 10 requests per hour per IP

Rate limit headers included in responses:
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1610721600
\`\`\`

## WebSocket Events

Connect to WebSocket for real-time test progress updates:

\`\`\`javascript
const socket = io('http://localhost:3000');

socket.on('test:started', (data) => {
  // Test execution started
});

socket.on('test:screenshot-captured', (data) => {
  // Screenshot captured
  console.log(data.label); // e.g., "initial-load"
});

socket.on('test:completed', (data) => {
  // Test finished
  console.log(data.testId);
});
\`\`\`

**Event Types:**
- `test:started`
- `test:browser-launched`
- `test:ui-detected`
- `test:screenshot-captured`
- `test:ai-analyzing`
- `test:completed`
- `test:error`

---

## Code Examples

### JavaScript (Fetch)

\`\`\`javascript
// Create test
const response = await fetch('http://localhost:3000/api/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    gameUrl: 'https://example.com/game',
    options: {
      timeout: 120000,
      screenshotCount: 5
    }
  })
});

const result = await response.json();
console.log('Test ID:', result.testId);
\`\`\`

### cURL

\`\`\`bash
# Create test
curl -X POST http://localhost:3000/api/test \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key" \\
  -d '{
    "gameUrl": "https://example.com/game",
    "options": {
      "timeout": 120000,
      "screenshotCount": 5
    }
  }'

# Get test results
curl http://localhost:3000/api/test/550e8400-e29b-41d4-a716-446655440000

# List tests
curl "http://localhost:3000/api/tests?page=1&limit=10&status=completed"
\`\`\`

### Python (requests)

\`\`\`python
import requests

# Create test
response = requests.post(
    'http://localhost:3000/api/test',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'gameUrl': 'https://example.com/game',
        'options': {
            'timeout': 120000,
            'screenshotCount': 5
        }
    }
)

result = response.json()
print(f"Test ID: {result['testId']}")
\`\`\`
