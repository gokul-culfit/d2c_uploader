import { UploaderConfig, RawRow } from '../types.js';

export type BcaseEvent = {
  storeCode: string;
  storeName: string;
  month: string;
  carpetArea: number;
  salesPerSqftDay: number;
  salesPerSqftMonth: number;
  gmvSoftlinesL: number;
  gmvHardlinesL: number;
  totalGmvL: number;
  hardlines1PRev: number;
  returns: number;
  netRevenueTotal: number;
  netRevenueSL: number;
  netRevenueHL: number;
  sensitivity: number;
  pmPercent: number;
  pmTotal: number;
  pmSL: number;
  pmHL: number;
  slInvnt: number;
  hlInvnt: number;
  staffCost: number;
  rentCam: number;
  cam: number;
  rentPerSqft1stYearPRS: number;
  rentPercentOCofNetRev: number;
  revShareAt8: number;
  supplyChainCosts: number;
  iwtAt15ofSL: number;
  inventoryProvAt93onNetRev: number;
  deltaRentRevShare: number;
  utilitiesAndPG: number;
  totalOpex: number;
  cmL: number;
  cmPercent: number;
  monetisation: number;
  marketingL: number;
  totalMktingOnNet: number;
  perfMktingOnHL: number;
  btlMktingOnSL: number;
  cm2L: number;
  cm2Percent: number;
  opexBE: number;
  opexBE2: number;
  capexPayback: number;
  capexPaybackWithInterest: number;
  sd: number;
  inventorySLHL: number;
  siteCapexWithTax: number;
  addnlCapex: number;
  totalCapex: number;
  totalCapexWithInterest: number;
  cumulativeCm2: number;
  capexPayback2: number;
  capexPaybackWithInterest2: number;
  hardlinesPMPercent: number;
  softlinesPMPercent: number;
  hardlinesGmvSharePercent: number;
  softlinesGmvSharePercent: number;
  hardlinesASP: number;
  softlinesASP: number;
  hardlinesUnits: number;
  softlinesUnits: number;
  hardlinesScmCostPerUnit: number;
  softlinesScmCostPerUnit: number;
  producedAt: string;
  source: 'ebo-multi-uploader';
};

// Normalize for matching: remove all spaces, lowercase (handles "Store Name" vs "storename")
function normalizeHeaderForMatch(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, '');
}

function getRowValue(row: RawRow, expectedHeader: string): string | number | undefined {
  const target = normalizeHeaderForMatch(expectedHeader);
  for (const key of Object.keys(row)) {
    if (normalizeHeaderForMatch(key) === target) return row[key];
  }
  return undefined;
}

