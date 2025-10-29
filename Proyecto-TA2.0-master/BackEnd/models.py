from sqlalchemy import Column, Date, Integer, String, DateTime, Boolean, Text, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime



Base = declarative_base()

class Profesora(Base):
    __tablename__ = "profesoras"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    especialidad = Column(String(100), nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    activa = Column(Boolean, default=True)
    
    # Relaciones
    asistencias = relationship("Asistencia", back_populates="profesora")
    clases = relationship("Clase", back_populates="profesora")

class Clase(Base):
    __tablename__ = "clases"
    
    id = Column(Integer, primary_key=True, index=True)
    profesora_id = Column(Integer, ForeignKey("profesoras.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)
    ubicacion = Column(String(100), nullable=False)  # "Colegio" o "Centro TecnoAcademia"
    descripcion = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    activa = Column(Boolean, default=True)
    
    # Relaciones
    profesora = relationship("Profesora", back_populates="clases")
    
    

class Aprendiz(Base):
    __tablename__ = "aprendices"
    id = Column(Integer, primary_key=True, index=True)
    lista_id = Column(Integer, ForeignKey("clases.id"), nullable=True)  # opcional link a clase si prefieres
    nombre = Column(String(200), nullable=False)
    documento = Column(String(50), nullable=True)
    profesora_id = Column(Integer, ForeignKey("profesoras.id"), nullable=False)

    profesora = relationship("Profesora", backref="aprendices")
    asistencias = relationship("Asistencia", back_populates="aprendiz", cascade="all, delete-orphan")

class Asistencia(Base):
    __tablename__ = "asistencias"
    id = Column(Integer, primary_key=True, index=True)
    aprendiz_id = Column(Integer, ForeignKey("aprendices.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    presente = Column(Boolean, default=False)
    profesora_id = Column(Integer, ForeignKey("profesoras.id"))

    aprendiz = relationship("Aprendiz", back_populates="asistencias")
    profesora = relationship("Profesora", back_populates="asistencias")
    __table_args__ = (UniqueConstraint('aprendiz_id', 'fecha', name='_aprendiz_fecha_uc'),)