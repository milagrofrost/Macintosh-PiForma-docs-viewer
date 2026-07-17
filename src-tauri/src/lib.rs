mod docs_cache;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            docs_cache::docs_status,
            docs_cache::read_cached_document,
            docs_cache::update_docs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Macintosh PiForma Docs Viewer");
}
