import { authenticatedFetch } from '../utils/api';

export const asistenciaService = {
  // Obtener asistencias con filtros
  async obtenerAsistencias(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.profesora_id) params.append('profesora_id', filters.profesora_id);
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);

      const response = await authenticatedFetch(`/asistencia?${params}`);
      if (response && response.ok) {
        const data = await response.json();
        return data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching asistencias:', error);
      throw new Error('Error al obtener asistencias: ' + error.message);
    }
  },

  // Crear nueva asistencia
  async crearAsistencia(asistenciaData) {
    try {
      const response = await authenticatedFetch('/asistencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asistenciaData),
      });

      if (response && response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear asistencia');
      }
    } catch (error) {
      console.error('Error creating asistencia:', error);
      throw error;
    }
  },

  // Obtener resumen de aprendices
  async obtenerResumen() {
    try {
  // El backend expone /asistencia/listas/ para el resumen de aprendices
  const response = await authenticatedFetch('/asistencia/listas/');
      if (response && response.ok) {
        const data = await response.json();
        return data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching resumen:', error);
      throw new Error('Error al obtener resumen: ' + error.message);
    }
  },

  // Obtener detalle de un aprendiz
  async detalleAprendiz(id) {
    try {
      const response = await authenticatedFetch(`/aprendices/${id}/detalle`);
      if (response && response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error('No se pudo obtener el detalle del aprendiz');
    } catch (error) {
      console.error('Error fetching detalle aprendiz:', error);
      throw error;
    }
  },

  // Toggle asistencia de un aprendiz
  async toggleAsistencia(aprendizId, fechaIso, presente) {
    try {
      // El backend espera PATCH en /asistencia/toggle/
      const response = await authenticatedFetch('/asistencia/toggle/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aprendiz_id: aprendizId,
          fecha: fechaIso,
          presente: presente
        }),
      });

      if (response && response.ok) {
        // El endpoint retorna { ok: True }
        return await response.json();
      }
      throw new Error('Error al actualizar asistencia');
    } catch (error) {
      console.error('Error toggling asistencia:', error);
      throw error;
    }
  },

  // Importar desde Excel
  async importarExcel(file, nombreLista) {
    try {
      const formData = new FormData();
      // Backend espera el campo 'archivo'
      formData.append('archivo', file);
      if (nombreLista) {
        formData.append('nombre_lista', nombreLista);
      }

      const response = await authenticatedFetch('/asistencia/importar/', {
        method: 'POST',
        body: formData,
      });

      if (response && response.ok) {
        return await response.json();
      }
      throw new Error('Error al importar archivo');
    } catch (error) {
      console.error('Error importing Excel:', error);
      throw error;
    }
  },

  // Exportar a CSV
  async exportarCSV() {
    try {
      // Backend expone /asistencia/exportar/
      const response = await authenticatedFetch('/asistencia/exportar/');
      if (response && response.ok) {
        // Devolver blob para descargar correctamente
        return await response.blob();
      }
      throw new Error('Error al exportar CSV');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }
};