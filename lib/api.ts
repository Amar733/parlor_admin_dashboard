import { API_BASE_URL } from '@/config/api';

export interface CmsData {
  [key: string]: any;
}

export async function fetchCmsData(
  doctorId: string,
  page: string,
  section: string
): Promise<CmsData | null> {
  try {
    const CMS_API_URL = `${API_BASE_URL}/api/doctor/cms/${doctorId}`;
    const response = await fetch(`${CMS_API_URL}/${page}/${section}`, {
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Section not found, return null
      }
      throw new Error(
        `Failed to fetch ${page}/${section}: ${response.statusText}`
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error fetching CMS data for ${page}/${section}:`, error);
    return null;
  }
}

export async function fetchAllHomeData(doctorId: string): Promise<{
  [section: string]: CmsData;
}> {
  const sections = [
    "topbar",
    "navbar",
    "carousel",
    "stats",
    "homepage_about",
    "services",
    "testimonials",
    "blog",
    "footer",
  ];

  const results: { [section: string]: CmsData } = {};

  await Promise.all(
    sections.map(async (section) => {
      const data = await fetchCmsData(doctorId, "home", section);
      if (data) {
        results[section] = data;
      }
    })
  );

  return results;
}

export function getAssetUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}