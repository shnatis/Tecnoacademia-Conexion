import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ClaseForm = ({ profesoras, selectedDate, onSubmit, onCancel, user, editingClase }) => {
  // Función para convertir una fecha a string en formato datetime-local (zona horaria local)
  const dateToLocalString = (date) => {
    if (!date) return '';
    
    // Asegurarse de que es un objeto Date válido
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    // Formatear para datetime-local input
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Función para obtener la fecha inicial
  const getInitialDate = () => {
    if (selectedDate) {
      const initialDate = new Date(selectedDate);
      initialDate.setHours(8, 0, 0, 0);
      return initialDate;
    }
    
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  };

  // Función para obtener la fecha final (2 horas después)
  const getInitialEndDate = () => {
    const startDate = getInitialDate();
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);
    return endDate;
  };

  const [formData, setFormData] = useState({
    profesora_id: user?.id || '',
    titulo: '',
    fecha_inicio: dateToLocalString(getInitialDate()),
    fecha_fin: dateToLocalString(getInitialEndDate()),
    ubicacion: 'Colegio',
    descripcion: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar profesora_id si cambia el usuario
  useEffect(() => {
    if (user?.id && !formData.profesora_id) {
      setFormData(prev => ({
        ...prev,
        profesora_id: user.id
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.profesora_id) {
      newErrors.profesora_id = 'Debe seleccionar una profesora';
    }
    
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    }
    
    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    }
    
    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es requerida';
    }
    
    if (formData.fecha_inicio && formData.fecha_fin) {
      const startDate = new Date(formData.fecha_inicio);
      const endDate = new Date(formData.fecha_fin);
      
      if (endDate <= startDate) {
        newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
      
      // Validar que no sea en el pasado (permitir hoy)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      
      if (startDay < today) {
        newErrors.fecha_inicio = 'No se pueden programar clases en fechas pasadas';
      }
      
      // Validar duración mínima de 30 minutos
      const diffMinutes = (endDate - startDate) / (1000 * 60);
      if (diffMinutes < 30) {
        newErrors.fecha_fin = 'La clase debe durar al menos 30 minutos';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convertir las fechas al formato ISO esperado por el backend
      const startDate = new Date(formData.fecha_inicio);
      const endDate = new Date(formData.fecha_fin);
      
      const submitData = {
        ...formData,
        profesora_id: parseInt(formData.profesora_id),
        titulo: formData.titulo.trim(),
        // Enviar fechas en formato ISO
        fecha_inicio: startDate.toISOString(),
        fecha_fin: endDate.toISOString(),
        descripcion: formData.descripcion.trim()
      };

      console.log('Enviando datos de clase:', submitData);
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error al crear clase:', error);
      setErrors({ submit: 'Error al crear la clase. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    // Limpiar error específico cuando el usuario comience a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-actualizar fecha de fin cuando cambie la fecha de inicio
      if (field === 'fecha_inicio' && value) {
        try {
          const startDate = new Date(value);
          if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2);
            newData.fecha_fin = dateToLocalString(endDate);
          }
        } catch (error) {
          console.error('Error al calcular fecha de fin:', error);
        }
      }

      return newData;
    });
  };

  // Función para formatear la fecha para mostrar
  const formatDisplayDate = (date) => {
    if (!date) return '';
    
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('es-CO', options);
  };

  // Calcular fecha mínima (hoy)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMin = dateToLocalString(today);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedDate 
              ? `Nueva Clase - ${formatDisplayDate(selectedDate)}` 
              : 'Nueva Clase'
            }
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facilitadora *
              </label>
              <select
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.profesora_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={formData.profesora_id}
                onChange={(e) => handleChange('profesora_id', e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar profesora</option>
                {profesoras.map((profesora) => (
                  <option key={profesora.id} value={profesora.id}>
                    {profesora.nombre} - {profesora.especialidad}
                  </option>
                ))}
              </select>
              {errors.profesora_id && (
                <p className="mt-1 text-sm text-red-600">{errors.profesora_id}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título de la Clase *
              </label>
              <input
                type="text"
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.titulo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ej: Introducción a la Programación"
                value={formData.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                disabled={isSubmitting}
              />
              {errors.titulo && (
                <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora de Inicio *
              </label>
              <input
                type="datetime-local"
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.fecha_inicio ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={formData.fecha_inicio}
                onChange={(e) => handleChange('fecha_inicio', e.target.value)}
                min={todayMin}
                disabled={isSubmitting}
              />
              {errors.fecha_inicio && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_inicio}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora de Fin *
              </label>
              <input
                type="datetime-local"
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.fecha_fin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={formData.fecha_fin}
                onChange={(e) => handleChange('fecha_fin', e.target.value)}
                min={formData.fecha_inicio}
                disabled={isSubmitting}
              />
              {errors.fecha_fin && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_fin}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="ubicacion"
                    value="Colegio"
                    checked={formData.ubicacion === 'Colegio'}
                    onChange={(e) => handleChange('ubicacion', e.target.value)}
                    className="mr-3 text-indigo-600 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <div>
                    <span className="font-medium text-gray-900">Colegio</span>
                    <p className="text-sm text-gray-500">Clases en la institución educativa</p>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="ubicacion"
                    value="Centro TecnoAcademia"
                    checked={formData.ubicacion === 'Centro TecnoAcademia'}
                    onChange={(e) => handleChange('ubicacion', e.target.value)}
                    className="mr-3 text-indigo-600 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <div>
                    <span className="font-medium text-gray-900">Centro TecnoAcademia</span>
                    <p className="text-sm text-gray-500">Formación en el centro tecnológico</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descripción de la clase, objetivos, materiales necesarios..."
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.profesora_id || !formData.titulo || !formData.fecha_inicio || !formData.fecha_fin}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingClase ? 'Actualizando...' : 'Programando...'}
                </div>
              ) : (
                editingClase ? 'Actualizar Clase' : 'Programar Clase'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaseForm; 