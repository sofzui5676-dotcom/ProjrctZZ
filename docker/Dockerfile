FROM nginx:alpine

# Копируем конфигурацию nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Копируем файлы фронтенда
COPY frontend/src /usr/share/nginx/html
COPY frontend/public /usr/share/nginx/html/public

# Открываем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
