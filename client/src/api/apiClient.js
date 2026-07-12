import axios from 'axios';

let accessToken = '';
let refreshSubscribers = [];
let isRefreshing = false;

// Create Axios Instance
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for receiving/sending HTTP-Only cookies (refreshToken)
});

// Set Token in Module State
export const setClientToken = (token) => {
  accessToken = token;
};

// Clear Token
export const clearClientToken = () => {
  accessToken = '';
};

// Request Interceptor: Attach Authorization Token
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Subscriber queue to handle multiple concurrent requests during token refresh
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

// Response Interceptor: Handle Token Expired (401) and Auto-Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is 401 and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop of refresh requests
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request token refresh
        const response = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const newToken = response.data?.data?.token;

        if (newToken) {
          setClientToken(newToken);
          
          // Notify any subscribers waiting for the new token
          onRefreshed(newToken);
          isRefreshing = false;

          // Dispatch event to sync token with Redux state if store is listening
          window.dispatchEvent(new CustomEvent('auth-token-refreshed', { detail: newToken }));

          // Retry the original request
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        clearClientToken();
        window.dispatchEvent(new CustomEvent('auth-session-expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
