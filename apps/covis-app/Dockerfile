FROM covis-base:latest AS base

FROM nginx:alpine

COPY nginx/default.template /etc/nginx/conf.d/default.template

COPY --from=base /app/dist/apps/covis-app /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK CMD curl --fail http://localhost/health || exit 1
CMD envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'
