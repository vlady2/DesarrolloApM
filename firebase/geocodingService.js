// firebase/geocodingService.js
import { GOOGLE_MAPS_API_KEY } from '@env';

/**
 * Convierte una dirección en coordenadas (GeoPoint)
 * @param {string} address - Dirección completa
 * @returns {Promise<FirebaseFirestore.GeoPoint|null>} GeoPoint o null si hay error
 */
export const geocodeAddress = async (address) => {
  try {
    if (!address || address.trim() === '') {
      console.log('⚠️ Dirección vacía, retornando null');
      return null;
    }

    console.log('📍 Geocodificando dirección:', address);
    
    // URL encode la dirección
    const encodedAddress = encodeURIComponent(address);
    
    // Llamar a Google Maps Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('✅ Coordenadas obtenidas:', location);
      
      // Importar GeoPoint de Firebase
      const { GeoPoint } = await import('firebase/firestore');
      return new GeoPoint(location.lat, location.lng);
    } else {
      console.warn('⚠️ No se pudieron obtener coordenadas:', data.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Error en geocodificación:', error);
    return null;
  }
};

export const geocodeTripDestination = async (destination) => {
  try {
    if (!destination || destination.trim() === '') {
      console.log('⚠️ Destino vacío, retornando null');
      return null;
    }

    console.log('📍 Geocodificando destino del viaje:', destination);
    
    // URL encode la dirección
    const encodedDestination = encodeURIComponent(destination);
    
    // Llamar a Google Maps Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedDestination}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('✅ Coordenadas del destino obtenidas:', location);
      
      // Importar GeoPoint de Firebase
      const { GeoPoint } = await import('firebase/firestore');
      return new GeoPoint(location.lat, location.lng);
    } else {
      console.warn('⚠️ No se pudieron obtener coordenadas del destino:', data.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Error geocodificando destino:', error);
    return null;
  }
};


/**
 * Geocodifica múltiples direcciones en paralelo
 * @param {Object} addresses - Objeto con direcciones {origin: '...', destination: '...'}
 * @returns {Promise<Object>} Objeto con GeoPoints {originCoords, destinationCoords}
 */
export const geocodeMoveAddresses = async (addresses) => {
  try {
    const { origin, destination } = addresses;
    
    // Geocodificar en paralelo para mejor performance
    const [originCoords, destinationCoords] = await Promise.all([
      geocodeAddress(origin),
      geocodeAddress(destination)
    ]);
    
    return {
      originCoords,
      destinationCoords
    };
  } catch (error) {
    console.error('❌ Error geocodificando direcciones:', error);
    return {
      originCoords: null,
      destinationCoords: null
    };
  }
};