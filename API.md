# ORTB Validation Tool API Documentation

## Overview

The ORTB Validation Tool provides a comprehensive REST API for validating OpenRTB 2.6 requests, generating sample requests, exporting results, and generating reports. The API includes authentication, rate limiting, and comprehensive monitoring capabilities.

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API supports optional API key authentication. When enabled, requests must include an API key either in the header or query parameter.

### Header Authentication
```http
x-api-key: your-api-key-here
```

### Query Parameter Authentication
```http
GET /api/templates?apiKey=your-api-key-here
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Default limits:
- **100 requests per 15 minutes** per IP address
- Rate limit headers are included in all responses:
  - `RateLimit-Limit`: Maximum requests allowed
  - `RateLimit-Remaining`: Remaining requests in current window
  - `RateLimit-Reset`: Time when the rate limit resets

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "requestId": "req_1234567890_abc123",
    "timestamp": "2023-12-07T10:30:00.000Z",
    "processingTime": 45,
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2023-12-07T10:30:00.000Z",
    "details": { ... }
  },
  "metadata": {
    "requestId": "req_1234567890_abc123",
    "timestamp": "2023-12-07T10:30:00.000Z",
    "processingTime": 12,
    "version": "1.0.0"
  }
}
```

## Endpoints

### Validation Endpoints

#### Validate Single Request
Validates a single OpenRTB 2.6 request.

```http
POST /api/validate
```

**Request Body:**
```json
{
  "request": {
    "id": "test-request-1",
    "imp": [{
      "id": "1",
      "banner": {
        "w": 300,
        "h": 250,
        "mimes": ["image/jpeg", "image/png"]
      },
      "bidfloor": 0.5,
      "bidfloorcur": "USD"
    }],
    "at": 1
  },
  "options": {
    "includeFieldDetails": true,
    "includeComplianceReport": false,
    "timeout": 5000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "complianceLevel": "compliant",
    "validatedFields": ["id", "imp", "at"],
    "complianceScore": 95,
    "timestamp": "2023-12-07T10:30:00.000Z",
    "validationId": "val_1234567890_abc123",
    "specVersion": "2.6"
  }
}
```

#### Validate Batch Requests
Validates multiple OpenRTB requests in a single call.

```http
POST /api/validate-batch
```

**Request Body:**
```json
{
  "requests": [
    { "id": "req1", "imp": [...], "at": 1 },
    { "id": "req2", "imp": [...], "at": 1 }
  ],
  "options": {
    "concurrency": 5,
    "failFast": false,
    "includeFieldDetails": true
  }
}
```

#### Validation Health Check
```http
GET /api/validate/health
```

#### Validation Statistics
```http
GET /api/validate/stats
```

### Sample Generation Endpoints

#### Generate Single Sample
Generates a single OpenRTB sample request based on configuration.

```http
POST /api/generate
```

**Request Body:**
```json
{
  "config": {
    "requestType": "display",
    "complexity": "minimal",
    "includeOptionalFields": false,
    "impressionCount": 1,
    "customFields": {
      "site.domain": "example.com"
    }
  }
}
```

#### Generate Batch Samples
```http
POST /api/generate-batch
```

**Request Body:**
```json
{
  "config": {
    "count": 10,
    "baseConfig": {
      "requestType": "display",
      "complexity": "minimal"
    },
    "varyConfigurations": true,
    "variations": {
      "varyRequestTypes": true
    }
  }
}
```

#### Generate from Template
```http
POST /api/generate/from-template
```

**Request Body:**
```json
{
  "templateId": "display-basic",
  "customFields": {
    "site.domain": "custom-domain.com"
  }
}
```

#### Generate from Scenario
```http
POST /api/generate/from-scenario
```

**Request Body:**
```json
{
  "scenarioId": "mobile-video-interstitial"
}
```

#### Get Available Templates
```http
GET /api/templates
GET /api/templates?type=display
```

#### Generation Health Check
```http
GET /api/generate/health
```

### Export Endpoints

#### Export Validation Result
```http
POST /api/export/validation-result
```

**Request Body:**
```json
{
  "data": { ... },
  "options": {
    "format": "json",
    "anonymize": false,
    "filename": "validation-result",
    "includeMetadata": true
  }
}
```

**Supported Formats:**
- `json` - JavaScript Object Notation
- `csv` - Comma Separated Values
- `txt` - Plain Text
- `html` - HTML Report
- `pdf` - PDF-ready HTML

#### Export Multiple Samples
```http
POST /api/export/multiple-samples
```

#### Get Supported Export Formats
```http
GET /api/export/formats
```

### Report Endpoints

#### Generate Validation Report
```http
POST /api/reports/validation
```

#### Generate Compliance Report
```http
POST /api/reports/compliance
```

