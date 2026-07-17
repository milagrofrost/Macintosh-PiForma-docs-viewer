use serde::{Deserialize, Serialize};
use std::{fs, path::{Component, Path, PathBuf}};
use tauri::{AppHandle, Manager};

const DOCS: &[&str] = &[
    "README.md",
    "docs/hardware.md",
    "docs/software.md",
    "docs/wiring.md",
    "docs/build-log.md",
    "docs/maintenance.md",
    "docs/known-issues.md",
    "docs/related-projects.md",
];
const REPO: &str = "milagrofrost/Macintosh-PiForma-docs";
const BRANCH: &str = "main";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CacheManifest {
    pub repository: String,
    pub branch: String,
    pub commit: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocsStatus {
    pub source: &'static str,
    pub commit: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateResult {
    pub updated: bool,
    pub commit: String,
    pub updated_at: String,
    pub files: usize,
}

#[derive(Deserialize)]
struct GitHubCommit { sha: String }

fn cache_root(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map(|path| path.join("docs-cache")).map_err(|error| error.to_string())
}

fn safe_relative(path: &str) -> Result<&Path, String> {
    let path = Path::new(path);
    if path.is_absolute() || path.components().any(|part| matches!(part, Component::ParentDir | Component::RootDir | Component::Prefix(_))) {
        return Err("invalid documentation path".into());
    }
    if !DOCS.iter().any(|allowed| Path::new(allowed) == path) {
        return Err("documentation path is not in the viewer manifest".into());
    }
    Ok(path)
}

fn read_manifest(root: &Path) -> Option<CacheManifest> {
    fs::read_to_string(root.join("manifest.json")).ok().and_then(|text| serde_json::from_str(&text).ok())
}

#[tauri::command]
pub fn docs_status(app: AppHandle) -> Result<DocsStatus, String> {
    let root = cache_root(&app)?;
    let manifest = read_manifest(&root);
    Ok(match manifest {
        Some(value) => DocsStatus { source: "cache", commit: Some(value.commit), updated_at: Some(value.updated_at) },
        None => DocsStatus { source: "bundled", commit: None, updated_at: None },
    })
}

#[tauri::command]
pub fn read_cached_document(app: AppHandle, path: String) -> Result<Option<String>, String> {
    let relative = safe_relative(&path)?;
    let root = cache_root(&app)?;
    if read_manifest(&root).is_none() { return Ok(None); }
    match fs::read_to_string(root.join(relative)) {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub async fn update_docs(app: AppHandle) -> Result<UpdateResult, String> {
    let client = reqwest::Client::builder()
        .user_agent("Macintosh-PiForma-docs-viewer")
        .timeout(std::time::Duration::from_secs(20))
        .build().map_err(|error| error.to_string())?;

    let commit: GitHubCommit = client
        .get(format!("https://api.github.com/repos/{REPO}/commits/{BRANCH}"))
        .send().await.map_err(|error| error.to_string())?
        .error_for_status().map_err(|error| error.to_string())?
        .json().await.map_err(|error| error.to_string())?;

    let root = cache_root(&app)?;
    if let Some(current) = read_manifest(&root) {
        if current.commit == commit.sha && DOCS.iter().all(|path| root.join(path).is_file()) {
            return Ok(UpdateResult { updated: false, commit: current.commit, updated_at: current.updated_at, files: DOCS.len() });
        }
    }

    let parent = root.parent().ok_or("invalid cache directory")?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    let next = parent.join("docs-cache-next");
    let old = parent.join("docs-cache-old");
    let _ = fs::remove_dir_all(&next);
    let _ = fs::remove_dir_all(&old);
    fs::create_dir_all(&next).map_err(|error| error.to_string())?;

    for path in DOCS {
        let url = format!("https://raw.githubusercontent.com/{REPO}/{}/{path}", commit.sha);
        let text = client.get(url).send().await.map_err(|error| error.to_string())?
            .error_for_status().map_err(|error| error.to_string())?
            .text().await.map_err(|error| error.to_string())?;
        let destination = next.join(path);
        if let Some(directory) = destination.parent() { fs::create_dir_all(directory).map_err(|error| error.to_string())?; }
        fs::write(destination, text).map_err(|error| error.to_string())?;
    }

    let updated_at = chrono::Utc::now().to_rfc3339();
    let manifest = CacheManifest { repository: REPO.into(), branch: BRANCH.into(), commit: commit.sha.clone(), updated_at: updated_at.clone() };
    fs::write(next.join("manifest.json"), serde_json::to_vec_pretty(&manifest).map_err(|error| error.to_string())?).map_err(|error| error.to_string())?;

    if root.exists() { fs::rename(&root, &old).map_err(|error| error.to_string())?; }
    if let Err(error) = fs::rename(&next, &root) {
        if old.exists() { let _ = fs::rename(&old, &root); }
        return Err(error.to_string());
    }
    let _ = fs::remove_dir_all(old);

    Ok(UpdateResult { updated: true, commit: commit.sha, updated_at, files: DOCS.len() })
}
