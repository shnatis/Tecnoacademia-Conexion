from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# Importaciones locales
from database import engine
from models import Base
from startup_admin import ensure_admin

# Crear las tablas
Base.metadata.create_all(bind=engine)

# Inicializar FastAPI
app = FastAPI(title="Sistema de Asistencia TecnoAcademia")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # o ["http://127.0.0.1:5500"] si usas Live Server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir todos los routers
from routers.asistencia import router as asistencia_router
from routers.aprendices import router as aprendices_router
from routers.profesoras import router as profesoras_admin_router
from routers.clases import router as clases_router
from routers.profesoras_general import router as profesoras_general_router
from routers.estadisticas import router as estadisticas_router

# Registrar routers
app.include_router(asistencia_router)
app.include_router(aprendices_router)
app.include_router(profesoras_admin_router)
app.include_router(clases_router)
app.include_router(profesoras_general_router)
app.include_router(estadisticas_router)

if __name__ == "__main__":
    ensure_admin()
    uvicorn.run(app, host="0.0.0.0", port=8000)