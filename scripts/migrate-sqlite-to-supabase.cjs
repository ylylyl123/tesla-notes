const path = require("path");
const { execFileSync } = require("child_process");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const SQLITE_PATH = path.join(__dirname, "../../tesla_notes.db");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const DRY_RUN = process.argv.includes("--dry-run");
const EXPORT_ONLY = process.argv.includes("--export-only");
const BATCH_SIZE = 5;
const EXPORT_DIR = path.join(__dirname, "../exports");

function querySqliteJson(sql) {
  const out = execFileSync("sqlite3", ["-json", SQLITE_PATH, sql], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  }).trim();
  if (!out) return [];
  return JSON.parse(out);
}

function querySqliteOne(sql) {
  const rows = querySqliteJson(sql);
  return rows[0] || null;
}

function getLocalCounts() {
  const memoRow = querySqliteOne("SELECT count(*) AS cnt FROM memo");
  const planRow = querySqliteOne("SELECT count(*) AS cnt FROM daily_plan");
  return {
    memoCount: Number(memoRow?.cnt || 0),
    planCount: Number(planRow?.cnt || 0),
  };
}

function loadMemoBatch(offset, limit) {
  return querySqliteJson(
    `SELECT uid, created_ts, updated_ts, category, target_date, completion_status, content, pinned, archived
     FROM memo
     ORDER BY created_ts ASC
     LIMIT ${limit} OFFSET ${offset}`
  ).map((row) => ({
    uid: row.uid,
    created_ts: Number(row.created_ts),
    updated_ts: Number(row.updated_ts),
    category: row.category || "daily",
    target_date: row.target_date || null,
    completion_status: row.completion_status || "pending",
    content: row.content || "",
    pinned: row.pinned === 1,
    archived: row.archived === 1,
  }));
}

function loadAllPlans() {
  return querySqliteJson(
    `SELECT plan_date, title, description, category, completed, priority, created_ts, updated_ts, completed_ts
     FROM daily_plan
     ORDER BY created_ts ASC`
  ).map((row) => ({
    plan_date: row.plan_date,
    title: row.title,
    description: row.description || "",
    category: row.category || "daily",
    completed: row.completed === 1,
    priority: Number(row.priority || 0),
    created_ts: Number(row.created_ts),
    updated_ts: Number(row.updated_ts),
    completed_ts: row.completed_ts ? Number(row.completed_ts) : null,
  }));
}

function postgrestRequest(method, pathWithQuery, body, prefer) {
  const base = SUPABASE_URL.replace(/\/+$/, "");
  const url = `${base}/rest/v1/${pathWithQuery}`;
  const args = [
    "-sS",
    "-X",
    method,
    url,
    "-H",
    `apikey: ${SUPABASE_KEY}`,
    "-H",
    `Authorization: Bearer ${SUPABASE_KEY}`,
    "-H",
    "Content-Type: application/json",
  ];
  if (prefer) {
    args.push("-H", `Prefer: ${prefer}`);
  }
  args.push("-w", "\n__HTTP_STATUS__:%{http_code}");

  let output;
  try {
    if (body !== undefined) {
      output = execFileSync("curl", [...args, "--data-binary", "@-"], {
        input: JSON.stringify(body),
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 50,
      });
    } else {
      output = execFileSync("curl", args, {
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 10,
      });
    }
  } catch (err) {
    throw new Error(`curl 请求失败: ${err.message}`);
  }

  const marker = "\n__HTTP_STATUS__:";
  const idx = output.lastIndexOf(marker);
  if (idx === -1) throw new Error(`无法解析 HTTP 状态码: ${output.slice(0, 200)}`);
  const bodyText = output.slice(0, idx).trim();
  const status = Number(output.slice(idx + marker.length).trim());

  if (status >= 400) {
    throw new Error(`HTTP ${status}: ${bodyText}`);
  }
  return { status, bodyText };
}

function getJson(pathWithQuery) {
  const { bodyText } = postgrestRequest("GET", pathWithQuery);
  if (!bodyText) return [];
  return JSON.parse(bodyText);
}

function remoteIsReachable() {
  postgrestRequest("GET", "memo?select=id&limit=1");
}

function remoteHasPlans() {
  const rows = getJson("daily_plan?select=id&limit=1");
  return Array.isArray(rows) && rows.length > 0;
}

function getRemoteMemoUidSet() {
  const rows = getJson("memo?select=uid");
  const set = new Set();
  for (const row of rows) {
    if (row && typeof row.uid === "string" && row.uid) {
      set.add(row.uid);
    }
  }
  return set;
}

function syncMemosByUid(totalMemos) {
  const remoteUids = getRemoteMemoUidSet();
  let inserted = 0;

  for (let i = 0; i < totalMemos; i += BATCH_SIZE) {
    const batch = loadMemoBatch(i, BATCH_SIZE);
    if (batch.length === 0) break;
    const newRows = batch.filter((row) => !remoteUids.has(row.uid));

    if (newRows.length > 0) {
      postgrestRequest("POST", "memo", newRows, "return=minimal");
      for (const row of newRows) remoteUids.add(row.uid);
      inserted += newRows.length;
    }

    console.log(
      `memo: ${i + 1}-${Math.min(i + batch.length, totalMemos)} 已处理, 新增 ${newRows.length} 条`
    );
  }

  console.log(`memo 同步完成: 新增 ${inserted} 条, 远端总 uid ${remoteUids.size} 条`);
}

function insertPlansIfEmpty(plans) {
  if (plans.length === 0) return;
  if (remoteHasPlans()) {
    console.log("daily_plan 远端已有数据，跳过计划写入以避免重复");
    return;
  }
  for (let i = 0; i < plans.length; i += BATCH_SIZE) {
    const batch = plans.slice(i, i + BATCH_SIZE);
    postgrestRequest("POST", "daily_plan", batch, "return=minimal");
    console.log(`daily_plan: ${i + 1}-${Math.min(i + BATCH_SIZE, plans.length)} 已写入`);
  }
}

async function main() {
  const { memoCount, planCount } = getLocalCounts();
  const plans = loadAllPlans();

  if (EXPORT_ONLY) {
    exportLocalData(memoCount, plans);
    console.log("已完成离线导出，不执行 Supabase 写入");
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("缺少 Supabase 环境变量: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  remoteIsReachable();

  console.log(`本地: memo=${memoCount}, daily_plan=${planCount}`);
  console.log("远端连通性检查通过");

  if (DRY_RUN) {
    console.log("dry-run 模式，不执行写入");
    return;
  }

  syncMemosByUid(memoCount);
  insertPlansIfEmpty(plans);
  console.log("迁移完成");
}

function exportLocalData(memoCount, plans) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const memoPath = path.join(EXPORT_DIR, "memo.migration.jsonl");
  const planPath = path.join(EXPORT_DIR, "daily_plan.migration.json");

  const memoWriter = fs.createWriteStream(memoPath, { flags: "w" });
  for (let i = 0; i < memoCount; i += BATCH_SIZE) {
    const batch = loadMemoBatch(i, BATCH_SIZE);
    for (const row of batch) {
      memoWriter.write(`${JSON.stringify(row)}\n`);
    }
  }
  memoWriter.end();
  fs.writeFileSync(planPath, JSON.stringify(plans, null, 2), "utf8");

  console.log(`导出完成: ${memoPath}`);
  console.log(`导出完成: ${planPath}`);
}

main().catch((err) => {
  console.error("迁移失败:", err);
  process.exit(1);
});
