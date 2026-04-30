import uuid
import json

from loguru import logger

class TaskService:
    def create_new_task(self, task_name, task_description) -> bool:
        task_id = str(uuid.uuid4().hex)
        task_state = 'not_accepted' # статус задачи, который назначается при создании, что означает, что она еще не принята никем в работу
        try:
            active_tasks = self.read_all_tasks()
            active_tasks['active_tasks'][task_id] = {
                'task_name' : task_name,
                'task_description' : task_description,
                'task_state' : task_state,
                'executor_id' : None
            }
            self._write_new_task_to_the_file(active_tasks)
        except Exception as create_new_task_error:
            logger.error(create_new_task_error)
        else:
            logger.info(f'new task was added --> task_id: {task_id}')
            return True

    def read_all_tasks(self) -> dict:
        try:
            with open('json_files/active_tasks.json', 'r', encoding = 'utf') as active_tasks_file:
                active_tasks = json.load(active_tasks_file)
        except Exception as read_active_tasks_file_error:
            logger.error(read_active_tasks_file_error)
        else:
            return active_tasks
    
    def user_take_task(self, user_id: str, task_id: str) -> bool:
        try:
            active_tasks = self.read_all_tasks()
            if self._check_task_free(task_id, active_tasks):
                active_tasks['active_tasks'][task_id]['executor_id'] = user_id
                active_tasks['active_tasks'][task_id]['task_state'] = 'accepted'
                self._write_new_task_to_the_file(active_tasks)
            else:
                return False
        except Exception as user_take_task_error:
            logger.error(user_take_task_error)
        else:
            return True

    def _write_new_task_to_the_file(self, active_tasks):
        try:
            new_active_tasks = self.read_all_tasks()
            new_active_tasks = active_tasks
            with open('json_files/active_tasks.json', 'w', encoding = 'utf-8') as active_tasks_file:
                json.dump(new_active_tasks, active_tasks_file, ensure_ascii = False, indent = 4)
                logger.info('new  data were successfully written to the file')
        except Exception as write_file_error:
            logger.error(write_file_error)

    def _check_task_free(self, task_id: str, active_tasks: dict) -> bool:
        try:
            _active_tasks = active_tasks['active_tasks']
            if _active_tasks[task_id]['executor_id'] != None:
                return False
            return True
        except Exception as _checl_task_free_error:
            logger.error(_checl_task_free_error)
