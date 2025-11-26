# PrideConnect API Documentation

This directory contains the OpenAPI specification for the PrideConnect backend API.

## OpenAPI Specification

The `openapi.yaml` file contains a comprehensive API specification following the OpenAPI 3.0.3 standard.

### What's Included

The specification documents:

- **Authentication Endpoints**
  - POST `/auth/register` - Register a new user
  - POST `/auth/login` - Login user
  - POST `/auth/refresh` - Refresh access token
  - GET `/auth/me` - Get current authenticated user

- **Creators Endpoints**
  - GET `/creators` - Get all creators (with pagination and filters)
  - GET `/creators/{id}` - Get creator by ID

- **Products Endpoints**
  - GET `/products` - Get all products (with pagination and filters)
  - GET `/products/{id}` - Get product by ID

- **Upload Endpoints**
  - POST `/uploads/presign` - Get presigned URL for file uploads

- **Checkout Endpoints**
  - POST `/checkout/create-session` - Create checkout session

- **Payment Webhooks**
  - POST `/payments/webhook` - Handle payment provider webhooks

### Data Models

The specification includes complete schemas for:

- User
- CreateUser
- LoginRequest
- AuthResponse
- Creator
- Product
- PresignRequest/Response
- CheckoutRequest/Response
- WebhookEvent
- Pagination
- ErrorResponse

### Security

The API uses JWT-based authentication with:
- `bearerAuth` - JWT token in Authorization header
- `cookieAuth` - Refresh token in httpOnly cookie

### Viewing the Documentation

You can view and interact with the API documentation using:

1. **Swagger UI** (recommended for development)
   ```bash
   # Install swagger-ui globally
   npm install -g swagger-ui-express express
   
   # Or use npx to run without installing
   npx swagger-ui-serve openapi.yaml
   ```

2. **Swagger Editor** (online)
   - Visit https://editor.swagger.io/
   - Copy and paste the contents of `openapi.yaml`

3. **VS Code Extension**
   - Install "OpenAPI (Swagger) Editor" extension
   - Open `openapi.yaml` and use the preview feature

### Using with Mock Server

You can generate a mock server based on this specification:

1. **Using Prism** (recommended)
   ```bash
   # Install Prism
   npm install -g @stoplight/prism-cli
   
   # Run mock server
   prism mock openapi.yaml
   ```

2. **Using Swagger Codegen**
   ```bash
   # Generate a mock server
   swagger-codegen generate -i openapi.yaml -l nodejs-server -o ./mock-server
   ```

### Frontend Integration

The frontend uses this specification as the contract for API calls. See:
- `adult-marketplace/src/services/api.js` - API client implementation
- `adult-marketplace/src/contexts/AuthContext.jsx` - Authentication context

### Environment Variables

Configure the API base URL in your frontend `.env` file:
```
VITE_API_URL=http://localhost:5000/api/v1
```

### Updating the Specification

When adding new endpoints or modifying existing ones:

1. Update the `openapi.yaml` file
2. Validate the specification using a validator
3. Update the corresponding API client methods in `adult-marketplace/src/services/api.js`
4. Update this README if necessary

### Validation

Validate the OpenAPI specification:

```bash
# Using swagger-cli
npm install -g swagger-cli
swagger-cli validate openapi.yaml

# Using openapi-validator
npm install -g ibm-openapi-validator
lint-openapi openapi.yaml
```

## Development Workflow

1. **Design First**: Update the OpenAPI specification before implementing features
2. **Generate Mock**: Use the specification to generate a mock server for frontend development
3. **Implement**: Build the actual backend endpoints following the specification
4. **Test**: Ensure the implementation matches the specification
5. **Update**: Keep the specification in sync with any API changes

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Documentation](https://swagger.io/docs/)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)
