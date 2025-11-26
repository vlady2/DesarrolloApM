// src/utils/tripUtils.js

// Función compartida para determinar el estado del viaje
export const getTripStatus = (trip) => {
  if (!trip.startDate) return { status: 'Planificado', color: '#FFA500', icon: 'calendar-outline' };
  
  const today = new Date();
  let startDate, endDate;
  
  try {
    // Convertir fechas de string a Date (manejar formato DD/MM/YYYY)
    if (trip.startDate.includes('/')) {
      const [day, month, year] = trip.startDate.split('/');
      startDate = new Date(year, month - 1, day);
    } else {
      startDate = new Date(trip.startDate);
    }
    
    if (trip.endDate && trip.endDate.includes('/')) {
      const [day, month, year] = trip.endDate.split('/');
      endDate = new Date(year, month - 1, day);
    } else if (trip.endDate) {
      endDate = new Date(trip.endDate);
    }
  } catch (error) {
    console.error('Error procesando fechas:', error);
    return { status: 'Planificado', color: '#FFA500', icon: 'calendar-outline' };
  }
  
  // Verificar si la fecha de inicio es válida
  if (isNaN(startDate.getTime())) {
    return { status: 'Planificado', color: '#FFA500', icon: 'calendar-outline' };
  }
  
  // Determinar estado basado en fechas
  if (today < startDate) {
    return { status: 'Pendiente', color: '#FFA500', icon: 'time-outline' };
  }
  
  if (endDate && !isNaN(endDate.getTime()) && today > endDate) {
    return { status: 'Completado', color: '#888', icon: 'checkmark-done' };
  }
  
  if (today >= startDate && (!endDate || today <= endDate)) {
    return { status: 'En curso', color: '#4CAF50', icon: 'airplane' };
  }
  
  return { status: 'Planificado', color: '#FFA500', icon: 'calendar-outline' };
};

// Función compartida para formatear fechas
export const formatDate = (dateString) => {
  if (!dateString) return 'No especificada';
  
  try {
    let date;
    
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha inválida';
  }
};