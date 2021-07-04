(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 7549:
/***/ ((module) => {

module.exports = require("vscode");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __webpack_require__(7549);
// import { OfficeEditorProvider } from './provider/officeEditorProvider';
// import { OfficeViewerProvider } from './provider/officeViewerProvider';
// import { HtmlService } from './service/htmlService';
function activate(context) {
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
    config.update("workbench.colorTheme", "One Dark Modern", vscode.ConfigurationTarget.Global);
    // }
    // if (config.get("workbench.iconTheme") == 'vs-seti') {
    config.update("workbench.iconTheme", "office-material-icon-theme", vscode.ConfigurationTarget.Global);
    // }
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});