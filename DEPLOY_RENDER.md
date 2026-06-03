# Deploy to Render

Это приложение можно разместить как бесплатный Node.js Web Service, но у бесплатного Render есть важные ограничения.

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

Чтобы результаты приходили на почту в бесплатном варианте, также задайте:

```text
RESULT_WEBHOOK_URL=https://script.google.com/macros/s/ваш-id/exec
RESULT_WEBHOOK_SECRET=тот-же-секрет-что-в-Google-Apps-Script
```

После деплоя:

- ссылка для учеников будет вида `https://english-placement-app.onrender.com`
- админка будет `https://english-placement-app.onrender.com/admin`
- в админке нужно ввести `ADMIN_PASSWORD`

## Почта: бесплатный вариант

На Render Free обычный SMTP не подходит: бесплатные web services не могут отправлять исходящий трафик на SMTP-порты `25`, `465` и `587`.

Используйте Google Apps Script:

1. Создайте Google Sheet.
2. Откройте `Extensions` -> `Apps Script`.
3. Вставьте код из `google-apps-script/Code.gs`.
4. В начале файла замените:

```js
const RECIPIENT_EMAIL = "your-email@example.com";
const WEBHOOK_SECRET = "change-this-secret";
```

5. Нажмите `Deploy` -> `New deployment`.
6. Type: `Web app`.
7. Execute as: `Me`.
8. Who has access: `Anyone`.
9. Скопируйте Web app URL в `RESULT_WEBHOOK_URL`.
10. Значение `WEBHOOK_SECRET` вставьте в Render как `RESULT_WEBHOOK_SECRET`.

## Почта: SMTP вариант

Если приложение размещается не на Render Free, можно использовать SMTP:

```text
RESULT_RECIPIENT_EMAIL=your-email@example.com
EMAIL_FROM="English Placement <your-email@example.com>"
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
```

## Важно про бесплатный Render

В бесплатном варианте `render.yaml` использует `plan: free` и не подключает persistent disk.

Это значит:

- сайт получает постоянную публичную ссылку;
- сервис может засыпать после простоя, первый запуск может занять около минуты;
- результаты, сохраненные в локальные JSON-файлы, могут пропасть после перезапуска/редеплоя/сна сервиса;
- для надежного бесплатного хранения результатов лучше подключить Google Sheets / Apps Script или другой бесплатный внешний приемник.
