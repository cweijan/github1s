"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebglRenderer = void 0;
var GlyphRenderer_1 = require("./GlyphRenderer");
var LinkRenderLayer_1 = require("./renderLayer/LinkRenderLayer");
var CursorRenderLayer_1 = require("./renderLayer/CursorRenderLayer");
var CharAtlasCache_1 = require("./atlas/CharAtlasCache");
var RectangleRenderer_1 = require("./RectangleRenderer");
var RenderModel_1 = require("./RenderModel");
var Lifecycle_1 = require("common/Lifecycle");
var Constants_1 = require("common/buffer/Constants");
var EventEmitter_1 = require("common/EventEmitter");
var CellData_1 = require("common/buffer/CellData");
var WebglRenderer = (function (_super) {
    __extends(WebglRenderer, _super);
    function WebglRenderer(_terminal, _colors, preserveDrawingBuffer) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._colors = _colors;
        _this._model = new RenderModel_1.RenderModel();
        _this._workCell = new CellData_1.CellData();
        _this._onRequestRedraw = new EventEmitter_1.EventEmitter();
        _this._core = _this._terminal._core;
        _this._renderLayers = [
            new LinkRenderLayer_1.LinkRenderLayer(_this._core.screenElement, 2, _this._colors, _this._core),
            new CursorRenderLayer_1.CursorRenderLayer(_this._core.screenElement, 3, _this._colors, _this._onRequestRedraw)
        ];
        _this.dimensions = {
            scaledCharWidth: 0,
            scaledCharHeight: 0,
            scaledCellWidth: 0,
            scaledCellHeight: 0,
            scaledCharLeft: 0,
            scaledCharTop: 0,
            scaledCanvasWidth: 0,
            scaledCanvasHeight: 0,
            canvasWidth: 0,
            canvasHeight: 0,
            actualCellWidth: 0,
            actualCellHeight: 0
        };
        _this._devicePixelRatio = window.devicePixelRatio;
        _this._updateDimensions();
        _this._canvas = document.createElement('canvas');
        var contextAttributes = {
            antialias: false,
            depth: false,
            preserveDrawingBuffer: preserveDrawingBuffer
        };
        _this._gl = _this._canvas.getContext('webgl2', contextAttributes);
        if (!_this._gl) {
            throw new Error('WebGL2 not supported ' + _this._gl);
        }
        _this._core.screenElement.appendChild(_this._canvas);
        _this._rectangleRenderer = new RectangleRenderer_1.RectangleRenderer(_this._terminal, _this._colors, _this._gl, _this.dimensions);
        _this._glyphRenderer = new GlyphRenderer_1.GlyphRenderer(_this._terminal, _this._colors, _this._gl, _this.dimensions);
        _this.onCharSizeChanged();
        _this._isAttached = document.body.contains(_this._core.screenElement);
        return _this;
    }
    Object.defineProperty(WebglRenderer.prototype, "onRequestRedraw", {
        get: function () { return this._onRequestRedraw.event; },
        enumerable: false,
        configurable: true
    });
    WebglRenderer.prototype.dispose = function () {
        this._renderLayers.forEach(function (l) { return l.dispose(); });
        this._core.screenElement.removeChild(this._canvas);
        _super.prototype.dispose.call(this);
    };
    Object.defineProperty(WebglRenderer.prototype, "textureAtlas", {
        get: function () {
            var _a;
            return (_a = this._charAtlas) === null || _a === void 0 ? void 0 : _a.cacheCanvas;
        },
        enumerable: false,
        configurable: true
    });
    WebglRenderer.prototype.setColors = function (colors) {
        var _this = this;
        this._colors = colors;
        this._renderLayers.forEach(function (l) {
            l.setColors(_this._terminal, _this._colors);
            l.reset(_this._terminal);
        });
        this._rectangleRenderer.setColors();
        this._glyphRenderer.setColors();
        this._refreshCharAtlas();
        this._rectangleRenderer.updateSelection(this._model.selection);
        this._glyphRenderer.updateSelection(this._model);
        this._model.clear();
        this._model.clearSelection();
    };
    WebglRenderer.prototype.onDevicePixelRatioChange = function () {
        if (this._devicePixelRatio !== window.devicePixelRatio) {
            this._devicePixelRatio = window.devicePixelRatio;
            this.onResize(this._terminal.cols, this._terminal.rows);
        }
    };
    WebglRenderer.prototype.onResize = function (cols, rows) {
        var _this = this;
        this._updateDimensions();
        this._model.resize(this._terminal.cols, this._terminal.rows);
        this._rectangleRenderer.onResize();
        this._renderLayers.forEach(function (l) { return l.resize(_this._terminal, _this.dimensions); });
        this._canvas.width = this.dimensions.scaledCanvasWidth;
        this._canvas.height = this.dimensions.scaledCanvasHeight;
        this._canvas.style.width = this.dimensions.canvasWidth + "px";
        this._canvas.style.height = this.dimensions.canvasHeight + "px";
        this._core.screenElement.style.width = this.dimensions.canvasWidth + "px";
        this._core.screenElement.style.height = this.dimensions.canvasHeight + "px";
        this._glyphRenderer.setDimensions(this.dimensions);
        this._glyphRenderer.onResize();
        this._refreshCharAtlas();
        this._model.clear();
        this._model.clearSelection();
    };
    WebglRenderer.prototype.onCharSizeChanged = function () {
        this.onResize(this._terminal.cols, this._terminal.rows);
    };
    WebglRenderer.prototype.onBlur = function () {
        var _this = this;
        this._renderLayers.forEach(function (l) { return l.onBlur(_this._terminal); });
    };
    WebglRenderer.prototype.onFocus = function () {
        var _this = this;
        this._renderLayers.forEach(function (l) { return l.onFocus(_this._terminal); });
    };
    WebglRenderer.prototype.onSelectionChanged = function (start, end, columnSelectMode) {
        var _this = this;
        this._renderLayers.forEach(function (l) { return l.onSelectionChanged(_this._terminal, start, end, columnSelectMode); });
        this._updateSelectionModel(start, end, columnSelectMode);
        this._rectangleRenderer.updateSelection(this._model.selection);
        this._glyphRenderer.updateSelection(this._model);
        this._onRequestRedraw.fire({ start: 0, end: this._terminal.rows - 1 });
    };
    WebglRenderer.prototype.onCursorMove = function () {
        var _this = this;
        this._renderLayers.forEach(function (l) { return l.onCursorMove(_this._terminal); });
    };
    WebglRenderer.prototype.onOptionsChanged = function () {
        var _this = this;
        this._renderLayers.forEach(function (l) { return l.onOptionsChanged(_this._terminal); });
        this._updateDimensions();
        this._refreshCharAtlas();
    };
    WebglRenderer.prototype._refreshCharAtlas = function () {
        if (this.dimensions.scaledCharWidth <= 0 && this.dimensions.scaledCharHeight <= 0) {
            this._isAttached = false;
            return;
        }
        var atlas = CharAtlasCache_1.acquireCharAtlas(this._terminal, this._colors, this.dimensions.scaledCharWidth, this.dimensions.scaledCharHeight);
        if (!('getRasterizedGlyph' in atlas)) {
            throw new Error('The webgl renderer only works with the webgl char atlas');
        }
        this._charAtlas = atlas;
        this._charAtlas.warmUp();
        this._glyphRenderer.setAtlas(this._charAtlas);
    };
    WebglRenderer.prototype.clearCharAtlas = function () {
        var _a;
        (_a = this._charAtlas) === null || _a === void 0 ? void 0 : _a.clearTexture();
        this._model.clear();
        this._updateModel(0, this._terminal.rows - 1);
        this._glyphRenderer.updateSelection(this._model);
        this._onRequestRedraw.fire({ start: 0, end: this._terminal.rows - 1 });
    };
    WebglRenderer.prototype.clear = function () {
        var _this = this;
        this._renderLayers.forEach(function (l) { return l.reset(_this._terminal); });
    };
    WebglRenderer.prototype.registerCharacterJoiner = function (handler) {
        return -1;
    };
    WebglRenderer.prototype.deregisterCharacterJoiner = function (joinerId) {
        return false;
    };
    WebglRenderer.prototype.renderRows = function (start, end) {
        var _this = this;
        if (!this._isAttached) {
            if (document.body.contains(this._core.screenElement) && this._core._charSizeService.width && this._core._charSizeService.height) {
                this._updateDimensions();
                this._refreshCharAtlas();
                this._isAttached = true;
            }
            else {
                return;
            }
        }
        this._renderLayers.forEach(function (l) { return l.onGridChanged(_this._terminal, start, end); });
        if (this._glyphRenderer.beginFrame()) {
            this._model.clear();
            this._model.clearSelection();
        }
        this._updateModel(start, end);
        this._rectangleRenderer.render();
        this._glyphRenderer.render(this._model, this._model.selection.hasSelection);
    };
    WebglRenderer.prototype._updateModel = function (start, end) {
        var terminal = this._core;
        for (var y = start; y <= end; y++) {
            var row = y + terminal.buffer.ydisp;
            var line = terminal.buffer.lines.get(row);
            this._model.lineLengths[y] = 0;
            for (var x = 0; x < terminal.cols; x++) {
                line.loadCell(x, this._workCell);
                var chars = this._workCell.getChars();
                var code = this._workCell.getCode();
                var i = ((y * terminal.cols) + x) * RenderModel_1.RENDER_MODEL_INDICIES_PER_CELL;
                if (code !== Constants_1.NULL_CELL_CODE) {
                    this._model.lineLengths[y] = x + 1;
                }
                if (this._model.cells[i] === code &&
                    this._model.cells[i + RenderModel_1.RENDER_MODEL_BG_OFFSET] === this._workCell.bg &&
                    this._model.cells[i + RenderModel_1.RENDER_MODEL_FG_OFFSET] === this._workCell.fg) {
                    continue;
                }
                if (chars.length > 1) {
                    code = code | RenderModel_1.COMBINED_CHAR_BIT_MASK;
                }
                this._model.cells[i] = code;
                this._model.cells[i + RenderModel_1.RENDER_MODEL_BG_OFFSET] = this._workCell.bg;
                this._model.cells[i + RenderModel_1.RENDER_MODEL_FG_OFFSET] = this._workCell.fg;
                this._glyphRenderer.updateCell(x, y, code, this._workCell.bg, this._workCell.fg, chars);
            }
        }
        this._rectangleRenderer.updateBackgrounds(this._model);
    };
    WebglRenderer.prototype._updateSelectionModel = function (start, end, columnSelectMode) {
        var terminal = this._terminal;
        if (!start || !end || (start[0] === end[0] && start[1] === end[1])) {
            this._model.clearSelection();
            return;
        }
        var viewportStartRow = start[1] - terminal.buffer.active.viewportY;
        var viewportEndRow = end[1] - terminal.buffer.active.viewportY;
        var viewportCappedStartRow = Math.max(viewportStartRow, 0);
        var viewportCappedEndRow = Math.min(viewportEndRow, terminal.rows - 1);
        if (viewportCappedStartRow >= terminal.rows || viewportCappedEndRow < 0) {
            this._model.clearSelection();
            return;
        }
        this._model.selection.hasSelection = true;
        this._model.selection.columnSelectMode = columnSelectMode;
        this._model.selection.viewportStartRow = viewportStartRow;
        this._model.selection.viewportEndRow = viewportEndRow;
        this._model.selection.viewportCappedStartRow = viewportCappedStartRow;
        this._model.selection.viewportCappedEndRow = viewportCappedEndRow;
        this._model.selection.startCol = start[0];
        this._model.selection.endCol = end[0];
    };
    WebglRenderer.prototype._updateDimensions = function () {
        if (!this._core._charSizeService.width || !this._core._charSizeService.height) {
            return;
        }
        this.dimensions.scaledCharWidth = Math.floor(this._core._charSizeService.width * this._devicePixelRatio);
        this.dimensions.scaledCharHeight = Math.ceil(this._core._charSizeService.height * this._devicePixelRatio);
        this.dimensions.scaledCellHeight = Math.floor(this.dimensions.scaledCharHeight * this._terminal.getOption('lineHeight'));
        this.dimensions.scaledCharTop = this._terminal.getOption('lineHeight') === 1 ? 0 : Math.round((this.dimensions.scaledCellHeight - this.dimensions.scaledCharHeight) / 2);
        this.dimensions.scaledCellWidth = this.dimensions.scaledCharWidth + Math.round(this._terminal.getOption('letterSpacing'));
        this.dimensions.scaledCharLeft = Math.floor(this._terminal.getOption('letterSpacing') / 2);
        this.dimensions.scaledCanvasHeight = this._terminal.rows * this.dimensions.scaledCellHeight;
        this.dimensions.scaledCanvasWidth = this._terminal.cols * this.dimensions.scaledCellWidth;
        this.dimensions.canvasHeight = Math.round(this.dimensions.scaledCanvasHeight / this._devicePixelRatio);
        this.dimensions.canvasWidth = Math.round(this.dimensions.scaledCanvasWidth / this._devicePixelRatio);
        this.dimensions.actualCellHeight = this.dimensions.scaledCellHeight / this._devicePixelRatio;
        this.dimensions.actualCellWidth = this.dimensions.scaledCellWidth / this._devicePixelRatio;
    };
    return WebglRenderer;
}(Lifecycle_1.Disposable));
exports.WebglRenderer = WebglRenderer;
//# sourceMappingURL=WebglRenderer.js.map