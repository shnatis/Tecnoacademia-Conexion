import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { formatDate } from '../utils/dateUtils';
import AsistenciaForm from './AsistenciaForm';
import { asistenciaService } from './AsistenciaService';

const AsistenciaModule = ({ token }) => {
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

  // Estado para módulo AsistenciaModule
  const [aprendices, setAprendices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [file, setFile] = useState(null);
  const [nombreLista, setNombreLista] = useState("");

  useEffect(() => {
    fetchAsistencias();
    fetchProfesoras();
    cargarResumen();
  }, []);

  useEffect(() => {
    fetchAsistencias();
  }, [filters]);

  const fetchAsistencias = async () => {
    try {
      setLoading(true);
      const data = await asistenciaService.obtenerAsistencias(filters);
      
      // Aplicar filtro de presente si está definido
      let filteredData = data;
      if (filters.presente !== '') {
        filteredData = data.filter(a => a.presente === (filters.presente === 'true'));
      }
      
      setAsistencias(filteredData);
    } catch (error) {
      console.error('Error fetching asistencias:', error);
      alert('Error al cargar asistencias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesoras = async () => {
    try {
      const response = await authenticatedFetch('/profesoras');
      if (response && response.ok) {
        const data = await response.json();
        setProfesoras(data || []);
      }
    } catch (error) {
      console.error('Error fetching profesoras:', error);
    }
  };

  const handleCreateAsistencia = async (asistenciaData) => {
    try {
      await asistenciaService.crearAsistencia(asistenciaData);
      fetchAsistencias();
      setShowForm(false);
      alert('Asistencia creada correctamente');
    } catch (error) {
      console.error('Error creating asistencia:', error);
      alert('Error al crear asistencia: ' + error.message);
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

  // ---- Lógica módulo AsistenciaModule ----
  async function cargarResumen() {
    try {
      const res = await asistenciaService.obtenerResumen();
      setAprendices(res || []);
    } catch (e) {
      console.error(e);
      alert("Error cargando resumen de aprendices: " + e.message);
    }
  }

  async function verDetalle(id) {
    setSelected(id);
    try {
      const d = await asistenciaService.detalleAprendiz(id);
      setDetalle(d);
    } catch (e) {
      console.error(e);
      alert("Error al cargar detalle: " + e.message);
    }
  }

  async function onToggle(aprendizId, fechaIso, current) {
    try {
      await asistenciaService.toggleAsistencia(aprendizId, fechaIso, !current);
      setDetalle(prev => {
        if (!prev) return prev;
        const copy = JSON.parse(JSON.stringify(prev));
        copy.asistencias[fechaIso] = !current;
        return copy;
      });
      setAprendices(prev => prev.map(p => p.id === aprendizId ? { ...p, total: p.total + (current ? -1 : 1) } : p));
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar asistencia: " + e.message);
    }
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!file) return alert("Selecciona un archivo");
    try {
      await asistenciaService.importarExcel(file, nombreLista);
      alert("Importado correctamente");
      setFile(null);
      setNombreLista("");
      cargarResumen();
    } catch (e) {
      console.error(e);
      alert("Error al importar: " + e.message);
    }
  }

  async function handleExport() {
    try {
      const csvContent = await asistenciaService.exportarCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "asistencia.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error al exportar: " + e.message);
    }
  }
  // ----------------------------------------

  // Función auxiliar para obtener nombre seguro
  const getNombreSeguro = (obj, defaultValue = 'N/A') => {
    return obj && obj.nombre ? obj.nombre : defaultValue;
  };

  // Función auxiliar para obtener especialidad segura
  const getEspecialidadSegura = (profesora, defaultValue = 'Sin especialidad') => {
    return profesora && profesora.especialidad ? profesora.especialidad : defaultValue;
  };

  // Buscar profesora por id en la lista cargada
  const findProfesoraById = (id) => {
    if (!id) return null;
    return profesoras.find(p => p.id === id) || null;
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
          <p className="text-gray-600">Gestiona los registros de asistencia de las facilitadora</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Profesora</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.profesora_id}
              onChange={(e) => handleFilterChange('profesora_id', e.target.value)}
            >
              <option value="">Todas las profesoras</option>
              {profesoras.map((profesora) => (
                <option key={profesora.id} value={profesora.id}>
                  {getNombreSeguro(profesora)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.fecha_inicio}
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.fecha_fin}
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
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

      {/* Formulario nueva asistencia */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facilitadora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprendiz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asistencias.map((asistencia) => (
                  <tr key={asistencia.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 h-10 w-10 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-sm">
                            {getNombreSeguro(asistencia.profesora, 'P').charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getNombreSeguro(asistencia.profesora || findProfesoraById(asistencia.profesora_id))}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getEspecialidadSegura(asistencia.profesora || findProfesoraById(asistencia.profesora_id))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getNombreSeguro(asistencia.aprendiz)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {asistencia.aprendiz?.documento || 'Sin documento'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {asistencia.fecha ? formatDate(asistencia.fecha) : 'Sin fecha'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* Checkbox para marcar presente/ausente en la fila */}
                        <input
                          type="checkbox"
                          className="mr-3 h-4 w-4"
                          checked={!!asistencia.presente}
                          onChange={async () => {
                            // Llamar al servicio para togglear y actualizar estado local
                            try {
                              await asistenciaService.toggleAsistencia(asistencia.aprendiz_id || asistencia.aprendiz?.id, asistencia.fecha, !asistencia.presente);
                              // Actualizar lista de asistencias
                              setAsistencias(prev => prev.map(a => a.id === asistencia.id ? { ...a, presente: !a.presente } : a));
                              // Actualizar resumen de aprendices si corresponde
                              setAprendices(prev => prev.map(p => {
                                if (p.id === (asistencia.aprendiz_id || asistencia.aprendiz?.id)) {
                                  const delta = asistencia.presente ? -1 : 1;
                                  return { ...p, total: (p.total || 0) + delta };
                                }
                                return p;
                              }));
                            } catch (e) {
                              console.error('Error toggling asistencia row:', e);
                              alert('No se pudo actualizar asistencia: ' + (e.message || e));
                            }
                          }}
                        />

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Módulo de Importar / Exportar */}
      <div className="p-4 border rounded bg-white">
        <div className="mb-4">
          <form onSubmit={handleImport} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Nombre lista (opcional)"
              value={nombreLista}
              onChange={e => setNombreLista(e.target.value)}
              className="border p-2 rounded"
            />
            <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setFile(e.target.files[0])} />
            <button className="bg-green-500 text-white px-3 py-2 rounded" type="submit">Importar Excel</button>
            <button type="button" onClick={handleExport} className="bg-blue-500 text-white px-3 py-2 rounded">Exportar CSV</button>
          </form>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Aprendices</h3>
            <ul>
              {aprendices.map(a => (
                <li key={a.id} className="flex justify-between items-center border-b py-1">
                  <div>
                    <strong>{getNombreSeguro(a)}</strong>
                    <div className="text-sm text-gray-600">{a.documento || 'Sin documento'}</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-sm">Total: {a.total || 0}</div>
                    <button className="text-sm bg-gray-200 px-2 rounded" onClick={() => verDetalle(a.id)}>Ver</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2">
            {detalle ? (
              <div>
                <h3 className="font-semibold">{getNombreSeguro(detalle)} - {detalle.documento || 'Sin documento'}</h3>
                <table className="table-auto border-collapse w-full mt-2">
                  <thead>
                    <tr>
                      {(detalle.fechas || []).map(f =>
                        <th key={f} className="border p-1 text-sm">{new Date(f).toLocaleDateString()}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {(detalle.fechas || []).map(f => {
                        const val = detalle.asistencias && detalle.asistencias[f] || false;
                        return (
                          <td key={f} className="border p-2 text-center">
                            <input type="checkbox" checked={!!val} onChange={() => onToggle(detalle.id, f, !!val)} />
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Selecciona un aprendiz para ver detalle</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsistenciaModule;