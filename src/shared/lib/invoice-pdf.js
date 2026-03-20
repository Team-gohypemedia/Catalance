const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const PAGE_MARGIN = 40;

const COLORS = {
  brand: [250, 204, 21],
  brandSoft: [254, 249, 195],
  ink: [15, 23, 42],
  muted: [100, 116, 139],
  line: [226, 232, 240],
  slate: [51, 65, 85],
  success: [22, 163, 74],
  successSoft: [220, 252, 231],
  warning: [217, 119, 6],
  warningSoft: [255, 237, 213],
  surface: [248, 250, 252],
  white: [255, 255, 255],
};

const formatCurrency = (value = 0) => currencyFormatter.format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const createInvoiceFileName = (projectTitle = "", invoiceId = "") => {
  const safeTitle = String(projectTitle || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `catalance-invoice-${safeTitle || "project"}-${invoiceId || "invoice"}.pdf`;
};

const applyColor = (doc, method, color) => {
  doc[method](...color);
};

const drawRoundedPanel = (doc, x, y, width, height, options = {}) => {
  const {
    fill = COLORS.white,
    stroke = COLORS.line,
    radius = 16,
    style = "FD",
    lineWidth = 1,
  } = options;

  doc.setLineWidth(lineWidth);
  applyColor(doc, "setFillColor", fill);
  applyColor(doc, "setDrawColor", stroke);
  doc.roundedRect(x, y, width, height, radius, radius, style);
};

const addWrappedText = (doc, text, x, y, maxWidth, lineHeight = 16) => {
  const lines = doc.splitTextToSize(String(text || "-"), maxWidth);
  doc.text(lines, x, y);
  return y + Math.max(lines.length - 1, 0) * lineHeight;
};

const getStatusTheme = (invoice) => {
  if (invoice?.isPaid || Number(invoice?.balanceDue || 0) === 0) {
    return {
      label: "Paid",
      fill: COLORS.successSoft,
      text: COLORS.success,
    };
  }

  if (Number(invoice?.amountPaid || 0) > 0) {
    return {
      label: "Part Paid",
      fill: COLORS.brandSoft,
      text: COLORS.warning,
    };
  }

  return {
    label: invoice?.statusLabel || "Pending",
    fill: COLORS.warningSoft,
    text: COLORS.warning,
  };
};

const drawMetricCard = (doc, x, y, width, label, value, tone = "default") => {
  const valueColor =
    tone === "success"
      ? COLORS.success
      : tone === "warning"
        ? COLORS.warning
        : COLORS.ink;

  drawRoundedPanel(doc, x, y, width, 74, {
    fill: COLORS.surface,
    stroke: COLORS.line,
    radius: 16,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  applyColor(doc, "setTextColor", COLORS.muted);
  doc.text(String(label || "").toUpperCase(), x + 16, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  applyColor(doc, "setTextColor", valueColor);
  doc.text(formatCurrency(value), x + 16, y + 50);
};

const drawDetailCard = (doc, x, y, width, title, items) => {
  const cardHeight = 150;
  drawRoundedPanel(doc, x, y, width, cardHeight, {
    fill: COLORS.white,
    stroke: COLORS.line,
    radius: 16,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  applyColor(doc, "setTextColor", COLORS.ink);
  doc.text(title, x + 18, y + 24);

  let cursorY = y + 46;
  items.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    applyColor(doc, "setTextColor", COLORS.muted);
    doc.text(String(item.label || "").toUpperCase(), x + 18, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    applyColor(doc, "setTextColor", COLORS.ink);
    const nextY = addWrappedText(doc, item.value || "-", x + 18, cursorY + 15, width - 36, 14);
    cursorY = nextY + 14;
  });
};

const drawTableHeader = (doc, x, y, widths) => {
  const labels = ["Line item", "Status", "Scheduled", "Paid", "Balance"];
  let cursorX = x;

  drawRoundedPanel(doc, x, y, widths.reduce((sum, value) => sum + value, 0), 34, {
    fill: COLORS.surface,
    stroke: COLORS.line,
    radius: 12,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  applyColor(doc, "setTextColor", COLORS.muted);

  labels.forEach((label, index) => {
    const isAmountColumn = index >= 2;
    const cellX = cursorX + 14;
    const textX = isAmountColumn ? cursorX + widths[index] - 14 : cellX;
    doc.text(label.toUpperCase(), textX, y + 21, {
      align: isAmountColumn ? "right" : "left",
    });
    cursorX += widths[index];
  });
};

const drawInvoiceRow = (doc, x, y, widths, invoice, statusTheme) => {
  const rowHeight = 66;
  const itemTitle = String(invoice?.installmentLabel || "Project installment");
  const itemSubtitle = [invoice?.projectLabel || invoice?.projectTitle, invoice?.serviceType]
    .filter(Boolean)
    .join(" • ");
  const amounts = [
    formatCurrency(invoice?.amountDue),
    formatCurrency(invoice?.amountPaid),
    formatCurrency(invoice?.balanceDue),
  ];

  drawRoundedPanel(doc, x, y, widths.reduce((sum, value) => sum + value, 0), rowHeight, {
    fill: COLORS.white,
    stroke: COLORS.line,
    radius: 14,
  });

  let cursorX = x;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  applyColor(doc, "setTextColor", COLORS.ink);
  doc.text(itemTitle, cursorX + 14, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  applyColor(doc, "setTextColor", COLORS.muted);
  doc.text(doc.splitTextToSize(itemSubtitle || "-", widths[0] - 28), cursorX + 14, y + 41);
  cursorX += widths[0];

  const badgeWidth = Math.max(doc.getTextWidth(statusTheme.label) + 20, 72);
  drawRoundedPanel(doc, cursorX + 14, y + 18, badgeWidth, 24, {
    fill: statusTheme.fill,
    stroke: statusTheme.fill,
    radius: 12,
    style: "F",
    lineWidth: 0,
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  applyColor(doc, "setTextColor", statusTheme.text);
  doc.text(statusTheme.label, cursorX + 14 + badgeWidth / 2, y + 33, {
    align: "center",
  });
  cursorX += widths[1];

  amounts.forEach((amount, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    applyColor(
      doc,
      "setTextColor",
      index === 1 && Number(invoice?.amountPaid || 0) > 0
        ? COLORS.success
        : index === 2 && Number(invoice?.balanceDue || 0) > 0
          ? COLORS.warning
          : COLORS.ink,
    );
    doc.text(amount, cursorX + widths[index + 2] - 14, y + 33, { align: "right" });
    cursorX += widths[index + 2];
  });
};

const drawFooterNote = (doc, x, y, width, note) => {
  drawRoundedPanel(doc, x, y, width, 72, {
    fill: COLORS.surface,
    stroke: COLORS.line,
    radius: 16,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  applyColor(doc, "setTextColor", COLORS.ink);
  doc.text("Payment note", x + 18, y + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  applyColor(doc, "setTextColor", COLORS.slate);
  doc.text(doc.splitTextToSize(note, width - 36), x + 18, y + 40);
};

export const downloadInvoicePdf = async (invoice, options = {}) => {
  const { jsPDF } = await import("jspdf");

  const amountDue = Number(invoice?.amountDue) || 0;
  const amountPaid = Number(invoice?.amountPaid) || 0;
  const balanceDue = Math.max(
    Number(invoice?.balanceDue ?? amountDue - amountPaid) || 0,
    0,
  );
  const escrowHeld = Number(invoice?.escrowHeld) || 0;
  const projectPaidSoFar = Number(invoice?.projectPaidSoFar) || 0;
  const projectRemainingAmount = Number(invoice?.projectRemainingAmount) || 0;
  const invoiceId = String(invoice?.id || "invoice");
  const projectLabel = invoice?.projectLabel || invoice?.projectTitle || "Project";
  const clientName = options?.clientName || "Client";
  const freelancerName = invoice?.freelancerName || "Assigned Freelancer";
  const serviceType = invoice?.serviceType || "Project service";
  const issuedAt = formatDate(invoice?.issuedAt);
  const statusTheme = getStatusTheme({ ...invoice, balanceDue, amountPaid });
  const statusLabel = statusTheme.label;
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const columnGap = 16;
  const halfWidth = (contentWidth - columnGap) / 2;
  const metricGap = 12;
  const metricWidth = (contentWidth - metricGap * 2) / 3;

  doc.setProperties({
    title: `Catalance Invoice ${invoiceId}`,
    subject: `${projectLabel} invoice`,
    author: "Catalance",
    creator: "Catalance",
  });

  drawRoundedPanel(doc, PAGE_MARGIN, PAGE_MARGIN, contentWidth, 130, {
    fill: COLORS.ink,
    stroke: COLORS.ink,
    radius: 22,
    style: "F",
    lineWidth: 0,
  });

  drawRoundedPanel(doc, PAGE_MARGIN + contentWidth - 120, PAGE_MARGIN + 18, 88, 28, {
    fill: COLORS.brand,
    stroke: COLORS.brand,
    radius: 14,
    style: "F",
    lineWidth: 0,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  applyColor(doc, "setTextColor", COLORS.ink);
  doc.text("INVOICE", PAGE_MARGIN + contentWidth - 76, PAGE_MARGIN + 37, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  applyColor(doc, "setTextColor", COLORS.white);
  doc.text("Catalance", PAGE_MARGIN + 24, PAGE_MARGIN + 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  applyColor(doc, "setTextColor", [203, 213, 225]);
  doc.text("Project milestone invoice", PAGE_MARGIN + 24, PAGE_MARGIN + 62);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  applyColor(doc, "setTextColor", COLORS.white);
  doc.text(projectLabel, PAGE_MARGIN + 24, PAGE_MARGIN + 98);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  applyColor(doc, "setTextColor", [203, 213, 225]);
  doc.text(invoice?.installmentLabel || "Project installment", PAGE_MARGIN + 24, PAGE_MARGIN + 118);

  const statusBadgeWidth = Math.max(doc.getTextWidth(statusLabel) + 24, 84);
  drawRoundedPanel(doc, PAGE_MARGIN + contentWidth - statusBadgeWidth - 24, PAGE_MARGIN + 82, statusBadgeWidth, 26, {
    fill: statusTheme.fill,
    stroke: statusTheme.fill,
    radius: 13,
    style: "F",
    lineWidth: 0,
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  applyColor(doc, "setTextColor", statusTheme.text);
  doc.text(statusLabel, PAGE_MARGIN + contentWidth - statusBadgeWidth / 2 - 24, PAGE_MARGIN + 99, {
    align: "center",
  });

  let cursorY = PAGE_MARGIN + 148;

  drawMetricCard(doc, PAGE_MARGIN, cursorY, metricWidth, "Scheduled", amountDue);
  drawMetricCard(
    doc,
    PAGE_MARGIN + metricWidth + metricGap,
    cursorY,
    metricWidth,
    "Amount paid",
    amountPaid,
    amountPaid > 0 ? "success" : "default",
  );
  drawMetricCard(
    doc,
    PAGE_MARGIN + (metricWidth + metricGap) * 2,
    cursorY,
    metricWidth,
    "Balance due",
    balanceDue,
    balanceDue > 0 ? "warning" : "default",
  );

  cursorY += 94;

  drawDetailCard(doc, PAGE_MARGIN, cursorY, halfWidth, "Invoice details", [
    { label: "Invoice ID", value: invoiceId },
    { label: "Issued on", value: issuedAt },
    { label: "Project title", value: invoice?.projectTitle || projectLabel },
    { label: "Status", value: statusLabel },
  ]);

  drawDetailCard(doc, PAGE_MARGIN + halfWidth + columnGap, cursorY, halfWidth, "Billing context", [
    { label: "Client", value: clientName },
    { label: "Freelancer", value: freelancerName },
    { label: "Business", value: projectLabel },
    { label: "Service", value: serviceType },
  ]);

  cursorY += 176;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  applyColor(doc, "setTextColor", COLORS.ink);
  doc.text("Invoice breakdown", PAGE_MARGIN, cursorY);

  cursorY += 16;

  const tableWidths = [210, 90, 80, 65, 70];
  drawTableHeader(doc, PAGE_MARGIN, cursorY, tableWidths);
  drawInvoiceRow(doc, PAGE_MARGIN, cursorY + 42, tableWidths, {
    ...invoice,
    amountDue,
    amountPaid,
    balanceDue,
  }, statusTheme);

  cursorY += 128;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  applyColor(doc, "setTextColor", COLORS.ink);
  doc.text("Project payment summary", PAGE_MARGIN, cursorY);

  cursorY += 16;

  drawMetricCard(doc, PAGE_MARGIN, cursorY, metricWidth, "Escrow held", escrowHeld);
  drawMetricCard(
    doc,
    PAGE_MARGIN + metricWidth + metricGap,
    cursorY,
    metricWidth,
    "Project paid",
    projectPaidSoFar,
    projectPaidSoFar > 0 ? "success" : "default",
  );
  drawMetricCard(
    doc,
    PAGE_MARGIN + (metricWidth + metricGap) * 2,
    cursorY,
    metricWidth,
    "Project balance",
    projectRemainingAmount,
    projectRemainingAmount > 0 ? "warning" : "default",
  );

  cursorY += 100;

  drawFooterNote(
    doc,
    PAGE_MARGIN,
    cursorY,
    contentWidth,
    balanceDue > 0
      ? `This invoice reflects ${formatCurrency(amountPaid)} already paid toward this milestone. ${formatCurrency(balanceDue)} is still outstanding and will be due once the current milestone is released for payment.`
      : `This milestone has been fully paid. The invoice reflects the completed payment and the remaining project balance after this installment.`,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  applyColor(doc, "setTextColor", COLORS.muted);
  doc.text(
    `Generated by Catalance on ${formatDate(new Date())}`,
    PAGE_MARGIN,
    doc.internal.pageSize.getHeight() - 22,
  );

  doc.save(createInvoiceFileName(projectLabel, invoiceId));
};
