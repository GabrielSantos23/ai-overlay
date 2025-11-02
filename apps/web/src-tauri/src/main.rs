use tauri::Emitter;
use tauri::Listener;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri::Manager;
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[tauri::command]
fn show_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    println!("[show_overlay_window] Attempting to show overlay window");
    
    // List all available windows for debugging
    let all_windows = app.webview_windows();
    println!("[show_overlay_window] Available windows: {:?}", all_windows.keys().collect::<Vec<_>>());
    
    // Try to get the existing window by label
    if let Some(window) = app.get_webview_window("ai-overlay") {
        println!("[show_overlay_window] Found existing overlay window, showing it");
        window.show().map_err(|e| {
            let err_msg = format!("Failed to show window: {}", e);
            eprintln!("[show_overlay_window] Error: {}", err_msg);
            err_msg
        })?;
        
        // Also ensure it's focused and on top
        let _ = window.set_focus();
        println!("[show_overlay_window] Overlay window shown successfully");
        Ok(())
    } else {
        let err_msg = format!(
            "Overlay window 'ai-overlay' not found. Available windows: {:?}. Make sure the window label in tauri.conf.json matches 'ai-overlay'.",
            all_windows.keys().collect::<Vec<_>>()
        );
        eprintln!("[show_overlay_window] Error: {}", err_msg);
        Err(err_msg)
    }
}

#[tauri::command]
fn hide_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("ai-overlay") {
        window.hide().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Overlay window not found".to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct TokenResponse {
    access_token: String,
    token_type: Option<String>,
    expires_in: Option<u64>,
    refresh_token: Option<String>,
    scope: Option<String>,
}

// Exchange authorization code for access token
#[tauri::command]
async fn exchange_code_for_token(
    provider: String,
    code: String,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
) -> Result<TokenResponse, String> {
    let token_url = match provider.as_str() {
        "google" => "https://oauth2.googleapis.com/token",
        "github" => "https://github.com/login/oauth/access_token",
        _ => return Err(format!("Unsupported provider: {}", provider)),
    };

    let mut params = HashMap::new();
    params.insert("grant_type", "authorization_code");
    params.insert("code", &code);
    params.insert("client_id", &client_id);
    params.insert("redirect_uri", &redirect_uri);

    let client = reqwest::Client::new();
    let mut request = client.post(token_url);

    if provider == "github" {
        // GitHub expects client_id and client_secret in Basic Auth or form data
        request = request.basic_auth(&client_id, Some(&client_secret));
        request = request.form(&params);
    } else {
        // Google expects client_secret in form data
        params.insert("client_secret", &client_secret);
        request = request.form(&params);
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Failed to send token request: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!(
            "Token exchange failed ({}): {}",
            status, error_text
        ));
    }

    let text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    // GitHub returns form-urlencoded, Google returns JSON
    let token_response = if provider == "github" {
        // Parse form-urlencoded response
        let mut access_token = None;
        let mut scope = None;
        let mut token_type = None;

        for pair in text.split('&') {
            let parts: Vec<&str> = pair.splitn(2, '=').collect();
            if parts.len() == 2 {
                let key = parts[0];
                let value = urlencoding::decode(parts[1])
                    .map(|v| v.to_string())
                    .unwrap_or_else(|_| parts[1].to_string());

                match key {
                    "access_token" => access_token = Some(value),
                    "scope" => scope = Some(value),
                    "token_type" => token_type = Some(value),
                    _ => {}
                }
            }
        }

        TokenResponse {
            access_token: access_token.ok_or_else(|| "No access_token in response".to_string())?,
            token_type,
            expires_in: None,
            refresh_token: None,
            scope,
        }
    } else {
        // Parse JSON response
        serde_json::from_str(&text).map_err(|e| format!("Failed to parse token response: {}", e))?
    };

    Ok(token_response)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            println!("Single instance callback - argv: {:?}", argv);
            
            if argv.len() > 1 {
                let url = &argv[1];
                println!("Received URL from single instance: {}", url);
                
                // Check if this is a deep link
                if url.starts_with("myapp://") {
                    println!("Deep link detected, emitting to frontend: {}", url);
                    
                    // Emit as an array to match the expected format
                    let urls = vec![url.clone()];
                    
                    // Try multiple event names to ensure it's caught
                    if let Err(e) = app.emit("deep-link-received", &urls) {
                        eprintln!("Failed to emit deep-link-received: {}", e);
                    }
                    
                    if let Err(e) = app.emit("oauth-callback", url) {
                        eprintln!("Failed to emit oauth-callback: {}", e);
                    }
                    
                    if let Err(e) = app.emit("session-token", url) {
                        eprintln!("Failed to emit session-token: {}", e);
                    }
                    
                    println!("Events emitted successfully");
                } else if url.contains("login") {
                    let _ = app.emit("session-token", url);
                }
            }
        }))
        .invoke_handler(tauri::generate_handler![exchange_code_for_token])
        .invoke_handler(tauri::generate_handler![
            show_overlay_window,
            hide_overlay_window
        ])
        .setup(|app| {
            println!("Tauri app initialized");

            let app_handle = app.handle().clone();

            // Register deep link protocol
            app.deep_link().register_all()?;
            println!("Deep link protocol registered");

            // Listen for deep link events from the plugin
            let app_handle_for_deep_link = app_handle.clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls();
                println!("Deep link received via on_open_url: {:?}", urls);

                // Emit to frontend
                if let Err(e) = app_handle_for_deep_link.emit("deep-link-received", urls) {
                    eprintln!("Failed to emit deep-link-received: {}", e);
                } else {
                    println!("Successfully emitted deep-link-received event");
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}