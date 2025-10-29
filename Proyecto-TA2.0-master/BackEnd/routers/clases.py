from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import pytz

from database import get_db
from models import Clase, Profesora
from auth import get_current_user

router = APIRouter(prefix="/clases", tags=["clases"])

# Esquemas Pydantic para Clases
class ClaseCreate(BaseModel):
    profesora_id: int
    titulo: str
    fecha_inicio: datetime
    fecha_fin: datetime
    ubicacion: str  # "Colegio" o "Centro TecnoAcademia"
    descripcion: Optional[str] = None

class ClaseUpdate(BaseModel):
    titulo: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    ubicacion: Optional[str] = None
    descripcion: Optional[str] = None
    activa: Optional[bool] = None

class ProfesoraResponse(BaseModel):
    id: int
    nombre: str
    email: str
    especialidad: str
    is_admin: Optional[bool] = False
    activa: Optional[bool] = True
    
    class Config:
        from_attributes = True

class ClaseResponse(BaseModel):
    id: int
    profesora_id: int
    titulo: str
    fecha_inicio: datetime
    fecha_fin: datetime
    ubicacion: str
    descripcion: Optional[str]
    activa: bool
    profesora: ProfesoraResponse
    
    class Config:
        from_attributes = True

# Endpoints de clases (CRUD completo)
@router.post("", response_model=ClaseResponse)
async def crear_clase(
    clase_data: ClaseCreate,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Si no es admin, solo puede crear clases para sí mismo
    if not current_user.is_admin and clase_data.profesora_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes crear clases para ti mismo"
        )
    
    # Verificar que la profesora existe
    profesora = db.query(Profesora).filter(Profesora.id == clase_data.profesora_id).first()
    if not profesora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profesora no encontrada"
        )
    
    clase = Clase(**clase_data.model_dump())
    db.add(clase)
    db.commit()
    db.refresh(clase)
    
    return ClaseResponse.model_validate(clase)

@router.get("", response_model=List[ClaseResponse])
async def get_clases(
    profesora_id: Optional[int] = None,
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    activa: Optional[bool] = None,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Clase)
    
    # Si no es admin, solo ver sus propias clases
    if not current_user.is_admin:
        query = query.filter(Clase.profesora_id == current_user.id)
    elif profesora_id:
        query = query.filter(Clase.profesora_id == profesora_id)
    
    if fecha_inicio:
        query = query.filter(Clase.fecha_inicio >= fecha_inicio)
    
    if fecha_fin:
        query = query.filter(Clase.fecha_fin <= fecha_fin)
    
    if activa is not None:
        query = query.filter(Clase.activa == activa)
    
    clases = query.order_by(Clase.fecha_inicio).all()
    return [ClaseResponse.model_validate(c) for c in clases]

@router.get("/{clase_id}", response_model=ClaseResponse)
async def get_clase(
    clase_id: int,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clase = db.query(Clase).filter(Clase.id == clase_id).first()
    
    if not clase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase no encontrada"
        )
    
    # Verificar permisos
    if not current_user.is_admin and clase.profesora_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta clase"
        )
    
    return ClaseResponse.model_validate(clase)

@router.put("/{clase_id}", response_model=ClaseResponse)
async def actualizar_clase(
    clase_id: int,
    clase_data: ClaseUpdate,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clase = db.query(Clase).filter(Clase.id == clase_id).first()
    
    if not clase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase no encontrada"
        )
    
    # Verificar permisos
    if not current_user.is_admin and clase.profesora_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar esta clase"
        )
    
    # Actualizar campos
    update_data = clase_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(clase, field, value)
    
    db.commit()
    db.refresh(clase)
    
    return ClaseResponse.model_validate(clase)

@router.delete("/{clase_id}")
async def eliminar_clase(
    clase_id: int,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clase = db.query(Clase).filter(Clase.id == clase_id).first()
    
    if not clase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase no encontrada"
        )
    
    # Verificar permisos
    if not current_user.is_admin and clase.profesora_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar esta clase"
        )
    
    db.delete(clase)
    db.commit()
    
    return {"message": "Clase eliminada exitosamente"}

@router.get("/calendario/mes")
async def get_calendario_clases(
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tz = pytz.timezone('America/Bogota')
    if not mes or not anio:
        now = datetime.now(tz)
        mes = mes or now.month
        anio = anio or now.year

    # Primer y último día del mes en zona horaria Colombia
    primer_dia = tz.localize(datetime(anio, mes, 1))
    if mes == 12:
        ultimo_dia = tz.localize(datetime(anio + 1, 1, 1)) - timedelta(days=1)
    else:
        ultimo_dia = tz.localize(datetime(anio, mes + 1, 1)) - timedelta(days=1)

    query = db.query(Clase).filter(
        Clase.fecha_inicio >= primer_dia,
        Clase.fecha_inicio <= ultimo_dia,
        Clase.activa == True
    )

    # Si no es admin, solo sus clases
    if not current_user.is_admin:
        query = query.filter(Clase.profesora_id == current_user.id)
    
    clases = query.all()
    
    return [ClaseResponse.model_validate(c) for c in clases]