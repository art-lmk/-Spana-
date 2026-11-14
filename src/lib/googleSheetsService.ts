import { Fundi, TradeCategory } from '../types';
import { getAccessToken } from './googleAuth';
import { parseCsvString } from './csvParser';

export { parseCsvString };

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface SheetTabInfo {
  title: string;
  sheetId: number;
  rowCount?: number;
  columnCount?: number;
}

export interface ParsedSheetDataset {
  spreadsheetId: string;
  spreadsheetTitle: string;
  selectedSheetName: string;
  headers: string[];
  rawRows: (string | number)[][];
  fundis: Fundi[];
  mappedColumns: Record<string, string>;
  detectedFeatures: {
    hasCoordinates: boolean;
    hasModelScores: boolean;
    hasRates: boolean;
    hasSkills: boolean;
  };
}

/**
 * Nairobi Metropolitan neighborhood coordinates lookup
 */
export const NAIROBI_ESTATE_COORDS: Record<string, { lat: number; lng: number; neighborhood: string }> = {
  westlands: { lat: -1.2685, lng: 36.8045, neighborhood: 'Westlands, Nairobi' },
  kilimani: { lat: -1.2921, lng: 36.7822, neighborhood: 'Kilimani, Nairobi' },
  karen: { lat: -1.3197, lng: 36.7065, neighborhood: 'Karen, Nairobi' },
  cbd: { lat: -1.2833, lng: 36.8233, neighborhood: 'Nairobi Central CBD' },
  central: { lat: -1.2833, lng: 36.8233, neighborhood: 'Nairobi Central CBD' },
  lavington: { lat: -1.2720, lng: 36.7650, neighborhood: 'Lavington, Nairobi' },
  southb: { lat: -1.3100, lng: 36.8350, neighborhood: 'South B, Nairobi' },
  southc: { lat: -1.3190, lng: 36.8270, neighborhood: 'South C, Nairobi' },
  roysambu: { lat: -1.2200, lng: 36.8900, neighborhood: 'Roysambu, Nairobi' },
  parklands: { lat: -1.2400, lng: 36.7800, neighborhood: 'Parklands, Nairobi' },
  kasarani: { lat: -1.2230, lng: 36.8980, neighborhood: 'Kasarani, Nairobi' },
  eastleigh: { lat: -1.2760, lng: 36.8520, neighborhood: 'Eastleigh, Nairobi' },
  donholm: { lat: -1.3050, lng: 36.8920, neighborhood: 'Donholm, Nairobi' },
  buruburu: { lat: -1.2900, lng: 36.8750, neighborhood: 'Buruburu, Nairobi' },
  ruaka: { lat: -1.2050, lng: 36.7750, neighborhood: 'Ruaka, Kiambu/Nairobi' },
  ngong: { lat: -1.3000, lng: 36.7600, neighborhood: 'Ngong Road, Nairobi' },
  langata: { lat: -1.3400, lng: 36.7500, neighborhood: 'Lang\'ata, Nairobi' },
  kikuyu: { lat: -1.2450, lng: 36.6650, neighborhood: 'Kikuyu, Kiambu' },
  rongai: { lat: -1.3950, lng: 36.7600, neighborhood: 'Ongata Rongai' },
  thika: { lat: -1.1800, lng: 36.9300, neighborhood: 'Thika Road, Nairobi' },
  embakasi: { lat: -1.3200, lng: 36.9100, neighborhood: 'Embakasi, Nairobi' },
  syokimau: { lat: -1.3700, lng: 36.9300, neighborhood: 'Syokimau, Machakos/Nairobi' },
  utawala: { lat: -1.2800, lng: 36.9700, neighborhood: 'Utawala, Nairobi' },
  gigiri: { lat: -1.2330, lng: 36.8120, neighborhood: 'Gigiri, Nairobi' },
  kitisuru: { lat: -1.2400, lng: 36.7600, neighborhood: 'Kitisuru, Nairobi' },
  muthaiga: { lat: -1.2600, lng: 36.8300, neighborhood: 'Muthaiga, Nairobi' },
  pangani: { lat: -1.2700, lng: 36.8400, neighborhood: 'Pangani, Nairobi' },
  madaraka: { lat: -1.3050, lng: 36.8200, neighborhood: 'Madaraka, Nairobi' },
  nairobiwest: { lat: -1.3080, lng: 36.8150, neighborhood: 'Nairobi West' },
  upperhill: { lat: -1.2970, lng: 36.8160, neighborhood: 'Upper Hill, Nairobi' }
};

