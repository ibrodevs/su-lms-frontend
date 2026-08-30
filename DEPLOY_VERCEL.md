# Инструкция по деплою фронтенда на Vercel

Фронтенд настроен на обращение к бэкенду:
**`https://sulmsbackend21.pythonanywhere.com/api/v1`**

---

## Вариант 1: Деплой через веб-интерфейс Vercel (Рекомендуется)

1. Зайдите на [vercel.com](https://vercel.com) и войдите через свой GitHub аккаунт.
2. Нажмите **Add New...** -> **Project**.
3. Выберите ваш репозиторий с фронтендом (`su-lms-frontend`).
4. В настройках проекта (**Configure Project**):
   - **Framework Preset**: `Vite` (определится автоматически)
   - **Root Directory**: `./` (или `su-lms-frontend`, если репозиторий объединенный)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. В разделе **Environment Variables** добавьте переменные:
   | Name | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://sulmsbackend21.pythonanywhere.com/api/v1` |
   | `VITE_APP_NAME` | `SU LMS` |
   | `VITE_ENABLE_PASSWORD_RECOVERY` | `false` |
6. Нажмите кнопку **Deploy**.

---

## Вариант 2: Деплой через Vercel CLI (через терминал)

1. Откройте терминал в папке `su-lms-frontend`.
2. Запустите деплой:
   ```bash
   npx vercel --prod
   ```
3. Следуйте подсказкам в терминале:
   - `Set up and deploy?` -> `Y`
   - `Which scope?` -> выберите ваш аккаунт
   - `Link to existing project?` -> `N`
   - `Project name?` -> `su-lms-frontend` (или ваше название)
   - `In which directory is your code located?` -> `./`
4. Vercel соберет проект и выдаст ссылку на готовый сайт (например, `https://su-lms-frontend-xxx.vercel.app`).

---

## Что уже настроено в коде:

- **[`vercel.json`](./vercel.json)**:
  - Автоматический проксирование API `/api/*` -> `https://sulmsbackend21.pythonanywhere.com/api/*`
  - Автоматическое проксирование медиа-файлов `/media/*` -> `https://sulmsbackend21.pythonanywhere.com/media/*`
  - SPA Rewrite: перенаправление всех маршрутов на `/index.html`, чтобы при обновлении страниц (например, `/courses`, `/dashboard`) не возникала ошибка 404.
- **[`src/api/client.ts`](./src/api/client.ts)**:
  - Базовый URL по умолчанию настроен на `https://sulmsbackend21.pythonanywhere.com/api/v1`.
- **[`.env.production`](./.env.production)** и **[`.env`](./.env)**:
  - Переменные окружения уже содержат адрес вашего PythonAnywhere бэкенда.
