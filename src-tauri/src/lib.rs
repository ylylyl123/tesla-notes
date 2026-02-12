// Tesla Notes - 轻量级笔记应用
// 基于 Tauri + React + SQLite (简化版,无用户系统)

mod database;
mod commands;

use std::sync::Mutex;
use commands::memo::DbState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化数据库
    let conn = database::init_db().expect("无法初始化数据库");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DbState(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            // 笔记命令
            commands::memo::create_memo,
            commands::memo::get_memos,
            commands::memo::get_memo,
            commands::memo::update_memo,
            commands::memo::delete_memo,
            commands::memo::search_memos,
            commands::memo::get_memos_by_date,
            commands::memo::toggle_memo_status,
            // 计划命令
            commands::plan::create_plan,
            commands::plan::get_plans_by_date,
            commands::plan::toggle_plan_status,
            commands::plan::delete_plan,
            commands::plan::update_plan,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
