// screens/MapPickerMoveScreen.js - MAPA PARA MUDANZAS
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const MapPickerMoveScreen = ({ navigation, route }) => {
    const { addressType = 'origin', currentAddress = '' } = route.params || {};
    
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const webViewRef = useRef(null);

    // ✅ API GRATUITA Y FUNCIONAL - BigDataCloud (igual que en viajes)
    const getLocationFromCoords = async (lat, lng) => {
        try {
            console.log(`📍 Buscando ubicación: ${lat}, ${lng}`);
            
            // INTENTO 1: API de BigDataCloud (GRATIS, sin API key)
            try {
                const response1 = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
                    {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        },
                        timeout: 10000 // 10 segundos timeout
                    }
                );
                
                if (response1.ok) {
                    const data1 = await response1.json();
                    console.log('📦 Respuesta BigDataCloud:', data1);
                    
                    if (data1 && data1.countryName) {
                        let country = data1.countryName || 'País desconocido';
                        let city = data1.locality || data1.city || data1.principalSubdivision || 'Ubicación seleccionada';
                        let street = data1.street || data1.locality || '';
                        
                        // Si es El Salvador, mejoramos la precisión
                        if (country === 'El Salvador') {
                            if (lng > -87.9 && lng < -87.7) {
                                city = 'La Unión';
                            } else if (lng > -88.3 && lng < -88.1) {
                                city = 'San Miguel';
                            } else if (lng > -89.3 && lng < -89.1) {
                                city = 'San Salvador';
                            }
                        }
                        
                        return {
                            latitude: lat,
                            longitude: lng,
                            address: street ? `${street}, ${city}, ${country}` : `${city}, ${country}`,
                            rawAddress: street ? `${street}, ${city}, ${country}` : `${city}, ${country}`,
                            street: street,
                            city: city,
                            country: country,
                            source: 'BigDataCloud'
                        };
                    }
                }
            } catch (error1) {
                console.log('⚠️ BigDataCloud falló, intentando otra API...');
            }
            
            // INTENTO 2: API de OpenStreetMap con proxy
            try {
                const response2 = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1&accept-language=es`,
                    {
                        headers: {
                            'User-Agent': 'MoveApp/1.0',
                            'Accept': 'application/json'
                        }
                    }
                );
                
                if (response2.ok) {
                    const data2 = await response2.json();
                    console.log('📦 Respuesta OpenStreetMap:', data2);
                    
                    if (data2 && data2.address) {
                        const addr = data2.address;
                        let country = addr.country || 'País desconocido';
                        let city = '';
                        let street = addr.road || addr.street || '';
                        
                        // Buscar ciudad en diferentes campos
                        if (addr.city) city = addr.city;
                        else if (addr.town) city = addr.town;
                        else if (addr.village) city = addr.village;
                        else if (addr.municipality) city = addr.municipality;
                        else if (addr.county) city = addr.county;
                        else if (addr.state) city = addr.state;
                        else city = 'Área cercana';
                        
                        return {
                            latitude: lat,
                            longitude: lng,
                            address: street ? `${street}, ${city}, ${country}` : `${city}, ${country}`,
                            rawAddress: street ? `${street}, ${city}, ${country}` : `${city}, ${country}`,
                            street: street,
                            city: city,
                            country: country,
                            source: 'OpenStreetMap'
                        };
                    }
                }
            } catch (error2) {
                console.log('⚠️ OpenStreetMap falló, usando fallback...');
            }
            
            // INTENTO 3: Usar API de GeoNames (gratis)
            try {
                const username = 'moveapp'; // Nombre de usuario cualquiera para GeoNames
                const response3 = await fetch(
                    `http://api.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lng}&username=${username}&lang=es`,
                    {
                        timeout: 8000
                    }
                );
                
                if (response3.ok) {
                    const data3 = await response3.json();
                    console.log('📦 Respuesta GeoNames:', data3);
                    
                    if (data3.geonames && data3.geonames.length > 0) {
                        const place = data3.geonames[0];
                        return {
                            latitude: lat,
                            longitude: lng,
                            address: `${place.name}, ${place.countryName}`,
                            rawAddress: `${place.name}, ${place.countryName}`,
                            street: '',
                            city: place.name,
                            country: place.countryName,
                            source: 'GeoNames'
                        };
                    }
                }
            } catch (error3) {
                console.log('⚠️ GeoNames falló...');
            }
            
            throw new Error('Todas las APIs fallaron');
            
        } catch (error) {
            console.error('❌ Todas las APIs fallaron:', error);
            
            // FALLBACK INTELIGENTE: Determinar ubicación por coordenadas
            return getLocationByCoordinates(lat, lng);
        }
    };

    // 🗺️ Determinar ubicación por coordenadas (fallback inteligente)
    const getLocationByCoordinates = (lat, lng) => {
        console.log(`🗺️ Usando fallback por coordenadas: ${lat}, ${lng}`);
        
        // Base de datos de países y regiones (igual que en viajes)
        const regions = [
            // América Central
            { name: 'El Salvador', latMin: 13.0, latMax: 14.5, lngMin: -90.0, lngMax: -87.5 },
            { name: 'Guatemala', latMin: 13.7, latMax: 18.0, lngMin: -92.2, lngMax: -88.2 },
            { name: 'Honduras', latMin: 12.9, latMax: 16.5, lngMin: -89.3, lngMax: -83.1 },
            { name: 'Nicaragua', latMin: 10.7, latMax: 15.0, lngMin: -87.7, lngMax: -82.7 },
            { name: 'Costa Rica', latMin: 8.0, latMax: 11.2, lngMin: -85.9, lngMax: -82.5 },
            { name: 'Panamá', latMin: 7.2, latMax: 9.7, lngMin: -83.0, lngMax: -77.1 },
            
            // Norteamérica
            { name: 'México', latMin: 14.5, latMax: 32.5, lngMin: -118.5, lngMax: -86.5 },
            { name: 'Estados Unidos', latMin: 24.5, latMax: 49.5, lngMin: -125.0, lngMax: -66.5 },
            { name: 'Canadá', latMin: 41.5, latMax: 83.5, lngMin: -141.0, lngMax: -52.5 },
            
            // Suramérica
            { name: 'Argentina', latMin: -55.0, latMax: -21.8, lngMin: -73.6, lngMax: -53.6 },
            { name: 'Brasil', latMin: -33.8, latMax: 5.3, lngMin: -73.9, lngMax: -34.7 },
            { name: 'Chile', latMin: -55.9, latMax: -17.5, lngMin: -75.6, lngMax: -66.1 },
            { name: 'Colombia', latMin: -4.2, latMax: 12.5, lngMin: -79.0, lngMax: -66.9 },
            { name: 'Perú', latMin: -18.4, latMax: 0.2, lngMin: -81.4, lngMax: -68.7 },
            
            // Europa
            { name: 'España', latMin: 27.6, latMax: 43.8, lngMin: -18.2, lngMax: 4.3 },
            { name: 'Francia', latMin: 41.3, latMax: 51.1, lngMin: -5.2, lngMax: 9.6 },
            { name: 'Italia', latMin: 35.5, latMax: 47.1, lngMin: 6.6, lngMax: 18.5 },
            { name: 'Alemania', latMin: 47.3, latMax: 55.1, lngMin: 5.9, lngMax: 15.0 },
            { name: 'Reino Unido', latMin: 49.9, latMax: 60.9, lngMin: -8.6, lngMax: 1.8 },
            
            // Asia
            { name: 'China', latMin: 18.2, latMax: 53.5, lngMin: 73.6, lngMax: 134.8 },
            { name: 'Japón', latMin: 24.4, latMax: 45.5, lngMin: 122.9, lngMax: 145.8 },
            { name: 'India', latMin: 8.1, latMax: 37.1, lngMin: 68.2, lngMax: 97.4 },
            
            // Oceanía
            { name: 'Australia', latMin: -43.6, latMax: -10.7, lngMin: 113.3, lngMax: 153.6 },
            
            // África
            { name: 'Sudáfrica', latMin: -34.8, latMax: -22.1, lngMin: 16.5, lngMax: 32.9 },
        ];

        // Buscar región
        let country = 'País desconocido';
        let city = 'Ubicación seleccionada';
        
        for (const region of regions) {
            if (lat >= region.latMin && lat <= region.latMax && 
                lng >= region.lngMin && lng <= region.lngMax) {
                country = region.name;
                
                // Para El Salvador, determinar ciudad específica
                if (country === 'El Salvador') {
                    if (lng > -87.9 && lng < -87.7) {
                        city = 'La Unión';
                    } else if (lng > -88.3 && lng < -88.1) {
                        city = 'San Miguel';
                    } else if (lng > -89.3 && lng < -89.1) {
                        city = 'San Salvador';
                    } else {
                        city = 'El Salvador';
                    }
                } else {
                    city = country;
                }
                break;
            }
        }

        return {
            latitude: lat,
            longitude: lng,
            address: `${city}, ${country}`,
            rawAddress: `${city}, ${country}`,
            street: '',
            city: city,
            country: country,
            source: 'Fallback por coordenadas'
        };
    };

    // 🗺️ HTML del mapa MEJORADO (igual que en viajes)
    const mapHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { width: 100%; height: 100%; overflow: hidden; }
        #map { width: 100%; height: 100%; background: #1a1a1a; }
        
        .leaflet-popup-content-wrapper { 
            background: rgba(30, 30, 30, 0.95); 
            backdrop-filter: blur(5px);
            border-radius: 12px;
            border: 1px solid rgba(66, 133, 244, 0.3);
            color: white;
            padding: 0;
        }
        
        .leaflet-popup-content { 
            margin: 0;
            padding: 0;
        }
        
        .selection-marker {
            background: #4285F4;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(66, 133, 244, 0.7);
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .pulse-animation {
            animation: pulse 1.5s infinite;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Inicializar mapa centrado en América
        const map = L.map('map').setView([13.6929, -89.2182], 3);
        
        // Capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);
        
        // Variables globales
        let selectionMarker = null;
        let currentPopup = null;
        
        // Función para mostrar popup de carga
        function showLoadingPopup(lat, lng) {
            if (currentPopup) {
                map.closePopup(currentPopup);
            }
            
            currentPopup = L.popup()
                .setLatLng([lat, lng])
                .setContent(
                    '<div style="padding: 20px; text-align: center; min-width: 220px;">' +
                    '<div style="color: #4285F4; font-size: 36px; margin-bottom: 12px; animation: pulse 1.5s infinite;">📍</div>' +
                    '<p style="color: white; font-size: 15px; margin-bottom: 15px; font-weight: 500;">Buscando dirección...</p>' +
                    '<div style="width: 100%; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">' +
                    '<div style="width: 60%; height: 100%; background: #4285F4; animation: loading 1.5s infinite;"></div>' +
                    '</div>' +
                    '<style>' +
                    '@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }' +
                    '@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }' +
                    '</style>' +
                    '</div>'
                )
                .openOn(map);
        }
        
        // Función para actualizar con datos reales
        window.updateMapPopup = function(locationData) {
            if (currentPopup) {
                map.closePopup(currentPopup);
            }
            
            // Crear marcador si no existe
            if (!selectionMarker) {
                selectionMarker = L.marker([locationData.latitude, locationData.longitude], {
                    icon: L.divIcon({
                        className: 'selection-marker',
                        html: '<div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; color: white; font-size: 22px; background: #4285F4; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(66, 133, 244, 0.7);">📍</div>',
                        iconSize: [40, 40],
                        iconAnchor: [20, 40]
                    })
                }).addTo(map);
            } else {
                selectionMarker.setLatLng([locationData.latitude, locationData.longitude]);
            }
            
            const popupContent = \`
                <div style="min-width: 280px; padding: 18px;">
                    <div style="display: flex; align-items: center; margin-bottom: 16px;">
                        <div style="background: #4285F4; width: 50px; height: 50px; border-radius: 50%; 
                                 display: flex; align-items: center; justify-content: center; 
                                 margin-right: 16px; color: white; font-size: 26px; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);">
                            📍
                        </div>
                        <div>
                            <h3 style="margin: 0; color: #BB86FC; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                                DIRECCIÓN ENCONTRADA
                            </h3>
                            <p style="margin: 10px 0 0 0; color: white; font-size: 17px; font-weight: bold;">
                                \${locationData.street ? locationData.street + ', ' : ''}\${locationData.city}
                            </p>
                            <p style="margin: 4px 0 0 0; color: #888; font-size: 14px;">
                                \${locationData.country}
                            </p>
                        </div>
                    </div>
                    
                    <div style="background: rgba(76, 175, 80, 0.15); padding: 14px; border-radius: 10px; 
                             margin: 14px 0; border-left: 4px solid #4CAF50; border-right: 1px solid rgba(76, 175, 80, 0.2);">
                        <p style="margin: 0; color: #4CAF50; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 16px;">📝</span> Se guardará como:
                        </p>
                        <p style="margin: 8px 0 0 0; color: white; font-size: 15px; font-weight: 500;">
                            \${locationData.street ? locationData.street + ', ' : ''}\${locationData.city}, \${locationData.country}
                        </p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid #333;">
                        <div>
                            <p style="margin: 0; color: #888; font-size: 11px; font-weight: 500;">Latitud</p>
                            <p style="margin: 4px 0 0 0; color: white; font-size: 12px; font-family: monospace;">
                                \${locationData.latitude.toFixed(6)}°
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; color: #888; font-size: 11px; font-weight: 500;">Longitud</p>
                            <p style="margin: 4px 0 0 0; color: white; font-size: 12px; font-family: monospace;">
                                \${locationData.longitude.toFixed(6)}°
                            </p>
                        </div>
                    </div>
                </div>
            \`;
            
            currentPopup = L.popup()
                .setLatLng([locationData.latitude, locationData.longitude])
                .setContent(popupContent)
                .openOn(map);
        };
        
        // Manejar clic en el mapa
        map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            console.log('📍 Coordenadas click:', lat, lng);
            
            // Mostrar popup de carga
            showLoadingPopup(lat, lng);
            
            // Enviar coordenadas a React Native
            window.ReactNativeWebView.postMessage(
                JSON.stringify({
                    type: 'COORDINATES_SELECTED',
                    latitude: lat,
                    longitude: lng,
                    timestamp: Date.now()
                })
            );
        });
        
        // Notificar que el mapa está listo
        setTimeout(() => {
            window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'MAP_READY' })
            );
            console.log('✅ Mapa inicializado correctamente');
        }, 800);
    </script>
</body>
</html>`;

    // 📍 Manejar mensajes del WebView
    const handleWebViewMessage = async (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            
            if (message.type === 'MAP_READY') {
                setLoading(false);
                console.log('✅ Mapa listo');
            }
            
            if (message.type === 'COORDINATES_SELECTED') {
                const { latitude, longitude } = message;
                console.log(`📍 Coordenadas recibidas: ${latitude}, ${longitude}`);
                
                // Mostrar loading
                setSelectedLocation({
                    latitude,
                    longitude,
                    address: 'Buscando dirección...',
                    city: 'Cargando...',
                    country: '...',
                    street: ''
                });
                
                // 🔥 OBTENER UBICACIÓN CON API GRATUITA
                const locationData = await getLocationFromCoords(latitude, longitude);
                
                console.log('✅ Dirección obtenida:', locationData);
                setSelectedLocation(locationData);
                
                // Actualizar el mapa
                if (webViewRef.current) {
                    const script = `
                        if (typeof window.updateMapPopup === 'function') {
                            window.updateMapPopup(${JSON.stringify(locationData)});
                        }
                    `;
                    webViewRef.current.injectJavaScript(script);
                }
            }
            
        } catch (error) {
            console.error('Error en handleWebViewMessage:', error);
            Alert.alert('Error', 'No se pudo obtener la dirección. Intenta nuevamente.');
        }
    };

    // ✅ Confirmar selección - MANEJA AMBOS CASOS (NUEVA MUDANZA Y EDICIÓN)
    const confirmSelection = () => {
        if (selectedLocation && selectedLocation.country !== '...') {
            console.log('📍 Confirmando selección para mudanza:', selectedLocation);
            
            // Verificar si viene con callback (edición o nueva mudanza)
            if (route.params?.onSelectAddress) {
                console.log('🔄 Viene de pantalla de mudanza - llamando callback');
                // Llamar al callback con la dirección seleccionada
                route.params.onSelectAddress(selectedLocation.address, addressType);
                // Regresar a la pantalla anterior (NewMoveScreen o EditMoveScreen)
                navigation.goBack();
            } else {
                // Si no hay callback, mostrar alerta (no debería pasar)
                Alert.alert('Error', 'No se pudo guardar la dirección seleccionada.');
            }
        } else {
            Alert.alert('Espera', 'Estamos obteniendo la dirección...');
        }
    };

    // 🔍 Búsqueda de países (igual que en viajes)
    const COUNTRIES_WITH_COORDS = [
        { name: 'El Salvador', lat: 13.6929, lng: -89.2182 },
        { name: 'Guatemala', lat: 14.6349, lng: -90.5069 },
        { name: 'Honduras', lat: 14.0818, lng: -87.2068 },
        { name: 'Nicaragua', lat: 12.1364, lng: -86.2514 },
        { name: 'Costa Rica', lat: 9.9281, lng: -84.0907 },
        { name: 'Panamá', lat: 8.9943, lng: -79.5188 },
        { name: 'México', lat: 19.4326, lng: -99.1332 },
        { name: 'Estados Unidos', lat: 38.9072, lng: -77.0369 },
        { name: 'Canadá', lat: 45.4215, lng: -75.6972 },
        { name: 'Argentina', lat: -34.6037, lng: -58.3816 },
        { name: 'Brasil', lat: -15.7975, lng: -47.8919 },
        { name: 'Chile', lat: -33.4489, lng: -70.6693 },
        { name: 'Colombia', lat: 4.7110, lng: -74.0721 },
        { name: 'Perú', lat: -12.0464, lng: -77.0428 },
        { name: 'España', lat: 40.4168, lng: -3.7038 },
        { name: 'Francia', lat: 48.8566, lng: 2.3522 },
        { name: 'Italia', lat: 41.9028, lng: 12.4964 },
        { name: 'Alemania', lat: 52.5200, lng: 13.4050 },
    ];

    const searchCountries = (query) => {
        if (!query.trim()) {
            setSearchResults(COUNTRIES_WITH_COORDS);
            return;
        }
        
        const results = COUNTRIES_WITH_COORDS.filter(country => 
            country.name.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(results);
        setSearching(false);
    };

    const handleSearchChange = (text) => {
        setSearchQuery(text);
        if (text.length === 0) {
            searchCountries('');
        } else if (text.length >= 2) {
            setSearching(true);
            searchCountries(text);
        }
    };

    const handleSelectCountry = async (country) => {
        const { name, lat, lng } = country;
        
        // Mover mapa al país
        if (webViewRef.current) {
            const script = `
                map.setView([${lat}, ${lng}], 8);
                
                // Limpiar marcador anterior
                if (window.selectionMarker) {
                    window.selectionMarker.remove();
                    window.selectionMarker = null;
                }
                if (window.currentPopup) {
                    map.closePopup(window.currentPopup);
                    window.currentPopup = null;
                }
                
                // Simular clic para obtener ubicación
                setTimeout(() => {
                    window.ReactNativeWebView.postMessage(
                        JSON.stringify({
                            type: 'COORDINATES_SELECTED',
                            latitude: ${lat},
                            longitude: ${lng},
                            timestamp: Date.now()
                        })
                    );
                }, 300);
            `;
            webViewRef.current.injectJavaScript(script);
        }
        
        setSearchVisible(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Mostrar países al abrir búsqueda
    useEffect(() => {
        if (searchVisible && searchQuery === '') {
            searchCountries('');
        }
    }, [searchVisible]);

    // Cargar dirección actual si existe
    useEffect(() => {
        if (currentAddress) {
            // Puedes implementar geocodificación inversa aquí si quieres centrar en la dirección
            console.log('📍 Dirección actual:', currentAddress);
        }
    }, [currentAddress]);

    // Obtener título según tipo de dirección
    const getTitle = () => {
        switch(addressType) {
            case 'origin':
                return 'Seleccionar Origen';
            case 'destination':
                return 'Seleccionar Destino';
            default:
                return 'Seleccionar Dirección';
        }
    };

    // Estilos
    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: '#121212' },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#1a1a1a',
            borderBottomWidth: 1,
            borderBottomColor: '#333',
        },
        backButton: { padding: 8 },
        title: {
            flex: 1,
            fontSize: 18,
            fontWeight: '600',
            color: 'white',
            textAlign: 'center',
        },
        searchButton: { padding: 8 },
        searchContainer: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#121212',
            zIndex: 1000,
            paddingTop: StatusBar.currentHeight || 40,
        },
        searchHeader: {
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#333',
        },
        searchBox: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#1a1a1a',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 12,
        },
        searchInput: {
            flex: 1,
            color: 'white',
            fontSize: 16,
            marginLeft: 10,
            marginRight: 10,
        },
        searchCancel: { alignSelf: 'flex-end', padding: 5 },
        searchCancelText: { color: '#BB86FC', fontSize: 16, fontWeight: '500' },
        resultsContainer: { flex: 1, padding: 16 },
        resultsTitle: {
            color: '#BB86FC',
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 12,
            textTransform: 'uppercase',
        },
        resultItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            backgroundColor: '#1a1a1a',
        },
        resultInfo: { flex: 1, marginLeft: 12 },
        resultName: { color: 'white', fontSize: 14, fontWeight: '500' },
        loadingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#121212',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        },
        loadingText: { marginTop: 16, color: 'white', fontSize: 16 },
        map: { flex: 1, backgroundColor: '#1a1a1a' },
        bottomPanel: {
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 99,
        },
        selectedLocationCard: {
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(76, 175, 80, 0.3)',
            elevation: 8,
        },
        locationHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        locationInfo: { flex: 1, marginLeft: 12 },
        locationTitle: {
            color: '#4CAF50',
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 4,
        },
        locationAddress: {
            color: 'white',
            fontSize: 15,
            fontWeight: '500',
            marginBottom: 2,
        },
        locationCoords: { color: '#888', fontSize: 11, fontStyle: 'italic' },
        saveNote: { color: '#4CAF50', fontSize: 11, fontStyle: 'italic', marginBottom: 12 },
        actionsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        chooseAnotherButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: 'rgba(187, 134, 252, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(187, 134, 252, 0.3)',
        },
        chooseAnotherText: {
            color: '#BB86FC',
            fontSize: 14,
            fontWeight: '500',
            marginLeft: 6,
        },
        useButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#4CAF50',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
        },
        useButtonText: {
            color: 'white',
            fontSize: 14,
            fontWeight: '600',
            marginRight: 6,
        },
        addressTypeBadge: {
            backgroundColor: addressType === 'origin' ? '#FF9800' : '#2196F3',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            marginRight: 10,
        },
        addressTypeText: {
            color: 'white',
            fontSize: 11,
            fontWeight: '600',
        },
        searchingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
        },
        searchingText: { marginTop: 12, color: '#BB86FC', fontSize: 14 },
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#121212" barStyle="light-content" />
            
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#BB86FC" />
                </TouchableOpacity>
                
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={styles.addressTypeBadge}>
                        <Text style={styles.addressTypeText}>
                            {addressType === 'origin' ? 'ORIGEN' : 'DESTINO'}
                        </Text>
                    </View>
                    <Text style={styles.title}>{getTitle()}</Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={() => setSearchVisible(true)}
                >
                    <Icon name="search" size={22} color="#BB86FC" />
                </TouchableOpacity>
            </View>

            {/* BÚSQUEDA */}
            {searchVisible && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchHeader}>
                        <View style={styles.searchBox}>
                            <Icon name="search" size={22} color="#BB86FC" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar país..."
                                placeholderTextColor="#888"
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                autoFocus={true}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => {
                                    setSearchQuery('');
                                    searchCountries('');
                                }}>
                                    <Icon name="close" size={20} color="#888" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity 
                            style={styles.searchCancel}
                            onPress={() => {
                                setSearchVisible(false);
                                setSearchQuery('');
                                setSearchResults([]);
                            }}
                        >
                            <Text style={styles.searchCancelText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* RESULTADOS */}
                    {searching ? (
                        <View style={styles.searchingContainer}>
                            <ActivityIndicator size="small" color="#BB86FC" />
                            <Text style={styles.searchingText}>Buscando...</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.resultsContainer}>
                            <Text style={styles.resultsTitle}>
                                {searchQuery === '' ? 'Todos los países' : 'Resultados'}
                            </Text>
                            
                            {searchResults.map((country, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.resultItem}
                                    onPress={() => handleSelectCountry(country)}
                                >
                                    <Icon name="public" size={22} color="#4CAF50" />
                                    <View style={styles.resultInfo}>
                                        <Text style={styles.resultName}>
                                            {country.name}
                                        </Text>
                                    </View>
                                    <Icon name="chevron-right" size={20} color="#666" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}

            {/* LOADING */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size={50} color="#BB86FC" />
                    <Text style={styles.loadingText}>Cargando mapa...</Text>
                </View>
            )}

            {/* MAPA */}
            <WebView
                ref={webViewRef}
                source={{ html: mapHTML }}
                style={styles.map}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={handleWebViewMessage}
                onLoadEnd={() => setLoading(false)}
                onError={(error) => console.error('WebView error:', error)}
            />

            {/* PANEL DE DIRECCIÓN SELECCIONADA */}
            {selectedLocation && (
                <View style={styles.bottomPanel}>
                    <View style={styles.selectedLocationCard}>
                        <View style={styles.locationHeader}>
                            <Icon name="check-circle" size={24} color="#4CAF50" />
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationTitle}>
                                    {addressType === 'origin' ? 'Origen Seleccionado' : 'Destino Seleccionado'}
                                </Text>
                                <Text style={styles.locationAddress} numberOfLines={2}>
                                    {selectedLocation.address}
                                </Text>
                                <Text style={styles.locationCoords}>
                                    {selectedLocation.latitude?.toFixed(6)}°, {selectedLocation.longitude?.toFixed(6)}°
                                </Text>
                            </View>
                        </View>
                        
                        <Text style={styles.saveNote}>
                            Se guardará como: {selectedLocation.address}
                        </Text>
                        
                        <View style={styles.actionsRow}>
                            <TouchableOpacity 
                                style={styles.chooseAnotherButton}
                                onPress={() => {
                                    setSelectedLocation(null);
                                    if (webViewRef.current) {
                                        webViewRef.current.injectJavaScript(`
                                            if (window.selectionMarker) {
                                                window.selectionMarker.remove();
                                                window.selectionMarker = null;
                                            }
                                            if (window.currentPopup) {
                                                map.closePopup();
                                                window.currentPopup = null;
                                            }
                                        `);
                                    }
                                }}
                            >
                                <Icon name="cancel" size={18} color="#BB86FC" />
                                <Text style={styles.chooseAnotherText}>Cambiar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.useButton}
                                onPress={confirmSelection}
                            >
                                <Text style={styles.useButtonText}>Usar Dirección</Text>
                                <Icon name="check" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default MapPickerMoveScreen;