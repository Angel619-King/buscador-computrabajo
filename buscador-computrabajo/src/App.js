// src/App.js

import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import jsPDF from 'jspdf';
import 'leaflet/dist/leaflet.css';


import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

import './App.css';
import Buscador from './components/Buscador';
import Filtros from './components/Filtros';

function App() {
  const [ofertas, setOfertas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

  
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
            const salarioNum = parseFloat(item.salario.replace(/[^0-9.]/g, ''));
            return !isNaN(salarioNum);
          })
          .sort((a, b) => {
            const salarioA = parseFloat(a.salario.replace(/[^0-9.]/g, ''));
            const salarioB = parseFloat(b.salario.replace(/[^0-9.]/g, ''));
            return salarioB - salarioA;
          })
          .slice(0, 10);
        break;
      case 'peores':
       
        resultados = resultados
          .filter(item => {
            const salarioNum = parseFloat(item.salario.replace(/[^0-9.]/g, ''));
            return !isNaN(salarioNum);
          })
          .sort((a, b) => {
            const salarioA = parseFloat(a.salario.replace(/[^0-9.]/g, ''));
            const salarioB = parseFloat(b.salario.replace(/[^0-9.]/g, ''));
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
    doc.text(`Fecha de publicación: ${oferta.publicado}`, 10, 50);
    doc.text(`Descripción:`, 10, 60);
    doc.text(doc.splitTextToSize(oferta.descripcion, 180), 10, 70);

    doc.save(`${oferta.titulo.replace(/ /g, '_')}.pdf`);
  };

  const handleSearchClick = () => {
    fetchOfertas();
  };

  const resultadosRender = ofertasFiltradas();

  return (
    <div className="App">
      <h1>Sistema de Búsqueda de Empleos</h1>
      <Buscador
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onSearch={handleSearchClick}
      />
      <Filtros filtro={filtro} setFiltro={setFiltro} />

      
      {cargando && <p>🔍 Buscando ofertas de empleo...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!cargando && resultadosRender.length === 0 && !error && (
        <p>No se encontraron ofertas. Intenta una nueva búsqueda.</p>
      )}

      
      {!cargando && resultadosRender.length > 0 && (
        <div className="ofertas-container">
          <h2>Resultados ({resultadosRender.length} ofertas)</h2>
          {resultadosRender.map((oferta, index) => (
            <div key={index} className="oferta-card">
              <h3>{oferta.titulo}</h3>
              <p><strong>Empresa:</strong> {oferta.empresa}</p>
              <p><strong>Ubicación:</strong> {oferta.ubicacion}</p>
              <p><strong>Salario:</strong> {oferta.salario}</p>
              <div className="botones-accion">
                <button onClick={() => downloadPdf(oferta)}>Descargar PDF</button>
                <button onClick={() => setOfertaSeleccionada(oferta)}>Ver en mapa</button>
              </div>
            </div>
          ))}
        </div>
      )}

      
      {ofertaSeleccionada && (
        <div className="mapa-container">
          <button className="cerrar-mapa" onClick={() => setOfertaSeleccionada(null)}>Cerrar Mapa</button>
          <h2>Ubicación de la oferta: {ofertaSeleccionada.ubicacion}</h2>
          <MapContainer center={[ofertaSeleccionada.latitud, ofertaSeleccionada.longitud]} zoom={13} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[ofertaSeleccionada.latitud, ofertaSeleccionada.longitud]}>
              <Popup>{ofertaSeleccionada.ubicacion}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}

export default App;