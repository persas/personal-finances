import type Database from 'better-sqlite3';

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS budget_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL,
      budget_group TEXT NOT NULL,
      line_name TEXT NOT NULL,
      monthly_amount REAL DEFAULT 0,
      annual_amount REAL DEFAULT 0,
      is_annual INTEGER DEFAULT 0,
      year INTEGER NOT NULL,
      UNIQUE(profile_id, line_name, year)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      source TEXT,
      category TEXT,
      budget_group TEXT,
      budget_line TEXT,
      notes TEXT,
      upload_batch_id TEXT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      source TEXT NOT NULL,
      filename TEXT NOT NULL,
      uploaded_at TEXT DEFAULT (datetime('now')),
      transaction_count INTEGER DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      user_comments TEXT,
      report_text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(profile_id, month, year)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_tx_profile_month ON transactions(profile_id, month, year)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tx_profile_year ON transactions(profile_id, year)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_budget_profile ON budget_lines(profile_id, year)`);

  // ---- Investment tables ----

  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      ticker TEXT,
      asset_type TEXT NOT NULL CHECK(asset_type IN ('stock', 'etf', 'fund', 'crypto', 'other')),
      is_public INTEGER NOT NULL DEFAULT 0,
      provider_id TEXT,
      currency TEXT NOT NULL DEFAULT 'EUR',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES portfolio_assets(id) ON DELETE CASCADE,
      quantity REAL NOT NULL,
      price_per_unit REAL NOT NULL,
      purchase_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES portfolio_assets(id) ON DELETE CASCADE,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('yahoo', 'coingecko', 'manual')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(asset_id, date, source)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL,
      ticker TEXT NOT NULL,
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL DEFAULT 'stock',
      exchange TEXT,
      added_at TEXT DEFAULT (datetime('now')),
      UNIQUE(profile_id, ticker)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS research_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      watchlist_id INTEGER NOT NULL REFERENCES watchlist(id) ON DELETE CASCADE,
      research_date TEXT DEFAULT (datetime('now')),
      content TEXT NOT NULL,
      sentiment TEXT CHECK(sentiment IN ('bullish', 'bearish', 'neutral', 'mixed')),
      summary TEXT,
      model_used TEXT DEFAULT 'gemini-2.5-pro'
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_assets_profile ON portfolio_assets(profile_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_lots_asset ON portfolio_lots(asset_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prices_asset_date ON asset_prices(asset_id, date DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_watchlist_profile ON watchlist(profile_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_research_watchlist ON research_reports(watchlist_id, research_date DESC)`);

  seedProfiles(db);
  seedBudgets(db);
}

function seedProfiles(db: Database.Database): void {
  const existing = db.prepare('SELECT id FROM profiles').all();
  if (existing.length > 0) return;

  const insert = db.prepare('INSERT INTO profiles (id, name, description) VALUES (?, ?, ?)');
  insert.run('diego', 'Diego', 'Personal finances');
  insert.run('marta', 'Marta', 'Personal finances');
  insert.run('casa', 'Casa', 'Joint household (Diego & Marta)');
}

function seedBudgets(db: Database.Database): void {
  const existing = db.prepare('SELECT id FROM budget_lines LIMIT 1').all();
  if (existing.length > 0) return;

  const year = 2026;
  const insert = db.prepare(
    `INSERT INTO budget_lines (profile_id, budget_group, line_name, monthly_amount, annual_amount, is_annual, year)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const allBudgets: [string, string, string, number, number, number][] = [
    // Diego — Fixed Costs
    ['diego', 'Fixed Costs', 'Rent / Mortgage', 1000, 12000, 0],
    ['diego', 'Fixed Costs', 'Utilities', 30, 360, 0],
    ['diego', 'Fixed Costs', 'Subscriptions', 60, 720, 0],
    ['diego', 'Fixed Costs', 'Seguro coche', 60, 720, 1],
    ['diego', 'Fixed Costs', 'Seguro moto', 30, 360, 1],
    ['diego', 'Fixed Costs', 'Garajes', 170, 2040, 0],
    ['diego', 'Fixed Costs', 'Transportation', 50, 600, 0],
    ['diego', 'Fixed Costs', 'Mant. vehículos', 100, 1200, 0],
    ['diego', 'Fixed Costs', 'BMW', 360, 4320, 0],
    ['diego', 'Fixed Costs', 'Psicóloga', 60, 720, 0],
    ['diego', 'Fixed Costs', 'Médicos', 50, 600, 0],
    ['diego', 'Fixed Costs', 'Miscellaneous', 295.50, 3546, 0],
    // Diego — Investments
    ['diego', 'Investments', 'Stocks', 500, 6000, 0],
    // Diego — Savings Goals
    ['diego', 'Savings Goals', 'Vacations', 450, 5400, 0],
    ['diego', 'Savings Goals', 'Gifts', 125, 1500, 0],
    ['diego', 'Savings Goals', 'Emergency fund', 400, 4800, 0],
    // Diego — Guilt-Free
    ['diego', 'Guilt-Free', 'Guilt-Free Spending', 776.41, 9316.92, 0],
    // Diego — Pre-Tax
    ['diego', 'Pre-Tax', 'Cuota Autónomos', 458.09, 5497.08, 0],
    // Casa
    ['casa', 'Fixed Costs', 'Rent / Mortgage', 1000, 12000, 0],
    ['casa', 'Fixed Costs', 'Groceries', 450, 5400, 0],
    ['casa', 'Fixed Costs', 'Miscellaneous', 217.50, 2610, 0],
    ['casa', 'Investments', 'Revolut Conjunta Ahorro', 300, 3600, 0],
    ['casa', 'Savings Goals', 'Vacations', 400, 4800, 0],
    ['casa', 'Guilt-Free', 'Guilt-Free Spending', 32.50, 390, 0],
    // Marta (template from Diego)
    ['marta', 'Fixed Costs', 'Rent / Mortgage', 1000, 12000, 0],
    ['marta', 'Fixed Costs', 'Utilities', 30, 360, 0],
    ['marta', 'Fixed Costs', 'Subscriptions', 60, 720, 0],
    ['marta', 'Fixed Costs', 'Transportation', 50, 600, 0],
    ['marta', 'Fixed Costs', 'Psicóloga', 60, 720, 0],
    ['marta', 'Fixed Costs', 'Médicos', 50, 600, 0],
    ['marta', 'Fixed Costs', 'Miscellaneous', 200, 2400, 0],
    ['marta', 'Investments', 'Savings', 500, 6000, 0],
    ['marta', 'Savings Goals', 'Vacations', 400, 4800, 0],
    ['marta', 'Savings Goals', 'Gifts', 125, 1500, 0],
    ['marta', 'Savings Goals', 'Emergency fund', 300, 3600, 0],
    ['marta', 'Guilt-Free', 'Guilt-Free Spending', 500, 6000, 0],
  ];

  const insertMany = db.transaction((items: typeof allBudgets) => {
    for (const [profileId, group, line, monthly, annual, isAnnual] of items) {
      insert.run(profileId, group, line, monthly, annual, isAnnual, year);
    }
  });

  insertMany(allBudgets);
}
