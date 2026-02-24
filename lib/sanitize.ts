/**
 * HTML Sanitization Utility
 * 
 * SECURITY: All user-generated or external HTML content MUST be sanitized
 * before rendering with dangerouslySetInnerHTML to prevent XSS attacks.
 * 
 * This utility uses DOMPurify for client-side sanitization.
 * For server-side rendering, consider using isomorphic-dompurify.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // Configure DOMPurify to allow common HTML elements used in rich text editors
  const config = {
    ALLOWED_TAGS: [
      // text formatting
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
      'mark', 'sub', 'sup', 'hr', 'code', 'pre', 'blockquote',
      // font / color (produced by execCommand foreColor / fontSize)
      'font', 'span',
      // headings & layout
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div',
      // lists
      'ul', 'ol', 'li',
      // links & media
      'a', 'img',
      // tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: [
      // links
      'href', 'target', 'rel',
      // images / tables
      'src', 'alt', 'title', 'width', 'height', 'align', 'colspan', 'rowspan',
      // styling (covers text-align, font-size, color, list styles, etc.)
      'style', 'class',
      // <font> attributes produced by execCommand
      'color', 'size', 'face',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
  };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitizes HTML content with stricter rules (for untrusted sources)
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string with minimal allowed tags
 */
export function sanitizeHtmlStrict(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  const config = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Strips all HTML tags and returns plain text
 * @param html - HTML string
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
