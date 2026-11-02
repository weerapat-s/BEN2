// Loads apps-script/Code.gs into a vm sandbox with in-memory fakes of the Google services it uses.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadBackend({ props = {} } = {}) {
  const store = { props: Object.assign({}, props), rows: [], cache: {}, files: [], notified: [] };
  let uuid = 0;

  const sheet = {
    getLastRow: () => store.rows.length,
    appendRow: (r) => store.rows.push(r),
    setFrozenRows() {},
    setName() {},
    getRange: (row, col, nr, nc) => ({
      getValues: () => store.rows.slice(row - 1, row - 1 + nr).map((r) => r.slice(col - 1, col - 1 + nc)),
      setValues: (v) => v[0].forEach((x, i) => { store.rows[row - 1][col - 1 + i] = x; }),
    }),
  };
  const ss = { getSheetByName: () => sheet, getSheets: () => [sheet], getId: () => 'SS1', getUrl: () => 'url' };
  const folder = {
    getId: () => 'F1',
    createFile: (blob) => {
      store.files.push(blob);
      return { setSharing() {}, getId: () => 'IMG' + store.files.length };
    },
  };

  const ctx = {
    console: { log() {}, error() {} },
    SpreadsheetApp: { create: () => ss, openById: () => ss },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k in store.props ? store.props[k] : null),
        setProperty: (k, v) => { store.props[k] = v; },
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (k in store.cache ? store.cache[k] : null),
        put: (k, v) => { store.cache[k] = String(v); },
        remove: (k) => { delete store.cache[k]; },
      }),
    },
    DriveApp: {
      createFolder: () => folder,
      getFolderById: () => folder,
      Access: { ANYONE_WITH_LINK: 1 },
      Permission: { VIEW: 1 },
    },
    Utilities: {
      base64Decode: (s) => Array.from(Buffer.from(s, 'base64')),
      newBlob: (bytes, type, name) => ({ bytes, type, name }),
      getUuid: () => 'uuid-' + String(++uuid).padStart(31, '0'),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (s) => ({ s, setMimeType() { return this; } }),
    },
    notifyNewTicket: (d, img) => store.notified.push(['new', d.ticket_id, img]),
    notifyTicketUpdate: (d) => store.notified.push(['upd', d.ticket_id, d.status]),
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx);

  return {
    ctx,
    store,
    post: (o) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(o) } }).s),
    get: (params = {}) => JSON.parse(ctx.doGet({ parameter: params }).s),
    setNow: (ms) => { ctx.nowMs_ = () => ms; },
  };
}

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const valid = (over = {}) => Object.assign(
  { action: 'create', ticket_id: 'BEN2-1234', reporter_name: 'ครูสมชาย', equipment_type: 'โปรเจคเตอร์',
    location: 'อาคาร 1', issue_detail: 'เปิดไม่ติด', imageBase64: null }, over);

module.exports = { loadBackend, PNG, valid };
