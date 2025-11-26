# Testing Guide for MVP Messaging System

This guide provides step-by-step instructions for testing the MVP messaging system implementation.

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned
- Port 5000 (backend), 3000 (frontend), 5432 (postgres), 6379 (redis) available

## Quick Start with Docker

### 1. Setup Environment

```bash
# Clone repository (if not already done)
git clone https://github.com/DevCostaSamundi/Exercise-Plataform.git
cd Exercise-Plataform

# Create environment file from example
cp .env.docker.example .env

# (Optional) Edit .env if you want to customize settings
# nano .env
```

### 2. Build and Start All Services

```bash
# Build and start all services
docker compose up --build

# OR run in detached mode
docker compose up -d --build
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Backend API (port 5000)
- Frontend app (port 3000)

### 3. Initialize Database

In a new terminal:

```bash
# Run database migrations
docker compose exec backend npx prisma migrate dev

# (Optional) Open Prisma Studio to inspect database
docker compose exec backend npx prisma studio
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/health

## Manual Testing Flows

### Test 1: Basic API Health Check

```bash
# Test API is running
curl http://localhost:5000/api/v1

# Expected response:
# {"status":"OK","message":"PrideConnect API - v1","endpoints":{...}}

# Test health endpoint
curl http://localhost:5000/health

# Expected response:
# {"status":"success","message":"Server is running","timestamp":"..."}
```

### Test 2: User Registration and Authentication

```bash
# Register a regular user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "username": "testuser",
    "password": "TestPassword123!",
    "displayName": "Test User"
  }'

# Save the accessToken from the response

# Register a creator (requires multipart/form-data)
# Use Postman or similar tool for this step
```

### Test 3: Chat Configuration

```bash
# Get creator chat config (public endpoint)
curl http://localhost:5000/api/v1/creators/{creatorId}/chat-config

# Expected response:
# {"status":"success","data":{"dmPolicy":"EVERYONE","creatorId":"..."},...}
```

### Test 4: Create/Get DM Chat

```bash
# Create or get DM chat (requires authentication)
curl -X POST http://localhost:5000/api/v1/chats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"creatorId": "CREATOR_USER_ID"}'

# Save the chatId from response

# Expected response:
# {"status":"success","data":{"chatId":"..."},...}
```

### Test 5: Get Chat Messages

```bash
# Get messages for a chat
curl http://localhost:5000/api/v1/chats/{chatId}/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected response:
# {"status":"success","data":{"items":[],"page":1,"limit":50},...}
```

### Test 6: Send Message (REST Fallback)

```bash
# Send a message via REST API (fallback when socket unavailable)
curl -X POST http://localhost:5000/api/v1/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "YOUR_CHAT_ID",
    "type": "TEXT",
    "content": "Hello from REST API!"
  }'
```

### Test 7: Live Configuration

```bash
# Get live configuration
curl http://localhost:5000/api/v1/lives/{liveId}/config

# Create a live session (requires authentication)
curl -X POST http://localhost:5000/api/v1/lives \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "mode": "open",
      "slowModeSeconds": 5,
      "minTipToHighlight": 10
    }
  }'
```

### Test 8: Check Subscription Status

```bash
# Check if user has active subscription to creator
curl "http://localhost:5000/api/v1/users/{userId}/subscription-status?creatorId={creatorId}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected response:
# {"status":"success","data":{"isSubscriber":false},...}
```

### Test 9: Check Tip Status

```bash
# Check if user has ever tipped a creator
curl "http://localhost:5000/api/v1/users/{userId}/has-tipped?creatorId={creatorId}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected response:
# {"status":"success","data":{"hasTipped":false},...}
```

## Socket.IO Testing

### Test 10: Socket Connection with Postman or similar tool

**Using Postman:**
1. Create a new WebSocket request to: `ws://localhost:5000`
2. Add authentication in connection options:
   ```json
   {
     "auth": {
       "token": "YOUR_ACCESS_TOKEN"
     }
   }
   ```
3. Connect

**Events to test:**

**Join Live:**
```json
{
  "event": "join:live",
  "data": {
    "liveId": "YOUR_LIVE_ID"
  }
}
```

