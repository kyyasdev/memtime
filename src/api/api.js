import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://interview-api.memtime-demo.deno.net/api/v1';

const API_KEY =
  import.meta.env.VITE_API_KEY ||
  't2On0w9hkjQNrfnKEaO7FhsVrfPLXZS2';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
});

