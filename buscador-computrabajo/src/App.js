import React, { useState, useEffect } from 'react';
import './App.css';
import Buscador from './components/Buscador';
import Filtros from './components/Filtros';
import BotonesExportar from './components/BotonesExportar';

function App() {
  // Datos en memoria (pero no se muestran)
  const [datos] = useState([
    { id: 1, nombre: 'Item 1', valor: 150, categoria: 'A' },
    { id: 2, nombre: 'Item 2', valor: 230, categoria: 'B' },
    // ... más datos ...
  ]);

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [datosFiltrados, setDatosFiltrados] = useState([]);

  useEffect(() => {
    filtrarDatos();
  }, [busqueda, filtro, datos]);

  const filtrarDatos = () => {
    let resultados = [...datos];
    
    // Aplicar búsqueda
    if (busqueda) {
      resultados = resultados.filter(item => 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.categoria.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    
    // Aplicar filtro
    switch(filtro) {
      case 'mayores':
        resultados = resultados
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 10);
        break;
      case 'menores':
        resultados = resultados
          .sort((a, b) => a.valor - b.valor)
          .slice(0, 10);
        break;
      default:
        // 'todos' - no se aplica filtro adicional
        break;
    }
    
    setDatosFiltrados(resultados);
  };

  return (
    <div className="App">
      <h1>Sistema de Búsqueda y Exportación</h1>
      <Buscador busqueda={busqueda} setBusqueda={setBusqueda} />
      <Filtros filtro={filtro} setFiltro={setFiltro} />
      <BotonesExportar datos={datosFiltrados} />
      
      {/* Solo para depuración: muestra cuántos items hay */}
      <div style={{display: 'none'}}>
        Items filtrados: {datosFiltrados.length}
      </div>
    </div>
  );
}

export default App;