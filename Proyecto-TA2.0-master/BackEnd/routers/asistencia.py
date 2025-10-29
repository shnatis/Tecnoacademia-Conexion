from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database import get_db
from models import Aprendiz, Asistencia, Profesora
from auth import get_current_user
from datetime import datetime, date
import pandas as pd
from fastapi.responses import StreamingResponse
import io
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/asistencia", tags=["Asistencia"])

# Schemas Pydantic mejorados
class AsistenciaCreate(BaseModel):
    aprendiz_id: int
    fecha: date
    presente: bool = True

class AsistenciaUpdate(BaseModel):
    presente: Optional[bool] = None

class AsistenciaResponse(BaseModel):
    id: int
    aprendiz_id: int
    fecha: date
    presente: bool
    profesora_id: int
    aprendiz: Optional[dict] = None
    
    class Config:
        from_attributes = True

class AsistenciaMasivaCreate(BaseModel):
    fecha: date
    asistencias: List[dict]  # [{"aprendiz_id": 1, "presente": True}, ...]

class ToggleAttendance(BaseModel):
    aprendiz_id: int
    fecha: str
    presente: bool

def _parse_date_col(col):
    """Helper function para parsear fechas de diferentes formatos"""
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(str(col), fmt).date()
        except Exception:
            continue
    return None

# CRUD Endpoints mejorados
@router.get("/", response_model=List[AsistenciaResponse])
def obtener_asistencias(
    profesora_id: Optional[int] = Query(None),
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    aprendiz_id: Optional[int] = Query(None),
    presente: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Obtener asistencias con filtros opcionales - versión mejorada"""
    query = db.query(Asistencia).join(Aprendiz)
    
    # Control de permisos
    if not getattr(user, 'is_admin', False):
        query = query.filter(Asistencia.profesora_id == user.id)
    elif profesora_id:
        query = query.filter(Asistencia.profesora_id == profesora_id)
    
    # Filtros de fecha
    if fecha_inicio:
        try:
            fecha_ini = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            query = query.filter(Asistencia.fecha >= fecha_ini)
        except ValueError:
            pass
    
    if fecha_fin:
        try:
            fecha_fin_date = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
            query = query.filter(Asistencia.fecha <= fecha_fin_date)
        except ValueError:
            pass
    
    # Filtros adicionales
    if aprendiz_id:
        query = query.filter(Asistencia.aprendiz_id == aprendiz_id)
    
    if presente is not None:
        query = query.filter(Asistencia.presente == presente)
    
    asistencias = query.order_by(Asistencia.fecha.desc()).all()
    
    # Formatear respuesta
    result = []
    for asist in asistencias:
        result.append({
            "id": asist.id,
            "aprendiz_id": asist.aprendiz_id,
            "fecha": asist.fecha,
            "presente": asist.presente,
            "profesora_id": asist.profesora_id,
            "aprendiz": {
                "id": asist.aprendiz.id,
                "nombre": asist.aprendiz.nombre,
                "documento": asist.aprendiz.documento
            }
        })
    
    return result

@router.post("/", response_model=AsistenciaResponse)
def crear_asistencia(
    asistencia_data: AsistenciaCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Crear asistencia individual - versión mejorada"""
    # Verificar que el aprendiz existe y pertenece al usuario actual (si no es admin)
    aprendiz = db.query(Aprendiz).filter(Aprendiz.id == asistencia_data.aprendiz_id).first()
    if not aprendiz:
        raise HTTPException(
            status_code=404,
            detail="Aprendiz no encontrado"
        )
    
    if not getattr(user, 'is_admin', False) and aprendiz.profesora_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para registrar asistencia de este aprendiz"
        )
    
    # Verificar si ya existe asistencia para ese día
    existing = db.query(Asistencia).filter(
        and_(
            Asistencia.aprendiz_id == asistencia_data.aprendiz_id,
            Asistencia.fecha == asistencia_data.fecha
        )
    ).first()
    
    if existing:
        # Actualizar existente
        existing.presente = asistencia_data.presente
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "aprendiz_id": existing.aprendiz_id,
            "fecha": existing.fecha,
            "presente": existing.presente,
            "profesora_id": existing.profesora_id,
            "aprendiz": {
                "id": existing.aprendiz.id,
                "nombre": existing.aprendiz.nombre,
                "documento": existing.aprendiz.documento
            }
        }
    
    # Crear nueva asistencia
    asistencia = Asistencia(
        aprendiz_id=asistencia_data.aprendiz_id,
        fecha=asistencia_data.fecha,
        presente=asistencia_data.presente,
        profesora_id=user.id
    )
    
    db.add(asistencia)
    db.commit()
    db.refresh(asistencia)
    
    return {
        "id": asistencia.id,
        "aprendiz_id": asistencia.aprendiz_id,
        "fecha": asistencia.fecha,
        "presente": asistencia.presente,
        "profesora_id": asistencia.profesora_id,
        "aprendiz": {
            "id": asistencia.aprendiz.id,
            "nombre": asistencia.aprendiz.nombre,
            "documento": asistencia.aprendiz.documento
        }
    }

