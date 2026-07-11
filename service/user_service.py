import json
import os

from loguru import logger

from conf import FILES

class UserService:
    def write_active_user(self, sid: str, user_id: str, user_login: str) -> bool:
        try:
            active_users = self._read_active_users()
            active_users['active_users'][user_id] = {
                'user_sid' : sid, 
                'user_login' : user_login
            }
            with open(FILES['ACTIVE_USERS_FILE'], 'w', encoding = 'utf-8') as active_users_file:
                json.dump(active_users, active_users_file, ensure_ascii = False, indent = 4)

        except Exception as file_write_error:
            logger.error(file_write_error)

        else:
            logger.info(f'file active_users.json was successfully updated with new user: {user_id}')
            return True
        
    def delete_active_user(self, user_id: str) -> bool:
        try:
            active_users = self._read_active_users()
            del active_users['active_users'][user_id]
            if self._save_file_changes_after_user_disconnect(active_users):
                logger.info(f'user: {user_id} was successfully deleted')
                return True
            else:
                return False
            
        except Exception as file_delet_error:
            logger.error(file_delet_error)
            return False
        
    def check_user_exist(self, user_login: str) -> str | bool:
        try:
            existed_users = self._read_existed_users()
            if user_login in existed_users['existed_users'].keys():
                return existed_users['existed_users'][user_login]['user_id']
            
        except Exception as check_user_exist_error:
            logger.error(check_user_exist_error)

        else:
            return False

    def create_new_user(self, user_login: str, user_id: str) -> bool:
        try:
            existed_users = self._read_existed_users()
            existed_users['existed_users'][user_login] = {
                'user_id' : user_id,
                'user_tasks' : []
            }
            self._write_new_existed_user(existed_users)

        except Exception as create_new_user_error:
            logger.error(create_new_user_error)
        else:
            return True
        
    def save_task_to_user(self, user_login, task_id: str) -> bool:
        try:
            existed_users = self._read_existed_users()
            existed_users['existed_users'][user_login]['user_tasks'].append(task_id)
            with open(FILES['EXISTED_USERS_FILE'], 'w', encoding = 'utf-8') as existed_users_file:
                json.dump(existed_users, existed_users_file, ensure_ascii = False, indent = 4)

        except Exception as save_task_to_user_error:
            logger.error(save_task_to_user_error)
        else:
            return True
        
    def read_user_tasks(self, user_login: str) -> list[dict]:
        from service import UserTaskApi
        user_task_api = UserTaskApi()

        user_tasks_description = []
        try:
            user_tasks = self._read_existed_users()['existed_users'][user_login]['user_tasks'] # -> list
            user_tasks_description = user_task_api.user_tasks_description(user_tasks)

        except Exception as read_user_tasks_error:
            logger.error(read_user_tasks_error)
        else:
            return user_tasks_description
        
    def user_complete_task(self, user_login: str, task_id: str) -> bool:
        try:
            user_tasks = self.read_user_tasks(user_login)
            try:
                for task in user_tasks:
                    if task['task_id'] == task_id:
                        user_tasks.remove(task)
                if self._save_user_tasks_after_delete(user_login, user_tasks):
                    return True
            
            except ValueError as task_id_not_in_list:
                logger.error(task_id_not_in_list)

        except Exception as user_complete_task_error:
            logger.error(user_complete_task_error)

    def user_return_task(self, user_login: str, task_id: str) -> bool:
        try:
            with open(FILES['EXISTED_USERS_FILE'], 'r', encoding = 'utf-8') as existed_users_file:
                existed_users = json.load(existed_users_file)
                existed_users['existed_users'][user_login]['user_tasks'].remove(task_id)

            with open(FILES['EXISTED_USERS_FILE'], 'w', encoding = 'utf-8') as existed_users_file:
                json.dump(existed_users, existed_users_file, ensure_ascii = False, indent = 4)

            return True
        
        except Exception as user_return_task_error:
            logger.error(user_return_task_error)

    def _read_active_users(self) -> dict:
        try:
            with open(FILES['ACTIVE_USERS_FILE'], 'r', encoding = 'utf-8') as active_users_file:
                _active_users = json.load(active_users_file)

        except Exception as _read_active_users_error:
            logger.error(_read_active_users_error)

        else:
            logger.info('file was successfully read')
            return _active_users
        
    def _read_existed_users(self) -> dict:
        try:
            with open(FILES['EXISTED_USERS_FILE'], 'r', encoding = 'utf-8') as _existed_users_file:
                _existed_users = json.load(_existed_users_file)

        except Exception as _read_existed_users_error:
            logger.error(_read_existed_users_error)

        else:
            return _existed_users
        
    def _write_new_existed_user(self, new_existed_users):
        try:
            existed_users = self._read_existed_users()
            existed_users = new_existed_users
            with open(FILES['EXISTED_USERS_FILE'], 'w', encoding = 'utf-8') as _existed_users_file:
                json.dump(existed_users, _existed_users_file, ensure_ascii = False, indent = 4)
                
        except Exception as _write_new_existed_user_error:
            logger.error(_write_new_existed_user_error)
        
    def _save_file_changes_after_user_disconnect(self, active_users: dict) -> bool:
        try:
            new_active_users = self._read_active_users()
            new_active_users = active_users
            with open(FILES['ACTIVE_USERS_FILE'], 'w', encoding = 'utf-8') as _active_users_file:
                json.dump(new_active_users, _active_users_file, ensure_ascii = False, indent = 4)

        except Exception as _save_file_changes_error:
            logger.error(_save_file_changes_error)

        else:
            return True
        
    def _save_user_tasks_after_delete(self, user_login: str, user_tasks: list[dict]) -> bool:
        try:
            existed_users = self._read_existed_users()
            existed_users['existed_users'][user_login]['user_tasks'] = user_tasks
            with open(FILES['EXISTED_USERS_FILE'], 'w', encoding = 'utf-8') as _active_users_file:
                json.dump(existed_users, _active_users_file, ensure_ascii = False, indent = 4)
            return True
        except Exception as _save_user_tasks_after_delete_error:
            logger.error(_save_user_tasks_after_delete_error)
