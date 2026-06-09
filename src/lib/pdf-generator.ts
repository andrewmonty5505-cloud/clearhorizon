import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "./utils";
import { FREQUENCY_LABELS, MARKET_LABELS } from "./pricing-engine";

interface ProposalData {
  estimate: {
    estimateNumber: string;
    city: string;
    squareFootage: number;
    bedrooms: number;
    bathrooms: number;
    frequency: string;
    marketArea: string;
    basePrice: number;
    travelFee: number;
    addOnTotal: number;
    roundedPrice: number;
    productionHours: number;
    condition: string;
    firstTimeType: string;
    expiresAt: string | null;
    notes: string | null;
    createdAt: string;
    addOns: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    zip: string | null;
  };
  company: {
    name: string;
    phone: string;
    email: string;
    website: string;
    address: string;
  };
}

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: "Excellent",
  AVERAGE: "Average",
  DIRTY: "Needs Attention",
  VERY_DIRTY: "Deep Clean Required",
};

const FIRST_TIME_LABELS: Record<string, string> = {
  EXISTING_CLIENT: "Returning Client",
  FIRST_VISIT: "Initial Visit",
  INITIAL_DEEP_CLEAN: "Initial Deep Clean",
};

const SCOPE_OF_WORK: Record<string, string[]> = {
  WEEKLY: [
    "All rooms vacuumed and/or swept",
    "All floors mopped",
    "Bathrooms sanitized (toilets, sinks, tubs/showers, mirrors, fixtures)",
    "Kitchen cleaned (countertops, sinks, stovetop, exterior appliances)",
    "Dusting of accessible surfaces, shelves, and furniture",
    "Trash emptied in all rooms",
    "Bed linens straightened",
  ],
  BIWEEKLY: [
    "All rooms vacuumed and/or swept",
    "All floors mopped",
    "Bathrooms deep cleaned (toilets, sinks, tubs/showers, mirrors, tiles, fixtures)",
    "Kitchen thoroughly cleaned (countertops, sinks, stovetop, appliance exteriors, cabinet faces)",
    "Dusting of all accessible surfaces, blinds, ceiling fans",
    "Trash emptied and replaced",
    "Baseboards spot-wiped",
    "Window sills wiped",
  ],
  MONTHLY: [
    "Complete top-to-bottom cleaning",
    "All rooms vacuumed, swept, and mopped",
    "Bathrooms deep cleaned and sanitized",
    "Kitchen deep cleaned including interior appliances",
    "Thorough dusting including light fixtures, vents, and blinds",
    "Inside windows cleaned",
    "Baseboards and door frames cleaned",
    "All trash emptied and replaced",
  ],
  ONE_TIME: [
    "Complete top-to-bottom cleaning of all rooms",
    "All floors vacuumed, swept, and mopped",
    "All bathrooms deep cleaned and sanitized",
    "Kitchen deep cleaned",
    "Thorough dusting throughout the home",
    "Inside windows (if included)",
    "Baseboards and surfaces cleaned",
  ],
  DEEP_CLEAN: [
    "Full interior deep clean of all rooms",
    "All floors vacuumed, scrubbed, and mopped",
    "Bathrooms scrubbed floor-to-ceiling",
    "Kitchen deep clean including inside appliances",
    "Full dusting of all surfaces, blinds, and fixtures",
    "Inside of all cabinets and drawers (if included)",
    "Baseboards, door frames, and light switches cleaned",
    "All glass and mirrors polished",
  ],
};

