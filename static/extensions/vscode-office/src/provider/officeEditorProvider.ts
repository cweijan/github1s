// import { existsSync, mkdirSync, readFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
// import * as util from 'util';
import * as vscode from 'vscode';
import { Hanlder } from '../common/handler';
import { Util } from '../common/util';
import { readFileSync } from './fsAda';
// const streamPipeline = util.promisify(require('stream').pipeline);


/**
 * support view and edit office files.
 */
export class OfficeEditorProvider implements vscode.CustomTextEditorProvider {

    private extensionPath: string;

    constructor(private context: vscode.ExtensionContext) {
        this.extensionPath = context.extensionPath;
    }

    private getFolders(): vscode.Uri[] {
        const data = [];
        for (var i = 65; i <= 90; i++) {
            data.push(vscode.Uri.parse(`${String.fromCharCode(i)}:/`))
        }
        return data;
    }

    resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        console.log('custom')
        const uri = document.uri;
        const webview = webviewPanel.webview;
        const folderPath = vscode.Uri.joinPath(uri,'..')
        webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.parse("/"), ...this.getFolders()]
        }

        const ext = extname(uri.fsPath).toLowerCase()
        const handler = Hanlder.bind(webviewPanel, uri);
        switch (ext) {
            case ".puml":
            case ".plantuml":
            case ".pu":
                this.handlePuml(document, handler);
                break;
            case ".md":
                this.handleMarkdown(document, handler, folderPath)
                break;
        }

    }

    private async handlePuml(document: vscode.TextDocument, handler: Hanlder) {
        const uri = document.uri;
        handler.on("init", async () => {
            handler.emit("open", await readFileSync(uri, 'utf8'))
        }).on("save", (content) => {
            this.updateTextDocument(document, content)
        }).on("edit", () => {
            vscode.commands.executeCommand('vscode.openWith', uri, "default");
        }).on("doSave", () => {
            vscode.commands.executeCommand('workbench.action.files.save');
        }).on("codemirrorEdit", (content) => {
            this.updateTextDocumentByEdit(document, content)
        }).on("download", (content) => {
            // vscode.window.showSaveDialog({ title: "Select download path" }).then((downloadPath) => {
            //     if (downloadPath) {
            //         (async () => {
            //             vscode.window.showInformationMessage("Start downloading...", { model: true } as MessageOptions)
            //             const response = await fetch(content);
            //             if (response.ok) {
            //                 vscode.window.showInformationMessage("Download success!")
            //                 return streamPipeline(response.body, fs.createWriteStream(downloadPath.fsPath));
            //             }
            //             vscode.window.showErrorMessage(`unexpected response ${response.statusText}`)
            //         })();
            //     }
            // });
        })
        const webview = handler.panel.webview;
        // webview.html = Util.buildPath(await readFileSync(this.extensionPath + "/resource/plantuml/index.html", 'utf8'), webview, this.extensionPath + "/resource/plantuml");
    }

    private async handleMarkdown(document: vscode.TextDocument, handler: Hanlder, folderPath: vscode.Uri) {

        const uri = document.uri;
        const webview = handler.panel.webview;

        const content = await readFileSync(uri, 'utf8');

        handler.on("init", () => {
            handler.emit("open", {
                title: basename(uri.fsPath),
                content,
                folderPath: webview.asWebviewUri(folderPath).toString(),
                autoTheme: vscode.workspace.getConfiguration("vscode-office").get<boolean>("autoTheme"),
                viewAbsoluteLocal: vscode.workspace.getConfiguration("vscode-office").get<boolean>("viewAbsoluteLocal")
            })
        }).on("command", (command) => {
            vscode.commands.executeCommand(command)
        }).on("openLink", (uri) => {
            vscode.env.openExternal(vscode.Uri.parse(uri));
        }).on("img", (img) => {
            const fileName = `${new Date().getTime()}.png`;
            // const rePath = `image/${parse(uri.fsPath).name}/${fileName}`;
            // const imagePath = `${resolve(uri.fsPath, "..")}/${rePath}`.replace(/\\/g, "/");
            // const dir = dirname(imagePath)
            // if (!existsSync(dir)) {
            //     mkdirSync(dir, { recursive: true })
            // }
            // fs.writeFileSync(imagePath,  Buffer.from(img, 'binary'))
            // console.log(img)
            // vscode.env.clipboard.writeText(`![${fileName}](${rePath})`)
            // vscode.commands.executeCommand("editor.action.clipboardPasteAction")
        }).on("input", () => {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, new vscode.Range(document.lineCount, 0, document.lineCount, 0), "" + new Date().getTime());
            return vscode.workspace.applyEdit(edit);
        }).on("editInVSCode", () => {
            vscode.commands.executeCommand('vscode.openWith', uri, "default");
        }).on("save", (content) => {
            this.updateTextDocument(document, content)
        }).on("codemirrorEdit", (content) => {
            this.updateTextDocumentByEdit(document, content)
        }).on("doSave", async (content) => {
            if (content) {
                await this.updateTextDocument(document, content)
            }
            vscode.commands.executeCommand('workbench.action.files.save');
        })

        webview.html = this.markdownViewer(webview, folderPath);
    }
    markdownViewer(webview: vscode.Webview, folderPath: vscode.Uri) {
        return `<!DOCTYPE html>
        <html>
        
        <head>
            <meta charset='utf-8'>
            <meta http-equiv='X-UA-Compatible' content='IE=edge'>
            <title>Page Title</title>
            <meta name='viewport' content='width=device-width, initial-scale=1'>
            <link rel="stylesheet" href="http://127.0.0.1:8080/vscode-web/dist/extensions/vscode-office/resource/vditor/vditor.css" />
            <link rel="stylesheet" href="http://127.0.0.1:8080/vscode-web/dist/extensions/vscode-office/resource/vditor/index.css" />
            <base href="{{baseUrl}}/">
            <link rel="stylesheet" href="http://127.0.0.1:8080/vscode-web/dist/extensions/vscode-office/resource/vditor/../css/context_material.min.css">
            <link rel="stylesheet" href="http://127.0.0.1:8080/vscode-web/dist/extensions/vscode-office/resource/vditor/./css/content-theme/light.css">
        </head>
        
        <body>
            <div id="vditor"></div>
            <div class="dropdown-menu dropdown-menu-sm" id="context-menu" style="display: none;">
                <a class="dropdown-item" id="copy" href="#">Copy</a>
                <a class="dropdown-item" id="paste" href="#">Paste</a>
                <a class="dropdown-item" id="exportPdf" href="#">Export PDF</a>
                <a class="dropdown-item" id="exportHtml" href="#">Export HTML</a>
              </div>
        </body>
        <script src="http://127.0.0.1:8080/vscode-web/dist/extensions/vscode-office/resource/vditor/vditor.js"></script>
        <script src="http://127.0.0.1:8080/vscode-web/dist/extensions/vscode-office/resource/vditor/../js/vscode.js"></script>
        <script src="http://127.0.0.1:8080/vscode-web/dist/extensions/vscode-office/resource/vditor/index.js" type="module"></script>
        
        </html>`.replace("{{baseUrl}}", webview.asWebviewUri(folderPath).toString());
    }

    private updateTextDocument(document: vscode.TextDocument, content: any) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), content);
        return vscode.workspace.applyEdit(edit);
    }

    private updateTextDocumentByEdit(document: vscode.TextDocument, changed: any) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(changed.from.line, changed.from.ch, changed.to.line, changed.to.ch), changed.text.join('\n'));
        return vscode.workspace.applyEdit(edit);
    }

}