#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.__ENV__ = {
  API_URL: "${API_URL:-http://localhost:8083}"
}
EOF
exec nginx -g 'daemon off;'