#### Generate Batch Report
```http
POST /api/reports/batch
```

#### Get Report Templates
```http
GET /api/reports/templates
```

#### Reporting Health Check
```http
GET /api/reports/health
```

### Analytics Endpoints

#### Get Usage Analytics
```http
GET /api/analytics/usage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2023-12-07T10:30:00.000Z",
    "usage": {
      "totalRequests": 1250,
      "successfulRequests": 1180,
      "failedRequests": 70,
      "successRate": 94,
      "averageResponseTime": 125,
      "requestsPerHour": 45,
      "topEndpoints": [...],
      "topApiKeys": [...]
    },
    "security": {
      "authFailures": 12,
      "rateLimitHits": 5,
      "suspiciousActivityCount": 3,
      "blockedIPsCount": 1
    },
    "uptime": 86400,
    "memoryUsage": { ... }
  }
}
```

#### Get Security Metrics
```http
GET /api/analytics/security
```

### System Endpoints

#### API Information
```http
GET /api/info
```

#### System Health Check
```http
GET /api/health
```

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_API_KEY` | API key is required but not provided |
| `INVALID_API_KEY` | Provided API key is not valid |
| `RATE_LIMIT_EXCEEDED` | Too many requests, rate limit exceeded |
| `MISSING_REQUIRED_FIELDS` | Required fields are missing from request |
| `INVALID_JSON` | Request body contains invalid JSON |
| `INVALID_CONTENT_TYPE` | Content-Type header is not application/json |
| `VALIDATION_ERROR` | Error during validation process |
| `GENERATION_ERROR` | Error during sample generation |
| `EXPORT_ERROR` | Error during export process |
| `TEMPLATE_NOT_FOUND` | Requested template does not exist |
| `SCENARIO_NOT_FOUND` | Requested scenario does not exist |
| `NOT_FOUND` | Requested endpoint does not exist |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

## Security Features

### Request ID Tracking
Every request receives a unique request ID that is:
- Included in response headers (`x-request-id`)
- Included in response metadata
- Used for request tracing and debugging

### Input Validation
- JSON payload validation
- Content-Type validation for POST/PUT requests
- Request size limits (10MB default)
- Field presence validation

### Security Headers
- Request ID headers for tracing
- Rate limit headers
- CORS headers for cross-origin requests

### Monitoring
- Comprehensive usage analytics
- Security event tracking
- Suspicious activity detection
- API key usage monitoring

## Usage Examples

### cURL Examples

#### Validate a Request
```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "request": {
      "id": "test-1",
      "imp": [{
        "id": "1",
        "banner": {"w": 300, "h": 250, "mimes": ["image/jpeg"]},
        "bidfloor": 0.5,
        "bidfloorcur": "USD"
      }],
      "at": 1
    }
  }'
```

#### Generate a Sample
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "config": {
      "requestType": "display",
      "complexity": "minimal"
    }
  }'
```

#### Get Templates
```bash
curl -X GET http://localhost:3000/api/templates \
  -H "x-api-key: your-api-key"
```

### JavaScript Examples

#### Using Fetch API
```javascript
// Validate a request
const response = await fetch('http://localhost:3000/api/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    request: {
      id: 'test-1',
      imp: [{
        id: '1',
        banner: { w: 300, h: 250, mimes: ['image/jpeg'] },
        bidfloor: 0.5,
        bidfloorcur: 'USD'
      }],
      at: 1
    }
  })
});

const result = await response.json();
console.log(result);
```

## Server Configuration

### Starting the Server
```bash
# Default configuration
npm run api

# Custom port
npm run api -- --port 8080

# With authentication
npm run api -- --auth key1,key2,key3

# Custom rate limit
npm run api -- --rate-limit 200

# Environment variables
PORT=8080 API_KEYS=key1,key2 npm run api
```

### Configuration Options
- `--port, -p`: Server port (default: 3000)
- `--host, -h`: Server host (default: 0.0.0.0)
- `--auth`: Enable authentication with API keys
- `--no-auth`: Disable authentication (default)
- `--rate-limit`: Requests per 15 minutes (default: 100)
- `--cors-origin`: CORS origin (default: *)

### Environment Variables
- `PORT`: Server port
- `HOST`: Server host
- `API_KEYS`: Comma-separated API keys
- `RATE_LIMIT`: Rate limit per 15 minutes
- `CORS_ORIGIN`: CORS origin

## Development

### Running Tests
```bash
# All API tests
npm run test:api

# Specific test files
npm test src/api/__tests__/basic-endpoints.test.ts
npm test src/api/__tests__/auth-rate-limit.test.ts
npm test src/api/__tests__/security-tests.test.ts
```

### API Development Server
```bash
# Start with auto-reload
npm run api:dev
```

## Support

For issues, questions, or contributions, please refer to the project repository or documentation.