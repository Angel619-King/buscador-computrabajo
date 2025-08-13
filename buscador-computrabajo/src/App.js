import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css'; // <- estilos propios

import Buscador from './components/Buscador';
import { geocodeLocationManual } from './components/manualGeode';

import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

const Filtros = ({ filtro, setFiltro }) => (
  <div className="filtros">
    <button
      onClick={() => setFiltro('todos')}
      className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
    >
      Todas las ofertas
    </button>
    <button
      onClick={() => setFiltro('mejores')}
      className={`filtro-btn ${filtro === 'mejores' ? 'active' : ''}`}
    >
      Mejores pagados
    </button>
    <button
      onClick={() => setFiltro('peores')}
      className={`filtro-btn ${filtro === 'peores' ? 'active' : ''}`}
    >
      Peores pagados
    </button>
  </div>
);

const LeafletMap = ({ ofertas, centro, zoom, height }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(centro, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    if (map) {
      map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      ofertas.forEach(oferta => {
        L.marker([oferta.coordenadas.lat, oferta.coordenadas.lng])
          .addTo(map)
          .bindPopup(
            `<h3>${oferta.titulo}</h3>` +
            `<p><strong>Salario:</strong> ${oferta.salario}</p>` +
            `<p><strong>Ubicación:</strong> ${oferta.ubicacion}</p>`
          );
      });

      map.setView(centro, zoom);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ofertas, centro, zoom]);

  return <div ref={mapRef} style={{ height, width: '100%', borderRadius: '12px' }} />;
};

function App() {
  const [ofertas, setOfertas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarMapaTop10, setMostrarMapaTop10] = useState(false);

  const fetchOfertas = async () => {
    if (!busqueda.trim()) {
      console.warn('Por favor, ingresa un puesto de trabajo para buscar.');
      setError('Por favor, ingresa un puesto de trabajo para buscar.');
      return;
    }

    setCargando(true);
    setError(null);
    setOfertas([]);
    setMostrarMapaTop10(false);

    try {
      const response = await axios.post('http://localhost:3001/api/buscar', { puesto: busqueda });
      const ofertasBase = response.data;

      const ofertasConCoords = ofertasBase.map((oferta) => {
        const coordenadas = geocodeLocationManual(oferta.ubicacion);
        if (!coordenadas) {
          console.warn(`No se encontraron coordenadas para la ubicación: ${oferta.ubicacion}`);
        }
        return {
          ...oferta,
          coordenadas: coordenadas || { lat: 19.4326, lng: -99.1332 }, // CDMX por defecto
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
    doc.text(`Título: ${oferta.titulo}`, 10, y); y += 10;
    doc.text(`Empresa: ${oferta.empresa}`, 10, y); y += 10;
    doc.text(`Ubicación: ${oferta.ubicacion}`, 10, y); y += 10;
    doc.text(`Salario: ${oferta.salario}`, 10, y); y += 10;
    if (oferta.publicado) { doc.text(`Fecha de publicación: ${oferta.publicado}`, 10, y); y += 10; }
    doc.text(`Descripción:`, 10, y); y += 10;
    const textLines = doc.splitTextToSize(oferta.descripcion || 'Sin descripción', 180);
    doc.text(textLines, 10, y);
    doc.save(`${(oferta.titulo || 'oferta').replace(/ /g, '_')}.pdf`);
  };

  const handleSearchClick = () => fetchOfertas();

  const handleVerMapaTop10 = () => {
    setFiltro('mejores');
    setMostrarMapaTop10(true);
  };

  // —— Exportaciones mejoradas (CSV / JSON) ——
  const exportCSV = () => {
    if (!ofertas.length) return;
    const headers = ['Titulo', 'Empresa', 'Ubicacion', 'Salario', 'Publicado'];
    const rows = ofertas.map(o => [
      o.titulo ?? '',
      o.empresa ?? '',
      o.ubicacion ?? '',
      o.salario ?? '',
      o.publicado ?? ''
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ofertas.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!ofertas.length) return;
    const blob = new Blob([JSON.stringify(ofertas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ofertas.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const resultadosRender = ofertasFiltradas();

  return (
    <div className="App">
      {/* Header con degradado morado LR y buscador arriba */}
      <div className="header-gradient">
        <div className="header-inner">
          <h1 className="app-title">Sistema de Búsqueda de Empleos</h1>
          <Buscador
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            onSearch={handleSearchClick}
            isLoading={cargando}
          />
        </div>
      </div>

      {/* Panel principal */}
      <div className="panel">
        <Filtros filtro={filtro} setFiltro={setFiltro} />

        <div className="toolbar">
          <button
            onClick={handleVerMapaTop10}
            className="btn-primary"
          >
            Ver mapa de los 10 mejores
          </button>

          {ofertas.length > 0 && (
            <div className="export-bar">
              <button className="btn-export csv" onClick={exportCSV}>Exportar CSV</button>
              <button className="btn-export json" onClick={exportJSON}>Exportar JSON</button>
            </div>
          )}
        </div>

        {cargando && <p className="info">🔍 Buscando ofertas de empleo...</p>}
        {error && <p className="error">{error}</p>}
        {!cargando && resultadosRender.length === 0 && !error && (
          <p className="info">No se encontraron ofertas. Intenta una nueva búsqueda.</p>
        )}

        {!cargando && resultadosRender.length > 0 && (
          <div className="ofertas-grid">
            {resultadosRender.map((oferta, index) => (
              <div key={index} className="oferta-card">
                <h3 className="oferta-titulo">{oferta.titulo}</h3>
                <p><strong>Empresa:</strong> {oferta.empresa}</p>
                <p><strong>Ubicación:</strong> {oferta.ubicacion}</p>
                <p className="salario"><strong>Salario:</strong> {oferta.salario}</p>
                <div className="acciones">
                  <button
                    onClick={() => downloadPdf(oferta)}
                    className="btn-export pdf"
                  >
                    Descargar PDF
                  </button>
                  {/* ✔️ Eliminado el botón "Ver en mapa" por oferta */}
                </div>
              </div>
            ))}
          </div>
        )}

        {mostrarMapaTop10 && (
          <div className="mapa-container">
            <button className="btn-danger" onClick={() => setMostrarMapaTop10(false)}>Cerrar Mapa</button>
            <h2 className="map-title">Ubicación de las 10 ofertas mejor pagadas</h2>
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
    </div>
  );
}

export default App;
