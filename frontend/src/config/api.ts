const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

if (!API_BASE) {
  console.warn("API URL not defined in environment variables, defaulting to http://localhost:8000/api/v1");
}

export default API_BASE;
