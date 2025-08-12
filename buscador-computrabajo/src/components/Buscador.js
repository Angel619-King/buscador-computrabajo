import React from 'react';
import './Buscador.css';

const Buscador = ({ busqueda, setBusqueda, onSearch, resultados }) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="buscador-app">
      <div className="buscador-container">
        <h1 className="buscador-title">BUSCADOR DE EMPLEO</h1>
        <div className="search-box">
          <input
            type="text"
            placeholder="Busca un puesto de trabajo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          <button onClick={onSearch} className="search-button">
            <i className="fas fa-search"></i> Buscar
          </button>
        </div>
      </div>

      {resultados && resultados.length > 0 && (
        <div className="resultados-container">
          <h2 className="resultados-title">Resultados encontrados: {resultados.length}</h2>
          <div className="resultados-grid">
            {resultados.map((empleo, index) => (
              <div key={index} className="empleo-card">
                <h3>{empleo.titulo}</h3>
                <p className="empresa">{empleo.empresa}</p>
                <p className="ubicacion">{empleo.ubicacion}</p>
                <p className="descripcion">{empleo.descripcion}</p>
                <div className="empleo-footer">
                  <span className="salario">{empleo.salario}</span>
                  <button className="aplicar-btn">Aplicar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Buscador;