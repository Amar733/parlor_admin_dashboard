# SRM Arnik Skin & Healthcare Clinic - Admin Panel

This is a Next.js application serving as the administrative backend for the SRM Arnik Skin & Healthcare Clinic. It's built with Next.js, TypeScript, Tailwind CSS, ShadCN UI components, and MongoDB.

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A [MongoDB](https://www.mongodb.com/) database instance (local or cloud-hosted with MongoDB Atlas)

### 1. Installation

First, clone the repository and install the project dependencies.

```bash
npm install
```

### 2. Environment Setup

The project uses a `.env.local` file to store sensitive information like database credentials and secret keys.

Create a file named `.env.local` in the root of the project and add the following variables:

```env
MONGODB_URI="your_mongodb_connection_string_here"
MONGODB_DB="your_database_name_here"
JWT_SECRET="your_super_secret_key_that_is_at_least_32_characters_long"
NEXT_PUBLIC_API_BASE_URL="https://your-api-server.com"
```

- **`MONGODB_URI`**: Your full MongoDB connection string.
- **`MONGODB_DB`**: The name of the database you want to use (e.g., `srm-arnik-clinic`).
- **`JWT_SECRET`**: A long, random, and unique string used for signing authentication tokens.
- **`NEXT_PUBLIC_API_BASE_URL`**: The base URL for your API server (optional, defaults to https://apis.srmarnik.com).

## API Configuration

To change the API base URL for connecting to your backend server, see the [API Configuration Guide](./API_CONFIGURATION.md) for detailed instructions.

### 3. Running the Development Server

Once the setup is complete, you can start the development server.

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## Available Scripts

- **`npm run dev`**: Starts the development server with hot-reloading.
- **`npm run build`**: Builds the application for production.
- **`npm run start`**: Starts a production server (requires a build first).
- **`npm run lint`**: Lints the codebase for errors.

## Security

🔒 **This application has been hardened against common web vulnerabilities including XSS, RCE, and OWASP Top 10 threats.**

### Security Features

- ✅ **HTML Sanitization**: All user-generated HTML is sanitized using DOMPurify to prevent XSS attacks
- ✅ **Security Headers**: Comprehensive security headers including CSP, X-Frame-Options, and more
- ✅ **Updated Dependencies**: All dependencies updated to latest stable versions with security patches
- ✅ **JWT Authentication**: Secure token-based authentication with automatic logout on expiration

### Security Documentation

For detailed security information, see:

- **[SECURITY_HARDENING_SUMMARY.md](./SECURITY_HARDENING_SUMMARY.md)** - Executive summary of security improvements
- **[SECURITY_UPDATES.md](./SECURITY_UPDATES.md)** - Detailed technical changes and testing procedures
- **[DEPLOYMENT_SECURITY_NOTES.md](./DEPLOYMENT_SECURITY_NOTES.md)** - Production deployment security guidelines
- **[SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)** - Comprehensive security checklist
- **[SECURITY_QUICK_REFERENCE.md](./SECURITY_QUICK_REFERENCE.md)** - Developer quick reference guide

### Important Security Notes

⚠️ **Before deploying to production**:
1. Review and update environment variables with strong secrets
2. Remove development-only image domains from `next.config.ts`
3. Configure HTTPS/TLS with valid certificates
4. Set up monitoring and logging
5. Follow the deployment checklist in `SECURITY_UPDATES.md`

⚠️ **After updating dependencies**:
```bash
# Delete old dependencies
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Check for vulnerabilities
npm audit
```

## File Uploads

This application uses a local file storage strategy suitable for development.

- **Storage Location**: Uploaded files (images, videos) are stored in the `public/uploads` directory.
- **Serving Files**: Next.js automatically serves files from the `public` directory at the root URL. A file at `public/uploads/photo.jpg` is accessible at `/uploads/photo.jpg`.
- **Database**: The MongoDB database stores the public URL path to the file (e.g., `/uploads/1678886400000-photo.jpg`), not the file itself.
- **Production Issue**: This method works well for `npm run dev`. However, with a production build (`npm run build`), files added to the `public` folder after the build is complete will not be recognized by the server until it is restarted. For a production-ready solution, a dynamic file serving route or an external storage service (like Firebase Storage or S3) would be required.
