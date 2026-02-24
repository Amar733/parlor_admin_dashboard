# Security Quick Reference Guide

Quick reference for developers working on the SRM Arnik Clinic Management Dashboard.

## 🔒 Golden Rules

1. **NEVER** commit secrets to version control
2. **ALWAYS** sanitize user-generated HTML before rendering
3. **ALWAYS** validate and sanitize user input
4. **NEVER** trust client-side validation alone
5. **ALWAYS** use HTTPS in production

## 🛡️ Common Security Tasks

### Rendering User-Generated HTML

```typescript
// ❌ WRONG - Vulnerable to XSS
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ CORRECT - Sanitized
import { sanitizeHtml } from '@/lib/sanitize';
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```

### Handling User Input

```typescript
// ✅ Always validate on both client and server
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

// Client-side validation
const result = schema.safeParse(formData);

// Server-side validation (in API route)
const validated = schema.parse(req.body);
```

### Making Authenticated API Calls

```typescript
// ✅ Use authFetch wrapper
import { useAuth } from '@/hooks/use-auth';

const { authFetch } = useAuth();

const response = await authFetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

### Handling Secrets

```typescript
// ❌ WRONG - Exposed to client
const apiKey = 'sk_live_123456789';

// ✅ CORRECT - Server-side only
// In API route or server component
const apiKey = process.env.API_KEY;

// ✅ CORRECT - Public variables (prefixed with NEXT_PUBLIC_)
const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
```

## 📋 Pre-Commit Checklist

Before committing code:

- [ ] No secrets or API keys in code
- [ ] All user input is validated
- [ ] All HTML content is sanitized
- [ ] No console.log statements with sensitive data
- [ ] No commented-out code with secrets
- [ ] .env.local is in .gitignore

## 🔍 Security Review Checklist

When reviewing code:

- [ ] Input validation is present
- [ ] HTML sanitization is used where needed
- [ ] Authentication checks are in place
- [ ] Authorization checks are correct
- [ ] No sensitive data in logs
- [ ] Error messages don't leak information
- [ ] SQL/NoSQL queries are parameterized

## 🚨 Common Vulnerabilities to Avoid

### XSS (Cross-Site Scripting)
```typescript
// ❌ Vulnerable
<div>{userInput}</div> // OK for plain text
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // DANGEROUS

// ✅ Safe
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userInput) }} />
```

### SQL/NoSQL Injection
```typescript
// ❌ Vulnerable
db.collection.find({ email: req.body.email }); // If email contains operators

// ✅ Safe
const email = String(req.body.email); // Ensure it's a string
db.collection.find({ email: email });
```

### Path Traversal
```typescript
// ❌ Vulnerable
const filePath = path.join(uploadDir, req.body.filename);

// ✅ Safe
const filename = path.basename(req.body.filename); // Remove path components
const filePath = path.join(uploadDir, filename);
```

### Insecure Direct Object Reference (IDOR)
```typescript
// ❌ Vulnerable
const user = await db.users.findOne({ _id: req.params.id });

// ✅ Safe - Check ownership
const user = await db.users.findOne({ 
  _id: req.params.id,
  ownerId: req.user.id // Verify user owns this resource
});
```

## 🔧 Useful Commands

### Check for vulnerabilities
```bash
npm audit
npm audit fix
```

### Update dependencies
```bash
npm update
npm outdated
```

### Check for secrets in code
```bash
git grep -i "password\|secret\|api_key\|token"
```

### Test security headers
```bash
curl -I http://localhost:3000
```

## 📚 Key Files

- `lib/sanitize.ts` - HTML sanitization utilities
- `hooks/use-auth.ts` - Authentication logic
- `next.config.ts` - Security headers configuration
- `.env.local` - Environment variables (NEVER commit)
- `SECURITY_CHECKLIST.md` - Complete security checklist
- `DEPLOYMENT_SECURITY_NOTES.md` - Deployment guidelines

## 🆘 What to Do If...

### You accidentally committed a secret
1. **Immediately** rotate the secret (change password, regenerate API key)
2. Remove the secret from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push (if safe to do so)
4. Notify the team

### You find a security vulnerability
1. **Do NOT** create a public issue
2. Contact the security team immediately
3. Document the vulnerability privately
4. Follow the incident response plan

### You're unsure if something is secure
1. Ask the security team
2. Review the security documentation
3. When in doubt, be more restrictive
4. Test in a safe environment first

## 🎯 Security Best Practices

### Authentication
- Use strong passwords (min 12 characters)
- Implement rate limiting
- Add account lockout after failed attempts
- Use secure session management
- Implement MFA where possible

### Authorization
- Follow principle of least privilege
- Check permissions on every request
- Don't rely on client-side checks alone
- Validate user ownership of resources

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Hash passwords with bcrypt/Argon2
- Never log sensitive information
- Implement proper access controls

### Error Handling
- Don't expose stack traces in production
- Log errors securely
- Show user-friendly error messages
- Don't leak system information

## 📞 Contacts

- **Security Team**: [security@example.com]
- **DevOps Team**: [devops@example.com]
- **Emergency**: [Follow incident response plan]

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!

**Last Updated**: $(date +%Y-%m-%d)
