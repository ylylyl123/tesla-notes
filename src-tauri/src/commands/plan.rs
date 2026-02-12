use tauri::State;
use crate::commands::memo::DbState;
use crate::database::plan::{self, CreatePlanParams, DailyPlan};

/// 创建计划
#[tauri::command]
pub fn create_plan(
    db: State<DbState>,
    plan_date: String,
    title: String,
    description: Option<String>,
    category: Option<String>,
    priority: Option<i64>,
) -> Result<DailyPlan, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let params = CreatePlanParams {
        plan_date,
        title,
        description,
        category,
        priority,
    };
    
    plan::create_plan(&conn, params).map_err(|e| e.to_string())
}

/// 获取某日期的计划
#[tauri::command]
pub fn get_plans_by_date(db: State<DbState>, date: String) -> Result<Vec<DailyPlan>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    plan::get_plans_by_date(&conn, &date).map_err(|e| e.to_string())
}

/// 切换计划完成状态
#[tauri::command]
pub fn toggle_plan_status(db: State<DbState>, id: i64) -> Result<DailyPlan, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    plan::toggle_plan_completion(&conn, id).map_err(|e| e.to_string())
}

/// 删除计划
#[tauri::command]
pub fn delete_plan(db: State<DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    plan::delete_plan(&conn, id).map_err(|e| e.to_string())
}

/// 更新计划
#[tauri::command]
pub fn update_plan(
    db: State<DbState>,
    id: i64,
    title: Option<String>,
    description: Option<String>,
) -> Result<DailyPlan, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    plan::update_plan(&conn, id, title, description).map_err(|e| e.to_string())
}
