import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../src/App.css'

// Importa la función de geocodificación desde el nuevo archivo
import { geocodeLocationManual } from './components/manualGeode';

// Para resolver los problemas de iconos de Leaflet, se usa una solución alternativa.
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';

// Se configura el path de los íconos de Leaflet.
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

// Componentes de ejemplo
const Buscador = ({ busqueda, setBusqueda, onSearch }) => (
    <div className="buscador-container mb-6">
        <input
            type="text"
            placeholder="Escribe el puesto de trabajo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="p-3 border rounded-l-lg w-3/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
            onClick={onSearch}
            className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 transition duration-300"
        >
            Buscar
        </button>
    </div>
);

const Filtros = ({ filtro, setFiltro }) => (
    <div className="filtros-container mb-6 flex space-x-4 justify-center">
        <button
            onClick={() => setFiltro('todos')}
            className={`p-2 rounded-lg ${filtro === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
            Todas las ofertas
        </button>
        <button
            onClick={() => setFiltro('mejores')}
            className={`p-2 rounded-lg ${filtro === 'mejores' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
            Mejores pagados
        </button>
        <button
            onClick={() => setFiltro('peores')}
            className={`p-2 rounded-lg ${filtro === 'peores' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
            Peores pagados
        </button>
    </div>
);

// Componente para manejar el mapa con Vanilla Leaflet
const LeafletMap = ({ ofertas, centro, zoom, height }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        // Inicializar el mapa solo una vez
        if (mapRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView(centro, zoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstanceRef.current);
        }

        const map = mapInstanceRef.current;
        if (map) {
            // Limpiar marcadores existentes antes de agregar los nuevos
            map.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            // Agregar marcadores para cada oferta
            ofertas.forEach(oferta => {
                L.marker([oferta.coordenadas.lat, oferta.coordenadas.lng])
                    .addTo(map)
                    .bindPopup(
                        `<h3>${oferta.titulo}</h3>` +
                        `<p><strong>Salario:</strong> ${oferta.salario}</p>` +
                        `<p><strong>Ubicación:</strong> ${oferta.ubicacion}</p>`
                    );
            });

            // Centrar el mapa si el centro cambia
            map.setView(centro, zoom);
        }

        // Función de limpieza para destruir el mapa
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [ofertas, centro, zoom]);

    return <div ref={mapRef} style={{ height: height, width: '100%', borderRadius: '12px' }} />;
};

// Función principal para la aplicación
function App() {
    const [ofertas, setOfertas] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('todos');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
    const [mostrarMapaTop10, setMostrarMapaTop10] = useState(false);

    // Función principal para buscar ofertas y obtener sus coordenadas
    const fetchOfertas = async () => {
        if (!busqueda.trim()) {
            console.warn('Por favor, ingresa un puesto de trabajo para buscar.');
            setError('Por favor, ingresa un puesto de trabajo para buscar.');
            return;
        }

        setCargando(true);
        setError(null);
        setOfertas([]);
        setOfertaSeleccionada(null);
        setMostrarMapaTop10(false);
        
        try {
            // Se realiza la llamada al servidor de ejemplo.
            const response = await axios.post('http://localhost:3001/api/buscar', { puesto: busqueda });
            const ofertasBase = response.data;

            const ofertasConCoords = ofertasBase.map((oferta) => {
                const coordenadas = geocodeLocationManual(oferta.ubicacion);
                
                if (!coordenadas) {
                    console.warn(`No se encontraron coordenadas para la ubicación: ${oferta.ubicacion}`);
                }
                
                return {
                    ...oferta,
                    coordenadas: coordenadas || { lat: 19.4326, lng: -99.1332 }, // Coordenadas por defecto para CDMX
                };
            }).filter(oferta => oferta !== null);
            
            setOfertas(ofertasConCoords);
        } catch (err) {
            console.error("Error al buscar las ofertas:", err);
            setError("No se pudieron cargar las ofertas. Asegúrate de que el servidor esté corriendo.");
            setOfertas([]);
        } finally {
            setCargando(false);
        }
    };

    const ofertasFiltradas = () => {
        let resultados = [...ofertas];

        switch (filtro) {
            case 'mejores':
                resultados = resultados
                    .filter(item => {
                        const salarioNum = parseFloat(String(item.salario).replace(/[^0-9.]/g, ''));
                        return !isNaN(salarioNum);
                    })
                    .sort((a, b) => {
                        const salarioA = parseFloat(String(a.salario).replace(/[^0-9.]/g, ''));
                        const salarioB = parseFloat(String(b.salario).replace(/[^0-9.]/g, ''));
                        return salarioB - salarioA;
                    })
                    .slice(0, 10);
                break;
            case 'peores':
                resultados = resultados
                    .filter(item => {
                        const salarioNum = parseFloat(String(item.salario).replace(/[^0-9.]/g, ''));
                        return !isNaN(salarioNum);
                    })
                    .sort((a, b) => {
                        const salarioA = parseFloat(String(a.salario).replace(/[^0-9.]/g, ''));
                        const salarioB = parseFloat(String(b.salario).replace(/[^0-9.]/g, ''));
                        return salarioA - salarioB;
                    })
                    .slice(0, 10);
                break;
            default:
                break;
        }
        return resultados;
    };

    const downloadPdf = (oferta) => {
        const doc = new jsPDF();
        doc.setFontSize(12);
        let y = 10;
        doc.text(`Título: ${oferta.titulo}`, 10, y);
        y += 10;
        doc.text(`Empresa: ${oferta.empresa}`, 10, y);
        y += 10;
        doc.text(`Ubicación: ${oferta.ubicacion}`, 10, y);
        y += 10;
        doc.text(`Salario: ${oferta.salario}`, 10, y);
        y += 10;
        doc.text(`Fecha de publicación: ${oferta.publicado}`, 10, y);
        y += 10;
        doc.text(`Descripción:`, 10, y);
        y += 10;
        const textLines = doc.splitTextToSize(oferta.descripcion, 180);
        doc.text(textLines, 10, y);
        doc.save(`${oferta.titulo.replace(/ /g, '_')}.pdf`);
    };

    const handleSearchClick = () => {
        fetchOfertas();
    };
    
    const handleVerMapaTop10 = () => {
        setFiltro('mejores');
        setMostrarMapaTop10(true);
        setOfertaSeleccionada(null);
    };

    const resultadosRender = ofertasFiltradas();

    return (
        <div className="App bg-gray-100 min-h-screen p-8 text-center font-sans">
            <h1 className="text-4xl font-bold mb-6 text-gray-800">Sistema de Búsqueda de Empleos</h1>
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
                <Buscador
                    busqueda={busqueda}
                    setBusqueda={setBusqueda}
                    onSearch={handleSearchClick}
                />
                <Filtros filtro={filtro} setFiltro={setFiltro} />
                
                <button
                    onClick={handleVerMapaTop10}
                    className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition duration-300 mb-6 w-full md:w-auto"
                >
                    Ver mapa de los 10 mejores
                </button>

                {cargando && <p className="text-gray-600 text-lg">🔍 Buscando ofertas de empleo...</p>}
                {error && <p className="text-red-500 text-lg">{error}</p>}
                {!cargando && resultadosRender.length === 0 && !error && (
                    <p className="text-gray-600 text-lg">No se encontraron ofertas. Intenta una nueva búsqueda.</p>
                )}

                {!cargando && resultadosRender.length > 0 && (
                    <div className="ofertas-container grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {resultadosRender.map((oferta, index) => (
                            <div key={index} className="oferta-card bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                                <h3 className="text-xl font-semibold text-blue-600 mb-2">{oferta.titulo}</h3>
                                <p><strong>Empresa:</strong> {oferta.empresa}</p>
                                <p><strong>Ubicación:</strong> {oferta.ubicacion}</p>
                                <p><strong>Salario:</strong> {oferta.salario}</p>
                                <div className="botones-accion mt-4 flex flex-col space-y-2">
                                    <button onClick={() => downloadPdf(oferta)} className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition">Descargar PDF</button>
                                    <button 
                                        onClick={() => {
                                            setOfertaSeleccionada(oferta);
                                            setMostrarMapaTop10(false);
                                        }} 
                                        className="bg-yellow-500 text-white p-2 rounded-md hover:bg-yellow-600 transition"
                                    >
                                        Ver en mapa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mapa para una sola oferta */}
                {ofertaSeleccionada && !mostrarMapaTop10 && (
                    <div className="mapa-container mt-8 bg-gray-50 p-4 rounded-xl shadow-inner">
                        <button className="bg-red-500 text-white p-2 rounded-lg mb-4 hover:bg-red-600" onClick={() => setOfertaSeleccionada(null)}>Cerrar Mapa</button>
                        <h2 className="text-2xl font-bold mb-4">Ubicación de la oferta: {ofertaSeleccionada.ubicacion}</h2>
                        <LeafletMap
                            ofertas={[ofertaSeleccionada]}
                            centro={[ofertaSeleccionada.coordenadas.lat, ofertaSeleccionada.coordenadas.lng]}
                            zoom={10}
                            height="400px"
                            key={`map-single-${ofertaSeleccionada.ubicacion}`}
                        />
                    </div>
                )}

                {/* Nuevo mapa para las 10 mejores ofertas */}
                {mostrarMapaTop10 && (
                    <div className="mapa-container mt-8 bg-gray-50 p-4 rounded-xl shadow-inner">
                        <button className="bg-red-500 text-white p-2 rounded-lg mb-4 hover:bg-red-600" onClick={() => setMostrarMapaTop10(false)}>Cerrar Mapa</button>
                        <h2 className="text-2xl font-bold mb-4">Ubicación de las 10 ofertas mejor pagadas</h2>
                        <LeafletMap
                            ofertas={resultadosRender}
                            centro={[19.4326, -99.1332]}
                            zoom={6}
                            height="500px"
                            key={`map-top10`}
                        />
                    </div>
                )}
            </div>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                .App {
                    font-family: 'Inter', sans-serif;
                }
                .leaflet-container {
                    border-radius: 12px;
                }
                `}
            </style>
        </div>
    );
}

export default App;
