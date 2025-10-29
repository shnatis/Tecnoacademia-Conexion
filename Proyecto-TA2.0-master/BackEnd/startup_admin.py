import os
from sqlalchemy.orm import Session
from database import SessionLocal, test_connection
from models import Profesora
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def ensure_admin():
    """Crear usuario admin por defecto si no existe"""
    
    # Verificar conexión a la base de datos
    if not test_connection():
        print("❌ No se pudo conectar a la base de datos")
        return False
    
    db = SessionLocal()
    try:
        # Buscar si ya existe un admin
        admin_exists = db.query(Profesora).filter(Profesora.is_admin == True).first()
        
        if not admin_exists:
            # Crear admin por defecto
            admin_email = os.getenv("ADMIN_EMAIL", "admin@tecnoacademia.com")
            admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
            admin_name = os.getenv("ADMIN_NAME", "Administrador")
            
            hashed_password = pwd_context.hash(admin_password)
            
            admin_user = Profesora(
                nombre=admin_name,
                email=admin_email,
                hashed_password=hashed_password,
                especialidad="Administración",
                is_admin=True,
                activa=True
            )
            
            db.add(admin_user)
            db.commit()
            
            print(f"✅ Usuario admin creado:")
            print(f"   Email: {admin_email}")
            print(f"   Password: {admin_password}")
            print(f"   ⚠️  CAMBIA LA CONTRASEÑA EN PRODUCCIÓN")
        else:
            print(f"✅ Usuario admin ya existe: {admin_exists.email}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error creando admin: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    ensure_admin()