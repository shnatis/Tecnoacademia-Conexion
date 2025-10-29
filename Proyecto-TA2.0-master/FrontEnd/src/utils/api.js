// utils/api.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Función para hacer fetch con autenticación
export const authenticatedFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  // If options.body is a FormData, don't set Content-Type, the browser will set the correct boundary
  const headers = {
    ...defaultHeaders,
    ...options.headers
  };

  // If there is a body and Content-Type wasn't provided and body is not FormData, set JSON
  if (options.body && !(options.body instanceof FormData)) {
    if (!Object.keys(headers).some(h => h.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Si el token ha expirado, redirigir al login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Token expirado');
    }
    
    return response;
  } catch (error) {
    console.error('Error en authenticatedFetch:', error);
    throw error;
  }
};

// Funciones específicas para la API

// Profesoras
export const getProfesoras = async () => {
  const response = await authenticatedFetch('/profesoras');
  if (!response.ok) throw new Error('Error al obtener profesoras');
  return response.json();
};

export const updateProfesora = async (profesoraId, data) => {
  const response = await authenticatedFetch(`/admin/profesoras/${profesoraId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Error al actualizar profesora');
  return response.json();
};

export const deleteProfesora = async (profesoraId) => {
  const response = await authenticatedFetch(`/admin/profesoras/${profesoraId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Error al eliminar profesora');
  return response.json();
};

export const changeProfesoraPassword = async (profesoraId, newPassword) => {
  const response = await authenticatedFetch(`/admin/profesoras/${profesoraId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ nueva_password: newPassword })
  });
  if (!response.ok) throw new Error('Error al cambiar contraseña');
  return response.json();
};

// Clases
export const getClases = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  const endpoint = `/clases${queryString ? '?' + queryString : ''}`;
  
  const response = await authenticatedFetch(endpoint);
  if (!response.ok) throw new Error('Error al obtener clases');
  return response.json();
};

export const getClase = async (claseId) => {
  const response = await authenticatedFetch(`/clases/${claseId}`);
  if (!response.ok) throw new Error('Error al obtener clase');
  return response.json();
};

export const createClase = async (claseData) => {
  const response = await authenticatedFetch('/clases', {
    method: 'POST',
    body: JSON.stringify(claseData)
  });
  if (!response.ok) throw new Error('Error al crear clase');
  return response.json();
};

export const updateClase = async (claseId, claseData) => {
  const response = await authenticatedFetch(`/clases/${claseId}`, {
    method: 'PUT',
    body: JSON.stringify(claseData)
  });
  if (!response.ok) throw new Error('Error al actualizar clase');
  return response.json();
};

export const deleteClase = async (claseId) => {
  const response = await authenticatedFetch(`/clases/${claseId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Error al eliminar clase');
  return response.json();
};

export const getCalendarioClases = async (mes, anio) => {
  // backend expects the route /clases/calendario/mes and parameter name 'anio'
  const response = await authenticatedFetch(`/clases/calendario/mes?mes=${mes}&anio=${anio}`);
  if (!response.ok) throw new Error('Error al obtener calendario');
  return response.json();
};

// Aprendices
export const getAprendices = async (profesoraId = null) => {
  const endpoint = profesoraId ? `/aprendices?profesora_id=${profesoraId}` : '/aprendices';
  const response = await authenticatedFetch(endpoint);
  if (!response.ok) throw new Error('Error al obtener aprendices');
  return response.json();
};

export const getAprendiz = async (aprendizId) => {
  const response = await authenticatedFetch(`/aprendices/${aprendizId}`);
  if (!response.ok) throw new Error('Error al obtener aprendiz');
  return response.json();
};

export const createAprendiz = async (aprendizData) => {
  const response = await authenticatedFetch('/aprendices', {
    method: 'POST',
    body: JSON.stringify(aprendizData)
  });
  if (!response.ok) throw new Error('Error al crear aprendiz');
  return response.json();
};

export const updateAprendiz = async (aprendizId, aprendizData) => {
  const response = await authenticatedFetch(`/aprendices/${aprendizId}`, {
    method: 'PUT',
    body: JSON.stringify(aprendizData)
  });
  if (!response.ok) throw new Error('Error al actualizar aprendiz');
  return response.json();
};

export const deleteAprendiz = async (aprendizId) => {
  const response = await authenticatedFetch(`/aprendices/${aprendizId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Error al eliminar aprendiz');
  return response.json();
};

// Estadísticas y Dashboard
export const getDashboardStats = async () => {
  const response = await authenticatedFetch('/estadisticas/dashboard');
  if (!response.ok) throw new Error('Error al obtener estadísticas del dashboard');
  return response.json();
};

// Health check
export const healthCheck = async () => {
  const response = await authenticatedFetch('/health');
  if (!response.ok) throw new Error('Error al verificar estado de la aplicación');
  return response.json();
};

// Autenticación
export const login = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error de autenticación');
  }
  
  return response.json();
};

export const register = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al registrar usuario');
  }
  
  return response.json();
};

export const getCurrentUser = async () => {
  const response = await authenticatedFetch('/me');
  if (!response.ok) throw new Error('Error al obtener usuario actual');
  return response.json();
};

// Utilidades para manejar errores
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('Token expirado')) {
    // Ya manejado en authenticatedFetch
    return;
  }
  
  // Mostrar mensaje de error al usuario
  const message = error.message || 'Error desconocido de la API';
  
  // Puedes personalizar esto según tu sistema de notificaciones
  alert(message);
};

// Función para verificar si el token es válido
export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Decodificar el JWT para verificar la expiración
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    
    return payload.exp > now;
  } catch {
    return false;
  }
};

// Función para logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};