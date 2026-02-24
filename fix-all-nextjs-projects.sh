#!/bin/bash

# CVE-2025-66478 Fix Script for All Next.js Projects
# Run this from your projects parent directory

echo "🚨 Scanning for vulnerable Next.js projects..."
echo ""

VULNERABLE_FOUND=0

# Find all package.json files
for package in $(find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.next/*"); do
    DIR=$(dirname "$package")
    
    # Check if Next.js is installed
    NEXT_VERSION=$(grep -o '"next"[[:space:]]*:[[:space:]]*"[^"]*"' "$package" | grep -o '[0-9][^"]*')
    
    if [ ! -z "$NEXT_VERSION" ]; then
        echo "📦 Project: $DIR"
        echo "   Next.js: $NEXT_VERSION"
        
        # Check if vulnerable
        VULNERABLE=0
        case "$NEXT_VERSION" in
            15.0.*) [ "$NEXT_VERSION" != "15.0.5" ] && VULNERABLE=1 && PATCH="15.0.5" ;;
            15.1.*) [ "$NEXT_VERSION" != "15.1.9" ] && VULNERABLE=1 && PATCH="15.1.9" ;;
            15.2.*) [ "$NEXT_VERSION" != "15.2.6" ] && VULNERABLE=1 && PATCH="15.2.6" ;;
            15.3.*) [ "$NEXT_VERSION" != "15.3.6" ] && VULNERABLE=1 && PATCH="15.3.6" ;;
            15.4.*) [ "$NEXT_VERSION" != "15.4.8" ] && VULNERABLE=1 && PATCH="15.4.8" ;;
            15.5.*) [ "$NEXT_VERSION" != "15.5.7" ] && VULNERABLE=1 && PATCH="15.5.7" ;;
            16.0.*) [ "$NEXT_VERSION" != "16.0.7" ] && VULNERABLE=1 && PATCH="16.0.7" ;;
            14.3.0-canary.*) VULNERABLE=1 && PATCH="14" ;;
        esac
        
        if [ $VULNERABLE -eq 1 ]; then
            echo "   ⚠️  VULNERABLE - Needs update to $PATCH"
            VULNERABLE_FOUND=1
            
            read -p "   Fix now? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cd "$DIR"
                echo "   🔧 Fixing..."
                rm -rf node_modules package-lock.json
                npm install next@$PATCH
                npm install
                echo "   ✅ Fixed! Next.js updated to $PATCH"
                cd - > /dev/null
            fi
        else
            echo "   ✅ Safe"
        fi
        echo ""
    fi
done

if [ $VULNERABLE_FOUND -eq 0 ]; then
    echo "✅ No vulnerable Next.js projects found!"
else
    echo "⚠️  IMPORTANT: After fixing all projects:"
    echo "   1. Redeploy all updated apps"
    echo "   2. ROTATE ALL SECRETS (JWT, API keys, passwords)"
    echo "   3. Run: npx fix-react2shell-next in each project"
fi
