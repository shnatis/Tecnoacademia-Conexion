
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export async function importarExcel(file, nombre_lista){
  const fd = new FormData();
  // El backend espera el campo 'archivo'
  fd.append("archivo", file);
  fd.append("nombre_lista", nombre_lista || "Importada desde Front");
  // No forzamos Content-Type: el navegador lo define (boundary)
  const res = await api.post("/asistencia/importar/", fd);
  return res.data;
}

export async function obtenerResumen(){
  const res = await api.get("/asistencia/listas/");
  return res.data;
}

export async function detalleAprendiz(aprendizId){
  const res = await api.get(`/asistencia/detalle/${aprendizId}`);
  return res.data;
}

export async function toggleAsistencia(aprendiz_id, fecha_iso, presente){
  const res = await api.patch("/asistencia/toggle/", { aprendiz_id, fecha: fecha_iso, presente });
  return res.data;
}

export async function exportarCSV(){
  const res = await api.get("/asistencia/exportar/", { responseType: "blob" });
  return res.data;
}
