from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    chat_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatBase(BaseModel):
    title: str

class ChatCreate(ChatBase):
    pass

class Chat(ChatBase):
    id: int
    user_id: int
    created_at: datetime
    messages: List[Message] = []

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    chats: List[Chat] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None