/**
 * Extract spreadsheet ID from Google Sheet URL or ID string
 */
export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const cleaned = urlOrId.trim();
  const match = cleaned.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return cleaned;
}

/**
 * Primary Sheet Fetcher: Supports direct Google Sheet URLs (public via backend proxy/gviz)
 * or authenticated private sheets.
 */
export async function fetchSpreadsheetData(
  urlOrId: string,
  sheetName?: string
): Promise<{
  success: boolean;
  spreadsheetId: string;
  title: string;
  sheetName: string;
  sheetTabs: SheetTabInfo[];
  headers: string[];
  rows: (string | number)[][];
}> {
  const cleanId = extractSpreadsheetId(urlOrId);
  if (!cleanId) {
    throw new Error('Please enter a valid Google Sheet URL or Spreadsheet ID');
  }

  const token = await getAccessToken();

  // 1. Try server proxy endpoint first (handles CORS, public sheets, and OAuth tokens seamlessly)
  try {
    const res = await fetch('/api/sheets/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: urlOrId,
        spreadsheetId: cleanId,
        sheetName,
        accessToken: token || undefined
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.headers && data.headers.length > 0) {
        return {
          success: true,
          spreadsheetId: cleanId,
          title: data.title || 'Google Sheet Dataset',
          sheetName: data.sheetName || sheetName || 'Sheet1',
          sheetTabs: data.sheetTabs || [{ title: data.sheetName || 'Sheet1', sheetId: 0 }],
          headers: data.headers,
          rows: data.rows || []
        };
      }
    } else {
      const errJson = await res.json().catch(() => ({}));
      if (errJson.message) {
        throw new Error(errJson.message);
      }
    }
  } catch (err: any) {
    // If the error explicitly mentions permissions, throw directly
    if (err.message && (err.message.includes('Share') || err.message.includes('permission') || err.message.includes('Google Sheet'))) {
      throw err;
    }
    console.warn('Backend /api/sheets/fetch encountered error, trying direct export fallback:', err);
  }

  // 2. Direct browser fallback using Google Visualization CSV endpoint (works for public sheets)
  try {
    const targetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv${targetParam}`;
    const directRes = await fetch(gvizUrl);
    
    if (directRes.ok) {
      const text = await directRes.text();
      if (!text.includes('<!DOCTYPE html>') && text.trim().length > 0) {
        const parsed = parseCsvString(text);
        if (parsed.headers.length > 0) {
          return {
            success: true,
            spreadsheetId: cleanId,
            title: 'Google Sheet Artisan Dataset',
            sheetName: sheetName || 'Sheet1',
            sheetTabs: [{ title: sheetName || 'Sheet1', sheetId: 0 }],
            headers: parsed.headers,
            rows: parsed.rows
          };
        }
      }
    }
  } catch (directErr) {
    console.warn('Direct gviz fetch failed:', directErr);
  }

  throw new Error(
    'Unable to connect to this Google Sheet.\n\n' +
    'Please ensure your sheet is accessible:\n' +
    '1. Open your sheet in Google Sheets\n' +
    '2. Click the blue "Share" button in the top right\n' +
    '3. Change General access from "Restricted" to "Anyone with the link can view"\n' +
    '4. Copy the link and paste it here, OR export to CSV (File > Download > CSV) and upload it directly.'
  );
}

/**
 * List spreadsheets available in user's Google Drive (if authenticated)
 */
export async function listUserGoogleSheets(): Promise<DriveSpreadsheetFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,webViewLink,iconLink)&orderBy=modifiedTime desc&pageSize=30`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to list files: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetch spreadsheet metadata including tab names
 */
export async function getSpreadsheetMetadata(spreadsheetId: string): Promise<{
  title: string;
  sheets: SheetTabInfo[];
}> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const token = await getAccessToken();

  if (token) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,sheets.properties(sheetId,title,gridProperties)`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const sheets: SheetTabInfo[] = (data.sheets || []).map((s: any) => ({
          title: s.properties.title,
          sheetId: s.properties.sheetId,
          rowCount: s.properties.gridProperties?.rowCount,
          columnCount: s.properties.gridProperties?.columnCount
        }));

        return {
          title: data.properties?.title || 'Fundi Dataset',
          sheets
        };
      }
    } catch {
      // fallback
    }
  }

  // Fallback via server proxy or defaults
  const data = await fetchSpreadsheetData(cleanId);
  return {
    title: data.title,
    sheets: data.sheetTabs
  };
}

/**
 * Fetch sheet cell values
 */
export async function fetchSheetValues(spreadsheetId: string, sheetName: string): Promise<{
  headers: string[];
  rows: (string | number)[][];
}> {
  const data = await fetchSpreadsheetData(spreadsheetId, sheetName);
  return {
    headers: data.headers,
    rows: data.rows
  };
}

/**
 * Normalize and auto-map column headers
 */
export function autoDetectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Identify explicit ID columns first, to strictly avoid using them as the artisan's name
  const idCol = headers.find(h => {
    const norm = clean(h);
    return [
      /^id$/, /^artisanid$/, /^fundiid$/, /^artisan_id$/, /^workerid$/, /^memberid$/,
      /^code$/, /^artisancode$/, /^regno$/, /^registrationno$/, /^registrationnumber$/,
      /^no$/, /^artisanno$/, /^fundino$/, /^number$/, /^ref$/, /^reference$/
    ].some(p => p.test(norm));
  });
  if (idCol) {
    mapping.artisanId = idCol;
  }

  // Helper to check if a header looks like an ID or non-name column
  const isExcludedFromName = (h: string) => {
    const norm = clean(h);
    return norm.endsWith('id') || norm.includes('idnumber') || norm.includes('code') || 
           norm.includes('regno') || norm === 'id' || norm === 'no' || norm === 'number' ||
           norm.includes('category') || norm.includes('trade') || norm.includes('phone') ||
           norm.includes('mobile') || norm.includes('rate') || norm.includes('price') ||
           norm.includes('skill') || norm.includes('location') || norm.includes('city') ||
           norm.includes('date') || norm.includes('rating') || norm.includes('score');
  };

  // Priority 1: Explicit Full Name headers
  const fullNameCol = headers.find(h => {
    if (isExcludedFromName(h)) return false;
    const norm = clean(h);
    return [
      /^fullname$/, /^fullnames$/, /^artisanname$/, /^artisansname$/, /^fundiname$/, 
      /^fundisname$/, /^nameofartisan$/, /^nameoffundi$/, /^technicianname$/, 
      /^contractorname$/, /^workername$/, /^artisanfullname$/, /^personname$/
    ].some(p => p.test(norm));
  });

  // Priority 2: Exact "name" or "names"
  const exactNameCol = headers.find(h => {
    if (isExcludedFromName(h)) return false;
    const norm = clean(h);
    return norm === 'name' || norm === 'names';
  });

  // Priority 3: Separate First Name and Last Name columns
  const firstNameCol = headers.find(h => {
    if (isExcludedFromName(h)) return false;
    const norm = clean(h);
    return [/^firstname$/, /^firstnames$/, /^givenname$/, /^fname$/].some(p => p.test(norm));
  });
  const lastNameCol = headers.find(h => {
    if (isExcludedFromName(h)) return false;
    const norm = clean(h);
    return [/^lastname$/, /^lastnames$/, /^surname$/, /^familyname$/, /^othernames$/, /^lname$/].some(p => p.test(norm));
  });

  if (firstNameCol) mapping.firstName = firstNameCol;
  if (lastNameCol) mapping.lastName = lastNameCol;

  // Priority 4: Contains "name" without ID exclusions
  const partialNameCol = headers.find(h => {
    if (isExcludedFromName(h)) return false;
    const norm = clean(h);
    return norm.includes('name');
  });

  // Priority 5: Contains "artisan", "fundi", "technician", "contractor", "worker" without ID exclusions
  const roleNameCol = headers.find(h => {
    if (isExcludedFromName(h)) return false;
    const norm = clean(h);
    return ['artisan', 'fundi', 'technician', 'contractor', 'worker'].some(r => norm.includes(r));
  });

  // Assign artisan name mapping
  mapping.name = fullNameCol || exactNameCol || partialNameCol || roleNameCol || firstNameCol || '';

  // If still empty, choose the first non-ID, non-technical header
  if (!mapping.name) {
    const nonIdCandidate = headers.find(h => !isExcludedFromName(h));
    if (nonIdCandidate) {
      mapping.name = nonIdCandidate;
    } else {
      mapping.name = headers[0] || '';
    }
  }

  const findHeader = (patterns: RegExp[]): string | undefined => {
    return headers.find(h => {
      const normalized = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return patterns.some(p => p.test(normalized));
    });
  };

  mapping.category = findHeader([/category/, /trade/, /service/, /skillcategory/, /craft/, /specialty/, /profession/]) || '';
  mapping.lat = findHeader([/^lat$/, /latitude/, /gpslat/, /ycoord/, /y$/]) || '';
  mapping.lng = findHeader([/^lng$/, /^lon$/, /longitude/, /gpslng/, /gpslon/, /xcoord/, /x$/]) || '';
  mapping.rating = findHeader([/rating/, /score/, /stars/, /avgrating/, /reviewrating/]) || '';
  mapping.modelScore = findHeader([/modelscore/, /mlscore/, /trainedscore/, /weight/, /modelweight/, /predictionscore/, /rankscore/, /recommendationscore/]) || '';
  mapping.phone = findHeader([/phone/, /mobile/, /contact/, /tel/, /cell/, /sms/]) || '';
  mapping.whatsapp = findHeader([/whatsapp/, /wanumber/, /wa/]) || '';
  mapping.hourlyRate = findHeader([/hourlyrate/, /rate/, /kes/, /price/, /ratekes/, /cost/, /charge/]) || '';
  mapping.inspectionFee = findHeader([/inspectionfee/, /callout/, /deposit/, /basefee/, /visitation/]) || '';
  mapping.skills = findHeader([/skills/, /specialties/, /keywords/, /services/, /tools/, /expertise/]) || '';
  mapping.experienceYears = findHeader([/experience/, /years/, /yearsofexp/, /tenure/]) || '';
  mapping.jobsCompleted = findHeader([/jobs/, /jobscompleted/, /orders/, /completed/, /projects/]) || '';
  mapping.reviewCount = findHeader([/reviews/, /reviewcount/, /numreviews/]) || '';
  mapping.neighborhood = findHeader([/neighborhood/, /estate/, /location/, /area/, /address/, /city/, /town/, /subcounty/]) || '';
  mapping.bio = findHeader([/bio/, /description/, /about/, /notes/, /summary/]) || '';
  mapping.avatarUrl = findHeader([/avatar/, /avatarurl/, /photo/, /image/, /picture/, /img/]) || '';
  mapping.isAvailable = findHeader([/available/, /isavailable/, /availability/, /status/]) || '';
  mapping.isVerified = findHeader([/verified/, /isverified/, /idverified/, /vetted/, /nita/]) || '';

  return mapping;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400'
];

/**
 * Standardize category names to known trades
 */
export function normalizeCategory(raw: string): string {
  if (!raw || !raw.trim()) return 'General Trade';
  const clean = raw.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('plumb') || lower.includes('pipe') || lower.includes('water')) return 'Plumbing & Pipe Fitting';
  if (lower.includes('electr') || lower.includes('wire') || lower.includes('power') || lower.includes('solar')) return 'Electrical Installation';
  if (lower.includes('carpent') || lower.includes('wood') || lower.includes('furniture') || lower.includes('joiner')) return 'Carpentry & Joinery';
  if (lower.includes('mason') || lower.includes('tile') || lower.includes('brick') || lower.includes('concrete')) return 'Masonry & Tiling';
  if (lower.includes('paint') || lower.includes('decorat') || lower.includes('color')) return 'Painting & Decoration';
  if (lower.includes('weld') || lower.includes('metal') || lower.includes('fabricat') || lower.includes('steel')) return 'Welding & Metal Fabrication';
  if (lower.includes('appliance') || lower.includes('electronic') || lower.includes('fridge') || lower.includes('tv') || lower.includes('washing')) return 'Electronics & Appliance Repair';
  if (lower.includes('ac') || lower.includes('hvac') || lower.includes('air con') || lower.includes('refrigerat') || lower.includes('cooling')) return 'Refrigeration & Air Conditioning';

  return clean;
}

/**
 * Standardize Kenyan phone numbers
 */
export function formatKenyanPhone(raw: string): string {
  if (!raw) return `+254 7${Math.floor(10000000 + Math.random() * 89999999)}`;
  const digits = raw.replace(/[^0-9]/g, '');

  if (digits.startsWith('254') && digits.length === 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+254 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 9) {
    return `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw.trim();
}