export function generateProposalPdf(data: ProposalData): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ── Header ─────────────────────────────────────────────────────────────────

  // Background header band
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(0, 0, pageWidth, 38, "F");

  // Company name
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(data.company.name, margin, 15);

  // Tagline
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(147, 197, 253); // blue-300
  doc.text("Southwest Florida Residential Cleaning Services", margin, 21);

  // Contact info on right
  doc.setFontSize(8);
  doc.setTextColor(219, 234, 254); // blue-100
  doc.text(data.company.phone, pageWidth - margin, 12, { align: "right" });
  doc.text(data.company.email, pageWidth - margin, 17, { align: "right" });
  doc.text(data.company.website, pageWidth - margin, 22, { align: "right" });

  // "CLEANING PROPOSAL" title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("CLEANING PROPOSAL", pageWidth - margin, 32, { align: "right" });

  y = 46;

  // ── Customer + Estimate Info ───────────────────────────────────────────────

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, "FD");

  // Customer info (left)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(107, 114, 128);
  doc.text("PREPARED FOR", margin + 5, y + 7);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(`${data.customer.firstName} ${data.customer.lastName}`, margin + 5, y + 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  let customerY = y + 20;
  if (data.customer.address) {
    doc.text(data.customer.address, margin + 5, customerY);
    customerY += 5;
  }
  if (data.customer.city) {
    doc.text(`${data.customer.city}${data.customer.zip ? `, FL ${data.customer.zip}` : ""}`, margin + 5, customerY);
    customerY += 5;
  }
  if (data.customer.phone) doc.text(data.customer.phone, margin + 5, customerY);

  // Estimate info (right)
  const rightCol = margin + contentWidth / 2 + 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(107, 114, 128);
  doc.text("ESTIMATE DETAILS", rightCol, y + 7);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.text(`Estimate #: ${data.estimate.estimateNumber}`, rightCol, y + 14);
  doc.text(`Date: ${formatDate(data.estimate.createdAt)}`, rightCol, y + 20);
  if (data.estimate.expiresAt) {
    doc.text(`Expires: ${formatDate(data.estimate.expiresAt)}`, rightCol, y + 26);
  }
  doc.text(
    `Service: ${FREQUENCY_LABELS[data.estimate.frequency as keyof typeof FREQUENCY_LABELS] || data.estimate.frequency}`,
    rightCol,
    y + 32
  );

  y += 46;

  // ── Property Summary ──────────────────────────────────────────────────────

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Property Summary", margin, y);
  y += 5;

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [],
    body: [
      [
        { content: "Location", styles: { fontStyle: "bold", textColor: [107, 114, 128], fontSize: 8 } },
        { content: data.estimate.city, styles: { fontStyle: "normal", fontSize: 9 } },
        { content: "Size", styles: { fontStyle: "bold", textColor: [107, 114, 128], fontSize: 8 } },
        { content: `${data.estimate.squareFootage.toLocaleString()} sq ft`, styles: { fontStyle: "normal", fontSize: 9 } },
        { content: "Bedrooms", styles: { fontStyle: "bold", textColor: [107, 114, 128], fontSize: 8 } },
        { content: String(data.estimate.bedrooms), styles: { fontStyle: "normal", fontSize: 9 } },
        { content: "Bathrooms", styles: { fontStyle: "bold", textColor: [107, 114, 128], fontSize: 8 } },
        { content: String(data.estimate.bathrooms), styles: { fontStyle: "normal", fontSize: 9 } },
      ],
      [
        { content: "Condition", styles: { fontStyle: "bold", textColor: [107, 114, 128], fontSize: 8 } },
        { content: CONDITION_LABELS[data.estimate.condition] || data.estimate.condition, styles: { fontSize: 9 } },
        { content: "Visit Type", styles: { fontStyle: "bold", textColor: [107, 114, 128], fontSize: 8 } },
        { content: FIRST_TIME_LABELS[data.estimate.firstTimeType] || data.estimate.firstTimeType, styles: { fontSize: 9 } },
        { content: "Market", styles: { fontStyle: "bold", textColor: [107, 114, 128], fontSize: 8 } },
        { content: MARKET_LABELS[data.estimate.marketArea as keyof typeof MARKET_LABELS] || data.estimate.marketArea, styles: { fontSize: 9 } },
        { content: "Est. Time", styles: { fontStyle: "bold", textColor: [107, 114, 128], fontSize: 8 } },
        { content: `${data.estimate.productionHours.toFixed(1)} hours`, styles: { fontSize: 9 } },
      ],
    ],
    styles: { cellPadding: 3, lineColor: [229, 231, 235], lineWidth: 0.3 },
    theme: "grid",
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // ── Scope of Work ─────────────────────────────────────────────────────────

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Scope of Work", margin, y);
  y += 5;

  doc.setDrawColor(59, 130, 246);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  const scope = SCOPE_OF_WORK[data.estimate.frequency] || SCOPE_OF_WORK.BIWEEKLY;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);

  scope.forEach((item) => {
    doc.setFillColor(59, 130, 246);
    doc.circle(margin + 2, y - 1.5, 1, "F");
    doc.text(item, margin + 6, y);
    y += 5.5;
  });

  if (data.estimate.notes) {
    y += 2;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(107, 114, 128);
    const lines = doc.splitTextToSize(`Note: ${data.estimate.notes}`, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 2;
  }

  y += 3;

  // ── Pricing Summary ───────────────────────────────────────────────────────

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Pricing Summary", margin, y);
  y += 5;

  doc.setDrawColor(59, 130, 246);
  doc.line(margin, y, margin + contentWidth, y);
  y += 3;

  const pricingRows: Array<[string, string]> = [
    ["Base Service Price", formatCurrency(data.estimate.basePrice)],
  ];

  if (data.estimate.travelFee > 0) {
    pricingRows.push(["Travel Fee", formatCurrency(data.estimate.travelFee)]);
  }

  if (data.estimate.addOns.length > 0) {
    data.estimate.addOns.forEach((addon) => {
      pricingRows.push([`${addon.name} ×${addon.quantity}`, formatCurrency(addon.totalPrice)]);
    });
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [],
    body: pricingRows,
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { textColor: [75, 85, 99] }, 1: { halign: "right", fontStyle: "bold", textColor: [17, 24, 39] } },
    theme: "plain",
    didDrawCell: () => {},
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;

  // Total row
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL ESTIMATE", margin + 5, y + 8);
  doc.text(formatCurrency(data.estimate.roundedPrice), pageWidth - margin - 5, y + 8, { align: "right" });

  y += 20;

  // ── Terms ─────────────────────────────────────────────────────────────────

  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Terms & Conditions", margin, y);
  y += 5;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  const terms = [
    "Payment is due upon completion of service. We accept cash, check, and all major credit cards.",
    "This estimate is valid for 30 days from the date issued.",
    "Prices may vary based on actual home condition upon arrival.",
    "Please ensure pets are secured and all valuables are put away prior to cleaning.",
    "Cancellations with less than 24 hours notice may incur a $50 fee.",
    "We carry full liability insurance. Certificate available upon request.",
    "Satisfaction is guaranteed — contact us within 24 hours if any concerns arise.",
  ];

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);

  terms.forEach((term, i) => {
    doc.text(`${i + 1}. ${term}`, margin, y, { maxWidth: contentWidth });
    y += 6;
  });

  y += 5;

  // ── Signature ─────────────────────────────────────────────────────────────

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Acceptance", margin, y);
  y += 4;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(
    "By signing below, you agree to the terms and conditions stated in this proposal.",
    margin,
    y
  );
  y += 8;

  // Signature lines
  doc.setDrawColor(75, 85, 99);
  doc.setLineWidth(0.4);
  const sigWidth = (contentWidth - 10) / 2;
  doc.line(margin, y + 10, margin + sigWidth, y + 10);
  doc.line(margin + sigWidth + 10, y + 10, margin + contentWidth, y + 10);

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("Client Signature", margin, y + 14);
  doc.text("Date", margin + sigWidth + 10, y + 14);

  // ── Footer ────────────────────────────────────────────────────────────────

  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFillColor(243, 244, 246);
  doc.rect(0, footerY - 2, pageWidth, 20, "F");

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `${data.company.name} · ${data.company.phone} · ${data.company.email}`,
    pageWidth / 2,
    footerY + 3,
    { align: "center" }
  );
  doc.text(
    "Serving Naples · Fort Myers · Bonita Springs · Marco Island · Estero",
    pageWidth / 2,
    footerY + 8,
    { align: "center" }
  );

  return doc.output("blob");
}
