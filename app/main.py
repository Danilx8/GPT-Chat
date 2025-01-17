import os

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from dotenv import load_dotenv
import openai

from . import crud, models, schemas, auth
from .database import engine, get_db

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")
openai.api_base = "https://api.vsegpt.ru/v1"


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(
        current_user: models.User = Depends(auth.get_current_user)
):
    return current_user


@app.post("/chats/", response_model=schemas.Chat)
def create_chat(
        chat: schemas.ChatCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_chat(db=db, chat=chat, user_id=current_user.id)


@app.get("/chats/", response_model=List[schemas.Chat])
def read_chats(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    chats = crud.get_chats(db, user_id=current_user.id, skip=skip, limit=limit)
    return chats


@app.post("/chats/{chat_id}/messages/", response_model=schemas.Message)
async def create_message(
        chat_id: int,
        message: schemas.MessageCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    # Save user message
    user_message = crud.create_message(db=db, message=message, chat_id=chat_id)

    # Get chat history
    chat_messages = crud.get_chat_messages(db, chat_id=chat_id)

    # Prepare messages for ChatGPT
    messages = [{"role": msg.role, "content": msg.content} for msg in chat_messages]

    try:
        response = openai.ChatCompletion.create(
            model="openai/gpt-4o-mini",
            messages=messages,
            temperature=0,
            n=1,
            max_tokens=1000,
            headers={"X-Title": "My App"}
        )

        # Save assistant's response
        assistant_message = schemas.MessageCreate(
            role="assistant",
            content=response['choices'][0]['message']['content']
        )
        return crud.create_message(db=db, message=assistant_message, chat_id=chat_id)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chats/{chat_id}/messages/", response_model=List[schemas.Message])
def read_chat_messages(
        chat_id: int,
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    messages = crud.get_chat_messages(db, chat_id=chat_id, skip=skip, limit=limit)
    return messages
