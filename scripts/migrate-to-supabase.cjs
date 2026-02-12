const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 配置
const MEMO_JSON_PATH = path.join(__dirname, '../memo.json');
const DAILY_PLAN_JSON_PATH = path.join(__dirname, '../daily_plan.json');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: 缺少 Supabase 环境变量 (VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateMemos() {
  console.log('开始迁移 Memo (笔记)...');

  if (!fs.existsSync(MEMO_JSON_PATH)) {
    console.warn('警告: 未找到 memo.json，跳过笔记迁移');
    return;
  }

  const rawData = fs.readFileSync(MEMO_JSON_PATH, 'utf-8');
  if (!rawData.trim()) {
    console.warn('警告: memo.json 为空，跳过笔记迁移');
    return;
  }

  let rows = [];
  try {
    rows = JSON.parse(rawData);
  } catch (e) {
    console.error('解析 memo.json 失败:', e);
    return;
  }

  console.log(`本地找到 ${rows.length} 条笔记`);

  const records = rows.map(row => ({
    uid: row.uid,
    created_ts: row.created_ts,
    updated_ts: row.updated_ts,
    category: row.category,
    target_date: row.target_date,
    completion_status: row.completion_status,
    content: row.content,
    pinned: row.pinned === 1,
    archived: row.archived === 1
  }));

  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('memo').insert(batch);
    if (error) {
      console.error('插入 memo 失败:', error);
      // continue or throw? throw to verify better
    }
    console.log(`已插入 Memo ${i + 1} - ${Math.min(i + BATCH_SIZE, records.length)}`);
  }
}

async function migrateDailyPlans() {
  console.log('开始迁移 Daily Plan (每日计划)...');

  if (!fs.existsSync(DAILY_PLAN_JSON_PATH)) {
    console.warn('警告: 未找到 daily_plan.json，跳过计划迁移');
    return;
  }

  const rawData = fs.readFileSync(DAILY_PLAN_JSON_PATH, 'utf-8');
  if (!rawData.trim()) {
    console.warn('警告: daily_plan.json 为空，跳过计划迁移');
    return;
  }

  let rows = [];
  try {
    rows = JSON.parse(rawData);
  } catch (e) {
    console.error('解析 daily_plan.json 失败:', e);
    return;
  }

  console.log(`本地找到 ${rows.length} 条每日计划`);

  const records = rows.map(row => ({
    plan_date: row.plan_date,
    title: row.title,
    description: row.description,
    category: row.category,
    completed: row.completed === 1,
    priority: row.priority,
    created_ts: row.created_ts,
    updated_ts: row.updated_ts,
    completed_ts: row.completed_ts
  }));

  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('daily_plan').insert(batch);
    if (error) {
      console.error('插入 daily_plan 失败:', error);
    }
    console.log(`已插入 Daily Plan ${i + 1} - ${Math.min(i + BATCH_SIZE, records.length)}`);
  }
}

async function run() {
  try {
    await migrateMemos();
    await migrateDailyPlans();
    console.log('✅ 所有数据迁移进程结束');
  } catch (err) {
    console.error('❌ 迁移流程错误:', err);
  }
}

run();
