Cómo usar (rápido):
1. Ve a BackEnd/ y copia .env.example -> .env; ajusta SECRET_KEY y parámetros de BD.
2. Instala dependencias: pip install -r requirements.txt
3. Ejecuta backend (desde BackEnd/):
   python -m uvicorn main:app --reload
   Al arrancar, si no existe admin, se creará y sus credenciales estarán en BackEnd/admin_credentials.txt
4. Frontend: desde FrontEnd/ npm install && npm start (el proxy está configurado a http://localhost:8000)

Notas de seguridad:
- No dejes SECRET_KEY ni credenciales en el repo en producción.
- Revisa y cambia la contraseña del admin al primer login.
- Considera usar Alembic para migraciones en producción (no incluido automáticamente).
