# API Configuration Guide

This document explains how to change the API base URL for the clinic management dashboard application.

## Quick Start

To change the API base URL, you only need to modify **ONE FILE**: `config/api.ts`

## How to Change the API Base URL

### Method 1: Environment Variable (Recommended)

1. Create or update your `.env.local` file in the project root:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-new-api-domain.com
```

2. Restart your development server:
```bash
npm run dev
```

### Method 2: Direct Configuration

1. Open `config/api.ts`
2. Find this line:
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://apis.srmarnik.com";
```

3. Replace it with your new URL:
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://your-new-api-domain.com";
```

### Method 3: Uncomment Pre-configured Options

In `config/api.ts`, you'll find commented examples for different environments:

```typescript
// Uncomment the one you want to use:
// export const API_BASE_URL = "http://localhost:5001";           // Local development
// export const API_BASE_URL = "https://staging.srmarnik.com";     // Staging environment
// export const API_BASE_URL = "https://your-new-domain.com";      // Production environment
```

Simply uncomment the line you want to use and comment out the default one.

## Environment-Specific Configuration

### Development
```typescript
export const API_BASE_URL = "http://localhost:5001";
```

### Staging
```typescript
export const API_BASE_URL = "https://staging.srmarnik.com";
```

### Production
```typescript
export const API_BASE_URL = "https://your-production-domain.com";
```

## Files That Use the Centralized Configuration

The following files automatically use the centralized `API_BASE_URL`:

- `config/api.ts` - Main configuration file
- `lib/api.ts` - CMS data fetching utilities
- `lib/api-utils.ts` - Generic API utilities
- `hooks/use-auth.ts` - Authentication hook
- `app/book-appointment/page.tsx` - Appointment booking page

## Verification

After changing the API base URL:

1. Check the browser's Network tab to ensure requests are going to the correct URL
2. Verify that authentication still works
3. Test a few API endpoints to confirm connectivity

## Troubleshooting

### Issue: Changes not taking effect
**Solution**: Restart your development server after making changes.

### Issue: Environment variable not working
**Solution**: Ensure your `.env.local` file is in the project root and the variable name is exactly `NEXT_PUBLIC_API_BASE_URL`.

### Issue: Build errors
**Solution**: Make sure the new API URL is accessible and returns valid responses.

## Important Notes

- Always use HTTPS in production environments
- Ensure CORS is properly configured on your backend server
- Test thoroughly after changing the API base URL
- The `NEXT_PUBLIC_` prefix is required for client-side environment variables in Next.js

## Need Help?

If you encounter issues after changing the API base URL:

1. Check the browser console for error messages
2. Verify the new API server is running and accessible
3. Ensure all required endpoints are available on the new server
4. Check that authentication tokens are still valid