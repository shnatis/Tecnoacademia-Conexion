import React, { useState, useEffect } from 'react';
import { Users, Edit, Trash2, Key, UserPlus, Search, Shield } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

const ProfessorasManagement = ({ user }) => {
  const [profesoras, setProfesoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProfesora, setSelectedProfesora] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    especialidad: '',
    activa: true,
    is_admin: false
  });
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombre: '',
    email: '',
    especialidad: '',
    password: '',
    activa: true,
    is_admin: false
  });
  const [createErrors, setCreateErrors] = useState({});

  const submitCreate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCreateErrors({});

    if (!createForm.password || createForm.password.length < 6) {
      setCreateErrors({ password: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    try {
      const response = await authenticatedFetch('/admin/profesoras', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });

      if (response.ok) {
        await fetchProfesoras();
        setShowCreateModal(false);
        setCreateForm({ nombre: '', email: '', especialidad: '', password: '', activa: true, is_admin: false });
        alert('Facilitadora creada exitosamente');
      } else {
        const errorData = await response.json();
        setCreateErrors({ general: errorData.detail || 'Error al crear facilitadora' });
      }
    } catch (error) {
      console.error('Error creating profesora:', error);
      setCreateErrors({ general: 'Error de conexión' });
    }
  };

  useEffect(() => {
    fetchProfesoras();
  }, []);

  const fetchProfesoras = async () => {
    try {
      setLoading(true);
  // Si el usuario es admin, usamos el endpoint admin que devuelve todas (incluye inactivas)
  const endpoint = user?.is_admin ? '/admin/profesoras' : '/profesoras';
  const response = await authenticatedFetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setProfesoras(data);
      }
    } catch (error) {
      console.error('Error fetching profesoras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfesora = (profesora) => {
    setSelectedProfesora(profesora);
    setEditForm({
      nombre: profesora.nombre,
      email: profesora.email,
      especialidad: profesora.especialidad,
      activa: profesora.activa,
      is_admin: profesora.is_admin || false
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handlePasswordChange = (profesora) => {
    setSelectedProfesora(profesora);
    setNewPassword('');
    setErrors({});
    setShowPasswordModal(true);
  };

  const handleDeleteProfesora = (profesora) => {
    setSelectedProfesora(profesora);
    setShowDeleteModal(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const response = await authenticatedFetch(`/admin/profesoras/${selectedProfesora.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchProfesoras();
        setShowEditModal(false);
        setSelectedProfesora(null);
        alert('Profesora actualizada exitosamente');
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.detail || 'Error al actualizar profesora' });
      }
    } catch (error) {
      console.error('Error updating profesora:', error);
      setErrors({ general: 'Error de conexión' });
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setErrors({});

    if (newPassword.length < 6) {
      setErrors({ password: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    try {
      const response = await authenticatedFetch(`/admin/profesoras/${selectedProfesora.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ nueva_password: newPassword })
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setSelectedProfesora(null);
        setNewPassword('');
        alert('Contraseña actualizada exitosamente');
      } else {
        const errorData = await response.json();
        setErrors({ password: errorData.detail || 'Error al cambiar contraseña' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({ password: 'Error de conexión' });
    }
  };

  const submitDelete = async () => {
    try {
      const response = await authenticatedFetch(`/admin/profesoras/${selectedProfesora.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchProfesoras();
        setShowDeleteModal(false);
        setSelectedProfesora(null);
        alert('Profesora eliminada exitosamente');
      } else {
        const errorData = await response.json();
        alert('Error al eliminar: ' + (errorData.detail || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error deleting profesora:', error);
      alert('Error de conexión al eliminar');
    }
  };

  const reactivarProfesora = async (profesoraId) => {
    try {
      const resp = await authenticatedFetch(`/admin/profesoras/${profesoraId}`, {
        method: 'PUT',
        body: JSON.stringify({ activa: true })
      });
      if (resp.ok) {
        await fetchProfesoras();
        alert('Facilitadora reactivada exitosamente');
      } else {
        const err = await resp.json();
        alert('Error al reactivar: ' + (err.detail || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error reactivando profesora:', error);
      alert('Error de conexión al reactivar');
    }
  };

  const filteredProfesoras = profesoras.filter(profesora =>
    profesora.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profesora.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profesora.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user?.is_admin) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso denegado</h3>
        <p className="mt-1 text-sm text-gray-500">
          Solo los administradores pueden acceder a esta sección.
        </p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de facilitadoras</h1>
          <p className="text-gray-600">Administra las facilitadoras del sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <UserPlus size={20} />
          Nueva Facilitadora
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o linea..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de profesoras */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            facilitadoras ({filteredProfesoras.length})
          </h3>
        </div>

        {filteredProfesoras.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron facilitadoras</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'No hay facilitadoras registradas.'}
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
                    Linea
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfesoras.map((profesora) => (
                  <tr key={profesora.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{profesora.nombre}</div>
                          <div className="text-sm text-gray-500">{profesora.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{profesora.especialidad}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        profesora.activa 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {profesora.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        profesora.is_admin 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profesora.is_admin ? 'Administrador' : 'Facilitadora'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditProfesora(profesora)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Editar facilitadora"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handlePasswordChange(profesora)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Cambiar contraseña"
                        >
                          <Key size={16} />
                        </button>
                        {!profesora.activa && profesora.id !== user.id && (
                          <button
                            onClick={() => reactivarProfesora(profesora.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Reactivar facilitadora"
                          >
                            <Users size={16} />
                          </button>
                        )}
                        {profesora.id !== user.id && (
                          <button
                            onClick={() => handleDeleteProfesora(profesora)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar facilitadora"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Modal de edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar facilitadora
              </h3>
              
              {errors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}

              <form onSubmit={submitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Linea
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editForm.especialidad}
                    onChange={(e) => setEditForm({...editForm, especialidad: e.target.value})}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      checked={editForm.activa}
                      onChange={(e) => setEditForm({...editForm, activa: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700">Activa</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      checked={editForm.is_admin}
                      onChange={(e) => setEditForm({...editForm, is_admin: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700">Administrador</span>
                  </label>
                </div>

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

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Crear nueva facilitadora
              </h3>

              {createErrors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {createErrors.general}
                </div>
              )}

              <form onSubmit={submitCreate}
                className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={createForm.nombre}
                    onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Linea</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={createForm.especialidad}
                    onChange={(e) => setCreateForm({ ...createForm, especialidad: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {createErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.password}</p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      checked={createForm.activa}
                      onChange={(e) => setCreateForm({ ...createForm, activa: e.target.checked })}
                    />
                    <span className="text-sm text-gray-700">Activa</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      checked={createForm.is_admin}
                      onChange={(e) => setCreateForm({ ...createForm, is_admin: e.target.checked })}
                    />
                    <span className="text-sm text-gray-700">Administrador</span>
                  </label>
                </div>

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
                    Crear Facilitadora
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Cambiar Contraseña - {selectedProfesora?.nombre}
              </h3>
              
              {errors.password && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.password}
                </div>
              )}

              <form onSubmit={submitPasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700"
                  >
                    Cambiar Contraseña
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
                ¿Estás segura de que deseas eliminar a {selectedProfesora?.nombre}?
                Esta acción eliminará también todos sus datos asociados y no se puede deshacer.
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

export default ProfessorasManagement;