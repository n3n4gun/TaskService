import redis

from loguru import logger

class RedisConnection:
    def __init__(self, host: str = '127.0.0.1', port: int = 6379, password: str = 'my_password'):
        try:
            self.redis_connection = redis.StrictRedis(
                host = host,
                port = port,
                password = password
            )

        except Exception as redis_connection_error:
            logger.error(redis_connection_error)

    def new_user_connection(self, user_id: str, user_login: str, user_sid: str) -> bool:
        try:
            self.redis_connection.hset(f'active_users:{user_id}', mapping = {
                'user_login' : user_login,
                'user_sid' : user_sid
            })
            self.redis_connection.expire(f'active_users:{user_id}', 3600) # устанавливаем TTL
            logger.info(f'User: {user_login} was added in Redis')

            return True

        except Exception as new_user_connection_error:
            logger.error(new_user_connection_error)

r_conn = RedisConnection()