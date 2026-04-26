const esc = (value) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const csv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const amount = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
};

const dateOnly = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : String(value).slice(0, 10);
};

const cell = (value) => {
  const number = typeof value === 'number' && Number.isFinite(value);
  return `<Cell><Data ss:Type="${number ? 'Number' : 'String'}">${esc(value)}</Data></Cell>`;
};

const worksheet = (name, columns, rows) => `
  <Worksheet ss:Name="${esc(name)}">
    <Table>
      <Row>${columns.map(cell).join('')}</Row>
      ${rows.map((row) => `<Row>${columns.map((column) => cell(row[column])).join('')}</Row>`).join('')}
    </Table>
  </Worksheet>`;

export const downloadGeneralWorkbook = ({ missions = [], shipments = [], expenses = [], users = [], startDate, endDate }) => {
  const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const to = endDate ? new Date(`${endDate}T23:59:59`) : null;
  const inRange = (value) => {
    const time = new Date(value || '').getTime();
    if (!Number.isFinite(time)) return false;
    return (!from || time >= from.getTime()) && (!to || time <= to.getTime());
  };
  const userById = new Map((users || []).map((user) => [Number(user.id), user]));
  const payerName = (product, mission) =>
    product?.payer_username ||
    userById.get(Number(product?.payer))?.username ||
    mission?.payer_username ||
    userById.get(Number(mission?.payer))?.username ||
    '';
  const shoppingColumns = ['Fecha', 'Cliente', 'Producto', 'Store Price (USD)', 'Store Price (USD+TAX)', 'Final Price (MXN)', 'Status', 'Tienda', 'Quien lo pago'];
  const shoppingRows = (missions || []).filter((mission) => inRange(mission.start_time)).flatMap((mission) =>
    (mission.products || []).map((product) => {
      const storePrice = amount(product.real_price);
      const tax = Number(mission.tax_percentage || 0) / 100;
      return {
        Fecha: dateOnly(mission.start_time),
        Cliente: product.client_name || '',
        Producto: product.name || '',
        'Store Price (USD)': storePrice,
        'Store Price (USD+TAX)': amount(storePrice * (1 + tax)),
        'Final Price (MXN)': amount(product.charged_price),
        Status: product.status || '',
        Tienda: product.store_name || mission.store_name || mission.name || '',
        'Quien lo pago': payerName(product, mission),
      };
    }),
  );
  const envioColumns = ['Fecha', 'Cliente', 'Paqueteria', 'Costo de compra', 'Costo de venta', 'Costo del seguro', 'Costo de venta del seguro'];
  const envioRows = (shipments || []).filter((shipment) => inRange(shipment.created_at)).map((shipment) => ({
    Fecha: dateOnly(shipment.created_at),
    Cliente: shipment.client_name || '',
    Paqueteria: shipment.carrier || '',
    'Costo de compra': amount(shipment.guide_price),
    'Costo de venta': amount(shipment.client_price),
    'Costo del seguro': amount(shipment.insurance_price),
    'Costo de venta del seguro': amount(shipment.insurance_sale_price),
  }));
  const gastoColumns = ['Fecha', 'Tipo de gasto', 'Descripcion', 'Monto'];
  const gastoRows = (expenses || []).filter((expense) => inRange(expense.expense_date)).map((expense) => ({
    Fecha: dateOnly(expense.expense_date),
    'Tipo de gasto': expense.expense_type || '',
    Descripcion: expense.description || '',
    Monto: amount(expense.amount),
  }));
  const workbook = `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      ${worksheet('SHOPPIING', shoppingColumns, shoppingRows)}
      ${worksheet('ENVIOS', envioColumns, envioRows)}
      ${worksheet('GASTOS', gastoColumns, gastoRows)}
    </Workbook>`;
  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const filename = `reporte_general_${startDate || 'inicio'}_${endDate || 'fin'}.xls`;
  if (typeof navigator !== 'undefined' && navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }
  const link = document.createElement('a');
  link.download = filename;
  if (typeof URL !== 'undefined' && URL.createObjectURL) {
    const url = URL.createObjectURL(blob);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }
  link.href = `data:application/vnd.ms-excel;charset=utf-8,${encodeURIComponent(workbook)}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadGeneralCsv = ({ missions = [], shipments = [], expenses = [], users = [], startDate, endDate }) => {
  const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const to = endDate ? new Date(`${endDate}T23:59:59`) : null;
  const inRange = (value) => {
    const time = new Date(value || '').getTime();
    if (!Number.isFinite(time)) return false;
    return (!from || time >= from.getTime()) && (!to || time <= to.getTime());
  };
  const userById = new Map((users || []).map((user) => [Number(user.id), user]));
  const payerName = (product, mission) =>
    product?.payer_username ||
    userById.get(Number(product?.payer))?.username ||
    mission?.payer_username ||
    userById.get(Number(mission?.payer))?.username ||
    '';
  const lines = [];
  const pushSection = (title, columns, rows) => {
    lines.push(csv(title));
    lines.push(columns.map(csv).join(','));
    rows.forEach((row) => lines.push(columns.map((column) => csv(row[column])).join(',')));
    lines.push('');
  };
  pushSection('SHOPPIING', ['Fecha', 'Cliente', 'Producto', 'Store Price (USD)', 'Store Price (USD+TAX)', 'Final Price (MXN)', 'Status', 'Tienda', 'Quien lo pago'], (missions || []).filter((mission) => inRange(mission.start_time)).flatMap((mission) =>
    (mission.products || []).map((product) => {
      const storePrice = amount(product.real_price);
      return {
        Fecha: dateOnly(mission.start_time),
        Cliente: product.client_name || '',
        Producto: product.name || '',
        'Store Price (USD)': storePrice,
        'Store Price (USD+TAX)': amount(storePrice * (1 + Number(mission.tax_percentage || 0) / 100)),
        'Final Price (MXN)': amount(product.charged_price),
        Status: product.status || '',
        Tienda: product.store_name || mission.store_name || mission.name || '',
        'Quien lo pago': payerName(product, mission),
      };
    }),
  ));
  pushSection('ENVIOS', ['Fecha', 'Cliente', 'Paqueteria', 'Costo de compra', 'Costo de venta', 'Costo del seguro', 'Costo de venta del seguro'], (shipments || []).filter((shipment) => inRange(shipment.created_at)).map((shipment) => ({
    Fecha: dateOnly(shipment.created_at),
    Cliente: shipment.client_name || '',
    Paqueteria: shipment.carrier || '',
    'Costo de compra': amount(shipment.guide_price),
    'Costo de venta': amount(shipment.client_price),
    'Costo del seguro': amount(shipment.insurance_price),
    'Costo de venta del seguro': amount(shipment.insurance_sale_price),
  })));
  pushSection('GASTOS', ['Fecha', 'Tipo de gasto', 'Descripcion', 'Monto'], (expenses || []).filter((expense) => inRange(expense.expense_date)).map((expense) => ({
    Fecha: dateOnly(expense.expense_date),
    'Tipo de gasto': expense.expense_type || '',
    Descripcion: expense.description || '',
    Monto: amount(expense.amount),
  })));
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte_general_${startDate || 'inicio'}_${endDate || 'fin'}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
