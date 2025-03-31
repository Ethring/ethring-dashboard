FROM nginxinc/nginx-unprivileged:1.18.0-alpine

COPY ./tests/build/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./playwright-report /var/www
