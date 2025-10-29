from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from passlib.context import CryptContext

from database import get_db
from models import Profesora
from auth import get_current_user, create_access_token

router = APIRouter(prefix="", tags=["profesoras"])

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquemas Pydantic para Profesoras
class ProfesoraCreate(BaseModel):
    nombre: str
    email: str
    password: str
    especialidad: str

class ProfesoraResponse(BaseModel):
    id: int
    nombre: str
    email: str
    especialidad: str
    is_admin: Optional[bool] = False
    activa: Optional[bool] = True
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

# Endpoints de autenticación
@router.post("/login")
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    profesora = db.query(Profesora).filter(Profesora.email == login_data.email).first()
    
    if not profesora or not pwd_context.verify(login_data.password, profesora.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    if not profesora.activa:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta inactiva"
        )
    
    access_token = create_access_token(data={"sub": profesora.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "profesora": ProfesoraResponse.model_validate(profesora)
    }

@router.post("/register", response_model=ProfesoraResponse)
async def register(profesora_data: ProfesoraCreate, db: Session = Depends(get_db)):
    # Verificar si el email ya existe
    existing_profesora = db.query(Profesora).filter(Profesora.email == profesora_data.email).first()
    if existing_profesora:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear nueva profesora
    hashed_password = pwd_context.hash(profesora_data.password)
    profesora = Profesora(
        nombre=profesora_data.nombre,
        email=profesora_data.email,
        hashed_password=hashed_password,
        especialidad=profesora_data.especialidad
    )
    
    db.add(profesora)
    db.commit()
    db.refresh(profesora)
    
    return ProfesoraResponse.model_validate(profesora)

# Endpoints de profesoras
@router.get("/profesoras", response_model=List[ProfesoraResponse])
async def get_profesoras(
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profesoras = db.query(Profesora).filter(Profesora.activa == True).all()
    return [ProfesoraResponse.model_validate(p) for p in profesoras]

@router.get("/me", response_model=ProfesoraResponse)
async def get_current_profesora(current_user: Profesora = Depends(get_current_user)):
    return ProfesoraResponse.model_validate(current_user)