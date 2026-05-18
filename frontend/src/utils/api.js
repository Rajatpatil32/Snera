import axios from 'axios';

const API_BASE =
  process.env.REACT_APP_ENVIRONMENT === "local"
    ? "http://localhost:5000/api"
    : process.env.REACT_APP_API_URL || "/api";

const IMAGE_BASE =
  process.env.REACT_APP_ENVIRONMENT === "local"
    ? "http://localhost:5000"
    : process.env.REACT_APP_API_URL?.replace('/api', '') || "";

const API = axios.create({
  baseURL: API_BASE,
});

// Attach admin token to every request if present
API.interceptors.request.use(config => {
  const token = localStorage.getItem('snera_admin_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;

// Helpers

export const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n);

export const GLYPHS = ['◈', '◇', '△', '◯', '⬡', '◻', '◆'];

export const BKGS = [
  '#EDE8E0',
  '#E6E1D9',
  '#EBE6DE',
  '#E9E4DC',
  '#ECDDE5',
  '#E4E0D7'
];

export const getImageUrl = (p) => {
  if (!p) return null;

  if (p.startsWith('http://') || p.startsWith('https://')) {
    return p;
  }

  return `${IMAGE_BASE}${p}`;
};