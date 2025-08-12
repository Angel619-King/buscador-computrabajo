import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import jsPDF from 'jspdf';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css';
import './App.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

import Buscador from './components/Buscador';
import Filtros from './components/Filtros';

function App() {
  const [ofertas, setOfertas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

  // Configuración del icono del marcador
  let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconRetinaUrl: iconRetina,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  const fetchOfertas = async () => {
    if (!busqueda.trim()) {
      alert('Por favor, ingresa un puesto de trabajo para buscar.');
      return;
    }

    setCargando(true);
    setError(null);
    setOfertas([]);

    try {
      // Aquí iría tu llamada real al backend
      const response = await axios.post('http://localhost:3001/api/buscar', { puesto: busqueda });
      setOfertas(response.data);
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
            const salarioNum = parseFloat(item.salario?.replace(/[^0-9.]/g, '') || 0);
            return !isNaN(salarioNum);
          })
          .sort((a, b) => {
            const salarioA = parseFloat(a.salario?.replace(/[^0-9.]/g, '') || 0);
            const salarioB = parseFloat(b.salario?.replace(/[^0-9.]/g, '') || 0);
            return salarioB - salarioA;
          })
          .slice(0, 10);
        break;
      case 'peores':
        resultados = resultados
          .filter(item => {
            const salarioNum = parseFloat(item.salario?.replace(/[^0-9.]/g, '') || 0);
            return !isNaN(salarioNum);
          })
          .sort((a, b) => {
            const salarioA = parseFloat(a.salario?.replace(/[^0-9.]/g, '') || 0);
            const salarioB = parseFloat(b.salario?.replace(/[^0-9.]/g, '') || 0);
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
    doc.text(`Título: ${oferta.titulo}`, 10, 10);
    doc.text(`Empresa: ${oferta.empresa}`, 10, 20);
    doc.text(`Ubicación: ${oferta.ubicacion}`, 10, 30);
    doc.text(`Salario: ${oferta.salario}`, 10, 40);
    doc.text(`Fecha de publicación: ${oferta.publicado || 'No especificada'}`, 10, 50);
    doc.text(`Descripción:`, 10, 60);
    doc.text(doc.splitTextToSize(oferta.descripcion, 180), 10, 70);

    doc.save(`${oferta.titulo.replace(/ /g, '_')}.pdf`);
  };

  const handleSearchClick = () => {
    fetchOfertas();
  };

  const resultadosRender = ofertasFiltradas();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Sistema de Búsqueda de Empleos</h1>
      </header>

      <main className="app-main">
        <div className="search-section">
          <Buscador
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            onSearch={handleSearchClick}
            resultados={resultadosRender}
          />
          <Filtros filtro={filtro} setFiltro={setFiltro} />
        </div>

        {/* Estado de carga y errores */}
        {cargando && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Buscando ofertas de empleo...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Resultados */}
        {!cargando && resultadosRender.length === 0 && !error && (
          <div className="no-results">
            <p>No se encontraron ofertas. Intenta una nueva búsqueda.</p>
          </div>
        )}

        {/* Lista de ofertas */}
        {!cargando && resultadosRender.length > 0 && (
          <section className="results-section">
            <h2 className="results-title">Resultados ({resultadosRender.length} ofertas)</h2>
            <div className="ofertas-grid">
              {resultadosRender.map((oferta, index) => (
                <div key={index} className="oferta-card">
                  <div className="card-header">
                    <h3>{oferta.titulo}</h3>
                    <span className="empresa-tag">{oferta.empresa}</span>
                  </div>
                  
                  <div className="card-body">
                    <div className="oferta-info">
                      <p className="info-item">
                        <i className="fas fa-map-marker-alt"></i> {oferta.ubicacion}
                      </p>
                      <p className="info-item">
                        <i className="fas fa-money-bill-wave"></i> {oferta.salario || 'Salario no especificado'}
                      </p>
                      {oferta.publicado && (
                        <p className="info-item">
                          <i className="far fa-calendar-alt"></i> Publicado: {oferta.publicado}
                        </p>
                      )}
                    </div>
                    
                    <p className="oferta-descripcion">
                      {oferta.descripcion.length > 150 
                        ? `${oferta.descripcion.substring(0, 150)}...` 
                        : oferta.descripcion}
                    </p>
                  </div>
                  
                  <div className="card-footer">
                    <button 
                      className="action-btn pdf-btn"
                      onClick={() => downloadPdf(oferta)}
                    >
                      <i className="fas fa-file-pdf"></i> PDF
                    </button>
                    {oferta.latitud && oferta.longitud && (
                      <button 
                        className="action-btn map-btn"
                        onClick={() => setOfertaSeleccionada(oferta)}
                      >
                        <i className="fas fa-map-marked-alt"></i> Mapa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mapa modal */}
        {ofertaSeleccionada && (
          <div className="map-modal">
            <div className="map-header">
              <h2>Ubicación: {ofertaSeleccionada.ubicacion}</h2>
              <button 
                className="close-map-btn"
                onClick={() => setOfertaSeleccionada(null)}
              >
                <i className="fas fa-times"></i> Cerrar
              </button>
            </div>
            
            <div className="map-wrapper">
              <MapContainer 
                center={[ofertaSeleccionada.latitud, ofertaSeleccionada.longitud]} 
                zoom={13} 
                className="map-container"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[ofertaSeleccionada.latitud, ofertaSeleccionada.longitud]}>
                  <Popup>
                    <strong>{ofertaSeleccionada.empresa}</strong><br/>
                    {ofertaSeleccionada.titulo}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;