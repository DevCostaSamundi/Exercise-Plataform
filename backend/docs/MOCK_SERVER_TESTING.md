# Testing with Mock Server

This guide shows how to test the frontend against a mock server generated from the OpenAPI specification, allowing frontend development to proceed independently of backend implementation.

## Quick Start with Prism Mock Server

### 1. Install Prism

```bash
npm install -g @stoplight/prism-cli
```

### 2. Start the Mock Server

Navigate to the backend docs directory and start the mock server:

```bash
cd backend/docs
prism mock openapi.yaml
```

The mock server will start on `http://localhost:4010` by default.

### 3. Configure Frontend

Update your frontend `.env` file:

```bash
# Use mock server
VITE_API_URL=http://localhost:4010/api/v1
```

Or create a `.env.local` for local development:

```bash
cp .env.example .env.local
echo "VITE_API_URL=http://localhost:4010/api/v1" > .env.local
```

### 4. Start Frontend

```bash
cd adult-marketplace
npm run dev
```

## Testing Authentication Flow

### Register a New User

The mock server will return example responses defined in the OpenAPI spec. Try registering:

1. Navigate to `/register`
2. Fill out the registration form
3. Submit

Expected Response:
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "role": "USER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login

1. Navigate to `/login`
2. Enter any email and password
3. Submit

The mock server will return the example login response.

## Testing API Calls

### Fetch Creators

```javascript
import { creatorsAPI } from '../services/api';

// This will hit the mock server
const response = await creatorsAPI.getAll({ page: 1, limit: 20 });
console.log(response.data);
```

Expected Response:
```json
{
  "status": "success",
  "data": {
    "creators": [
      {
        "id": "creator-1",
        "displayName": "Alex Creator",
        "description": "Content creator specializing in art",
        "isVerified": true,
        "subscriptionPrice": 9.99
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## Advanced Prism Options

### Start with Custom Port

```bash
prism mock -p 8080 openapi.yaml
```

### Enable Request Validation

```bash
prism mock --errors openapi.yaml
```

This will return errors for invalid requests.

### Dynamic Response Examples

Prism can return different responses based on the `Prefer` header:

```javascript
// Request a specific example
const response = await api.get('/creators', {
  headers: {
    'Prefer': 'example=creator-verified'
  }
});
```

### Enable CORS

Prism automatically handles CORS, but you can customize it:

```bash
prism mock --cors openapi.yaml
```

## Using with Swagger UI

You can also use Swagger UI to interact with the mock server:

### Option 1: Use Online Swagger Editor

1. Go to https://editor.swagger.io/
2. File → Import File → Select `openapi.yaml`
3. Click "Try it out" on any endpoint
4. Update the server URL to your mock server

### Option 2: Run Swagger UI Locally

```bash
npm install -g swagger-ui-express express

# Create a simple server file
cat > swagger-server.js << 'EOF'
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./openapi.yaml');

const app = express();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3000, () => {
  console.log('Swagger UI available at http://localhost:3000/api-docs');
});
EOF

# Install dependencies
npm install express swagger-ui-express yamljs

# Run
node swagger-server.js
```

Visit `http://localhost:3000/api-docs` to see the interactive API documentation.

## Testing Error Scenarios

### Test 401 Unauthorized

Make a request without a token:

```javascript
localStorage.removeItem('accessToken');
const response = await creatorsAPI.create({ displayName: 'Test' });
// Will return 401 error
```

### Test 404 Not Found

```javascript
const response = await creatorsAPI.getById('non-existent-id');
// Will return 404 error
```

### Test 400 Bad Request

```javascript
const response = await authAPI.register({
  email: 'invalid-email',
  // Missing required fields
});
// Will return 400 error
```

## Testing with Different Environments

### Development (Mock Server)

```bash
# .env.development
VITE_API_URL=http://localhost:4010/api/v1
```

### Staging (Real Backend - Staging)

```bash
# .env.staging
VITE_API_URL=https://staging-api.prideconnect.com/api/v1
```

### Production

```bash
# .env.production
VITE_API_URL=https://api.prideconnect.com/api/v1
```

## Troubleshooting

### Mock Server Not Responding

1. Check if Prism is running: `ps aux | grep prism`
2. Check the port: `lsof -i :4010`
3. Restart Prism: Kill the process and start again

### CORS Errors

Make sure Prism is started with CORS enabled:
```bash
prism mock --cors openapi.yaml
```

### Frontend Not Connecting

1. Check `.env` file has correct URL
2. Restart frontend dev server
3. Check browser console for errors

### Mock Server Returns Wrong Response

1. Check OpenAPI spec has correct example
2. Verify the request matches the spec
3. Use `--errors` flag to see validation errors

## Best Practices

1. **Keep Spec Updated**: Update `openapi.yaml` as you add features
2. **Use Examples**: Add realistic examples to the spec
3. **Test Early**: Test frontend against mock server before backend is ready
4. **Validate Requests**: Use Prism's validation to catch errors early
5. **Document**: Add comments to the OpenAPI spec for clarity

## Continuous Integration

You can run the mock server in CI for frontend tests:

```yaml
# .github/workflows/frontend-test.yml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Prism
        run: npm install -g @stoplight/prism-cli
      
      - name: Start Mock Server
        run: |
          cd backend/docs
          prism mock openapi.yaml &
          sleep 5
      
      - name: Run Frontend Tests
        run: |
          cd adult-marketplace
          npm install
          VITE_API_URL=http://localhost:4010/api/v1 npm test
```

## Additional Resources

- [Prism Documentation](https://meta.stoplight.io/docs/prism/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [API Mocking Best Practices](https://stoplight.io/mocking/)