@router.post("/masiva")
def crear_asistencia_masiva(
    asistencia_data: AsistenciaMasivaCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Crear múltiples asistencias para una fecha específica"""
    created_count = 0
    updated_count = 0
    errors = []
    
    for item in asistencia_data.asistencias:
        try:
            aprendiz_id = item.get("aprendiz_id")
            presente = item.get("presente", True)
            
            # Verificar que el aprendiz existe
            aprendiz = db.query(Aprendiz).filter(Aprendiz.id == aprendiz_id).first()
            if not aprendiz:
                errors.append(f"Aprendiz {aprendiz_id} no encontrado")
                continue
            
            # Verificar permisos
            if not getattr(user, 'is_admin', False) and aprendiz.profesora_id != user.id:
                errors.append(f"Sin permisos para aprendiz {aprendiz_id}")
                continue
            
            # Buscar si ya existe
            existing = db.query(Asistencia).filter(
                and_(
                    Asistencia.aprendiz_id == aprendiz_id,
                    Asistencia.fecha == asistencia_data.fecha
                )
            ).first()
            
            if existing:
                # Actualizar
                existing.presente = presente
                updated_count += 1
            else:
                # Crear nuevo
                new_asistencia = Asistencia(
                    aprendiz_id=aprendiz_id,
                    fecha=asistencia_data.fecha,
                    presente=presente,
                    profesora_id=user.id
                )
                db.add(new_asistencia)
                created_count += 1
                
        except Exception as e:
            errors.append(f"Error con aprendiz {item.get('aprendiz_id', 'N/A')}: {str(e)}")
    
    db.commit()
    
    return {
        "message": "Asistencia masiva procesada",
        "creadas": created_count,
        "actualizadas": updated_count,
        "errores": errors
    }

@router.patch("/toggle/")
def toggle_attendance(
    item: ToggleAttendance, 
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    """Toggle attendance - mantener funcionalidad existente"""
    ap = db.query(Aprendiz).filter(
        Aprendiz.id == item.aprendiz_id, 
        Aprendiz.profesora_id == user.id
    ).first()
    
    if not ap:
        raise HTTPException(
            status_code=404, 
            detail="Aprendiz no encontrado o no autorizado"
        )
    
    fecha = datetime.fromisoformat(item.fecha).date()
    a = db.query(Asistencia).filter(
        Asistencia.aprendiz_id == item.aprendiz_id, 
        Asistencia.fecha == fecha
    ).first()
    
    if a:
        a.presente = item.presente
    else:
        a = Asistencia(
            aprendiz_id=item.aprendiz_id, 
            fecha=fecha, 
            presente=item.presente, 
            profesora_id=user.id
        )
        db.add(a)
    
    db.commit()
    return {"ok": True}

@router.get("/reporte")
def get_reporte_asistencia(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    profesora_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Generar reporte de asistencia por período"""
    query = db.query(
        Aprendiz.id,
        Aprendiz.nombre,
        Aprendiz.documento,
        func.count(Asistencia.id).label('total_registros'),
        func.sum(func.cast(Asistencia.presente, db.bind.dialect.INTEGER)).label('presentes'),
    ).join(Asistencia, Aprendiz.id == Asistencia.aprendiz_id)
    
    # Filtros de permiso
    if not getattr(user, 'is_admin', False):
        query = query.filter(Aprendiz.profesora_id == user.id)
    elif profesora_id:
        query = query.filter(Aprendiz.profesora_id == profesora_id)
    
    # Filtro de fechas
    query = query.filter(
        and_(
            Asistencia.fecha >= fecha_inicio,
            Asistencia.fecha <= fecha_fin
        )
    ).group_by(Aprendiz.id, Aprendiz.nombre, Aprendiz.documento)
    
    resultados = query.all()
    
    reporte = []
    for resultado in resultados:
        presentes = resultado.presentes or 0
        total = resultado.total_registros or 0
        porcentaje = (presentes / total * 100) if total > 0 else 0
        
        reporte.append({
            "aprendiz_id": resultado.id,
            "nombre": resultado.nombre,
            "documento": resultado.documento,
            "total_clases": total,
            "asistencias": presentes,
            "faltas": total - presentes,
            "porcentaje_asistencia": round(porcentaje, 2)
        })
    
    return {
        "periodo": {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin
        },
        "aprendices": reporte
    }

@router.put("/{asistencia_id}", response_model=AsistenciaResponse)
def actualizar_asistencia(
    asistencia_id: int,
    asistencia_data: AsistenciaUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Actualizar una asistencia específica"""
    asistencia = db.query(Asistencia).filter(Asistencia.id == asistencia_id).first()
    
    if not asistencia:
        raise HTTPException(
            status_code=404,
            detail="Asistencia no encontrada"
        )
    
    # Verificar permisos
    if not getattr(user, 'is_admin', False) and asistencia.profesora_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para editar esta asistencia"
        )
    
    # Actualizar campos
    update_data = asistencia_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asistencia, field, value)
    
    db.commit()
    db.refresh(asistencia)
    
    return AsistenciaResponse.model_validate(asistencia)

@router.delete("/{asistencia_id}")
def eliminar_asistencia(
    asistencia_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Eliminar una asistencia específica"""
    asistencia = db.query(Asistencia).filter(Asistencia.id == asistencia_id).first()
    
    if not asistencia:
        raise HTTPException(
            status_code=404,
            detail="Asistencia no encontrada"
        )
    
    # Verificar permisos
    if not getattr(user, 'is_admin', False) and asistencia.profesora_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para eliminar esta asistencia"
        )
    
    db.delete(asistencia)
    db.commit()
    
    return {"message": "Asistencia eliminada exitosamente"}

# === FUNCIONALIDADES ESPECÍFICAS DE TU SISTEMA EXISTENTE ===

@router.post("/importar/")
@router.post("/importar")
async def importar_asistencia(
    archivo: UploadFile = File(...), 
    nombre_lista: str = "Importada", 
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    """Importar asistencia desde Excel - funcionalidad existente mejorada"""
    try:
        # Leer Excel
        df = pd.read_excel(archivo.file, engine="openpyxl")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo Excel: {e}")

    # Detectar columna de nombre
    nombre_col = None
    for cand in ["NOMBRES", "NOMBRE", "Nombres", "Nombre"]:
        if cand in df.columns:
            nombre_col = cand
            break
    if nombre_col is None:
        nombre_col = df.columns[0]

    # Detectar columnas fecha
    fecha_cols = []
    for col in df.columns:
        fecha_parsed = _parse_date_col(col)
        if fecha_parsed:
            fecha_cols.append((col, fecha_parsed))

    if not fecha_cols:
        raise HTTPException(
            status_code=400, 
            detail="No se encontraron columnas de fecha válidas en el archivo"
        )

    # Crear aprendices y asistencias
    created_aprendices = 0
    created_asistencias = 0
    updated_asistencias = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            nombre = str(row.get(nombre_col, "")).strip()
            if not nombre or nombre.lower() == 'nan':
                continue

            documento = str(row.get("DOCUMENTO", "")).strip() if "DOCUMENTO" in df.columns else None
            if documento and documento.lower() == 'nan':
                documento = None

            # Buscar o crear aprendiz
            aprendiz = None
            if documento:
                aprendiz = db.query(Aprendiz).filter(
                    Aprendiz.documento == documento,
                    Aprendiz.profesora_id == user.id
                ).first()
            
            if not aprendiz:
                # Buscar por nombre si no hay documento
                aprendiz = db.query(Aprendiz).filter(
                    Aprendiz.nombre == nombre,
                    Aprendiz.profesora_id == user.id
                ).first()

            if not aprendiz:
                aprendiz = Aprendiz(
                    nombre=nombre, 
                    documento=documento, 
                    profesora_id=user.id
                )
                db.add(aprendiz)
                db.flush()  # Para obtener el ID
                created_aprendices += 1

            # Insertar asistencias
            for colname, fecha in fecha_cols:
                val = row.get(colname)
                presente = False
                
                if pd.notna(val) and val != '':
                    s = str(val).strip().lower()
                    if s in ("x", "1", "true", "si", "sí", "y", "yes"):
                        presente = True
                    else:
                        try:
                            if float(val) != 0:
                                presente = True
                        except (ValueError, TypeError):
                            if s:  # Si hay algún valor, considerar presente
                                presente = True

                # Upsert asistencia
                existing_asist = db.query(Asistencia).filter(
                    Asistencia.aprendiz_id == aprendiz.id,
                    Asistencia.fecha == fecha
                ).first()

                if existing_asist:
                    existing_asist.presente = presente
                    updated_asistencias += 1
                else:
                    new_asist = Asistencia(
                        aprendiz_id=aprendiz.id,
                        fecha=fecha,
                        presente=presente,
                        profesora_id=user.id
                    )
                    db.add(new_asist)
                    created_asistencias += 1

        except Exception as e:
            errors.append(f"Error procesando fila {idx + 2}: {str(e)}")

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error guardando en base de datos: {e}")

    return {
        "ok": True,
        "aprendices_creados": created_aprendices,
        "asistencias_creadas": created_asistencias,
        "asistencias_actualizadas": updated_asistencias,
        "fechas_procesadas": len(fecha_cols),
        "errores": errors
    }

@router.get("/listas/")
def obtener_listas(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Obtener lista de aprendices con resumen de asistencias"""
    aprendices = db.query(Aprendiz).filter(Aprendiz.profesora_id == user.id).all()
    result = []
    
    for ap in aprendices:
        total_asistencias = len(ap.asistencias)
        total_presentes = sum(1 for a in ap.asistencias if a.presente)
        porcentaje = (total_presentes / total_asistencias * 100) if total_asistencias > 0 else 0
        
        result.append({
            "id": ap.id,
            "nombre": ap.nombre,
            "documento": ap.documento,
            "total_clases": total_asistencias,
            "total_presentes": total_presentes,
            "porcentaje_asistencia": round(porcentaje, 2)
        })
    
    return result

@router.get("/detalle/{aprendiz_id}")
def detalle_aprendiz(
    aprendiz_id: int, 
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    """Obtener detalle completo de asistencias de un aprendiz"""
    ap = db.query(Aprendiz).filter(
        Aprendiz.id == aprendiz_id,
        Aprendiz.profesora_id == user.id
    ).first()
    
    if not ap:
        raise HTTPException(
            status_code=404, 
            detail="Aprendiz no encontrado o no autorizado"
        )
    
    # Ordenar asistencias por fecha
    asistencias_ordenadas = sorted(ap.asistencias, key=lambda x: x.fecha)
    fechas = [a.fecha for a in asistencias_ordenadas]
    asist_map = {a.fecha.isoformat(): a.presente for a in asistencias_ordenadas}
    
    total_presentes = sum(1 for a in asistencias_ordenadas if a.presente)
    porcentaje = (total_presentes / len(asistencias_ordenadas) * 100) if asistencias_ordenadas else 0
    
    return {
        "id": ap.id,
        "nombre": ap.nombre,
        "documento": ap.documento,
        "fechas": [f.isoformat() for f in fechas],
        "asistencias": asist_map,
        "resumen": {
            "total_clases": len(asistencias_ordenadas),
            "total_presentes": total_presentes,
            "total_ausentes": len(asistencias_ordenadas) - total_presentes,
            "porcentaje_asistencia": round(porcentaje, 2)
        }
    }

@router.get("/exportar/")
def exportar_csv(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Exportar asistencias a CSV - funcionalidad existente mejorada"""
    aprendices = db.query(Aprendiz).filter(Aprendiz.profesora_id == user.id).all()
    
    if not aprendices:
        raise HTTPException(status_code=404, detail="No hay aprendices para exportar")
    
    # Recopilar todas las fechas únicas
    fechas_set = set()
    for ap in aprendices:
        for a in ap.asistencias:
            fechas_set.add(a.fecha)
    
    fechas = sorted(list(fechas_set))
    
    if not fechas:
        raise HTTPException(status_code=404, detail="No hay asistencias para exportar")
    
    # Construir filas del CSV
    rows = []
    for ap in aprendices:
        row = {
            "NOMBRES": ap.nombre,
            "DOCUMENTO": ap.documento or ""
        }
        
        total_presentes = 0
        asist_dict = {a.fecha: a.presente for a in ap.asistencias}
        
        for f in fechas:
            presente = asist_dict.get(f, False)
            row[f.strftime("%d/%m/%Y")] = "X" if presente else ""
            if presente:
                total_presentes += 1
        
        row["TOTAL"] = total_presentes
        porcentaje = (total_presentes / len(fechas) * 100) if fechas else 0
        row["PORCENTAJE"] = f"{porcentaje:.1f}%"
        
        rows.append(row)
    
    # Crear DataFrame y CSV
    df = pd.DataFrame(rows)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    
    filename = f"asistencia_{user.nombre.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        io.StringIO(stream.getvalue()), 
        media_type="text/csv", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )