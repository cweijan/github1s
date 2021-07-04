import * as vscode from 'vscode';
// import { OfficeEditorProvider } from './provider/officeEditorProvider';
// import { OfficeViewerProvider } from './provider/officeViewerProvider';
// import { HtmlService } from './service/htmlService';
export function activate(context: vscode.ExtensionContext) {

	// const viewOption = { webviewOptions: { retainContextWhenHidden: true, enableFindWidget: true } };
	// const viewerInstance = new OfficeViewerProvider(context);
	// context.subscriptions.push(
	// 	vscode.commands.registerCommand('office.html.preview', HtmlService.previewHtml),
	// 	vscode.window.registerCustomEditorProvider("cweijan.markdownViewer", new OfficeEditorProvider(context), viewOption),
	// 	vscode.window.registerCustomEditorProvider("cweijan.officeViewer", viewerInstance, viewOption),
	// 	vscode.window.registerCustomEditorProvider("cweijan.htmlViewer", viewerInstance, viewOption),
	// );
	const config = vscode.workspace.getConfiguration();
	// if (config.get("workbench.colorTheme") == 'Default Light+') {
	  config.update("workbench.colorTheme", "One Dark Modern",vscode.ConfigurationTarget.Global)
	// }
	// if (config.get("workbench.iconTheme") == 'vs-seti') {
	  config.update("workbench.iconTheme", "office-material-icon-theme",vscode.ConfigurationTarget.Global)
	// }

}

export function deactivate() { }