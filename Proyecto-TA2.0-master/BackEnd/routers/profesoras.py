from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from passlib.context import CryptContext

from database import get_db
from models import Profesora
from auth import get_current_admin, get_current_user

router = APIRouter(prefix="/admin/profesoras", tags=["admin-profesoras"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ProfesoraUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    especialidad: Optional[str] = None
    activa: Optional[bool] = None
    is_admin: Optional[bool] = None

class ProfesoraPasswordUpdate(BaseModel):
    nueva_password: str


class ProfesoraCreate(BaseModel):
    nombre: str
    email: str
    password: str
    especialidad: str


@router.get("/")
async def listar_profesoras_admin(
    current_admin: Profesora = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Listar todas las profesoras (incluye inactivas). Solo accesible por admin.
    """
    profesoras = db.query(Profesora).all()
    result = []
    for p in profesoras:
        result.append({
            "id": p.id,
            "nombre": p.nombre,
            "email": p.email,
            "especialidad": p.especialidad,
            "is_admin": getattr(p, 'is_admin', False),
            "activa": getattr(p, 'activa', True)
        })
    return result

# CRUD adicional para profesoras (solo admin)
@router.put("/{profesora_id}")
async def actualizar_profesora(
    profesora_id: int,
    profesora_data: ProfesoraUpdate,
    current_admin: Profesora = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    profesora = db.query(Profesora).filter(Profesora.id == profesora_id).first()
    
    if not profesora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profesora no encontrada"
        )
    
    # Verificar email único si se está cambiando
    if profesora_data.email and profesora_data.email != profesora.email:
        existing = db.query(Profesora).filter(Profesora.email == profesora_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está en uso"
            )
    
    # Actualizar campos
    update_data = profesora_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profesora, field, value)
    
    db.commit()
    db.refresh(profesora)
    
    return {"message": "Profesora actualizada exitosamente"}

@router.put("/{profesora_id}/password")
async def cambiar_password_profesora(
    profesora_id: int,
    password_data: ProfesoraPasswordUpdate,
    current_admin: Profesora = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    profesora = db.query(Profesora).filter(Profesora.id == profesora_id).first()
    
    if not profesora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profesora no encontrada"
        )
    
    # Hashear nueva contraseña
    profesora.hashed_password = pwd_context.hash(password_data.nueva_password)
    
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}

@router.delete("/{profesora_id}")
async def eliminar_profesora(
    profesora_id: int,
    current_admin: Profesora = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    profesora = db.query(Profesora).filter(Profesora.id == profesora_id).first()
    
    if not profesora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profesora no encontrada"
        )
    
    # No permitir eliminar al admin actual
    if profesora.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta"
        )
    
    db.delete(profesora)
    db.commit()
    
    return {"message": "Profesora eliminada exitosamente"}


@router.post("/")
async def crear_profesora_admin(
    profesora_data: ProfesoraCreate,
    current_admin: Profesora = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Verificar si el email ya existe
    existing = db.query(Profesora).filter(Profesora.email == profesora_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    hashed = pwd_context.hash(profesora_data.password)
    profesora = Profesora(
        nombre=profesora_data.nombre,
        email=profesora_data.email,
        hashed_password=hashed,
        especialidad=profesora_data.especialidad,
        activa=True
    )

    db.add(profesora)
    db.commit()
    db.refresh(profesora)

    return {"message": "Profesora creada exitosamente", "id": profesora.id}