from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db, test_connection
from models import Profesora, Aprendiz, Clase, Asistencia
from auth import get_current_user

router = APIRouter(prefix="", tags=["estadisticas"])

class ProfesoraResponse(BaseModel):
    id: int
    nombre: str
    email: str
    especialidad: str
    is_admin: bool = False
    activa: bool = True
    
    class Config:
        from_attributes = True

class ClaseResponse(BaseModel):
    id: int
    profesora_id: int
    titulo: str
    fecha_inicio: datetime
    fecha_fin: datetime
    ubicacion: str
    descripcion: str = None
    activa: bool
    profesora: ProfesoraResponse
    
    class Config:
        from_attributes = True

# Endpoints adicionales de estadísticas y reportes
@router.get("/estadisticas/dashboard")
async def get_estadisticas_dashboard(
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dashboard con estadísticas principales"""
    
    # Filtros base según permisos
    if current_user.is_admin:
        # Admin ve todo
        aprendices_query = db.query(Aprendiz)
        clases_query = db.query(Clase).filter(Clase.activa == True)
        asistencias_query = db.query(Asistencia)
    else:
        # Profesora ve solo sus datos
        aprendices_query = db.query(Aprendiz).filter(Aprendiz.profesora_id == current_user.id)
        clases_query = db.query(Clase).filter(
            Clase.profesora_id == current_user.id,
            Clase.activa == True
        )
        asistencias_query = db.query(Asistencia).filter(Asistencia.profesora_id == current_user.id)
    
    # Conteos básicos
    total_aprendices = aprendices_query.count()
    total_clases = clases_query.count()
    total_asistencias = asistencias_query.count()
    
    # Estadísticas de asistencia del mes actual
    now = datetime.now()
    primer_dia_mes = datetime(now.year, now.month, 1)
    
    asistencias_mes = asistencias_query.filter(
        Asistencia.fecha >= primer_dia_mes.date()
    )
    
    total_asistencias_mes = asistencias_mes.count()
    presentes_mes = asistencias_mes.filter(Asistencia.presente == True).count()
    
    porcentaje_asistencia = 0
    if total_asistencias_mes > 0:
        porcentaje_asistencia = round((presentes_mes / total_asistencias_mes) * 100, 2)
    
    # Clases próximas (siguientes 7 días)
    fecha_limite = datetime.now() + timedelta(days=7)
    clases_proximas = clases_query.filter(
        Clase.fecha_inicio >= datetime.now(),
        Clase.fecha_inicio <= fecha_limite
    ).order_by(Clase.fecha_inicio).limit(5).all()
    
    return {
        "totales": {
            "aprendices": total_aprendices,
            "clases": total_clases,
            "asistencias_registradas": total_asistencias
        },
        "mes_actual": {
            "total_asistencias": total_asistencias_mes,
            "presentes": presentes_mes,
            "ausentes": total_asistencias_mes - presentes_mes,
            "porcentaje_asistencia": porcentaje_asistencia
        },
        "clases_proximas": [ClaseResponse.model_validate(c) for c in clases_proximas]
    }

# Endpoint de salud de la aplicación
@router.get("/health")
async def health_check():
    """Verificar estado de la aplicación"""
    
    db_status = "ok" if test_connection() else "error"
    
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "database": db_status,
        "version": "1.0.0"
    }