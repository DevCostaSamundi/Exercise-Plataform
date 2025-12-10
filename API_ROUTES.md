# API Routes Documentation

Complete map of all API routes in the Exercise Platform.

## Base URL
- **Development**: `http://localhost:5000/api/v1`
- **Production**: Configured via `VITE_API_URL` environment variable

## Authentication Routes
**Base**: `/api/v1/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/creator-register` | Register as creator | No |
| POST | `/logout` | User logout | Yes |
| POST | `/refresh` | Refresh access token | Yes |

## User Routes
**Base**: `/api/v1/user`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get current user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| PUT | `/password` | Change password | Yes |
| PUT | `/email` | Update email | Yes |
| GET | `/settings` | Get user settings | Yes |
| PUT | `/settings` | Update user settings | Yes |
| DELETE | `/account` | Delete account | Yes |
| GET | `/subscriptions` | Get user subscriptions | Yes |
| GET | `/favorites` | Get user favorites | Yes |
| GET | `/notifications` | Get notifications | Yes |
| PUT | `/notifications/:id/read` | Mark notification as read | Yes |
| PUT | `/notifications/read-all` | Mark all notifications as read | Yes |
| GET | `/wallet` | Get wallet balance | Yes |
| GET | `/transactions` | Get transaction history | Yes |
| GET | `/:id/subscription-status` | Check subscription status | Yes |
| GET | `/:id/has-tipped` | Check if user tipped creator | Yes |

## Subscription Routes
**Base**: `/api/v1/subscriptions`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List user subscriptions | Yes |
| POST | `/:creatorId` | Create new subscription | Yes |
| GET | `/check/:creatorId` | Check subscription status | Yes |
| DELETE | `/:subscriptionId` | Cancel subscription | Yes |

## Favorites Routes
**Base**: `/api/v1/favorites`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's favorite creators | Yes |
| POST | `/:creatorId` | Add creator to favorites | Yes |
| DELETE | `/:creatorId` | Remove creator from favorites | Yes |
| GET | `/check/:creatorId` | Check if creator is favorited | Yes |

## Trending Routes
**Base**: `/api/v1/trending`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/posts` | Get trending posts | No (optional auth) |
| GET | `/creators` | Get trending creators | No (optional auth) |
| GET | `/tags` | Get trending tags/hashtags | No (optional auth) |

**Query Parameters**:
- `period`: `24h`, `7d`, `30d` (default: `7d`)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

## Wallet & Transaction Routes
**Base**: `/api/v1`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/wallet` | Get wallet information | Yes |
| GET | `/transactions` | Get transaction history | Yes |
| GET | `/transactions/export` | Export transactions to CSV | Yes |

**Query Parameters** (transactions):
- `type`: Filter by transaction type
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)
- `page`: Page number
- `limit`: Results per page

## Creator Routes
**Base**: `/api/v1/creators`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List all creators | No (optional auth) |
| GET | `/:id` | Get creator by ID | No (optional auth) |
| GET | `/username/:username` | Get creator by username | No (optional auth) |
| GET | `/username/:username/posts` | Get creator's posts | No (optional auth) |

## Creator Management Routes
**Base**: `/api/v1/creator`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get creator profile | Yes (Creator) |
| PUT | `/profile` | Update creator profile | Yes (Creator) |
| GET | `/settings` | Get creator settings | Yes (Creator) |
| PUT | `/settings` | Update creator settings | Yes (Creator) |

## Creator Posts Routes
**Base**: `/api/v1/creator/posts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List creator's own posts | Yes (Creator) |
| POST | `/` | Create new post | Yes (Creator) |
| GET | `/:id` | Get specific post | Yes (Creator) |
| PUT | `/:id` | Update post | Yes (Creator) |
| DELETE | `/:id` | Delete post | Yes (Creator) |

## Post Routes (Public)
**Base**: `/api/v1/posts`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List all posts (feed) | No (optional auth) |
| GET | `/:id` | Get post by ID | No (optional auth) |
| POST | `/:id/like` | Like/unlike post | Yes |
| GET | `/:id/comments` | Get post comments | No |
| POST | `/:id/comments` | Add comment to post | Yes |

## Comment Routes
**Base**: `/api/v1`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/comments/:id` | Get comment by ID | No |
| PUT | `/comments/:id` | Update comment | Yes |
| DELETE | `/comments/:id` | Delete comment | Yes |
| POST | `/comments/:id/like` | Like/unlike comment | Yes |

## Like Routes
**Base**: `/api/v1`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/posts/:postId/like` | Like/unlike post | Yes |
| POST | `/comments/:commentId/like` | Like/unlike comment | Yes |

## Message Routes
**Base**: `/api/v1/messages`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List user messages | Yes |
| POST | `/` | Send message | Yes |
| GET | `/:id` | Get specific message | Yes |
| DELETE | `/:id` | Delete message | Yes |

## Chat Routes
**Base**: `/api/v1/chat`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List user chats | Yes |
| GET | `/:id` | Get specific chat | Yes |
| POST | `/:id/messages` | Send message in chat | Yes |

## Live Routes
**Base**: `/api/v1/lives`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List active lives | No (optional auth) |
| POST | `/` | Create new live stream | Yes (Creator) |
| GET | `/:id` | Get live stream details | No (optional auth) |
| PUT | `/:id` | Update live stream | Yes (Creator) |
| DELETE | `/:id` | End live stream | Yes (Creator) |

## Payment Routes
**Base**: `/api/v1/payments`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/methods` | Get payment methods | Yes |
| POST | `/methods` | Add payment method | Yes |
| DELETE | `/methods/:id` | Remove payment method | Yes |
| PUT | `/methods/:id/default` | Set default payment method | Yes |

## Withdrawal Routes
**Base**: `/api/v1/withdrawals`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List withdrawals | Yes (Creator) |
| POST | `/` | Request withdrawal | Yes (Creator) |
| GET | `/:id` | Get withdrawal details | Yes (Creator) |

## Creator Dashboard Routes
**Base**: `/api/v1/creator-dashboard`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats` | Get dashboard statistics | Yes (Creator) |
| GET | `/earnings` | Get earnings data | Yes (Creator) |
| GET | `/subscribers` | Get subscribers list | Yes (Creator) |

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Optional validation errors
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Authentication

All authenticated requests must include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is automatically added by the API service (`api.js`) which reads from localStorage.

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applies to**: All `/api/*` routes

## CORS

Allowed origins are configured in `backend/src/app.js`:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev server)
- Production URL via `FRONTEND_URL` environment variable

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized / Invalid Token |
| 403 | Forbidden / Insufficient Permissions |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate entry) |
| 429 | Too Many Requests (Rate Limited) |
| 500 | Internal Server Error |

## Environment Variables

### Backend
```env
API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

### Frontend
```env
VITE_API_URL=http://localhost:5000
VITE_API_VERSION=v1
VITE_SOCKET_URL=http://localhost:5000
```