function getNumber(row: RawRow, expectedHeader: string): number {
  const value = getRowValue(row, expectedHeader);
  if (value === undefined || value === null || value === '') return 0;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function getString(row: RawRow, expectedHeader: string): string {
  const value = getRowValue(row, expectedHeader);
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function getStringFlexible(row: RawRow, variants: string[]): string {
  for (const expectedHeader of variants) {
    const v = getString(row, expectedHeader);
    if (v) return v;
  }
  return '';
}

// Expected column headers for format template (order for download)
const BCASE_FORMAT_HEADERS = [
  'store code',
  'store name',
  'month',
  'space - carpet area (sq ft)',
  'sales/ sq ft (rs/ day)',
  'sales/ sq ft (rs/ month)',
  'gmv softlines l',
  'gmv hardlines l',
  'total gmv l',
  '1p hardlines rev',
  'returns',
  'net revenue total',
  'net revenue sl',
  'net revenue hl',
  'sensitivity',
  'pm%',
  'pm total',
  'pm sl',
  'pm hl',
  'sl invnt',
  'hl invnt',
  'staff cost',
  'rent + cam',
  'cam',
  'rent/ sq ft 1st year prs',
  'rent%(oc) of net rev',
  'rev share @ 8%',
  'supply chain costs',
  'iwt@1.5 of sl',
  'inventory prov@.93% on net rev',
  'delta b/w rent and rev share',
  'utilities and pg + basement stock room',
  'total opex',
  'cm l',
  'cm%',
  'monetisation',
  'marketing l',
  'total mkting on net',
  'perf mkting on hl',
  'btl mkting on sl',
  'cm2 l',
  'cm2%',
  'opex be',
  'month',
  'opex b/e',
  'capex payback',
  'capex payback with interest',
  'sd',
  'inventory sl +hl',
  'site capex (with tax)',
  'addnl capex [ticker+bkge+ board out]',
  'total capex',
  'total capex with interest',
  'cumulative cm2',
  'capex payback',
  'month',
  'capex payback with interest',
  'month',
  'hardlines pm%',
  'softlines pm%',
  'hardlines gmv share%',
  'softlines gmv share%',
  'hardlines asp',
  'softlines asp',
  'hardlines units',
  'softlines units',
  'hardlines scm cost/ unit',
  'softlines scm cost/ unit',
];

export const bcaseUploaderConfig: UploaderConfig<BcaseEvent> = {
  id: 'bcase',
  displayName: 'EBO Business Case',
  acceptedFileTypes: ['csv', 'excel'],
  kafkaTopic: 'fitstore_unicommerce',
  eventName: 'ebo_bcase',
  formatHeaders: BCASE_FORMAT_HEADERS,
  buildKey: (e) => (e.storeCode && e.month ? `${e.storeCode}_${e.month}` : `row_${e.producedAt}`),
  validateHeaders: (headers) => {
    const normalized = new Set(headers.map(normalizeHeaderForMatch));
    const requiredHeaders = [...new Set(BCASE_FORMAT_HEADERS)];
    const missing: string[] = [];
    for (const h of requiredHeaders) {
      if (!normalized.has(normalizeHeaderForMatch(h))) missing.push(h);
    }
    return missing;
  },
  mapRowToEvent: (row: RawRow) => {
    const storeCode = getStringFlexible(row, ['store code', 'storecode', 'store_code', 'store id']);
    const storeName = getStringFlexible(row, ['store name', 'storename', 'store_name']);
    const month = getStringFlexible(row, ['month', 'months', 'period']);

    const hasAnyKey = storeCode || storeName || month;
    if (!hasAnyKey && Object.values(row).every((v) => v === '' || v === null || v === undefined)) {
      return null;
    }

    const num = (key: string) => getNumber(row, key);

    return {
      storeCode,
      storeName,
      month,
      carpetArea: num('space - carpet area (sq ft)'),
      salesPerSqftDay: num('sales/ sq ft (rs/ day)'),
      salesPerSqftMonth: num('sales/ sq ft (rs/ month)'),
      gmvSoftlinesL: num('gmv softlines l'),
      gmvHardlinesL: num('gmv hardlines l'),
      totalGmvL: num('total gmv l'),
      hardlines1PRev: num('1p hardlines rev'),
      returns: num('returns'),
      netRevenueTotal: num('net revenue total'),
      netRevenueSL: num('net revenue sl'),
      netRevenueHL: num('net revenue hl'),
      sensitivity: num('sensitivity'),
      pmPercent: num('pm%'),
      pmTotal: num('pm total'),
      pmSL: num('pm sl'),
      pmHL: num('pm hl'),
      slInvnt: num('sl invnt'),
      hlInvnt: num('hl invnt'),
      staffCost: num('staff cost'),
      rentCam: num('rent + cam'),
      cam: num('cam'),
      rentPerSqft1stYearPRS: num('rent/ sq ft 1st year prs'),
      rentPercentOCofNetRev: num('rent%(oc) of net rev'),
      revShareAt8: num('rev share @ 8%'),
      supplyChainCosts: num('supply chain costs'),
      iwtAt15ofSL: num('iwt@1.5 of sl'),
      inventoryProvAt93onNetRev: num('inventory prov@.93% on net rev'),
      deltaRentRevShare: num('delta b/w rent and rev share'),
      utilitiesAndPG: num('utilities and pg + basement stock room'),
      totalOpex: num('total opex'),
      cmL: num('cm l'),
      cmPercent: num('cm%'),
      monetisation: num('monetisation'),
      marketingL: num('marketing l'),
      totalMktingOnNet: num('total mkting on net'),
      perfMktingOnHL: num('perf mkting on hl'),
      btlMktingOnSL: num('btl mkting on sl'),
      cm2L: num('cm2 l'),
      cm2Percent: num('cm2%'),
      opexBE: num('opex be'),
      opexBE2: num('opex b/e'),
      capexPayback: num('capex payback'),
      capexPaybackWithInterest: num('capex payback with interest'),
      sd: num('sd'),
      inventorySLHL: num('inventory sl +hl'),
      siteCapexWithTax: num('site capex (with tax)'),
      addnlCapex: num('addnl capex [ticker+bkge+ board out]'),
      totalCapex: num('total capex'),
      totalCapexWithInterest: num('total capex with interest'),
      cumulativeCm2: num('cumulative cm2'),
      capexPayback2: num('capex payback'),
      capexPaybackWithInterest2: num('capex payback with interest'),
      hardlinesPMPercent: num('hardlines pm%'),
      softlinesPMPercent: num('softlines pm%'),
      hardlinesGmvSharePercent: num('hardlines gmv share%'),
      softlinesGmvSharePercent: num('softlines gmv share%'),
      hardlinesASP: num('hardlines asp'),
      softlinesASP: num('softlines asp'),
      hardlinesUnits: num('hardlines units'),
      softlinesUnits: num('softlines units'),
      hardlinesScmCostPerUnit: num('hardlines scm cost/ unit'),
      softlinesScmCostPerUnit: num('softlines scm cost/ unit'),
      producedAt: new Date().toISOString(),
      source: 'ebo-multi-uploader',
    };
  },
};

export default bcaseUploaderConfig;
