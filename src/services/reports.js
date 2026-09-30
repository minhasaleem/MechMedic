import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
const clean = (value) =>
  String(value ?? "Not provided")
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E\n\r]/g, "?");
export function createMaintenanceReport(records, { demo, staff, filter }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const title = demo ? "DEMO MAINTENANCE REPORT" : "MAINTENANCE REPORT";
  doc.setFillColor(15, 29, 39);
  doc.rect(0, 0, 297, 38, "F");
  doc.setTextColor(73, 218, 183);
  doc.setFontSize(22);
  doc.text("MechMedic", 14, 17);
  doc.setFontSize(9);
  doc.setTextColor(210, 225, 234);
  doc.text("Keeping Machines One Step Ahead", 14, 24);
  doc.setFontSize(10);
  doc.text(title, 283, 17, { align: "right" });
  doc.setTextColor(35, 50, 62);
  doc.setFontSize(10);
  doc.text(
    `Equipment: Greaves diesel engine test rig | Prepared by: ${clean(staff).slice(0, 65)}`,
    14,
    48,
  );
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString()} | Records: ${records.length}`,
    14,
    55,
  );
  const filterLines = doc.splitTextToSize(`Selection: ${clean(filter)}`, 268);
  doc.text(filterLines, 14, 62);
  const startY = 65 + filterLines.length * 4;
  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14, top: 18, bottom: 18 },
    head: [
      [
        "Date",
        "Type",
        "Description / action",
        "Condition",
        "Technician / staff",
        "Notes",
      ],
    ],
    body: records.map((r) => [
      new Date(r.timestamp).toLocaleString(),
      clean(r.type),
      clean(r.message),
      clean(r.condition),
      clean(r.technician),
      clean(r.notes),
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "top",
      textColor: [35, 50, 62],
    },
    headStyles: { fillColor: [24, 61, 64], textColor: 255 },
    alternateRowStyles: { fillColor: [241, 246, 247] },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 25 },
      2: { cellWidth: 65 },
      3: { cellWidth: 30 },
      4: { cellWidth: 38 },
      5: { cellWidth: 77 },
    },
    rowPageBreak: "avoid",
  });
  const count = doc.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    doc.setPage(i);
    doc.setDrawColor(210, 220, 225);
    doc.line(14, 196, 283, 196);
    doc.setFontSize(8);
    doc.setTextColor(90, 108, 120);
    doc.text(
      demo
        ? "DEMO DATA - not an official record of equipment service."
        : "MechMedic | Laboratory maintenance records",
      14,
      202,
    );
    doc.text(`Page ${i} of ${count}`, 283, 202, { align: "right" });
  }
  return doc;
}
export function exportMaintenance(records, options) {
  createMaintenanceReport(records, options).save(
    `MechMedic-maintenance-${options.demo ? "demo-" : ""}${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}
