# Deployment Security Notes

This document outlines critical security considerations for deploying the SRM Arnik Clinic Management Dashboard in production.

## Architecture Separation

### Frontend (Next.js Application)
- **Deployment**: Deploy the Next.js application in its own isolated container or service
- **User**: Run as a non-root user (e.g., `node` user with UID 1000)
- **Network**: Place in a DMZ or public-facing network segment
- **Ports**: Expose only necessary ports (typically 3000 or 80/443 via reverse proxy)

### Backend API & Database
- **Isolation**: Backend API and MongoDB should run in a separate private network
- **Access Control**: Backend should NOT be directly accessible from the public internet
- **Communication**: Frontend communicates with backend via internal network or VPN
- **User**: Never run Node.js or MongoDB as root user in production

## Environment Variables & Secrets

### Secrets Management
- **Never commit** `.env.local` or any file containing secrets to version control
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) for production
- Rotate secrets regularly (JWT_SECRET, database credentials, API keys)

### Required Environment Variables
```bash
MONGODB_URI="mongodb://..."           # MongoDB connection string
MONGODB_DB="srm-arnik-clinic"         # Database name
JWT_SECRET="<64-char-random-string>"  # JWT signing key (min 32 chars)
NEXT_PUBLIC_API_BASE_URL="https://..."  # Backend API URL
```

### Security Best Practices
- Use strong, randomly generated secrets (minimum 32 characters for JWT_SECRET)
- Use different secrets for development, staging, and production
- Restrict environment variable access to only necessary services
- Enable encryption at rest for secrets storage

## Network Security

### Firewall Rules
- Frontend: Allow inbound on ports 80/443 only
- Backend: Allow inbound only from frontend's private IP range
- Database: Allow inbound only from backend's private IP
- Block all other inbound traffic by default

### TLS/SSL
- **Always use HTTPS** in production (use Let's Encrypt or AWS Certificate Manager)
- Enforce TLS 1.2 or higher
- Configure strong cipher suites
- Enable HSTS (HTTP Strict Transport Security)

### Reverse Proxy
- Use Nginx or similar as a reverse proxy in front of Next.js
- Configure rate limiting to prevent DDoS attacks
- Set appropriate timeout values
- Enable request size limits

## Container Security (Docker/Kubernetes)

### Docker Best Practices
```dockerfile
# Use official Node.js image
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY --chown=nodejs:nodejs . .

# Build application
RUN npm run build

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Kubernetes Security
- Use Pod Security Standards (restricted profile)
- Set resource limits (CPU, memory)
- Use network policies to restrict pod-to-pod communication
- Enable RBAC (Role-Based Access Control)
- Scan container images for vulnerabilities regularly

## Database Security

### MongoDB Configuration
- Enable authentication and authorization
- Use strong passwords (minimum 16 characters, mixed case, numbers, symbols)
- Create separate database users with minimal required permissions
- Enable encryption at rest
- Enable encryption in transit (TLS)
- Regularly backup database and test restore procedures
- Keep MongoDB updated to latest stable version

### Access Control
```javascript
// Example: Create read-only user for reporting
db.createUser({
  user: "reporting_user",
  pwd: "<strong-password>",
  roles: [{ role: "read", db: "srm-arnik-clinic" }]
});
```

## Application Security

### Security Headers
The application now includes security headers in `next.config.ts`:
- Content-Security-Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- X-XSS-Protection
- Permissions-Policy

**Note**: Review and adjust CSP directives based on your specific requirements.

### HTML Sanitization
All user-generated HTML content is sanitized using DOMPurify before rendering to prevent XSS attacks. See `lib/sanitize.ts` for implementation.

### Authentication & Authorization
- JWT tokens are used for authentication
- Tokens should have short expiration times (e.g., 1 hour)
- Implement refresh token mechanism for better UX
- Validate and verify all JWT tokens on the backend
- Implement role-based access control (RBAC)

## File Upload Security

### Current Implementation
- Files are stored in `public/uploads/` directory
- **Production Issue**: This approach doesn't work well with production builds

### Recommended Production Solution
1. **Use External Storage**: AWS S3, Google Cloud Storage, or Azure Blob Storage
2. **Implement Upload Validation**:
   - Validate file types (whitelist approach)
   - Limit file sizes (e.g., max 10MB)
   - Scan uploaded files for malware
   - Generate unique filenames to prevent overwrites
3. **Serve via CDN**: Use CloudFront, CloudFlare, or similar for better performance

## Monitoring & Logging

### Application Monitoring
- Implement application performance monitoring (APM) - New Relic, Datadog, etc.
- Set up error tracking - Sentry, Rollbar, etc.
- Monitor resource usage (CPU, memory, disk)
- Set up alerts for critical errors and performance degradation

### Security Logging
- Log all authentication attempts (success and failure)
- Log all authorization failures
- Log all data modifications (audit trail)
- **Never log sensitive data** (passwords, tokens, PII)
- Implement log rotation and retention policies
- Use centralized logging (ELK stack, CloudWatch, etc.)

### Security Monitoring
- Monitor for suspicious activity patterns
- Set up alerts for:
  - Multiple failed login attempts
  - Unusual API usage patterns
  - Large data exports
  - Access from unusual locations

## Incident Response

### Preparation
- Document incident response procedures
- Maintain contact list for security team
- Keep backups of critical data
- Test disaster recovery procedures regularly

### Response Plan
1. **Detect**: Monitor logs and alerts
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove threat and patch vulnerabilities
4. **Recover**: Restore systems from clean backups
5. **Learn**: Conduct post-incident review

## Regular Maintenance

### Security Updates
- Update dependencies regularly (weekly or monthly)
- Monitor security advisories for Node.js, Next.js, and dependencies
- Apply security patches promptly
- Test updates in staging before production

### Security Audits
- Conduct regular security audits (quarterly)
- Perform penetration testing annually
- Review access controls and permissions
- Audit third-party integrations

### Compliance
- Ensure HIPAA compliance for healthcare data (if applicable)
- Implement GDPR requirements for EU users (if applicable)
- Follow local data protection regulations
- Maintain documentation for compliance audits

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Contact

For security concerns or to report vulnerabilities, contact your security team immediately.

---

**Last Updated**: $(date +%Y-%m-%d)
**Version**: 1.0
