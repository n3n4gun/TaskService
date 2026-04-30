from pydantic import BaseModel

class User(BaseModel):
    user_sid: str
    name: str