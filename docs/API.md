# SEO Audit Tool API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
Creates a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "subscription_plan": "starter",
    "created_at": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email or password format
- `409 Conflict` - Email already exists

---

### Login
Authenticates a user and returns a JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "subscription_plan": "starter"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

### Logout
Logs out the current user.

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## Audit Endpoints

### Create Audit
Starts a new SEO audit for a website.

**Endpoint:** `POST /audits`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "url": "https://example.com",
  "maxPages": 50
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-v4",
  "user_id": "uuid-v4",
  "domain": "example.com",
  "url": "https://example.com",
  "status": "pending",
  "health_score": 0,
  "total_pages_crawled": 0,
  "critical_issues_count": 0,
  "warnings_count": 0,
  "notices_count": 0,
  "created_at": "2025-01-15T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid URL format
- `401 Unauthorized` - Missing or invalid token
- `429 Too Many Requests` - Rate limit exceeded

---

### Get All Audits
Retrieves all audits for the authenticated user.

**Endpoint:** `GET /audits`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `status` (optional) - Filter by status: pending, running, completed, failed

**Response:** `200 OK`
```json
{
  "audits": [
    {
      "id": "uuid-v4",
      "domain": "example.com",
      "url": "https://example.com",
      "status": "completed",
      "health_score": 85,
      "total_pages_crawled": 45,
      "critical_issues_count": 2,
      "warnings_count": 8,
      "notices_count": 15,
      "created_at": "2025-01-15T10:00:00.000Z",
      "completed_at": "2025-01-15T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### Get Audit by ID
Retrieves a specific audit with full details.

**Endpoint:** `GET /audits/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "user_id": "uuid-v4",
  "domain": "example.com",
  "url": "https://example.com",
  "status": "completed",
  "health_score": 85,
  "total_pages_crawled": 45,
  "critical_issues_count": 2,
  "warnings_count": 8,
  "notices_count": 15,
  "created_at": "2025-01-15T10:00:00.000Z",
  "completed_at": "2025-01-15T10:05:00.000Z",
  "updated_at": "2025-01-15T10:05:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Audit not found
- `403 Forbidden` - Audit belongs to another user

---

### Get Audit Issues
Retrieves all issues found in an audit.

**Endpoint:** `GET /audits/:id/issues`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `severity` (optional) - Filter by severity: critical, warning, notice

**Response:** `200 OK`
```json
{
  "issues": [
    {
      "id": "uuid-v4",
      "audit_id": "uuid-v4",
      "issue_type": "missing_title",
      "severity": "critical",
      "title": "Missing Page Titles",
      "description": "5 pages are missing title tags",
      "affected_pages": [
        "https://example.com/page1",
        "https://example.com/page2"
      ],
      "affected_count": 5,
      "recommendation": "Add unique, descriptive title tags to all pages",
      "status": "unresolved",
      "created_at": "2025-01-15T10:05:00.000Z"
    }
  ]
}
```

---

### Get Issue Recommendations
Retrieves AI-powered recommendations for a specific issue.

**Endpoint:** `GET /audits/:auditId/issues/:issueId/recommendations`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "recommendations": [
    {
      "id": "uuid-v4",
      "issue_id": "uuid-v4",
      "title": "Add Title Tags to All Pages",
      "description": "Each page should have a unique, descriptive title tag between 50-60 characters",
      "effort_level": "easy",
      "impact_level": "high",
      "priority_score": 95,
      "fix_guide": "1. Review each affected page\n2. Add <title> tag in <head>\n3. Keep titles 50-60 characters\n4. Make each title unique and descriptive",
      "external_resources": [
        "https://moz.com/learn/seo/title-tag",
        "https://developers.google.com/search/docs/appearance/title-link"
      ]
    }
  ]
}
```

---

### Delete Audit
Deletes an audit and all associated data.

**Endpoint:** `DELETE /audits/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Audit deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Audit not found
- `403 Forbidden` - Audit belongs to another user

---

## Account Endpoints

### Get Profile
Retrieves the authenticated user's profile.

**Endpoint:** `GET /account/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  "subscription_plan": "pro",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T10:00:00.000Z"
}
```

---

### Update Profile
Updates the authenticated user's profile.

**Endpoint:** `PUT /account/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid-v4",
    "email": "newemail@example.com",
    "subscription_plan": "pro"
  }
}
```

---

### Get Subscription
Retrieves the user's subscription information.

**Endpoint:** `GET /account/subscription`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "user_id": "uuid-v4",
  "plan_type": "pro",
  "status": "active",
  "current_period_start": "2025-01-01T00:00:00.000Z",
  "current_period_end": "2025-02-01T00:00:00.000Z",
  "auto_renew": true,
  "usage": {
    "audits_this_month": 15,
    "audits_limit": 20,
    "pages_crawled": 1500,
    "pages_limit": 5000
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters",
  "details": ["url must be a valid URL"]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "The requested resource was not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

API requests are rate-limited based on subscription plan:

| Plan | Requests per minute | Audits per month |
|------|-------------------|------------------|
| Starter | 30 | 5 |
| Pro | 60 | 20 |
| Agency | 120 | 100 |
| Enterprise | Custom | Unlimited |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642248000
```

---

## Webhooks (Coming Soon)

Subscribe to audit completion events:

```json
{
  "event": "audit.completed",
  "audit_id": "uuid-v4",
  "domain": "example.com",
  "health_score": 85,
  "timestamp": "2025-01-15T10:05:00.000Z"
}
```

---

## SDKs and Libraries

Official SDKs coming soon for:
- JavaScript/TypeScript
- Python
- PHP
- Ruby

---

## Support

For API support:
- Documentation: https://docs.seoaudit.com
- GitHub Issues: https://github.com/yourusername/seo-audit-tool/issues
- Email: support@seoaudit.com
