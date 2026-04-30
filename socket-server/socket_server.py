import sys
import uuid
import socketio

from pathlib import Path
from loguru import logger

root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

from models import User, Task
from service import (
    UserService, TaskService
)

socket_server = socketio.AsyncServer(async_mode = 'asgi')
socket_app = socketio.ASGIApp(socketio_server = socket_server)

user_service = UserService()
task_service = TaskService()

@socket_server.event
async def connect(sid, environ, auth):                  # СОБЫТИЕ - подключение пользователя к серверу
    user_login = auth.get('login')
    user_id = user_service.check_user_exist(user_login)

    if not user_id:
        user_id = str(uuid.uuid4().hex)
        if user_service.create_new_user(user_login, user_id):
            logger.info(f'new user: {user_login} user_id: {user_id} --> was created')
        else:
            logger.error(f'unsuccessful attempt to create new user {user_login}')   

    await socket_server.save_session(sid = sid, session = {
        'user_id' : user_id,
        'user_login' : user_login
    })
    
    user_tasks = user_service.read_user_tasks(user_login)
    active_tasks = task_service.read_all_tasks()

    if user_service.write_active_user(sid, user_id, user_login):
        logger.info(f"user: {user_login} connected --> user_id: {user_id} --> user_sid: {sid}")
        await socket_server.emit(
            event = 'user_connection',
            data = {
                'user_tasks' : user_tasks,
                'active_tasks' : active_tasks
            },
            to = sid
        )
    else:
        logger.error(f'unsuccessful attempt to write user {sid} to the file')

@socket_server.on('create_task')                        # СОБЫТИЕ - пользователь создает новую задачу и размещает ее в общем доступе
async def user_create_task(sid, data):
    task_name, task_description = data['name'], data['description']
    task_creation_state = task_service.create_new_task(task_name, task_description)
    if task_creation_state:
        active_tasks = task_service.read_all_tasks()
        await socket_server.emit(
            event = 'new_task',
            data = active_tasks
        )
    else:
        logger.error(f'unsuccessful attempt to create new task by user: {sid}')

@socket_server.on('take_task')                          # СОБЫТИЕ - пользователь принимает на выполнение выбранную задачу
async def user_take_task(sid, data):
    task_id = data['task_id']
    async with socket_server.session(sid = sid) as user_session:
        user_id = user_session.get('user_id')
        user_login = user_session.get('user_login')

    if task_service.user_take_task(user_id, task_id) and user_service.save_task_to_user(user_login, task_id):
        user_tasks = user_service.read_user_tasks(user_login)
        logger.info(f'user: {user_id} take task: {task_id}')
        await socket_server.emit(
            event = 'take_new_task',
            data = user_tasks,
            to = sid
        )

        # продумать функцию ниже...как лучше отправлять другим пользователям информацию о том, что
        # клиент взял задачу в работу
        # НАДО ЛИ ЭТО ВООБЩЕ ДЕЛАТЬ?
        # по сути остальным клиентам просто рассылается обновленнное состояние списка задач

        active_tasks = task_service.read_all_tasks()
        await socket_server.emit(
            event = 'tasks_states_update',
            data = active_tasks,
        )   # рассылка пользователям обновленные сведения о задачах
            # то, что задача была кем то принята
    else:
        logger.warning(f'user: {user_login} tries to take busy task: {task_id}')

@socket_server.on('return_task')                        # СОБЫТИЕ - пользователь не смог выполнить задачу, поэтому он возвращает ее
async def user_return_task(sid, data):
    task_id = data['task_id']

    async with socket_server.session(sid = sid) as user_session:
        user_login = user_session.get('user_login')

@socket_server.event
async def disconnect(sid, reason):
    async with socket_server.session(sid = sid) as user_session:
        user_id = user_session.get('user_id')
    if user_service.delete_active_user(user_id):
        logger.info(f'user: {sid} disconnected --> reason: {reason}')
    else:
        logger.error(f'problem with user: {sid} disconnection')