import React from 'react';
import './Buscador.css'; 

const Buscador = ({ busqueda, setBusqueda, onSearch }) => {

  const handleKeyDown = (event) => {
    
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