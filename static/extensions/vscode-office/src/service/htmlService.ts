
import { basename, resolve } from "path";
import * as vscode from "vscode";
import { Util } from "../common/util";
import { readFileSync } from "../provider/fsAda";

export class HtmlService {

    public static async previewHtml(uri: vscode.Uri) {
        if (!uri) {
            uri = vscode.window.activeTextEditor.document.uri
        }
        const webviewPanel = vscode.window.createWebviewPanel("cwejan.viewHtml", 'preview', { viewColumn: vscode.ViewColumn.Two, preserveFocus: true }, { enableScripts: true })
        webviewPanel.webview.html = await readFileSync(uri, 'utf8'), webviewPanel.webview
        Util.listen(webviewPanel, uri, async () => {
            webviewPanel.webview.html = await readFileSync(uri, 'utf8'), webviewPanel.webview
        })
    }

}