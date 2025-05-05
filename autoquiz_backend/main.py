from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from models import Base, engine
from dotenv import load_dotenv
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Google Forms Quiz System API",
    description="API for creating and managing quizzes using Google Forms",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)