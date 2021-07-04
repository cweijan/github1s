import { extname, resolve } from 'path';
import * as vscode from 'vscode';
import { Hanlder } from '../common/handler';
import { Util } from '../common/util';
import { readFileSync } from './fsAda';

/**
 * support view office files
 */
export class OfficeViewerProvider implements vscode.CustomReadonlyEditorProvider {

    private extensionPath: string;

    constructor(private context: vscode.ExtensionContext) {
        this.extensionPath = context.extensionPath;
    }

    public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
        return { uri, dispose: (): void => { } };
    }
    public async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken):  Promise<void> {
        const uri = document.uri;
        const webview = webviewPanel.webview;
        webview.options = {
            enableScripts: true,
        }

        const ext = extname(uri.fsPath).toLowerCase()
        let htmlPath: string | null = null;

        const handler = Hanlder.bind(webviewPanel, uri);

        switch (ext) {
            case ".svg":
                this.handleSvg(uri, webview);
                break;
            case ".pdf":
                this.handlePdf(uri, webview);
                handler.on("fileChange", () => {
                    this.handlePdf(uri, webview);
                })
                break;
            default:
                vscode.commands.executeCommand('vscode.openWith', uri, "default");
        }
    }

    private handlePdf(uri: vscode.Uri, webview: vscode.Webview) {
        webview.html = Util.buildPath(
            this.pdfHtml().replace("{{content}}",
                JSON.stringify({
                    path: webview.asWebviewUri(uri).with({ query: `nonce=${Date.now().toString()}` }).toString(),
                    defaults: {
                        cursor: "select",
                        scale: "auto",
                        sidebar: true,
                        scrollMode: "vertical",
                        spreadMode: "none",
                    },
                }).replace(/"/g, '&quot;')
            ),
            webview, this.extensionPath + "/resource/pdf"
        );
    }

    private pdfHtml(){
        return `<!DOCTYPE html>
        <html dir="ltr" mozdisallowselectionprint>
        
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
          <meta name="google" content="notranslate">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta id="pdf-preview-config" data-config="{{content}}">
          <title>PDF.js viewer</title>
          <link rel="stylesheet" href="viewer.css">
          <link rel="resource" type="application/l10n" href="locale/locale.properties">
          <script src="pdf.worker.js"></script>
          <script src="pdf.js"></script>
          <script src="viewer.js"></script>
          <script src="main.js"></script>
        </head>
        
        <body tabindex="1">
          <div id="outerContainer">
        
            <div id="sidebarContainer">
              <div id="toolbarSidebar">
                <div class="splitToolbarButton toggled">
                  <button id="viewThumbnail" class="toolbarButton toggled" title="Show Thumbnails" tabindex="2"
                    data-l10n-id="thumbs">
                    <span data-l10n-id="thumbs_label">Thumbnails</span>
                  </button>
                  <button id="viewOutline" class="toolbarButton"
                    title="Show Document Outline (double-click to expand/collapse all items)" tabindex="3"
                    data-l10n-id="document_outline">
                    <span data-l10n-id="document_outline_label">Document Outline</span>
                  </button>
                  <button id="viewAttachments" class="toolbarButton" title="Show Attachments" tabindex="4"
                    data-l10n-id="attachments">
                    <span data-l10n-id="attachments_label">Attachments</span>
                  </button>
                  <button id="viewLayers" class="toolbarButton"
                    title="Show Layers (double-click to reset all layers to the default state)" tabindex="5"
                    data-l10n-id="layers">
                    <span data-l10n-id="layers_label">Layers</span>
                  </button>
                </div>
              </div>
              <div id="sidebarContent">
                <div id="thumbnailView">
                </div>
                <div id="outlineView" class="hidden">
                </div>
                <div id="attachmentsView" class="hidden">
                </div>
                <div id="layersView" class="hidden">
                </div>
              </div>
              <div id="sidebarResizer"></div>
            </div> <!-- sidebarContainer -->
        
            <div id="mainContainer">
              <div class="findbar hidden doorHanger" id="findbar">
                <div id="findbarInputContainer">
                  <input id="findInput" class="toolbarField" title="Find" placeholder="Find in document…" tabindex="91"
                    data-l10n-id="find_input">
                  <div class="splitToolbarButton">
                    <button id="findPrevious" class="toolbarButton findPrevious"
                      title="Find the previous occurrence of the phrase" tabindex="92" data-l10n-id="find_previous">
                      <span data-l10n-id="find_previous_label">Previous</span>
                    </button>
                    <div class="splitToolbarButtonSeparator"></div>
                    <button id="findNext" class="toolbarButton findNext" title="Find the next occurrence of the phrase"
                      tabindex="93" data-l10n-id="find_next">
                      <span data-l10n-id="find_next_label">Next</span>
                    </button>
                  </div>
                </div>
        
                <div id="findbarOptionsOneContainer">
                  <input type="checkbox" id="findHighlightAll" class="toolbarField" tabindex="94">
                  <label for="findHighlightAll" class="toolbarLabel" data-l10n-id="find_highlight">Highlight all</label>
                  <input type="checkbox" id="findMatchCase" class="toolbarField" tabindex="95">
                  <label for="findMatchCase" class="toolbarLabel" data-l10n-id="find_match_case_label">Match case</label>
                </div>
                <div id="findbarOptionsTwoContainer">
                  <input type="checkbox" id="findEntireWord" class="toolbarField" tabindex="96">
                  <label for="findEntireWord" class="toolbarLabel" data-l10n-id="find_entire_word_label">Whole words</label>
                  <span id="findResultsCount" class="toolbarLabel hidden"></span>
                </div>
        
                <div id="findbarMessageContainer">
                  <span id="findMsg" class="toolbarLabel"></span>
                </div>
              </div> <!-- findbar -->
        
              <div id="secondaryToolbar" class="secondaryToolbar hidden doorHangerRight">
                <div id="secondaryToolbarButtonContainer">
                  <button id="secondaryPresentationMode" class="secondaryToolbarButton presentationMode visibleLargeView"
                    title="Switch to Presentation Mode" tabindex="51" data-l10n-id="presentation_mode">
                    <span data-l10n-id="presentation_mode_label">Presentation Mode</span>
                  </button>
        
                  <button id="secondaryOpenFile" class="secondaryToolbarButton openFile visibleLargeView" title="Open File"
                    tabindex="52" data-l10n-id="open_file">
                    <span data-l10n-id="open_file_label">Open</span>
                  </button>
        
                  <button id="secondaryPrint" class="secondaryToolbarButton print visibleMediumView" title="Print" tabindex="53"
                    data-l10n-id="print">
                    <span data-l10n-id="print_label">Print</span>
                  </button>
        
                  <button id="secondaryDownload" class="secondaryToolbarButton download visibleMediumView" title="Download"
                    tabindex="54" data-l10n-id="download">
                    <span data-l10n-id="download_label">Download</span>
                  </button>
        
                  <a href="#" id="secondaryViewBookmark" class="secondaryToolbarButton bookmark visibleSmallView"
                    title="Current view (copy or open in new window)" tabindex="55" data-l10n-id="bookmark">
                    <span data-l10n-id="bookmark_label">Current View</span>
                  </a>
        
                  <div class="horizontalToolbarSeparator visibleLargeView"></div>
        
                  <button id="firstPage" class="secondaryToolbarButton firstPage" title="Go to First Page" tabindex="56"
                    data-l10n-id="first_page">
                    <span data-l10n-id="first_page_label">Go to First Page</span>
                  </button>
                  <button id="lastPage" class="secondaryToolbarButton lastPage" title="Go to Last Page" tabindex="57"
                    data-l10n-id="last_page">
                    <span data-l10n-id="last_page_label">Go to Last Page</span>
                  </button>
        
                  <div class="horizontalToolbarSeparator"></div>
        
                  <button id="pageRotateCw" class="secondaryToolbarButton rotateCw" title="Rotate Clockwise" tabindex="58"
                    data-l10n-id="page_rotate_cw">
                    <span data-l10n-id="page_rotate_cw_label">Rotate Clockwise</span>
                  </button>
                  <button id="pageRotateCcw" class="secondaryToolbarButton rotateCcw" title="Rotate Counterclockwise"
                    tabindex="59" data-l10n-id="page_rotate_ccw">
                    <span data-l10n-id="page_rotate_ccw_label">Rotate Counterclockwise</span>
                  </button>
        
                  <div class="horizontalToolbarSeparator"></div>
        
                  <button id="cursorSelectTool" class="secondaryToolbarButton selectTool toggled"
                    title="Enable Text Selection Tool" tabindex="60" data-l10n-id="cursor_text_select_tool">
                    <span data-l10n-id="cursor_text_select_tool_label">Text Selection Tool</span>
                  </button>
                  <button id="cursorHandTool" class="secondaryToolbarButton handTool" title="Enable Hand Tool" tabindex="61"
                    data-l10n-id="cursor_hand_tool">
                    <span data-l10n-id="cursor_hand_tool_label">Hand Tool</span>
                  </button>
        
                  <div class="horizontalToolbarSeparator"></div>
        
                  <button id="scrollVertical" class="secondaryToolbarButton scrollModeButtons scrollVertical toggled"
                    title="Use Vertical Scrolling" tabindex="62" data-l10n-id="scroll_vertical">
                    <span data-l10n-id="scroll_vertical_label">Vertical Scrolling</span>
                  </button>
                  <button id="scrollHorizontal" class="secondaryToolbarButton scrollModeButtons scrollHorizontal"
                    title="Use Horizontal Scrolling" tabindex="63" data-l10n-id="scroll_horizontal">
                    <span data-l10n-id="scroll_horizontal_label">Horizontal Scrolling</span>
                  </button>
                  <button id="scrollWrapped" class="secondaryToolbarButton scrollModeButtons scrollWrapped"
                    title="Use Wrapped Scrolling" tabindex="64" data-l10n-id="scroll_wrapped">
                    <span data-l10n-id="scroll_wrapped_label">Wrapped Scrolling</span>
                  </button>
        
                  <div class="horizontalToolbarSeparator scrollModeButtons"></div>
        
                  <button id="spreadNone" class="secondaryToolbarButton spreadModeButtons spreadNone toggled"
                    title="Do not join page spreads" tabindex="65" data-l10n-id="spread_none">
                    <span data-l10n-id="spread_none_label">No Spreads</span>
                  </button>
                  <button id="spreadOdd" class="secondaryToolbarButton spreadModeButtons spreadOdd"
                    title="Join page spreads starting with odd-numbered pages" tabindex="66" data-l10n-id="spread_odd">
                    <span data-l10n-id="spread_odd_label">Odd Spreads</span>
                  </button>
                  <button id="spreadEven" class="secondaryToolbarButton spreadModeButtons spreadEven"
                    title="Join page spreads starting with even-numbered pages" tabindex="67" data-l10n-id="spread_even">
                    <span data-l10n-id="spread_even_label">Even Spreads</span>
                  </button>
        
                  <div class="horizontalToolbarSeparator spreadModeButtons"></div>
        
                  <button id="documentProperties" class="secondaryToolbarButton documentProperties" title="Document Properties…"
                    tabindex="68" data-l10n-id="document_properties">
                    <span data-l10n-id="document_properties_label">Document Properties…</span>
                  </button>
                </div>
              </div> <!-- secondaryToolbar -->
        
              <div class="toolbar">
                <div id="toolbarContainer">
                  <div id="toolbarViewer">
                    <div id="toolbarViewerLeft">
                      <button id="sidebarToggle" class="toolbarButton" title="Toggle Sidebar" tabindex="11"
                        data-l10n-id="toggle_sidebar">
                        <span data-l10n-id="toggle_sidebar_label">Toggle Sidebar</span>
                      </button>
                      <div class="toolbarButtonSpacer"></div>
                      <button id="viewFind" class="toolbarButton" title="Find in Document" tabindex="12" data-l10n-id="findbar">
                        <span data-l10n-id="findbar_label">Find</span>
                      </button>
                      <div class="splitToolbarButton hiddenSmallView">
                        <button class="toolbarButton pageUp" title="Previous Page" id="previous" tabindex="13"
                          data-l10n-id="previous">
                          <span data-l10n-id="previous_label">Previous</span>
                        </button>
                        <div class="splitToolbarButtonSeparator"></div>
                        <button class="toolbarButton pageDown" title="Next Page" id="next" tabindex="14" data-l10n-id="next">
                          <span data-l10n-id="next_label">Next</span>
                        </button>
                      </div>
                      <input type="number" id="pageNumber" class="toolbarField pageNumber" title="Page" value="1" size="4"
                        min="1" tabindex="15" data-l10n-id="page" autocomplete="off">
                      <span id="numPages" class="toolbarLabel"></span>
                    </div>
                    <div id="toolbarViewerRight">
                      <button id="presentationMode" class="toolbarButton presentationMode hiddenLargeView"
                        title="Switch to Presentation Mode" tabindex="31" data-l10n-id="presentation_mode">
                        <span data-l10n-id="presentation_mode_label">Presentation Mode</span>
                      </button>
        
                      <button id="openFile" class="toolbarButton openFile hiddenLargeView" title="Open File" tabindex="32"
                        data-l10n-id="open_file">
                        <span data-l10n-id="open_file_label">Open</span>
                      </button>
        
                      <button id="print" class="toolbarButton print hiddenMediumView" title="Print" tabindex="33"
                        data-l10n-id="print">
                        <span data-l10n-id="print_label">Print</span>
                      </button>
        
                      <button id="download" class="toolbarButton download hiddenMediumView" title="Download" tabindex="34"
                        data-l10n-id="download">
                        <span data-l10n-id="download_label">Download</span>
                      </button>
                      <a href="#" id="viewBookmark" class="toolbarButton bookmark hiddenSmallView"
                        title="Current view (copy or open in new window)" tabindex="35" data-l10n-id="bookmark">
                        <span data-l10n-id="bookmark_label">Current View</span>
                      </a>
        
                      <div class="verticalToolbarSeparator hiddenSmallView"></div>
        
                      <button id="secondaryToolbarToggle" class="toolbarButton" title="Tools" tabindex="36"
                        data-l10n-id="tools">
                        <span data-l10n-id="tools_label">Tools</span>
                      </button>
                    </div>
                    <div id="toolbarViewerMiddle">
                      <div class="splitToolbarButton">
                        <button id="zoomOut" class="toolbarButton zoomOut" title="Zoom Out" tabindex="21"
                          data-l10n-id="zoom_out">
                          <span data-l10n-id="zoom_out_label">Zoom Out</span>
                        </button>
                        <div class="splitToolbarButtonSeparator"></div>
                        <button id="zoomIn" class="toolbarButton zoomIn" title="Zoom In" tabindex="22" data-l10n-id="zoom_in">
                          <span data-l10n-id="zoom_in_label">Zoom In</span>
                        </button>
                      </div>
                      <span id="scaleSelectContainer" class="dropdownToolbarButton">
                        <select id="scaleSelect" title="Zoom" tabindex="23" data-l10n-id="zoom">
                          <option id="pageAutoOption" title="" value="auto" selected="selected" data-l10n-id="page_scale_auto">
                            Automatic Zoom</option>
                          <option id="pageActualOption" title="" value="page-actual" data-l10n-id="page_scale_actual">Actual
                            Size</option>
                          <option id="pageFitOption" title="" value="page-fit" data-l10n-id="page_scale_fit">Page Fit</option>
                          <option id="pageWidthOption" title="" value="page-width" data-l10n-id="page_scale_width">Page Width
                          </option>
                          <option id="customScaleOption" title="" value="custom" disabled="disabled" hidden="true"></option>
                          <option title="" value="0.5" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 50 }'>50%
                          </option>
                          <option title="" value="0.75" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 75 }'>75%
                          </option>
                          <option title="" value="1" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 100 }'>100%
                          </option>
                          <option title="" value="1.25" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 125 }'>125%
                          </option>
                          <option title="" value="1.5" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 150 }'>150%
                          </option>
                          <option title="" value="2" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 200 }'>200%
                          </option>
                          <option title="" value="3" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 300 }'>300%
                          </option>
                          <option title="" value="4" data-l10n-id="page_scale_percent" data-l10n-args='{ "scale": 400 }'>400%
                          </option>
                        </select>
                      </span>
                    </div>
                  </div>
                  <div id="loadingBar">
                    <div class="progress">
                      <div class="glimmer">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
        
              <menu type="context" id="viewerContextMenu">
                <menuitem id="contextFirstPage" label="First Page" data-l10n-id="first_page">
                </menuitem>
                <menuitem id="contextLastPage" label="Last Page" data-l10n-id="last_page">
                </menuitem>
                <menuitem id="contextPageRotateCw" label="Rotate Clockwise" data-l10n-id="page_rotate_cw">
                </menuitem>
                <menuitem id="contextPageRotateCcw" label="Rotate Counter-Clockwise" data-l10n-id="page_rotate_ccw">
                </menuitem>
              </menu>
        
              <div id="viewerContainer" tabindex="0">
                <div id="viewer" class="pdfViewer"></div>
              </div>
        
              <div id="errorWrapper" hidden='true'>
                <div id="errorMessageLeft">
                  <span id="errorMessage"></span>
                  <button id="errorShowMore" data-l10n-id="error_more_info">
                    More Information
                  </button>
                  <button id="errorShowLess" data-l10n-id="error_less_info" hidden='true'>
                    Less Information
                  </button>
                </div>
                <div id="errorMessageRight">
                  <button id="errorClose" data-l10n-id="error_close">
                    Close
                  </button>
                </div>
                <div class="clearBoth"></div>
                <textarea id="errorMoreInfo" hidden='true' readonly="readonly"></textarea>
              </div>
            </div> <!-- mainContainer -->
        
            <div id="overlayContainer" class="hidden">
              <div id="passwordOverlay" class="container hidden">
                <div class="dialog">
                  <div class="row">
                    <p id="passwordText" data-l10n-id="password_label">Enter the password to open this PDF file:</p>
                  </div>
                  <div class="row">
                    <input type="password" id="password" class="toolbarField">
                  </div>
                  <div class="buttonRow">
                    <button id="passwordCancel" class="overlayButton"><span
                        data-l10n-id="password_cancel">Cancel</span></button>
                    <button id="passwordSubmit" class="overlayButton"><span data-l10n-id="password_ok">OK</span></button>
                  </div>
                </div>
              </div>
              <div id="documentPropertiesOverlay" class="container hidden">
                <div class="dialog">
                  <div class="row">
                    <span data-l10n-id="document_properties_file_name">File name:</span>
                    <p id="fileNameField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_file_size">File size:</span>
                    <p id="fileSizeField">-</p>
                  </div>
                  <div class="separator"></div>
                  <div class="row">
                    <span data-l10n-id="document_properties_title">Title:</span>
                    <p id="titleField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_author">Author:</span>
                    <p id="authorField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_subject">Subject:</span>
                    <p id="subjectField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_keywords">Keywords:</span>
                    <p id="keywordsField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_creation_date">Creation Date:</span>
                    <p id="creationDateField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_modification_date">Modification Date:</span>
                    <p id="modificationDateField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_creator">Creator:</span>
                    <p id="creatorField">-</p>
                  </div>
                  <div class="separator"></div>
                  <div class="row">
                    <span data-l10n-id="document_properties_producer">PDF Producer:</span>
                    <p id="producerField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_version">PDF Version:</span>
                    <p id="versionField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_page_count">Page Count:</span>
                    <p id="pageCountField">-</p>
                  </div>
                  <div class="row">
                    <span data-l10n-id="document_properties_page_size">Page Size:</span>
                    <p id="pageSizeField">-</p>
                  </div>
                  <div class="separator"></div>
                  <div class="row">
                    <span data-l10n-id="document_properties_linearized">Fast Web View:</span>
                    <p id="linearizedField">-</p>
                  </div>
                  <div class="buttonRow">
                    <button id="documentPropertiesClose" class="overlayButton"><span
                        data-l10n-id="document_properties_close">Close</span></button>
                  </div>
                </div>
              </div>
              <div id="printServiceOverlay" class="container hidden">
                <div class="dialog">
                  <div class="row">
                    <span data-l10n-id="print_progress_message">Preparing document for printing…</span>
                  </div>
                  <div class="row">
                    <progress value="0" max="100"></progress>
                    <span data-l10n-id="print_progress_percent" data-l10n-args='{ "progress": 0 }'
                      class="relative-progress">0%</span>
                  </div>
                  <div class="buttonRow">
                    <button id="printCancel" class="overlayButton"><span
                        data-l10n-id="print_progress_close">Cancel</span></button>
                  </div>
                </div>
              </div>
            </div> <!-- overlayContainer -->
        
          </div> <!-- outerContainer -->
          <div id="printContainer"></div>
        </body>
        
        </html>`
    }

    private handleSvg(uri: vscode.Uri, webview: vscode.Webview) {
        webview.html = `<html>
        <head>
            <script>
                const zoomOutIcon = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAEwAAABMAGW7EZ5AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAO1QTFRF////////////4+Pj6urq5+fn5ubm5+fn4ujo5OTk9bRa4+fn5enp4+bm5Ofn9bRY4+jo5Ojo87Na5Obm5ebm5Ojo4+fn5ejo6KtW5Ofn5Obm9LNZ5Ofn46dU5Ofn9LRZ48um5Mqm5Ofn5Ofn5Ofn5Ofn5Ofn5Ofn5Ofn5OfnPbOeP7SfXL6tXL+thM3AyOfhyefi26JQ26NS3Ktk4aZS4adU4tnI4/Du4/Hu5Ofn5ejo5ujo5unp5+rq6Ovr6evr6uzs7O7u7e/v7vDw7vX08PLy8fLy8vPz8vT09LRZ9Pb29fb29ff39vf39/j44kksWgAAACp0Uk5TAAEDCQwVHyAsMDM/RVJUYmR6gIWHj5SkpK26vb7Ax9bd39/g6uzy9vr+enQd/wAAAQ5JREFUGBltwYd6wWAYBtDPpnas2q1Np1a1rxUSwo989385zR9R8tQ5ZPPE0sVmu5RN+MklWIGjEaUrqQ6wWG0MTZ2gn/PRWQqY7di2V4ECOYIdLE0+04E42TwVzEy+WKIVICkG7PjKcYoMSWks2EVDiaQiVuxioE1SExtmfh3YntfMByBEljYMZn4Z2J5+mE0gTJYSNGZev79J38y8RddLlixUdtFRIymByZ6vzZEnyd+Aylc09CJki/ah858d8ECOHLA88okGjL8UOvEVgKlmHMytPgfGnyOhkCPegqP3+DEcCaGQI5AptYFuLR+h6nAkhFDoIhT2klQdCUuS/rsXljrdoAghynRLsl6++wWUkFffJlU41AAAAABJRU5ErkJggg==),auto";
                const zoomInIcon = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAEwAAABMAGW7EZ5AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAASBQTFRF////////////4+Pj6urq5+fn5eXl5ubm5+fn4ujo5OTk9bRa5eXl4ubm4+fn5enp5ejo4+bm5Ofn9bRY5ejo4+jo5efn5Ojo87Na5Ofn5Obm5ebm5Ofn5Ojo4+fn5ejo6KtW5Ofn5Ofn5efn4+jo5Obm9LNZ5Ofn46dU5Ofn9LRZ5Obm48um4+fn5Mqm5Ofn5Ofn5Ofn5Ofn5Ofn4+fn5Ofn5Ofn5Ofn5Ofn5OfnPbOeP7SfXL6tXL+thM3ApdrQyOfhyefi26JQ26NS3Ktk4aZS4adU4tnI4/Du4/Hu5Ofn5ejo5ujo5unp5+rq6Ovr6evr6uzs7O7u7e/v7vDw7vX08PLy8fLy8vPz8vT09LRZ9Pb29fb29ff39vf39/j4UpPm1gAAADp0Uk5TAAEDCQwVHR8gLDAzOz4/RU1SVGJjZHV6gIKFh42PlKSkqq23ubq9vsDH1trd3t/f4Orr7PHy9vr9/qPt2wcAAAEsSURBVBgZbcEJOwJRGAbQTwnZdyP7kiW7KG5FlsgbKtN6W97//y/MnSbx6BxxDUwtbZ9Hwyuzg/LH8D48Z5Pyy8I1kP+qVO1CDrdrfumaBz7qdDUKwIZ4hq5QbLOrBMxIxy4+2uwp4iIgxgRQp3GXKtPRekdIjEXk6VLqgYaNsBhb+KJLqTSNKqJinKBC8k65kmWyCYyI4xJVkinlSryRbSAojh3YJMsPaaXu01mSNcR84lhGgS6l0jRKOBRjGrkGjWQiS+MT62L4j1CgUc7SsBEfFdf4DUr8UQeOxbMKFFvssIHXF0s6/BvAu11ttmulT+D1OaMt8cxcwBM/fXrMaG2JJxAKR4HY4fqoHDxmtNaW9IwEfWIcZLRjTv7b1I6I9GFprfekn7nI3tg3KKZsSAoO0MAAAAAASUVORK5CYII=),auto";
                const iconChange = e => {
                    if (e.ctrlKey || e.altKey) {
                        document.body.style.cursor = zoomOutIcon;
                    }
                    else {
                        document.body.style.cursor = zoomInIcon;
                    }
                };
            </script>
            <style>
                body {
                    width: 100vw;
                    height: 100vh;
                    display: table;
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 100%;
                }
                .svg-container {
                    overflow: hidden;
                    text-align: center;
                    display: table-cell;
                    vertical-align: middle;
                }
                .svg-view {
                    width: 30%;
                    height: 30%;
                    user-select: none;
                    background: #fefefe;
                }
            </style>
        </head>
        <body>
            <div id="main" class="svg-container">
                <img class="svg-view" src="data:image/svg+xml,{{content}}">
            </div>
        </body>
        </html>`
    }



}