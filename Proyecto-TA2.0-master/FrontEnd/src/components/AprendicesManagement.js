import React, { useState, useEffect } from 'react';
import { Users, Edit, Trash2, UserPlus, Search, FileText } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

const AprendicesManagement = ({ user }) => {
  const [aprendices, setAprendices] = useState([]);
  const [profesoras, setProfesoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfesora, setSelectedProfesora] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAprendiz, setSelectedAprendiz] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    profesora_id: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAprendices();
    fetchProfesoras();
  }, [selectedProfesora]);

  const fetchAprendices = async () => {
    try {
      setLoading(true);
      const endpoint = selectedProfesora ? `/aprendices?profesora_id=${selectedProfesora}` : '/aprendices';
      // Debug: mostrar el usuario actual y endpoint
      console.log('DEBUG: fetchAprendices user=', user, 'endpoint=', endpoint);
      const response = await authenticatedFetch(endpoint);
      console.log('DEBUG: fetchAprendices response status=', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG: aprendices data=', data);
        setAprendices(data);
      } else {
        try {
          const err = await response.json();
          console.error('Error fetching aprendices:', err);
        } catch (e) {
          console.error('Error fetching aprendices: status', response.status);
        }
      }
    } catch (error) {
      console.error('Error fetching aprendices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesoras = async () => {
    try {
      // Usar el endpoint admin cuando el usuario es admin para incluir al administrador
      const endpoint = user?.is_admin ? '/admin/profesoras' : '/profesoras';
      const response = await authenticatedFetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setProfesoras(data);
      }
    } catch (error) {
      console.error('Error fetching profesoras:', error);
    }
  };

  const handleCreateAprendiz = () => {
    setForm({
      nombre: '',
      documento: '',
      profesora_id: user?.is_admin ? '' : user?.id || ''
    });
    setErrors({});
    setSelectedAprendiz(null);
    setShowCreateModal(true);
  };

  const handleEditAprendiz = (aprendiz) => {
    setSelectedAprendiz(aprendiz);
    setForm({
      nombre: aprendiz.nombre,
      documento: aprendiz.documento || '',
      profesora_id: aprendiz.profesora_id
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleDeleteAprendiz = (aprendiz) => {
    setSelectedAprendiz(aprendiz);
    setShowDeleteModal(true);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.nombre.trim()) {
      setErrors({ nombre: 'El nombre es requerido' });
      return;
    }

    if (!form.profesora_id) {
      setErrors({ profesora_id: 'Debe seleccionar una profesora' });
      return;
    }

    try {
      const response = await authenticatedFetch('/aprendices', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          profesora_id: parseInt(form.profesora_id)
        })
      });

      if (response.ok) {
        await fetchAprendices();
        setShowCreateModal(false);
        setForm({ nombre: '', documento: '', profesora_id: '' });
        alert('Aprendiz creado exitosamente');
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.detail || 'Error al crear aprendiz' });
      }
    } catch (error) {
      console.error('Error creating aprendiz:', error);
      setErrors({ general: 'Error de conexión' });
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.nombre.trim()) {
      setErrors({ nombre: 'El nombre es requerido' });
      return;
    }

    try {
      const response = await authenticatedFetch(`/aprendices/${selectedAprendiz.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          profesora_id: parseInt(form.profesora_id)
        })
      });

      if (response.ok) {
        await fetchAprendices();
        setShowEditModal(false);
        setSelectedAprendiz(null);
        alert('Aprendiz actualizado exitosamente');
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.detail || 'Error al actualizar aprendiz' });
      }
    } catch (error) {
      console.error('Error updating aprendiz:', error);
      setErrors({ general: 'Error de conexión' });
    }
  };

  const submitDelete = async () => {
    try {
      const response = await authenticatedFetch(`/aprendices/${selectedAprendiz.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchAprendices();
        setShowDeleteModal(false);
        setSelectedAprendiz(null);
        alert('Aprendiz eliminado exitosamente');
      } else {
        const errorData = await response.json();
        alert('Error al eliminar: ' + (errorData.detail || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error deleting aprendiz:', error);
      alert('Error de conexión al eliminar');
    }
  };

  const filteredAprendices = aprendices.filter(aprendiz =>
    aprendiz.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aprendiz.documento && aprendiz.documento.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const canManageAprendiz = (aprendiz) => {
    return user?.is_admin || aprendiz.profesora_id === user?.id;
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Aprendices</h1>
          <p className="text-gray-600">Administra los aprendices del sistema</p>
        </div>
        <button
          onClick={handleCreateAprendiz}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <UserPlus size={20} />
          Nuevo Aprendiz
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por profesora (solo para admin) */}
          {user?.is_admin && (
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedProfesora}
              onChange={(e) => setSelectedProfesora(e.target.value)}
            >
              <option value="">Todas las facilitadoras</option>
              {profesoras.map((profesora) => (
                <option key={profesora.id} value={profesora.id}>
                  {profesora.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Lista de aprendices */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Aprendices ({filteredAprendices.length})
          </h3>
        </div>

        {filteredAprendices.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron aprendices</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'No hay aprendices registrados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aprendiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesora
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAprendices.map((aprendiz) => {
                  const profesora = profesoras.find(p => p.id === aprendiz.profesora_id);
                  return (
                    <tr key={aprendiz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{aprendiz.nombre}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{aprendiz.documento || 'No especificado'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{profesora?.nombre || 'No asignada'}</div>
                        <div className="text-sm text-gray-500">{profesora?.especialidad}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {canManageAprendiz(aprendiz) && (
                            <>
                              <button
                                onClick={() => handleEditAprendiz(aprendiz)}
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="Editar aprendiz"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteAprendiz(aprendiz)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Eliminar aprendiz"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          {/* Botón 'Ver asistencias' eliminado según solicitud */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Nuevo Aprendiz
              </h3>
              
              {errors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}

              <form onSubmit={submitCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documento
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={form.documento}
                    onChange={(e) => setForm({...form, documento: e.target.value})}
                    placeholder="Número de documento (opcional)"
                  />
                </div>

                {user?.is_admin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profesora *
                    </label>
                    <select
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.profesora_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      value={form.profesora_id}
                      onChange={(e) => setForm({...form, profesora_id: e.target.value})}
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
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    Crear Aprendiz
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Aprendiz
              </h3>
              
              {errors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}

              <form onSubmit={submitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documento
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={form.documento}
                    onChange={(e) => setForm({...form, documento: e.target.value})}
                    placeholder="Número de documento (opcional)"
                  />
                </div>

                {user?.is_admin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profesora *
                    </label>
                    <select
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.profesora_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      value={form.profesora_id}
                      onChange={(e) => setForm({...form, profesora_id: e.target.value})}
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
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar Eliminación
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Estás segura de que deseas eliminar a {selectedAprendiz?.nombre}?
                Esta acción eliminará también todos los registros de asistencia asociados y no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AprendicesManagement;