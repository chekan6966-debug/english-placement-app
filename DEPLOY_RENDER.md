# Deploy to Render

Это приложение лучше размещать как Node.js Web Service, а не как static site: сервер считает результаты, сохраняет попытки и отдает админку.

## Перед деплоем

1. Создайте GitHub-репозиторий и загрузите туда файлы проекта.
2. Создайте аккаунт на Render: https://render.com
3. В Render выберите **New +** -> **Blueprint**.
4. Подключите GitHub-репозиторий с этим проектом.
5. Render прочитает `render.yaml` и создаст Web Service.

## Обязательные переменные

Render попросит значения для переменных с `sync: false`.

Минимально нужно задать:

```text
ADMIN_PASSWORD=любой-надежный-пароль-для-админки
```

После деплоя:

- ссылка для учеников будет вида `https://english-placement-app.onrender.com`
- админка будет `https://english-placement-app.onrender.com/admin`
- в админке нужно ввести `ADMIN_PASSWORD`

## Почта

Если нужно получать результаты на почту, добавьте:

```text
RESULT_RECIPIENT_EMAIL=your-email@example.com
EMAIL_FROM="English Placement <your-email@example.com>"
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
```

## Важно про хранение результатов

`render.yaml` использует persistent disk:

```yaml
disk:
  name: placement-results
  mountPath: /opt/render/project/src/storage
  sizeGB: 1
```

Это нужно, чтобы результаты не исчезали после перезапуска сервера. Без persistent disk многие хостинги стирают локальные файлы при redeploy/restart.
