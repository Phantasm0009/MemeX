import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../database.json');
const marketPath = path.join(__dirname, '../market.json');

// Initialize database if it doesn't exist
function initDb() {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      users: {},
      holdings: {},
      transactions: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  }
}

function loadDb() {
  if (!fs.existsSync(dbPath)) initDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Users
export function getUser(id) {
  const db = loadDb();
  if (!db.users[id]) {
    db.users[id] = {
      id,
      balance: 100,
      lastDaily: 0,
      lastMessage: 0
    };
    saveDb(db);
  }
  return db.users[id];
}

export function updateUserBalance(id, balance) {
  const db = loadDb();
  if (!db.users[id]) {
    db.users[id] = { id, balance: 100, lastDaily: 0, lastMessage: 0 };
  }
  db.users[id].balance = balance;
  saveDb(db);
}

export function updateUserLastDaily(id, timestamp) {
  const db = loadDb();
  if (!db.users[id]) {
    db.users[id] = { id, balance: 100, lastDaily: 0, lastMessage: 0 };
  }
  db.users[id].lastDaily = timestamp;
  saveDb(db);
}

export function updateUserLastMessage(id, timestamp) {
  const db = loadDb();
  if (!db.users[id]) {
    db.users[id] = { id, balance: 100, lastDaily: 0, lastMessage: 0 };
  }
  db.users[id].lastMessage = timestamp;
  saveDb(db);
}

// Holdings
export function getHoldings(id) {
  const db = loadDb();
  if (!db.holdings) db.holdings = {};
  return db.holdings[id] || [];
}

export function addHolding(id, stock, amount) {
  const db = loadDb();
  if (!db.holdings) db.holdings = {};
  if (!db.holdings[id]) db.holdings[id] = [];
  
  const existing = db.holdings[id].find(h => h.stock === stock);
  if (existing) {
    existing.amount += amount;
  } else {
    db.holdings[id].push({ stock, amount });
  }
  saveDb(db);
}

export function removeHolding(id, stock, amount) {
  const db = loadDb();
  if (!db.holdings) db.holdings = {};
  if (!db.holdings[id]) return;
  
  const holding = db.holdings[id].find(h => h.stock === stock);
  if (holding) {
    holding.amount -= amount;
    if (holding.amount <= 0) {
      db.holdings[id] = db.holdings[id].filter(h => h.stock !== stock);
    }
  }
  saveDb(db);
}

// Transactions
export function addTransaction(userId, stock, amount, price) {
  const db = loadDb();
  if (!db.transactions) db.transactions = [];
  db.transactions.push({
    id: Date.now() + Math.random(),
    userId,
    stock,
    amount,
    price,
    timestamp: Date.now()
  });
  saveDb(db);
}

export function getTransactions(userId) {
  const db = loadDb();
  if (!db.transactions) db.transactions = [];
  return db.transactions
    .filter(t => t.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);
}

export function getAllUsers() {
  const db = loadDb();
  if (!db.users) db.users = {};
  return Object.values(db.users).sort((a, b) => b.balance - a.balance);
}

// Stock Prices
export function getStockPrice(symbol) {
  if (!fs.existsSync(marketPath)) return null;
  const market = JSON.parse(fs.readFileSync(marketPath));
  return market[symbol]?.price || null;
}

export function setStockPrice(symbol, price) {
  let market = {};
  if (fs.existsSync(marketPath)) market = JSON.parse(fs.readFileSync(marketPath));
  if (!market[symbol]) market[symbol] = {};
  market[symbol].price = price;
  fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
}

export function getAllStocks() {
  if (!fs.existsSync(marketPath)) return {};
  return JSON.parse(fs.readFileSync(marketPath));
}

// DB Init
export { initDb };
