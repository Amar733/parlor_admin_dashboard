export const imageSizeHints: { [key: string]: string } = {
  'home-carousel-image': 'Required: 700x720px',
  'home-homepage_about-image1': 'Required: 500x600px',
  'home-services-image': 'Required: 800x500px',
  'home-services-items-image': 'Required: 800x500px',
  'home-testimonials-image': 'Required: 100x100px',
  'home-blog-image': 'Required: 400x300px',
  'home-navbar-logo': 'Required: 200x80px',
  'home-footer-logo': 'Required: 200x80px',
};

export const imageDimensionConstraints: { [key: string]: { width: number; height: number } } = {
  'home-carousel-image': { width: 700, height: 720 },
  'home-homepage_about-image1': { width: 500, height: 600 },
  'home-services-image': { width: 800, height: 500 },
  'home-services-items-image': { width: 800, height: 500 },
  'home-testimonials-image': { width: 100, height: 100 },
  'home-blog-image': { width: 400, height: 300 },
  'home-navbar-logo': { width: 200, height: 80 },
  'home-footer-logo': { width: 200, height: 80 },
};

import { API_BASE_URL } from '@/config/api';

export const fetchSectionData = async (doctorId: string, section: string) => {
  const response = await fetch(`${API_BASE_URL}/api/cms/home/${section}_${doctorId}`);
  if (response.ok) {
    const data = await response.json();
    return data.data;
  }
  return null;
};

export const saveSectionData = async (authFetch: any, doctorId: string, section: string, data: any) => {
  const response = await authFetch(`${API_BASE_URL}/api/cms/home/${section}_${doctorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return response.ok;
};

export const uploadImage = async (file: File, folder: string, authFetch: any): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await authFetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  const result = await response.json();
  return result.url;
};

export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};