import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, User, Edit, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { 
  formatDateTime, 
  formatDateRange, 
  calculateDuration,
  getCalendarDays,
  parseBackendDate,
  getCurrentColombiaDate,
  isToday
  , formatTime
} from '../utils/dateUtils';
import ClaseForm from './ClaseForm';

const Calendario = ({ token, user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clases, setClases] = useState([]);
  const [profesoras, setProfesoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingClase, setEditingClase] = useState(null);
  const [selectedClase, setSelectedClase] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  useEffect(() => {
    fetchClases();
    fetchProfesoras();
  }, [currentDate]);

  const fetchClases = async () => {
    try {
      console.log('fetchClases ejecutado');
      setLoading(true);
  const anio = currentDate.getFullYear();
  const mes = currentDate.getMonth() + 1;
  // Use the backend endpoint that expects /calendario/mes and parameter 'anio'
  const url = `${API_BASE_URL}/clases/calendario/mes?mes=${mes}&anio=${anio}`;
      console.log('Consultando URL:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const clasesProcessed = data.map(clase => ({
          ...clase,
          fecha_inicio: parseBackendDate(clase.fecha_inicio),
          fecha_fin: parseBackendDate(clase.fecha_fin)
        }));
        console.log('Clases recibidas del backend:', clasesProcessed);
        setClases(clasesProcessed);
      } else {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        setClases([]);
      }
    } catch (error) {
      console.error('Error fetching clases:', error);
      setClases([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesoras = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profesoras`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfesoras(data);
      }
    } catch (error) {
      console.error('Error fetching profesoras:', error);
    }
  };

  const handleCreateClase = async (claseData) => {
    try {
      const url = editingClase 
        ? `${API_BASE_URL}/clases/${editingClase.id}` 
        : `${API_BASE_URL}/clases`;
      
      const method = editingClase ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(claseData),
      });

      if (response.ok) {
        await fetchClases();
        setShowForm(false);
        setSelectedDate(null);
        setEditingClase(null);
        
        // Mostrar mensaje de éxito
        alert(editingClase ? 'Clase actualizada exitosamente' : 'Clase creada exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error al ${editingClase ? 'actualizar' : 'crear'} clase: ` + (errorData.detail || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error with clase:', error);
      alert('Error de conexión al procesar la clase');
    }
  };

  const handleEditClase = (clase) => {
    setEditingClase(clase);
    setShowForm(true);
  };

  const handleDeleteClase = async () => {
    if (!selectedClase) return;

    try {
      const response = await fetch(`${API_BASE_URL}/clases/${selectedClase.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchClases();
        setShowDeleteModal(false);
        setSelectedClase(null);
        alert('Clase eliminada exitosamente');
      } else {
        const errorData = await response.json();
        alert('Error al eliminar clase: ' + (errorData.detail || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error deleting clase:', error);
      alert('Error de conexión al eliminar clase');
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getClasesForDate = (date) => {
    if (!date || !clases.length) return [];
    
    return clases.filter(clase => {
      if (!clase.fecha_inicio) return false;
      
      const claseDate = new Date(clase.fecha_inicio);
      return claseDate.getDate() === date.getDate() &&
             claseDate.getMonth() === date.getMonth() &&
             claseDate.getFullYear() === date.getFullYear();
    });
  };

  const handleDateClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date);
      setEditingClase(null);
      setShowForm(true);
    }
  };

  const canEditClase = (clase) => {
    return user?.is_admin || clase.profesora_id === user?.id;
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedDate(null);
    setEditingClase(null);
  };

  // Modal de confirmación para eliminar
  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Confirmar Eliminación
          </h3>
          <p className="text-gray-600 mb-6">
            ¿Estás segura de que deseas eliminar la clase "{selectedClase?.titulo}"?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedClase(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteClase}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const calendarDays = getCalendarDays(currentDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario de Clases</h1>
          <p className="text-gray-600">Programa y visualiza las clases del colegio y TecnoAcademia</p>
        </div>
        <button
          onClick={() => {
            setEditingClase(null);
            setSelectedDate(null);
            setShowForm(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Clase
        </button>
      </div>

      {/* Navegación del calendario */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {diasSemana.map((dia) => (
            <div key={dia} className="p-2 text-center text-sm font-medium text-gray-500">
              {dia}
            </div>
          ))}
        </div>

        {/* Grilla del calendario */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const clasesDelDia = getClasesForDate(day.date);
            const dayIsToday = day.isToday;
            
            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${dayIsToday ? 'bg-blue-50 border-blue-200' : ''} ${
                  day.isPast && day.isCurrentMonth ? 'opacity-75' : ''
                }`}
                onClick={() => handleDateClick(day)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  dayIsToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {clasesDelDia.slice(0, 2).map((clase) => (
                    <div
                      key={clase.id}
                      className={`text-xs p-1 rounded text-white truncate cursor-pointer ${
                        clase.ubicacion === 'Colegio' ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-500 hover:bg-purple-600'
                      } transition-colors`}
                      title={`${clase.titulo} - ${clase.profesora.nombre} - ${formatDateTime(clase.fecha_inicio)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Aquí podrías abrir un modal con detalles de la clase
                      }}
                    >
                      <div className="font-medium">{clase.titulo}</div>
                        <div className="opacity-90">
                        {clase.fecha_inicio && formatTime(clase.fecha_inicio)}
                      </div>
                    </div>
                  ))}
                  {clasesDelDia.length > 2 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{clasesDelDia.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Colegio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-600">Centro TecnoAcademia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 border-2 border-blue-400 rounded"></div>
            <span className="text-sm text-gray-600">Día actual</span>
          </div>
        </div>
      </div>

      {/* Lista de clases del mes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Clases de {meses[currentDate.getMonth()]} ({clases.length})
          </h3>
        </div>
        
        {clases.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clases programadas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay clases programadas para este mes.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {clases
                .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
                .map((clase) => {
                  const isClasePast = clase.fecha_fin && new Date(clase.fecha_fin) < getCurrentColombiaDate();
                  const canEdit = canEditClase(clase);
                  
                  return (
                    <div 
                      key={clase.id} 
                      className={`flex items-start space-x-4 p-4 bg-gray-50 rounded-lg transition-opacity ${
                        isClasePast ? 'opacity-60' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        clase.ubicacion === 'Colegio' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        <MapPin className={`${
                          clase.ubicacion === 'Colegio' ? 'text-green-600' : 'text-purple-600'
                        }`} size={20} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-lg font-medium text-gray-900">{clase.titulo}</h4>
                          <div className="flex items-center gap-2">
                            {isClasePast && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                Finalizada
                              </span>
                            )}
                            {canEdit && !isClasePast && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditClase(clase)}
                                  className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                  title="Editar clase"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedClase(clase);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Eliminar clase"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <User size={14} className="mr-1 flex-shrink-0" />
                          <span className="truncate">{clase.profesora.nombre} - {clase.profesora.especialidad}</span>
                        </div>
                        
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Clock size={14} className="mr-1 flex-shrink-0" />
                          <span>{formatDateRange(clase.fecha_inicio, clase.fecha_fin)}</span>
                        </div>
                        
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MapPin size={14} className="mr-1 flex-shrink-0" />
                          <span>{clase.ubicacion}</span>
                        </div>
                        
                        {clase.fecha_inicio && clase.fecha_fin && (
                          <div className="mt-1 text-sm text-gray-500">
                            <span className="font-medium">Duración:</span> {calculateDuration(clase.fecha_inicio, clase.fecha_fin)}
                          </div>
                        )}
                        
                        {clase.descripcion && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{clase.descripcion}</p>
                        )}
                      </div>
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        clase.ubicacion === 'Colegio' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {clase.ubicacion}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Formulario de nueva/editar clase */}
      {showForm && (
        <ClaseForm
          profesoras={profesoras}
          selectedDate={selectedDate}
          editingClase={editingClase}
          user={user}
          onSubmit={handleCreateClase}
          onCancel={handleFormCancel}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && <DeleteConfirmModal />}
    </div>
  );
};

export default Calendario;