import JSZip from 'jszip';

export type XlsxCell = string | number | { formula: string } | null | undefined;

export type XlsxRow = {
  cells: XlsxCell[];
  kind?: 'brand' | 'title' | 'muted' | 'header' | 'group' | 'body' | 'stripe' | 'total' | 'code';
  height?: number;
};

export type XlsxImage = {
  row: number;
  col: number;
  bytes: Uint8Array;
  width: number;
  height: number;
};

export type XlsxSheet = {
  name: string;
  columns: number[];
  rows: XlsxRow[];
  images?: XlsxImage[];
};

function xmlText(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colLetter(index: number) {
  let n = index;
  let text = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    text = String.fromCharCode(65 + rem) + text;
    n = Math.floor((n - 1) / 26);
  }
  return text;
}

function styleIndex(kind: XlsxRow['kind'], col: number) {
  if (kind === 'brand') return 1;
  if (kind === 'title') return 2;
  if (kind === 'muted') return 3;
  if (kind === 'header') return 4;
  if (kind === 'group') return 5;
  if (kind === 'total') return 6;
  if (kind === 'code' && col === 2) return 7;
  if (kind === 'stripe') return 8;
  return 9;
}

function cellXml(row: number, col: number, value: XlsxCell, style: number) {
  const ref = `${colLetter(col)}${row}`;
  if (value == null || value === '') {
    return `<c r="${ref}" s="${style}"/>`;
  }
  if (typeof value === 'number') {
    return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  }
  if (typeof value === 'object' && 'formula' in value) {
    return `<c r="${ref}" s="${style}"><f>${xmlText(value.formula)}</f></c>`;
  }
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(String(value))}</t></is></c>`;
}

function sheetXml(sheet: XlsxSheet, drawingId?: number) {
  const colCount = Math.max(sheet.columns.length, ...sheet.rows.map((row) => row.cells.length), 1);
  const lastRef = `${colLetter(colCount)}${Math.max(sheet.rows.length, 1)}`;
  const cols = sheet.columns
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join('');
  const rows = sheet.rows
    .map((row, index) => {
      const r = index + 1;
      const height = row.height ? ` ht="${row.height}" customHeight="1"` : '';
      const cells = row.cells
        .map((value, col) => cellXml(r, col + 1, value, styleIndex(row.kind, col + 1)))
        .join('');
      return `<row r="${r}"${height}>${cells}</row>`;
    })
    .join('');
  const drawing = drawingId ? `<drawing r:id="rId1"/>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${cols}</cols>
  <sheetData>${rows}</sheetData>
  ${drawing}
  <dimension ref="A1:${lastRef}"/>
</worksheet>`;
}

function drawingXml(images: XlsxImage[]) {
  const anchors = images
    .map((image, index) => {
      const cx = Math.round(image.width * 9525);
      const cy = Math.round(image.height * 9525);
      return `<xdr:oneCellAnchor>
        <xdr:from>
          <xdr:col>${image.col}</xdr:col>
          <xdr:colOff>80000</xdr:colOff>
          <xdr:row>${image.row}</xdr:row>
          <xdr:rowOff>40000</xdr:rowOff>
        </xdr:from>
        <xdr:ext cx="${cx}" cy="${cy}"/>
        <xdr:pic>
          <xdr:nvPicPr>
            <xdr:cNvPr id="${index + 1}" name="Foto ${index + 1}"/>
            <xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>
          </xdr:nvPicPr>
          <xdr:blipFill>
            <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${index + 1}"/>
            <a:stretch><a:fillRect/></a:stretch>
          </xdr:blipFill>
          <xdr:spPr>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          </xdr:spPr>
        </xdr:pic>
        <xdr:clientData/>
      </xdr:oneCellAnchor>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
${anchors}
</xdr:wsDr>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="6">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="16"/><color rgb="FFF96706"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FF121212"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF6B7280"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FFF96706"/><name val="Calibri"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF121212"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFE8D6"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF5F5F5"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border/><border>
      <bottom style="thin"><color rgb="FFF96706"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="10">
    <xf xfId="0"/>
    <xf xfId="0" fontId="1" applyFont="1"/>
    <xf xfId="0" fontId="2" applyFont="1"/>
    <xf xfId="0" fontId="3" applyFont="1"/>
    <xf xfId="0" fontId="4" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf xfId="0" fontId="2" fillId="3" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf xfId="0" fontId="2" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf xfId="0" fontId="5" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf xfId="0" fillId="4" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

export async function buildXlsx(sheets: XlsxSheet[]) {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets
    .map(
      (sheet, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>${
          sheet.images?.length
            ? `<Override PartName="/xl/drawings/drawing${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`
            : ''
        }`,
    )
    .join('')}
</Types>`,
  );
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets
    .map(
      (_sheet, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join('')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  );
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets
      .map(
        (sheet, index) =>
          `<sheet name="${xmlText(sheet.name.slice(0, 31))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
      )
      .join('')}
  </sheets>
</workbook>`,
  );
  zip.file('xl/styles.xml', STYLES);

  sheets.forEach((sheet, index) => {
    const sheetNo = index + 1;
    const hasImages = Boolean(sheet.images?.length);
    zip.file(`xl/worksheets/sheet${sheetNo}.xml`, sheetXml(sheet, hasImages ? 1 : undefined));
    if (!hasImages || !sheet.images) return;

    zip.file(
      `xl/worksheets/_rels/sheet${sheetNo}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${sheetNo}.xml"/>
</Relationships>`,
    );
    zip.file(
      `xl/drawings/_rels/drawing${sheetNo}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheet.images
    .map(
      (_image, imageIndex) =>
        `<Relationship Id="rId${imageIndex + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${sheetNo}_${imageIndex + 1}.jpeg"/>`,
    )
    .join('')}
</Relationships>`,
    );
    zip.file(`xl/drawings/drawing${sheetNo}.xml`, drawingXml(sheet.images));
    sheet.images.forEach((image, imageIndex) => {
      zip.file(`xl/media/image${sheetNo}_${imageIndex + 1}.jpeg`, image.bytes);
    });
  });

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export function titleRows(subtitle: string, columns: number): XlsxRow[] {
  const pad = Array.from({ length: Math.max(columns - 1, 0) }, () => '');
  return [
    { kind: 'brand', cells: ['VICAST', ...pad] },
    { kind: 'title', cells: ['Informe de levantamiento · Excel', ...pad] },
    { kind: 'muted', cells: [subtitle, ...pad] },
    { cells: pad.length ? ['', ...pad] : [''] },
  ];
}

export function headerRow(labels: string[]): XlsxRow {
  return { kind: 'header', cells: labels, height: 22 };
}
