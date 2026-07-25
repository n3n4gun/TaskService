# TaskService

Небольшой pet-проект — сервис управления задачами в реальном времени на базе **Socket.IO / WebSocket**. Пользователи подключаются по сокету, видят список общих задач, могут создавать новые, брать их в работу, завершать или возвращать обратно в пул. Все изменения рассылаются подключённым клиентам мгновенно (broadcast-события).

## Как это работает

1. Клиент подключается к серверу через `socket.io-client`, передавая в `auth` свой логин (`{ login: "..." }`).
2. Сервер ищет пользователя в `existed_users.json`; если не находит — создаёт нового и выдаёт `user_id`.
3. При подключении клиенту приходит событие `user_connection` со списком его личных задач и всех активных задач в системе.
4. Дальнейшее взаимодействие идёт через события: создание задачи, взятие в работу, завершение, возврат — сервер обновляет JSON-файлы и рассылает всем клиентам актуальное состояние.

Текущее хранилище — плоские JSON-файлы (`json_files/`), без БД. Каталог [redis/](redis/) — задел на переход к Redis (пока подключение и запись активного пользователя реализованы, но в основной поток `socket_server.py` ещё не интегрированы).

## Стек

- **Backend:** Python 3.10, [python-socketio](https://python-socketio.readthedocs.io/) (`AsyncServer`, ASGI), [uvicorn](https://www.uvicorn.org/), [pydantic](https://docs.pydantic.dev/), [loguru](https://github.com/Delgan/loguru)
- **Хранилище:** JSON-файлы (`json_files/`), опционально Redis (`redis-py`)
- **Клиент (демо/тесты):** Node.js, `socket.io-client`

## Структура проекта

```
TaskService/
├── conf/                    # конфигурация (пути до JSON-файлов)
│   └── files_dir.py
├── models/                  # pydantic-модели
│   ├── task.py
│   └── user.py
├── service/                 # бизнес-логика
│   ├── task_service.py      # CRUD и состояния задач
│   ├── user_service.py      # пользователи, привязка задач к пользователю
│   └── user_task_api.py     # сборка описаний задач пользователя
├── socket-server/
│   ├── socket_server.py     # обработчики Socket.IO событий
│   └── run_socket_server.py # точка входа (uvicorn)
├── redis/
│   └── redis_server.py      # экспериментальная интеграция с Redis
├── json_files/               # файловое "хранилище" (active_tasks, active_users, existed_users, completed_tasks)
├── static/js/                # демо-клиенты на socket.io-client
│   ├── socket_client_1.js
│   └── socket_client_2.js
└── task_file_structure_example.txt / existed_users_file_structure.txt  # примеры структуры JSON
```

## Модель данных

**Задача** (`active_tasks.json`):
```json
{
  "active_tasks": {
    "<task_id>": {
      "task_name": "string",
      "task_description": "string",
      "task_state": "not_accepted | accepted",
      "executor_id": "user_id | null"
    }
  }
}
```

**Пользователь** (`existed_users.json`):
```json
{
  "existed_users": {
    "<user_login>": {
      "user_id": "string",
      "user_tasks": ["task_id", "..."]
    }
  }
}
```

## Socket.IO события

| Направление | Событие | Payload | Описание |
|---|---|---|---|
| client → server | `connect` (auth) | `{ login }` | авторизация/создание пользователя |
| server → client | `user_connection` | `{ user_tasks, active_tasks }` | состояние при подключении |
| client → server | `create_task` | `{ name, description }` | создать новую задачу |
| server → all | `new_task` | `active_tasks` | новая задача добавлена |
| client → server | `take_task` | `{ task_id }` | взять задачу в работу |
| server → client | `take_new_task` | список задач пользователя | подтверждение взятия |
| server → all | `tasks_states_update` | `active_tasks` | изменилось состояние задач |
| client → server | `complete_task` | `{ task_id }` | завершить задачу |
| client → server | `return_task` | `{ task_id }` | вернуть задачу в общий пул |
| server → all | `user_return_task` | `active_tasks` | задача вернулась в пул |

## Запуск

### Требования
- Python 3.10+
- Node.js (для демо-клиентов)
- (опционально) Redis, если используете `redis/redis_server.py`

### Backend

```bash
python -m venv myvenv
myvenv\Scripts\activate          # Windows
pip install python-socketio uvicorn pydantic loguru redis

cd socket-server
python run_socket_server.py      # поднимет сервер на http://127.0.0.1:8888
```

> Пути к JSON-файлам заданы абсолютно в `conf/files_dir.py` — при запуске на другой машине их нужно поправить под свой путь до репозитория.

### Демо-клиенты

```bash
npm install
node static/js/socket_client_1.js
node static/js/socket_client_2.js
```

Каждый клиент подключается под своим логином и в консоли показывает события подключения, создания/взятия/завершения/возврата задач.

## Известные ограничения

- Нет `requirements.txt` — зависимости нужно ставить вручную (см. список выше).
- Хранилище — обычные JSON-файлы без блокировок, для конкурентной записи не рассчитано.
- Интеграция с Redis (`redis/redis_server.py`) не подключена к основному сокет-серверу.
- Пути к файлам в `conf/files_dir.py` захардкожены под конкретную машину.
