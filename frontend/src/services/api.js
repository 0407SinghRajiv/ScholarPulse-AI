/**
 * API Service for interacting with ScholarPulse AI Backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  : '/api';

export async function analyzePDF(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Analysis failed.' }));
    throw new Error(errorData.detail || 'Failed to analyze paper.');
  }

  return await response.json();
}

export async function fetchSampleDemo() {
  const response = await fetch(`${API_BASE_URL}/sample`);

  if (!response.ok) {
    throw new Error('Could not load benchmark sample demo data.');
  }

  return await response.json();
}
