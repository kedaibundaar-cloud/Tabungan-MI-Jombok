
declare const XLSX: any;
declare const jspdf: any;

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = (
  title: string,
  headers: string[][],
  data: any[][],
  fileName: string,
  pageSize: 'a4' | 'f4' = 'a4'
) => {
  // F4 size in mm is approx 210 x 330
  const format = pageSize === 'f4' ? [210, 330] : 'a4';
  const doc = new jspdf.jsPDF('p', 'mm', format);

  doc.setFontSize(18);
  doc.text("MI MIFTAHUL ULUM JOMBOK", 105, 15, { align: 'center' });
  doc.setFontSize(14);
  doc.text(title, 105, 25, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 105, 32, { align: 'center' });

  (doc as any).autoTable({
    startY: 40,
    head: headers,
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255 },
    styles: { fontSize: 8 },
  });

  doc.save(`${fileName}.pdf`);
};