**Send Chat Message:**
```json
{
  "event": "chat:message",
  "data": {
    "chatId": "YOUR_CHAT_ID",
    "type": "TEXT",
    "content": "Hello from Socket.IO!"
  }
}
```

**Send Live Message:**
```json
{
  "event": "live:message",
  "data": {
    "liveId": "YOUR_LIVE_ID",
    "type": "TEXT",
    "content": "Hello live chat!"
  }
}
```

**Send Tip (stubbed):**
```json
{
  "event": "tip:send",
  "data": {
    "liveId": "YOUR_LIVE_ID",
    "amount": 10,
    "content": "Thanks for the great stream!"
  }
}
```

## Frontend Testing

### Test 11: Frontend Components

1. **Open Frontend**: Navigate to http://localhost:3000
2. **Register Account**: Create a new user account
3. **Login**: Authenticate with your credentials
4. **Browse Creators**: View creator profiles
5. **Open DM**: Click "Enviar mensagem" button on a creator profile
6. **Send Messages**: Test sending messages in the chat
7. **Join Live**: Navigate to a live session (if available)
8. **Send Live Message**: Test sending messages in live chat
9. **Send Tip**: Click "Tip R$10" button and confirm (stubbed payment)

## Rate Limiting Tests

### Test 12: Verify Rate Limiting

```bash
# Test chat rate limiting (30 requests/minute)
for i in {1..35}; do
  curl -X POST http://localhost:5000/api/v1/messages \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"chatId":"test","type":"TEXT","content":"Test '$i'"}' &
done

# Expected: First 30 should succeed, remaining should return 429 Too Many Requests
```

## Database Inspection

### Test 13: Inspect Database with Prisma Studio

```bash
# Open Prisma Studio
docker compose exec backend npx prisma studio

# This opens a web UI at http://localhost:5555
# You can view and edit:
# - Users
# - Creators
# - Chats
# - Messages
# - Tips
# - Subscriptions
# - etc.
```

## Logs and Debugging

### View Service Logs

```bash
# View all logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View frontend logs only
docker compose logs -f frontend

# View database logs
docker compose logs -f postgres
```

## Cleanup

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes database data)
docker compose down -v

# Remove images
docker compose down --rmi all
```

## Common Issues and Solutions

### Issue 1: Port Already in Use
**Solution:** Stop the conflicting service or change ports in docker-compose.yml

### Issue 2: Database Connection Errors
**Solution:** 
```bash
# Wait for database to be ready
docker compose exec postgres pg_isready -U exercise_user

# Restart backend
docker compose restart backend
```

### Issue 3: Frontend Can't Connect to Backend
**Solution:** Check REACT_APP_API_URL in docker-compose.yml is set to http://localhost:5000

### Issue 4: Socket.IO Connection Fails
**Solution:** Ensure JWT token is valid and included in auth handshake

### Issue 5: Migration Fails
**Solution:**
```bash
# Reset database (WARNING: deletes all data)
docker compose exec backend npx prisma migrate reset

# Or create a new migration
docker compose exec backend npx prisma migrate dev --name fix_issue
```

## Performance Testing

### Test 14: Load Testing with Apache Bench

```bash
# Install apache2-utils if not already installed
# sudo apt-get install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 http://localhost:5000/api/v1

# Test with authentication (create auth.txt with token)
ab -n 100 -c 5 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/chats/CHAT_ID/messages
```

## Next Steps

After testing:
1. Review logs for any errors or warnings
2. Check database records in Prisma Studio
3. Verify all features work as expected
4. Test error handling by sending invalid requests
5. Review security settings in production before deploying

## Production Deployment Checklist

Before deploying to production:
- [ ] Change all default secrets in .env
- [ ] Set NODE_ENV=production
- [ ] Configure real Cloudinary credentials
- [ ] Set up real email service
- [ ] Implement real payment gateway
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Review SECURITY_SUMMARY.md
- [ ] Set up CI/CD pipeline
- [ ] Load testing and optimization

---

**Last Updated:** 2025-11-26  
**Version:** 1.0 (MVP)
