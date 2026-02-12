use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

/// 笔记结构体 (简化版)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Memo {
    pub id: i64,
    pub uid: String,
    pub created_ts: i64,
    pub updated_ts: i64,
    pub category: String,
    pub target_date: Option<String>,
    pub completion_status: String,
    pub content: String,
    pub pinned: bool,
    pub archived: bool,
}

/// 创建笔记参数
#[derive(Debug, Deserialize)]
pub struct CreateMemoParams {
    pub content: String,
    pub category: Option<String>,
    pub target_date: Option<String>,
}

/// 更新笔记参数
#[derive(Debug, Deserialize)]
pub struct UpdateMemoParams {
    pub content: Option<String>,
    pub category: Option<String>,
    pub target_date: Option<String>,
    pub completion_status: Option<String>,
    pub pinned: Option<bool>,
    pub archived: Option<bool>,
}

/// 创建笔记
pub fn create_memo(conn: &Connection, params: CreateMemoParams) -> Result<Memo> {
    let uid = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    let category = params.category.unwrap_or_else(|| "daily".to_string());

    // 始终使用当前实际时间作为创建时间戳
    let created_ts = now;

    conn.execute(
        "INSERT INTO memo (uid, created_ts, updated_ts, category, target_date, content)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![uid, created_ts, now, category, params.target_date, params.content],
    )?;

    let id = conn.last_insert_rowid();
    get_memo_by_id(conn, id)
}

/// 根据 ID 获取笔记
pub fn get_memo_by_id(conn: &Connection, id: i64) -> Result<Memo> {
    conn.query_row(
        "SELECT id, uid, created_ts, updated_ts, category, target_date, 
                completion_status, content, pinned, archived
         FROM memo WHERE id = ?1",
        params![id],
        |row| {
            Ok(Memo {
                id: row.get(0)?,
                uid: row.get(1)?,
                created_ts: row.get(2)?,
                updated_ts: row.get(3)?,
                category: row.get(4)?,
                target_date: row.get(5)?,
                completion_status: row.get(6)?,
                content: row.get(7)?,
                pinned: row.get::<_, i64>(8)? != 0,
                archived: row.get::<_, i64>(9)? != 0,
            })
        },
    )
}

/// 获取笔记列表
pub fn get_memos(
    conn: &Connection,
    limit: i64,
    offset: i64,
    category: Option<&str>,
) -> Result<Vec<Memo>> {
    let sql = match category {
        Some(_) => "SELECT id, uid, created_ts, updated_ts, category, target_date,
                    completion_status, content, pinned, archived
                    FROM memo WHERE archived = 0 AND category = ?3
                    ORDER BY pinned DESC, created_ts DESC LIMIT ?1 OFFSET ?2",
        None => "SELECT id, uid, created_ts, updated_ts, category, target_date,
                 completion_status, content, pinned, archived
                 FROM memo WHERE archived = 0
                 ORDER BY pinned DESC, created_ts DESC LIMIT ?1 OFFSET ?2",
    };

    let mut stmt = conn.prepare(sql)?;
    
    let memo_iter = if let Some(cat) = category {
        stmt.query_map(params![limit, offset, cat], row_to_memo)?
    } else {
        stmt.query_map(params![limit, offset], row_to_memo)?
    };

    memo_iter.collect()
}

fn row_to_memo(row: &rusqlite::Row) -> Result<Memo> {
    Ok(Memo {
        id: row.get(0)?,
        uid: row.get(1)?,
        created_ts: row.get(2)?,
        updated_ts: row.get(3)?,
        category: row.get(4)?,
        target_date: row.get(5)?,
        completion_status: row.get(6)?,
        content: row.get(7)?,
        pinned: row.get::<_, i64>(8)? != 0,
        archived: row.get::<_, i64>(9)? != 0,
    })
}

/// 更新笔记
pub fn update_memo(conn: &Connection, id: i64, params: UpdateMemoParams) -> Result<Memo> {
    let now = Utc::now().timestamp();
    let memo = get_memo_by_id(conn, id)?;

    let content = params.content.unwrap_or(memo.content);
    let category = params.category.unwrap_or(memo.category);
    let target_date = params.target_date.or(memo.target_date);
    let completion_status = params.completion_status.unwrap_or(memo.completion_status);
    let pinned = params.pinned.unwrap_or(memo.pinned);
    let archived = params.archived.unwrap_or(memo.archived);

    conn.execute(
        "UPDATE memo SET content = ?1, category = ?2, target_date = ?3, 
         completion_status = ?4, pinned = ?5, archived = ?6, updated_ts = ?7
         WHERE id = ?8",
        params![
            content, category, target_date,
            completion_status, pinned as i64, archived as i64, now, id
        ],
    )?;

    get_memo_by_id(conn, id)
}

/// 删除笔记
pub fn delete_memo(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM memo WHERE id = ?1", params![id])?;
    Ok(())
}

/// 搜索笔记
pub fn search_memos(conn: &Connection, query: &str) -> Result<Vec<Memo>> {
    let search_pattern = format!("%{}%", query);
    
    let mut stmt = conn.prepare(
        "SELECT id, uid, created_ts, updated_ts, category, target_date,
                completion_status, content, pinned, archived
         FROM memo 
         WHERE content LIKE ?1 AND archived = 0
         ORDER BY created_ts DESC
         LIMIT 50"
    )?;

    let memo_iter = stmt.query_map(params![search_pattern], row_to_memo)?;
    memo_iter.collect()
}

/// 按日期获取笔记
pub fn get_memos_by_date(conn: &Connection, date: &str) -> Result<Vec<Memo>> {
    let mut stmt = conn.prepare(
        "SELECT id, uid, created_ts, updated_ts, category, target_date,
                completion_status, content, pinned, archived
         FROM memo 
         WHERE (target_date = ?1 OR DATE(created_ts, 'unixepoch', 'localtime') = ?1)
         AND archived = 0
         ORDER BY pinned DESC, created_ts DESC"
    )?;

    let memo_iter = stmt.query_map(params![date], row_to_memo)?;
    memo_iter.collect()
}

/// 切换完成状态
pub fn toggle_completion_status(conn: &Connection, id: i64) -> Result<Memo> {
    let memo = get_memo_by_id(conn, id)?;
    
    let new_status = match memo.completion_status.as_str() {
        "pending" => "completed",
        "completed" => "incomplete",
        "incomplete" => "pending",
        _ => "pending",
    };

    let now = Utc::now().timestamp();
    conn.execute(
        "UPDATE memo SET completion_status = ?1, updated_ts = ?2 WHERE id = ?3",
        params![new_status, now, id],
    )?;

    get_memo_by_id(conn, id)
}
