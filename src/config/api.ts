const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8080';

const envBaseUrl = import.meta.env.VITE_API_BASE_URL;

const defaultBaseUrl = import.meta.env.DEV
  ? DEFAULT_DEV_API_BASE_URL
  : window.location.origin;

export const API_BASE_URL = envBaseUrl?.length ? envBaseUrl : defaultBaseUrl;

export const buildApiUrl = (path: string) => {
  const normalizedBase = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.replace(/^\//, '');
  return `${normalizedBase}/${normalizedPath}`;
};
