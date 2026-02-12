use tauri::State;
use std::sync::Mutex;
use rusqlite::Connection;

use crate::database::memo::{self, CreateMemoParams, Memo, UpdateMemoParams};

/// 数据库连接状态
pub struct DbState(pub Mutex<Connection>);

/// 创建笔记
#[tauri::command]
pub fn create_memo(
    db: State<DbState>,
    content: String,
    category: Option<String>,
    target_date: Option<String>,
) -> Result<Memo, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let params = CreateMemoParams {
        content,
        category,
        target_date,
    };
    
    memo::create_memo(&conn, params).map_err(|e| e.to_string())
}

/// 获取笔记列表
#[tauri::command]
pub fn get_memos(
    db: State<DbState>,
    limit: Option<i64>,
    offset: Option<i64>,
    category: Option<String>,
) -> Result<Vec<Memo>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    memo::get_memos(
        &conn,
        limit.unwrap_or(50),
        offset.unwrap_or(0),
        category.as_deref(),
    )
    .map_err(|e| e.to_string())
}

/// 获取单个笔记
#[tauri::command]
pub fn get_memo(db: State<DbState>, id: i64) -> Result<Memo, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    memo::get_memo_by_id(&conn, id).map_err(|e| e.to_string())
}

/// 更新笔记
#[tauri::command]
pub fn update_memo(
    db: State<DbState>,
    id: i64,
    content: Option<String>,
    category: Option<String>,
    target_date: Option<String>,
    completion_status: Option<String>,
    pinned: Option<bool>,
    archived: Option<bool>,
) -> Result<Memo, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let params = UpdateMemoParams {
        content,
        category,
        target_date,
        completion_status,
        pinned,
        archived,
    };
    
    memo::update_memo(&conn, id, params).map_err(|e| e.to_string())
}

/// 删除笔记
#[tauri::command]
pub fn delete_memo(db: State<DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    memo::delete_memo(&conn, id).map_err(|e| e.to_string())
}

/// 搜索笔记
#[tauri::command]
pub fn search_memos(db: State<DbState>, query: String) -> Result<Vec<Memo>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    memo::search_memos(&conn, &query).map_err(|e| e.to_string())
}

/// 按日期获取笔记
#[tauri::command]
pub fn get_memos_by_date(db: State<DbState>, date: String) -> Result<Vec<Memo>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    memo::get_memos_by_date(&conn, &date).map_err(|e| e.to_string())
}

/// 切换完成状态
#[tauri::command]
pub fn toggle_memo_status(db: State<DbState>, id: i64) -> Result<Memo, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    memo::toggle_completion_status(&conn, id).map_err(|e| e.to_string())
}
