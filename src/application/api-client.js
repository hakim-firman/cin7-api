import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.API_CIN7_URL,
  // timeout: 15000, 
});


apiClient.interceptors.request.use(
  (config) => {
    config.headers['api-auth-accountid'] = process.env.API_CIN7_ACCOUNT_ID;
    config.headers['api-auth-applicationkey'] = process.env.API_CIN7_KEY;

    console.log(`[REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[RESPONSE] ${response.status} - ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[ERROR] ${error.response.status} - ${error.config.url}`, error.response.data);
    } else {
      console.error(`[ERROR]`, error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
