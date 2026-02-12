use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use chrono::Utc;

/// 每日计划结构体 (简化版)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DailyPlan {
    pub id: i64,
    pub plan_date: String,
    pub title: String,
    pub description: Option<String>,
    pub category: String,
    pub completed: bool,
    pub priority: i64,
    pub created_ts: i64,
    pub updated_ts: i64,
    pub completed_ts: Option<i64>,
}

/// 创建计划参数
#[derive(Debug, Deserialize)]
pub struct CreatePlanParams {
    pub plan_date: String,
    pub title: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub priority: Option<i64>,
}

/// 创建每日计划
pub fn create_plan(conn: &Connection, params: CreatePlanParams) -> Result<DailyPlan> {
    let now = Utc::now().timestamp();
    let category = params.category.unwrap_or_else(|| "daily".to_string());
    let priority = params.priority.unwrap_or(0);

    conn.execute(
        "INSERT INTO daily_plan (plan_date, title, description, category, priority, created_ts, updated_ts)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            params.plan_date,
            params.title,
            params.description,
            category,
            priority,
            now,
            now
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_plan_by_id(conn, id)
}

/// 根据 ID 获取计划
pub fn get_plan_by_id(conn: &Connection, id: i64) -> Result<DailyPlan> {
    conn.query_row(
        "SELECT id, plan_date, title, description, category, completed, priority,
                created_ts, updated_ts, completed_ts
         FROM daily_plan WHERE id = ?1",
        params![id],
        |row| {
            Ok(DailyPlan {
                id: row.get(0)?,
                plan_date: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                category: row.get(4)?,
                completed: row.get::<_, i64>(5)? != 0,
                priority: row.get(6)?,
                created_ts: row.get(7)?,
                updated_ts: row.get(8)?,
                completed_ts: row.get(9)?,
            })
        },
    )
}

fn row_to_plan(row: &rusqlite::Row) -> Result<DailyPlan> {
    Ok(DailyPlan {
        id: row.get(0)?,
        plan_date: row.get(1)?,
        title: row.get(2)?,
        description: row.get(3)?,
        category: row.get(4)?,
        completed: row.get::<_, i64>(5)? != 0,
        priority: row.get(6)?,
        created_ts: row.get(7)?,
        updated_ts: row.get(8)?,
        completed_ts: row.get(9)?,
    })
}

/// 获取某日期的计划列表
pub fn get_plans_by_date(conn: &Connection, date: &str) -> Result<Vec<DailyPlan>> {
    let mut stmt = conn.prepare(
        "SELECT id, plan_date, title, description, category, completed, priority,
                created_ts, updated_ts, completed_ts
         FROM daily_plan 
         WHERE plan_date = ?1
         ORDER BY priority DESC, created_ts ASC"
    )?;

    let plan_iter = stmt.query_map(params![date], row_to_plan)?;
    plan_iter.collect()
}

/// 切换计划完成状态
pub fn toggle_plan_completion(conn: &Connection, id: i64) -> Result<DailyPlan> {
    let plan = get_plan_by_id(conn, id)?;
    let now = Utc::now().timestamp();
    
    let (new_completed, completed_ts): (i64, Option<i64>) = if plan.completed {
        (0, None)
    } else {
        (1, Some(now))
    };

    conn.execute(
        "UPDATE daily_plan SET completed = ?1, completed_ts = ?2, updated_ts = ?3 WHERE id = ?4",
        params![new_completed, completed_ts, now, id],
    )?;

    get_plan_by_id(conn, id)
}

/// 删除计划
pub fn delete_plan(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM daily_plan WHERE id = ?1", params![id])?;
    Ok(())
}

/// 更新计划
pub fn update_plan(conn: &Connection, id: i64, title: Option<String>, description: Option<String>) -> Result<DailyPlan> {
    let now = Utc::now().timestamp();
    let plan = get_plan_by_id(conn, id)?;

    let new_title = title.unwrap_or(plan.title);
    let new_description = description.or(plan.description);

    conn.execute(
        "UPDATE daily_plan SET title = ?1, description = ?2, updated_ts = ?3 WHERE id = ?4",
        params![new_title, new_description, now, id],
    )?;

    get_plan_by_id(conn, id)
}
