import { nanoid } from "nanoid";

export interface MeetingData {
  channel: string;
  linkId: string;
  expiresAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
}

/**
 * Generate unique meeting link data for an appointment
 */
export function generateMeetingLink(appointmentId: string, date: string, endTime: string): MeetingData {
  const linkId = nanoid(16);
  const channel = `consult_${appointmentId}`;
  const expiresAt = new Date(`${date}T${endTime}:00`);

  return {
    channel,
    linkId,
    expiresAt,
  };
}

/**
 * Get the full meeting URL for a link ID
 */
export function getMeetingUrl(linkId: string, baseUrl?: string, role?: 'doctor' | 'patient'): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const token = role === 'doctor' ? 'h' : 'p';
  return `${base}/meet/${linkId}?t=${token}`;
}

/**
 * Decode role from token
 */
export function decodeRole(token: string): 'doctor' | 'patient' {
  return token === 'h' ? 'doctor' : 'patient';
}

/**
 * Check if a meeting link is expired
 */
export function isMeetingExpired(expiresAt: Date | string): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Calculate meeting duration in seconds
 */
export function calculateDuration(startedAt: Date | string, endedAt: Date | string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.floor((end - start) / 1000);
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (error) {
        textArea.remove();
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}
