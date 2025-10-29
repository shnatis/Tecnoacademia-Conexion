from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
load_dotenv()


# Configuración de MySQL
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "root")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "tecnoacademia2")

# Escapar la contraseña para caracteres especiales
escaped_password = quote_plus(MYSQL_PASSWORD)

# URL de conexión a MySQL
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{escaped_password}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"

# Configuración del motor de base de datos
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False  # Cambiar a True para debug SQL
)

# Crear la fábrica de sesiones
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Dependencia para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para verificar la conexión
def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute("SELECT 1")
            print("✅ Conexión a MySQL exitosa")
            return True
    except Exception as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return False

# Función para crear las tablas
def create_tables():
    from models import Base
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas exitosamente")
        return True
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        return False