from loguru import logger

from service import TaskService

task_service = TaskService()

class UserTaskApi:
    def user_tasks_description(self, tasks_id: list) -> list[dict]:
        tasks_description = []
        try:
            active_tasks = task_service.read_all_tasks()
            for task_id in tasks_id:
                tasks_description.append({
                    'task_id' : task_id,
                    'task_name' : active_tasks['active_tasks'][task_id]['task_name'],
                    'task_description' : active_tasks['active_tasks'][task_id]['task_description'],
                    'task_state' : active_tasks['active_tasks'][task_id]['task_state'],
                    'executor_id' : active_tasks['active_tasks'][task_id]['executor_id']
                })
        except Exception as user_tasks_description_error:
            logger.error(user_tasks_description_error)
        else:
            return tasks_description