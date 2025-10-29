import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getAprendices, createAprendiz, getProfesoras } from '../utils/api';

// Development marker to confirm this file is the one loaded by the app
// Remove or comment out in production
console.log('[DEV] AsistenciaForm (aprendices) loaded');

const initialState = () => ({
  fecha: new Date().toISOString().split('T')[0],
  presente: true,
  observaciones: ''
});

const toIsoDate = (dateString) => {
  // dateString expected as YYYY-MM-DD -> return full ISO with time 00:00:00Z
  if (!dateString) return null;
  // Use UTC midnight to avoid timezone shifts when backend expects date only
  return new Date(dateString + 'T00:00:00.000Z').toISOString();
};

const AsistenciaForm = ({ profesoras: propProfesoras = null, aprendices: propAprendices = null, onSubmit, onCancel }) => {
  const [profesoras, setProfesoras] = useState(propProfesoras || []);
  const [aprendices, setAprendices] = useState(propAprendices || []);
  const [selectedProfesora, setSelectedProfesora] = useState('');
  const [aprendizNombre, setAprendizNombre] = useState('');
  const [formData, setFormData] = useState(initialState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const firstInputRef = useRef(null);

  useEffect(() => {
    // Load profesoras if parent didn't provide
    let mounted = true;
    (async () => {
      try {
        if (!propProfesoras) {
          const data = await getProfesoras();
          if (!mounted) return;
          setProfesoras(data || []);
          if ((data || []).length > 0) setSelectedProfesora(String((data || [])[0].id));
        } else {
          setProfesoras(propProfesoras || []);
          if ((propProfesoras || []).length > 0) setSelectedProfesora(String((propProfesoras || [])[0].id));
        }
      } catch (e) {
        console.error('No se pudieron obtener profesoras:', e);
      }
    })();
    return () => { mounted = false };
  }, [propProfesoras]);

  useEffect(() => {
    // Focus the first input for accessibility when modal opens
    firstInputRef.current?.focus();
  }, []);

  // When selectedProfesora changes, load aprendices for her
  useEffect(() => {
    if (!selectedProfesora) return;
    let mounted = true;
    (async () => {
      try {
        const data = await getAprendices(Number(selectedProfesora));
        if (!mounted) return;
        setAprendices(data || []);
      } catch (e) {
        console.error('Error cargando aprendices para la profesora:', e);
        setAprendices([]);
      }
    })();
    return () => { mounted = false };
  }, [selectedProfesora]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!selectedProfesora) return 'Seleccione una facilitadora.';
    if (!aprendizNombre || aprendizNombre.trim() === '') return 'Escribe o selecciona el nombre del aprendiz.';
    if (!formData.fecha) return 'Seleccione una fecha válida.';
    // Additional validation rules can go here
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Determine aprendiz_id: match by name or create new
    let aprendiz_id = null;
    const nombreTrim = aprendizNombre.trim();
    const found = aprendices.find(a => a.nombre && a.nombre.toLowerCase() === nombreTrim.toLowerCase());
    try {
      if (found) {
        aprendiz_id = found.id;
      } else {
        // Create aprendiz for selected profesora
        const created = await createAprendiz({ nombre: nombreTrim, documento: null, profesora_id: Number(selectedProfesora) });
        aprendiz_id = created.id;
      }
    } catch (e) {
      console.error('Error creando/obteniendo aprendiz:', e);
      setError('No se pudo crear el aprendiz: ' + (e.message || e));
      setLoading(false);
      return;
    }

    const payload = {
      aprendiz_id: parseInt(aprendiz_id, 10),
      fecha: toIsoDate(formData.fecha),
      presente: formData.presente
    };

    try {
      setLoading(true);
      // If parent provided onSubmit, call it and await if returns a promise
      const result = onSubmit && onSubmit(payload);
      if (result && typeof result.then === 'function') {
        await result;
      }
      setSuccess('Asistencia guardada.');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error al guardar asistencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="asistencia-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 id="asistencia-title" className="text-lg font-medium text-gray-900">Nueva Asistencia</h3>
          <button
            onClick={onCancel}
            aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {error && (
            <div className="text-sm text-red-700 bg-red-100 p-2 rounded">{error}</div>
          )}
          {success && (
            <div className="text-sm text-green-700 bg-green-100 p-2 rounded">{success}</div>
          )}

          <div>
            <label htmlFor="profesora" className="block text-sm font-medium text-gray-700 mb-1">Facilitadora *</label>
            <select
              id="profesora"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
              value={selectedProfesora}
              onChange={(e) => setSelectedProfesora(e.target.value)}
            >
              <option value="">Seleccionar facilitadora</option>
              {profesoras.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} {p.especialidad ? `- ${p.especialidad}` : ''}</option>
              ))}
            </select>

            <label htmlFor="aprendizNombre" className="block text-sm font-medium text-gray-700 mb-1">Aprendiz (escribe o selecciona) *</label>
            <input
              id="aprendizNombre"
              list="aprendices-list"
              ref={firstInputRef}
              value={aprendizNombre}
              onChange={(e) => setAprendizNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nombre del aprendiz..."
            />
            <datalist id="aprendices-list">
              {aprendices.map(a => (
                <option key={a.id} value={a.nombre} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              id="fecha"
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
            />
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">Estado de Asistencia *</legend>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="presente"
                  aria-label="Presente"
                  checked={formData.presente === true}
                  onChange={() => handleChange('presente', true)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Presente</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="presente"
                  aria-label="Ausente"
                  checked={formData.presente === false}
                  onChange={() => handleChange('presente', false)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Ausente</span>
              </label>
            </div>
          </fieldset>

          <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Agregar comentarios adicionales..."
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar Asistencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsistenciaForm;