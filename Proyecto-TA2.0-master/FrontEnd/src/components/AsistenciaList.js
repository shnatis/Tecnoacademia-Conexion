import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { formatDate } from '../utils/dateUtils';
import AsistenciaForm from './AsistenciaForm';


const AsistenciaList = ({ token }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [profesoras, setProfesoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    profesora_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    presente: ''
  });

  useEffect(() => {
    fetchAsistencias();
    fetchProfesoras();
  }, []);

  useEffect(() => {
    fetchAsistencias();
  }, [filters]);

  const fetchAsistencias = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.profesora_id) params.append('profesora_id', filters.profesora_id);
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);

      const response = await fetch(`${API_BASE_URL}/asistencia?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        let data = await response.json();
        
        // Filtrar por estado de presencia si está seleccionado
        if (filters.presente !== '') {
          data = data.filter(a => a.presente === (filters.presente === 'true'));
        }

        setAsistencias(data);
      }
    } catch (error) {
      console.error('Error fetching asistencias:', error);
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

  const handleCreateAsistencia = async (asistenciaData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/asistencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(asistenciaData),
      });

      if (response.ok) {
        fetchAsistencias();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        alert('Error al crear asistencia: ' + errorData.detail);
      }
    } catch (error) {
      console.error('Error creating asistencia:', error);
      alert('Error de conexión al crear asistencia');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      profesora_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      presente: ''
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de Asistencia</h1>
          <p className="text-gray-600">Gestiona los registros de asistencia de las facilitadoras</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Asistencia
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facilitadora
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.profesora_id}
              onChange={(e) => handleFilterChange('profesora_id', e.target.value)}
            >
              <option value="">Todas las profesoras</option>
              {profesoras.map((profesora) => (
                <option key={profesora.id} value={profesora.id}>
                  {profesora.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.fecha_inicio}
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.fecha_fin}
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.presente}
              onChange={(e) => handleFilterChange('presente', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="true">Presente</option>
              <option value="false">Ausente</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Formulario de nueva asistencia */}
      {showForm && (
        <AsistenciaForm
          profesoras={profesoras}
          onSubmit={handleCreateAsistencia}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Tabla de asistencias */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Registros de Asistencia ({asistencias.length})
          </h3>
        </div>
        
        {asistencias.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron registros de asistencia con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facilitadora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asistencias.map((asistencia) => (
                  <tr key={asistencia.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 h-10 w-10 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-sm">
                            {asistencia.profesora.nombre.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {asistencia.profesora.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {asistencia.profesora.especialidad}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(asistencia.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={asistencia.presente}
                        onChange={async (e) => {
                          const nuevoEstado = e.target.checked;
                          try {
                            const response = await fetch(`${API_BASE_URL}/asistencia/${asistencia.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                              },
                              body: JSON.stringify({ presente: nuevoEstado }),
                            });
                            if (response.ok) {
                              fetchAsistencias();
                            } else {
                              alert('Error al actualizar asistencia');
                            }
                          } catch (error) {
                            alert('Error de conexión al actualizar asistencia');
                          }
                        }}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {asistencia.presente ? (
                          <>
                            <CheckCircle className="text-green-500 mr-2" size={20} />
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Presente
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="text-red-500 mr-2" size={20} />
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Ausente
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {asistencia.observaciones || (
                          <span className="text-gray-400 italic">Sin observaciones</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsistenciaList;