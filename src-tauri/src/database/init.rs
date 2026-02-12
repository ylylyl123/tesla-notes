use rusqlite::{Connection, Result};
use std::path::PathBuf;

/// 获取数据库文件路径 - 固定存储在外接硬盘工作目录
pub fn get_db_path() -> PathBuf {
    // 使用固定的绝对路径，确保数据库位置一致
    PathBuf::from("/Volumes/T7/谷歌反重力/尝试项目/UI设计/笔记界面优化/tesla_notes.db")
}

/// 初始化数据库连接
pub fn init_db() -> Result<Connection> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;
    
    // 创建表
    create_tables(&conn)?;
    
    Ok(conn)
}

/// 创建所有必要的表
fn create_tables(conn: &Connection) -> Result<()> {
    // 笔记表 (简化版,无需用户系统)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS memo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uid TEXT NOT NULL UNIQUE,
            created_ts BIGINT NOT NULL,
            updated_ts BIGINT NOT NULL,
            category TEXT NOT NULL DEFAULT 'daily',
            target_date TEXT,
            completion_status TEXT NOT NULL DEFAULT 'pending',
            content TEXT NOT NULL DEFAULT '',
            pinned INTEGER NOT NULL DEFAULT 0,
            archived INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // 每日计划表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS daily_plan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_date TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            category TEXT DEFAULT 'daily',
            completed INTEGER NOT NULL DEFAULT 0,
            priority INTEGER DEFAULT 0,
            created_ts BIGINT NOT NULL,
            updated_ts BIGINT NOT NULL,
            completed_ts BIGINT
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_memo_category ON memo (category)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_memo_target_date ON memo (target_date)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_memo_created_ts ON memo (created_ts)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_daily_plan_date ON daily_plan (plan_date)",
        [],
    )?;

    Ok(())
}

/// 获取数据库连接
pub fn get_connection() -> Connection {
    init_db().expect("无法初始化数据库")
}
