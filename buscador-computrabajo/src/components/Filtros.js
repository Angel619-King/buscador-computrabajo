import React from 'react';

const Filtros = ({ filtro, setFiltro }) => {
  return (
    <div className="filtros">
      <button 
        className={filtro === 'todos' ? 'active' : ''}
        onClick={() => setFiltro('todos')}
      >
        Todos
      </button>
      <button 
        className={filtro === 'mayores' ? 'active' : ''}
        onClick={() => setFiltro('mayores')}
      >
        Top 10 Mayores
      </button>
      <button 
        className={filtro === 'menores' ? 'active' : ''}
        onClick={() => setFiltro('menores')}
      >
        Top 10 Menores
      </button>
    </div>
  );
};

export default Filtros;