from pydantic import BaseModel

class Task(BaseModel):
    task_id: str
    name: str
    description: str