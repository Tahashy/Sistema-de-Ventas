import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Check, X, Navigation } from 'lucide-react';
import { showToast } from '../../../components/Toast';

// Fix para iconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const SelectorUbicacion = ({ onClose, onConfirm, initialLat = -12.046374, initialLng = -77.042793 }) => {
    const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Componente interno para manejar clicks en el mapa
    const LocationMarker = () => {
        const map = useMapEvents({
            click(e) {
                setPosition(e.latlng);
                map.flyTo(e.latlng, map.getZoom());
            },
        });

        return position === null ? null : (
            <Marker position={position}></Marker>
        );
    };



    // Buscador usando Nominatim API (OpenStreetMap)
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            // Usando jsonv2 y limitando resultados. 
            // Encoding explícito para prevenir caracteres inválidos.
            const query = encodeURIComponent(searchQuery.trim() + ' Peru');
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${query}`;

            const response = await fetch(url);

            if (!response.ok) {
                // Si la API responde con error (ej: 400, 429, 500)
                throw new Error(`Error servicio mapas: ${response.status}`);
            }

            const data = await response.json();

            if (data.length === 0) {
                showToast('No se encontraron resultados', 'info');
            }

            setSearchResults(data);
        } catch (error) {
            console.error("Error buscando dirección:", error);
            showToast('Error al buscar dirección. Intente mover el pin manualmente.', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        setPosition({ lat, lng: lon });
        setSearchResults([]);
        setSearchQuery(result.display_name.split(',')[0]); // Texto corto
    };

    const handleConfirm = () => {
        onConfirm(position);
        onClose();
    };

    // Obtener ubicación actual
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => console.error(err)
            );
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'white', width: '100%', maxWidth: '800px',
                height: '600px', borderRadius: '16px', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{ padding: '16px', background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Buscar calle, avenida..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{
                                width: '100%', padding: '10px 10px 10px 40px',
                                borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none'
                            }}
                        />
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />

                        {/* Resultados de búsqueda */}
                        {searchResults.length > 0 && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                                marginTop: '4px', zIndex: 3000, maxHeight: '200px', overflowY: 'auto',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                {searchResults.map((res, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSelectResult(res)}
                                        style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        {res.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handleSearch} disabled={isSearching} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Buscar
                    </button>

                    <button onClick={getCurrentLocation} title="Mi ubicación" style={{ padding: '10px', background: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        <Navigation size={20} color="#374151" />
                    </button>
                </div>

                {/* Mapa */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <MapContainer
                        center={[position.lat, position.lng]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker />
                        {/* Recenter map when position changes managed by key or effect if needed, but FlyTo in marker handles click */}
                    </MapContainer>

                    {/* Floating Info */}
                    <div style={{
                        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                        background: 'white', padding: '10px 20px', borderRadius: '30px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500'
                    }}>
                        <MapPin size={16} color="#ef4444" fill="#ef4444" />
                        Lat: {position.lat.toFixed(5)}, Lng: {position.lng.toFixed(5)}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '12px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#374151' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '12px 24px', background: '#10b981', border: 'none', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Check size={20} /> Confirmar Ubicación
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectorUbicacion;
