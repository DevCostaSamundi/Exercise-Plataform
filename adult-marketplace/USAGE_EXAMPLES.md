# API Client and Authentication Usage Examples

This document provides examples of how to use the API client and AuthContext in the PrideConnect frontend application.

## Table of Contents

1. [Authentication](#authentication)
2. [Using the API Client](#using-the-api-client)
3. [Protected Routes](#protected-routes)
4. [Error Handling](#error-handling)

## Authentication

### Using the AuthContext

The `AuthContext` provides authentication state and methods throughout the application.

#### Example: Login Component

```jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login(formData);
    
    if (result.success) {
      // Redirect to dashboard or home page
      navigate('/dashboard');
    } else {
      // Error is automatically set in AuthContext
      console.error('Login failed:', result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default LoginPage;
```

#### Example: Register Component

```jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    birthDate: '',
    genderIdentity: '',
    orientation: '',
    agreeTerms: false,
    ageConfirm: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await register(formData);
    
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

#### Example: Accessing User Information

```jsx
import { useAuth } from '../contexts/AuthContext';

function UserProfile() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login to view your profile</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.displayName || user.username}!</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}
```

#### Example: Logout

```jsx
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
```

## Using the API Client

### Creators API

#### Example: Fetching All Creators

```jsx
import { useState, useEffect } from 'react';
import { creatorsAPI } from '../services/api';

function CreatorsList() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const response = await creatorsAPI.getAll({
          page: pagination.page,
          limit: pagination.limit,
          isVerified: true,
        });
        
        setCreators(response.data.data.creators);
        setPagination(response.data.data.pagination);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch creators');
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, [pagination.page, pagination.limit]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {creators.map(creator => (
        <div key={creator.id}>
          <h3>{creator.displayName}</h3>
          <p>{creator.description}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Example: Fetching Single Creator

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { creatorsAPI } from '../services/api';

function CreatorProfile() {
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const response = await creatorsAPI.getById(id);
        setCreator(response.data.data);
      } catch (err) {
        console.error('Failed to fetch creator:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!creator) return <div>Creator not found</div>;

  return (
    <div>
      <h1>{creator.displayName}</h1>
      <p>{creator.description}</p>
      <p>Followers: {creator.followersCount}</p>
      <p>Posts: {creator.postsCount}</p>
    </div>
  );
}
```

### Products API

#### Example: Fetching Products with Filters

```jsx
import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';

function ProductsList() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    page: 1,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = {};
        if (filters.category) params.category = filters.category;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        params.page = filters.page;

        const response = await productsAPI.getAll(params);
        setProducts(response.data.data.products);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    fetchProducts();
  }, [filters]);

  return (
    <div>
      {/* Filter UI */}
      <select onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
        <option value="">All Categories</option>
        <option value="DIGITAL_CONTENT">Digital Content</option>
        <option value="PHYSICAL_ITEM">Physical Items</option>
      </select>

      {/* Products List */}
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Upload API

#### Example: Uploading a File

```jsx
import { useState } from 'react';
import { uploadsAPI } from '../services/api';
import axios from 'axios';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);

      // Step 1: Get presigned URL
      const presignResponse = await uploadsAPI.getPresignedUrl({
        fileName: file.name,
        fileType: file.type,
        folder: 'avatars',
      });

      const { uploadUrl, publicUrl } = presignResponse.data.data;

      // Step 2: Upload file to cloud storage
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      // Step 3: Save the public URL
      setUploadedUrl(publicUrl);
      alert('File uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {uploadedUrl && (
        <div>
          <p>Uploaded successfully!</p>
          <img src={uploadedUrl} alt="Uploaded file" />
        </div>
      )}
    </div>
  );
}
```

### Checkout API

#### Example: Creating a Checkout Session

```jsx
import { useState } from 'react';
import { checkoutAPI } from '../services/api';

function ProductCheckout({ productId }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const response = await checkoutAPI.createSession({
        items: [
          {
            productId: productId,
            quantity: 1,
          },
        ],
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/cancel`,
      });

      const { checkoutUrl } = response.data.data;
      
      // Redirect to checkout page
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Processing...' : 'Buy Now'}
    </button>
  );
}
```

## Protected Routes

#### Example: Route Protection with Logout Handling

```jsx
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  // Handle automatic logout when session expires
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}

// Usage in routes
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      {/* Creator-only route */}
      <Route
        path="/creator/upload"
        element={
          <ProtectedRoute requiredRole="CREATOR">
            <UploadContentPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

## Error Handling

#### Example: Global Error Handler

```jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

function useAPICall(apiFunction, params = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFunction(...params);
        setData(response.data.data);
      } catch (err) {
        setError({
          message: err.response?.data?.message || 'An error occurred',
          status: err.response?.status,
          errors: err.response?.data?.errors,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [...params]);

  return { data, loading, error };
}

// Usage
function CreatorsPage() {
  const { data: creators, loading, error } = useAPICall(
    creatorsAPI.getAll,
    [{ page: 1, limit: 20 }]
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {creators.map(creator => (
        <div key={creator.id}>{creator.displayName}</div>
      ))}
    </div>
  );
}
```

## Additional Tips

### Refreshing User Data

```jsx
import { useAuth } from '../contexts/AuthContext';

function UpdateProfile() {
  const { refreshUser } = useAuth();

  const handleProfileUpdate = async (newData) => {
    try {
      // Update profile via API
      await api.put('/users/me', newData);
      
      // Refresh user data in context
      await refreshUser();
      
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    // Profile form
  );
}
```

### Custom API Calls

```jsx
import api from '../services/api';

// For endpoints not covered by the predefined API methods
async function customAPICall() {
  try {
    const response = await api.get('/custom-endpoint', {
      params: { foo: 'bar' },
    });
    return response.data;
  } catch (err) {
    console.error('API call failed:', err);
    throw err;
  }
}
```

## Environment Configuration

Make sure to create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the API URL in `.env`:

```
VITE_API_URL=http://localhost:5000/api/v1
```

For production:

```
VITE_API_URL=https://api.prideconnect.com/api/v1
```