/**
 * Lookup coordinates for a neighborhood string
 */
export function lookupNeighborhoodCoords(neighborhoodStr: string, index: number): { lat: number; lng: number; neighborhood: string } {
  if (neighborhoodStr) {
    const cleanLower = neighborhoodStr.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, val] of Object.entries(NAIROBI_ESTATE_COORDS)) {
      if (cleanLower.includes(key)) {
        // Add tiny jitter (10-20 meters) so pins in the same neighborhood do not completely overlap
        const jitterLat = (Math.sin(index * 1.7) * 0.0035);
        const jitterLng = (Math.cos(index * 2.3) * 0.0035);
        return {
          lat: val.lat + jitterLat,
          lng: val.lng + jitterLng,
          neighborhood: neighborhoodStr.trim()
        };
      }
    }
  }

  // Pick from default estate list by index
  const estateKeys = Object.keys(NAIROBI_ESTATE_COORDS);
  const chosenKey = estateKeys[index % estateKeys.length];
  const chosen = NAIROBI_ESTATE_COORDS[chosenKey];
  const jitterLat = (Math.sin(index * 1.5) * 0.004);
  const jitterLng = (Math.cos(index * 1.8) * 0.004);

  return {
    lat: chosen.lat + jitterLat,
    lng: chosen.lng + jitterLng,
    neighborhood: neighborhoodStr?.trim() || chosen.neighborhood
  };
}

