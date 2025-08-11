import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BotonesExportar = ({ datos }) => {
  const exportarExcel = () => {
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
    XLSX.writeFile(workbook, "datos.xlsx");
  };

  const exportarPDF = () => {
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    const doc = new jsPDF();
    doc.autoTable({
      head: [Object.keys(datos[0])],
      body: datos.map(item => Object.values(item)),
    });
    doc.save('datos.pdf');
  };

  const exportarCSV = () => {
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    const headers = Object.keys(datos[0]).join(',') + '\n';
    const csv = datos.map(item => 
      Object.values(item).join(',')
    ).join('\n');
    const blob = new Blob([headers + csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'datos.csv');
  };

  return (
    <div className="botones-exportar">
      <button onClick={exportarExcel}>Exportar XLSX</button>
      <button onClick={exportarPDF}>Exportar PDF</button>
      <button onClick={exportarCSV}>Exportar CSV</button>
    </div>
  );
};

export default BotonesExportar;