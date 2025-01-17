# Кликабельный прототип RAG-системы на базе ChatGPT

## Запуск:

1. Скопировать `.env.example` в `.env` и установить значения для представленных переменных.
2. Создать виртуальное пространство и активировать его:

   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

3. Установить пакеты pip:

   ```bash
   pip install -r requirements.txt
   ```

4. Создать PostgreSQL БД. Например, с помощью контейнера в докере следующей строчкой:

   ```bash
   docker run -d --name my-postgres -e POSTGRES_PASSWORD=mypassword -p 5432:5432 postgres
   ```

5. Запустить миграции:

   ```bash
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

6. Запустить сервер FastAPI:

   ```bash
   uvicorn app.main:app --reload
   ```

7. В папке `frontend` установить зависимости и запустить клиентское приложение:

   ```bash
   npm i
   npm run dev
   ```