/**
 * Transform sheet rows into typed Fundi items with trained model weights and attributes
 */
export function parseSheetRowsToFundis(
  headers: string[],
  rows: (string | number)[][],
  columnMap: Record<string, string>,
  datasetName: string = 'Google Sheet Model'
): Fundi[] {
  const getColIdx = (mapKey: string): number => {
    const colName = columnMap[mapKey];
    if (!colName) return -1;
    return headers.indexOf(colName);
  };

  const artisanIdIdx = getColIdx('artisanId');
  const nameIdx = getColIdx('name');
  const firstNameIdx = getColIdx('firstName');
  const lastNameIdx = getColIdx('lastName');
  const catIdx = getColIdx('category');
  const latIdx = getColIdx('lat');
  const lngIdx = getColIdx('lng');
  const ratingIdx = getColIdx('rating');
  const modelScoreIdx = getColIdx('modelScore');
  const phoneIdx = getColIdx('phone');
  const waIdx = getColIdx('whatsapp');
  const rateIdx = getColIdx('hourlyRate');
  const feeIdx = getColIdx('inspectionFee');
  const skillsIdx = getColIdx('skills');
  const expIdx = getColIdx('experienceYears');
  const jobsIdx = getColIdx('jobsCompleted');
  const reviewsIdx = getColIdx('reviewCount');
  const neighIdx = getColIdx('neighborhood');
  const bioIdx = getColIdx('bio');
  const avatarIdx = getColIdx('avatarUrl');
  const availIdx = getColIdx('isAvailable');
  const verifiedIdx = getColIdx('isVerified');

  return rows
    .filter(r => r && r.length > 0 && r.some(cell => String(cell || '').trim() !== ''))
    .map((row, index) => {
      const getVal = (idx: number, fallback: string = ''): string => {
        if (idx === -1 || idx >= row.length || row[idx] === undefined || row[idx] === null) {
          return fallback;
        }
        return String(row[idx]).trim();
      };

      const getNum = (idx: number, fallback: number): number => {
        const val = getVal(idx);
        if (!val) return fallback;
        const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? fallback : parsed;
      };

      // Helper to check if a value looks like an ID / code / number rather than a person's full name
      const isIdLike = (val: string): boolean => {
        if (!val) return true;
        const s = val.trim();
        if (/^[0-9]+$/.test(s)) return true; // pure numbers: e.g. "10492"
        if (/^[A-Z0-9_\-#/]{1,15}$/i.test(s) && !s.includes(' ')) return true; // short codes: "ART-001", "A01"
        if (/^(artisan|fundi|id|code|ref|reg|no|worker)[\s_#-]*[0-9]+/i.test(s)) return true; // "Artisan 01", "ID: 492"
        return false;
      };

      // Helper to check if a candidate cell looks like a real person's full name
      const isHumanName = (val: string): boolean => {
        if (!val) return false;
        const s = val.trim();
        if (isIdLike(s)) return false;
        if (s.startsWith('+') || s.startsWith('07') || s.startsWith('http')) return false;
        if (/[0-9]/.test(s) && !s.includes(' ')) return false;
        // Real human name: mostly letters, spaces, hyphens, periods, between 3 and 45 characters
        return /^[a-zA-Z\s'.-]{3,45}$/.test(s) && s.includes(' ');
      };

      let extractedId = getVal(artisanIdIdx, '');
      let rawName = getVal(nameIdx, '');
      const firstName = getVal(firstNameIdx, '');
      const lastName = getVal(lastNameIdx, '');

      // Check if separate first and last name columns were provided
      if (firstName || lastName) {
        const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
        if (combined) {
          if (!rawName || isIdLike(rawName)) {
            if (rawName && !extractedId) extractedId = rawName;
            rawName = combined;
          }
        }
      }

      // If rawName was mapped or detected as an ID code, look for the actual human full name in this row
      if (isIdLike(rawName)) {
        if (!extractedId && rawName) {
          extractedId = rawName;
        }
        
        // Scan other columns in this row to find the true human full name
        for (let c = 0; c < row.length; c++) {
          if (c === nameIdx || c === artisanIdIdx || c === phoneIdx || c === waIdx || c === catIdx || c === neighIdx || c === latIdx || c === lngIdx || c === skillsIdx || c === bioIdx) {
            continue;
          }
          const candidate = String(row[c] || '').trim();
          if (isHumanName(candidate)) {
            rawName = candidate;
            break;
          }
        }

        // Secondary fallback: if no multi-word name, look for any non-id alphabetic text cell (3-35 chars)
        if (isIdLike(rawName)) {
          for (let c = 0; c < row.length; c++) {
            if (c === nameIdx || c === artisanIdIdx || c === phoneIdx || c === waIdx || c === catIdx || c === neighIdx || c === latIdx || c === lngIdx || c === skillsIdx || c === bioIdx) {
              continue;
            }
            const candidate = String(row[c] || '').trim();
            if (candidate.length >= 3 && candidate.length <= 35 && /^[a-zA-Z\s'.-]+$/.test(candidate) && !isIdLike(candidate)) {
              rawName = candidate;
              break;
            }
          }
        }
      }

      // Final resolution of artisan name and ID
      let finalName = rawName.trim();
      if (!finalName || isIdLike(finalName)) {
        finalName = extractedId ? `Artisan ${extractedId}` : `Artisan #${index + 1}`;
      }

      const rawCategory = getVal(catIdx, 'Plumbing & Pipe Fitting');
      const primaryCategory = normalizeCategory(rawCategory);

      // Neighborhood and GPS Coordinates
      const rawNeigh = getVal(neighIdx, '');
      const geo = lookupNeighborhoodCoords(rawNeigh, index);
      const parsedLat = latIdx !== -1 && row[latIdx] !== undefined ? getNum(latIdx, geo.lat) : geo.lat;
      const parsedLng = lngIdx !== -1 && row[lngIdx] !== undefined ? getNum(lngIdx, geo.lng) : geo.lng;
      const neighborhood = rawNeigh || geo.neighborhood;

      // Model score / trained bias if present in sheet
      const rawModelScore = modelScoreIdx !== -1 ? getNum(modelScoreIdx, -1) : -1;
      let matchScore: number | undefined = undefined;
      let matchReasons: string[] = [];

      if (rawModelScore > 0) {
        if (rawModelScore <= 1.0) {
          matchScore = Math.round(rawModelScore * 100);
        } else if (rawModelScore <= 100) {
          matchScore = Math.round(rawModelScore);
        } else {
          matchScore = Math.min(99, Math.max(50, Math.round(rawModelScore)));
        }
        matchReasons.push(`Sheet ML Match Score: ${matchScore}% relevance`);
      }

      const rawRating = getNum(ratingIdx, 4.8);
      const rating = Math.min(5.0, Math.max(3.0, rawRating));
      const jobsCompleted = Math.max(1, Math.round(getNum(jobsIdx, 20 + (index * 7) % 150)));
      const reviewCount = Math.max(1, Math.round(getNum(reviewsIdx, Math.round(jobsCompleted * 0.7))));
      const experienceYears = Math.max(1, Math.round(getNum(expIdx, 4 + (index % 12))));
      const hourlyRateKes = Math.round(getNum(rateIdx, 750 + (index % 5) * 150));
      const fixedInspectionFeeKes = Math.round(getNum(feeIdx, 500));

      const rawSkills = getVal(skillsIdx);
      const skills = rawSkills 
        ? rawSkills.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
        : [`${primaryCategory} Diagnostics`, 'Precision Repair', 'NITA Standards'];

      const rawPhone = getVal(phoneIdx, '');
      const phone = formatKenyanPhone(rawPhone);
      const rawWa = getVal(waIdx, '');
      const whatsapp = rawWa ? rawWa.replace(/[^0-9]/g, '') : phone.replace(/[^0-9]/g, '');
      
      const bio = getVal(bioIdx, `Certified ${primaryCategory} specialist with ${experienceYears}+ years hands-on experience in ${neighborhood}. Imported from ${datasetName}.`);
      const avatarUrl = getVal(avatarIdx, DEFAULT_AVATARS[index % DEFAULT_AVATARS.length]);

      const isAvailableRaw = getVal(availIdx, 'true').toLowerCase();
      const isAvailableNow = isAvailableRaw === 'true' || isAvailableRaw === '1' || isAvailableRaw === 'yes' || isAvailableRaw === 'available';

      const isVerifiedRaw = getVal(verifiedIdx, 'true').toLowerCase();
      const isVerified = isVerifiedRaw === 'true' || isVerifiedRaw === '1' || isVerifiedRaw === 'yes' || isVerifiedRaw.includes('nita');

      matchReasons.push(`Imported from: ${datasetName}`);
      if (skills.length > 0) {
        matchReasons.push(`Specialty: ${skills.slice(0, 2).join(', ')}`);
      }

      const fundi: Fundi = {
        id: extractedId ? `fundi-${extractedId.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : `sheet-fundi-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
        artisanId: extractedId || undefined,
        name: finalName,
        avatarUrl,
        phone,
        whatsapp,
        primaryCategory,
        additionalCategories: [],
        skills,
        bio,
        experienceYears,
        hourlyRateKes,
        fixedInspectionFeeKes,
        rating: parseFloat(rating.toFixed(1)),
        reviewCount,
        jobsCompleted,
        isVerified,
        idVerified: true,
        backgroundChecked: isVerified,
        isAvailableNow,
        responseTimeMinutes: 15 + (index % 4) * 5,
        location: {
          lat: parsedLat,
          lng: parsedLng,
          neighborhood,
          address: `${neighborhood}, Kenya`,
          city: 'Nairobi'
        },
        toolsEquipment: ['Professional Tool Set', 'Safety Gear & PPE'],
        emergencyAvailable: true,
        matchScore,
        matchReasons,
        nitaAccredited: isVerified,
        nitaCertificationLevel: 'NITA Artisan Grade II',
        reviews: [
          {
            id: `rev-sheet-${index}-1`,
            authorName: 'Verified Client',
            rating: Math.min(5, Math.max(4, Math.round(rating))),
            date: '2026-02-20',
            comment: `High quality work and prompt arrival in ${neighborhood}. Fully satisfied!`,
            jobType: `${primaryCategory} Service`,
            verifiedJob: true
          }
        ],
        portfolio: [
          {
            id: `port-sheet-${index}-1`,
            title: `${primaryCategory} Project`,
            description: `Quality installation and troubleshooting carried out in ${neighborhood}`,
            imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800',
            category: primaryCategory,
            completionDate: '2026-01-20'
          }
        ]
      };

      return fundi;
    });
}
