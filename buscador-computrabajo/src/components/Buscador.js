// src/components/Buscador.js

import React from 'react';
import './Buscador.css'; // Asegúrate de que este archivo exista para los estilos

const Buscador = ({ busqueda, setBusqueda, onSearch }) => {

  const handleKeyDown = (event) => {
    // Permite que la búsqueda se dispare también con la tecla "Enter"
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="buscador-container">
      <input
        type="text"
        placeholder="Busca un puesto de trabajo..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button onClick={onSearch}>Buscar</button>
    </div>
  );
};



export default Buscador;