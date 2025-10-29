// Utilidades para el manejo correcto de fechas con zona horaria de Colombia

// Configuración de zona horaria para Colombia
const COLOMBIA_TIMEZONE = 'America/Bogota';

// Helper: obtiene las partes de fecha/hora en una zona horaria especificada
const getTZDateParts = (date, timeZone) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });

    const parts = {};
    formatter.formatToParts(date).forEach((p) => {
      if (p.type !== 'literal') parts[p.type] = p.value;
    });

    return parts; // { year, month, day, hour, minute, second }
  } catch (error) {
    console.error('Error obteniendo partes TZ:', error);
    return null;
  }
};

/**
 * Formatea una fecha para mostrar en formato legible
 * @param {string|Date} dateInput - Fecha en string ISO o objeto Date
 * @returns {string} - Fecha formateada
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', dateInput);
      return 'Fecha inválida';
    }
    
    // Formatear en zona horaria de Colombia
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: COLOMBIA_TIMEZONE
    };
    
    return date.toLocaleString('es-CO', options);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
};

/**
 * Formatea solo la fecha (sin hora)
 * @param {string|Date} dateInput - Fecha en string ISO o objeto Date
 * @returns {string} - Fecha formateada sin hora
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: COLOMBIA_TIMEZONE
    };
    
    return date.toLocaleDateString('es-CO', options);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
};

/**
 * Formatea solo la hora
 * @param {string|Date} dateInput - Fecha en string ISO o objeto Date
 * @returns {string} - Hora formateada
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      return 'Hora inválida';
    }
    
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: COLOMBIA_TIMEZONE
    };
    
    return date.toLocaleTimeString('es-CO', options);
  } catch (error) {
    console.error('Error formateando hora:', error);
    return 'Error en hora';
  }
};

/**
 * Convierte una fecha a string en formato datetime-local para inputs HTML
 * @param {Date} date - Objeto Date
 * @returns {string} - String en formato YYYY-MM-DDTHH:MM
 */
export const dateToLocalString = (date) => {
  if (!date || !(date instanceof Date)) return '';
  
  try {
    // Crear una nueva fecha ajustada a la zona horaria local
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
  } catch (error) {
    console.error('Error convirtiendo fecha a string local:', error);
    return '';
  }
};

/**
 * Obtiene la fecha actual en Colombia
 * @returns {Date} - Fecha actual en zona horaria de Colombia
 */
export const getCurrentColombiaDate = () => {
  // Devuelve el instante actual (Date) — las comparaciones por día usan getTZDateParts
  return new Date();
};

/**
 * Verifica si una fecha es hoy
 * @param {string|Date} dateInput - Fecha a verificar
 * @returns {boolean} - True si es hoy
 */
export const isToday = (dateInput) => {
  if (!dateInput) return false;
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    const dParts = getTZDateParts(date, COLOMBIA_TIMEZONE);
    const nowParts = getTZDateParts(new Date(), COLOMBIA_TIMEZONE);

    if (!dParts || !nowParts) return false;

    return (
      dParts.year === nowParts.year &&
      dParts.month === nowParts.month &&
      dParts.day === nowParts.day
    );
  } catch (error) {
    console.error('Error verificando si es hoy:', error);
    return false;
  }
};

/**
 * Verifica si una fecha es en el pasado
 * @param {string|Date} dateInput - Fecha a verificar
 * @returns {boolean} - True si es en el pasado
 */
export const isPastDate = (dateInput) => {
  if (!dateInput) return false;
  
  try {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // Comparar instantes: si la fecha (instante) es menor que ahora, está en el pasado
  return date.getTime() < Date.now();
  } catch (error) {
    console.error('Error verificando si es fecha pasada:', error);
    return false;
  }
};

/**
 * Obtiene el rango de fechas para un mes específico
 * @param {number} year - Año
 * @param {number} month - Mes (0-11)
 * @returns {Object} - Objeto con fechas de inicio y fin del mes
 */
export const getMonthRange = (year, month) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Formatea un rango de fechas para mostrar
 * @param {string|Date} startDate - Fecha de inicio
 * @param {string|Date} endDate - Fecha de fin
 * @returns {string} - Rango formateado
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    // Si es el mismo día, mostrar solo la fecha una vez con rango de horas
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(start)} de ${formatTime(start)} a ${formatTime(end)}`;
    } else {
      return `${formatDateTime(start)} - ${formatDateTime(end)}`;
    }
  } catch (error) {
    console.error('Error formateando rango de fechas:', error);
    return 'Error en rango';
  }
};

/**
 * Calcula la duración entre dos fechas en horas y minutos
 * @param {string|Date} startDate - Fecha de inicio
 * @param {string|Date} endDate - Fecha de fin
 * @returns {string} - Duración formateada
 */
export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `${diffMinutes} minutos`;
    } else if (diffMinutes === 0) {
      return `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `${diffHours}h ${diffMinutes}m`;
    }
  } catch (error) {
    console.error('Error calculando duración:', error);
    return '';
  }
};

/**
 * Convierte una fecha del backend (que puede venir con zona horaria) a Date local
 * @param {string} backendDate - Fecha del backend
 * @returns {Date} - Objeto Date local
 */
export const parseBackendDate = (backendDate) => {
  if (!backendDate) return null;
  
  try {
    // Normalizar fechas recibidas del backend:
    // - Si la cadena ya contiene información de zona (Z o +hh:mm), respetarla
    // - Si es una marca naive como '2025-09-05T14:00:00', asumir UTC y añadir 'Z'
    if (typeof backendDate === 'string') {
      const hasTZ = /([zZ]|[+\-]\d\d:?\d\d)$/.test(backendDate);
      const normalized = hasTZ ? backendDate : backendDate + 'Z';
      return new Date(normalized);
    }

    // Si ya es Date
    if (backendDate instanceof Date) return backendDate;

    return new Date(backendDate);
  } catch (error) {
    console.error('Error parseando fecha del backend:', error);
    return null;
  }
};

/**
 * Prepara una fecha para enviar al backend
 * @param {string} frontendDate - Fecha del input datetime-local
 * @returns {string} - Fecha formateada para el backend
 */
export const prepareDateForBackend = (frontendDate) => {
  if (!frontendDate) return '';
  
  try {
    // El input datetime-local envía en formato "YYYY-MM-DDTHH:mm"
    // El backend esperará este formato y aplicará la zona horaria correcta
    return frontendDate;
  } catch (error) {
    console.error('Error preparando fecha para backend:', error);
    return '';
  }
};

/**
 * Obtiene los días de un mes para el calendario
 * @param {Date} currentDate - Fecha actual del calendario
 * @returns {Array} - Array de objetos con información de los días
 */
export const getCalendarDays = (currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  const today = getCurrentColombiaDate();
  
  // Días del mes anterior
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevMonthDay = new Date(year, month - 1, lastDay.getDate() - i);
    days.push({
      date: prevMonthDay,
      isCurrentMonth: false,
      isToday: false,
      isPast: isPastDate(prevMonthDay)
    });
  }
  
  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({
      date: date,
      isCurrentMonth: true,
      isToday: isToday(date),
      isPast: isPastDate(date)
    });
  }
  
  // Días del próximo mes para completar la grilla (42 celdas)
  const remainingCells = 42 - days.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDay = new Date(year, month + 1, day);
    days.push({
      date: nextMonthDay,
      isCurrentMonth: false,
      isToday: false,
      isPast: isPastDate(nextMonthDay)
    });
  }
  
  return days;
};