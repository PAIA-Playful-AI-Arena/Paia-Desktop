/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview JavaScript for Blockly's Code demo.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * Create a namespace for the application.
 */
var Code = {};

/**
 * Get the name of the game.
 */
Code.GAME = (new URLSearchParams(window.location.search)).get('game');

/**
 * Get the name of the game.
 */
Code.GAME_VERSION = (new URLSearchParams(window.location.search)).get('ver');

/**
 * The name of opened project.
 */
Code.PROJECT = '';

/**
 * The full path of opened project.
 */
Code.PROJECT_PATH = '';

/**
 * The file system watcher of opened project.
 */
Code.PROJECT_WATCHER = null;

/**
 * The mode of running program.
 */
Code.MODE = 'play';

/**
 * The Python editor is toggled or not.
 */
Code.PYTHON_EDITOR = false;

 /**
 * The mode of running program.
 */
Code.FILESET_ID = null;

/**
 * The fileset data found by token.
 */
Code.FILESET_FOUND = null;

 /**
 * The list of all opened files.
 */
Code.OPENED_XMLS = {};

/**
 * The mapping from paths to displayed names.
 */
Code.PATH_MAP = {};

 /**
 * The name of currently focused XML.
 */
Code.FOCUSED_XML = "";

/**
 * Lookup for names of supported languages.  Keys should be in ISO 639 format.
 */
Code.LANGUAGE_NAME = {
  'en': 'English',
  'zh-hant': '正體中文'
};

/**
 * List of RTL languages.
 */
Code.LANGUAGE_RTL = ['ar', 'fa', 'he', 'lki'];

/**
 * Blockly's main workspace.
 * @type {Blockly.WorkspaceSvg}
 */
Code.workspace = null;

/**
 * Extracts a parameter from the URL.
 * If the parameter is absent default_value is returned.
 * @param {string} name The name of the parameter.
 * @param {string} defaultValue Value to return if parameter not found.
 * @return {string} The parameter value or the default value if not found.
 */
Code.getStringParamFromUrl = function(name, defaultValue) {
  var val = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
  return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};

/**
 * Get the language of this user from the URL.
 * @return {string} User's language.
 */
Code.getLang = function() {
  var lang = Code.getStringParamFromUrl('lang', '');
  if (Code.LANGUAGE_NAME[lang] === undefined) {
    // Default to Chinese.
    lang = 'zh-hant';
  }
  return lang;
};

/**
 * Is the current language (Code.LANG) an RTL language?
 * @return {boolean} True if RTL, false if LTR.
 */
Code.isRtl = function() {
  return Code.LANGUAGE_RTL.indexOf(Code.LANG) != -1;
};

/**
 * Load blocks saved on App Engine Storage or in session/local storage.
 * @param {string} defaultXml Text representation of default blocks.
 */
Code.loadBlocks = function(defaultXml) {
  var xml = Blockly.utils.xml.textToDom(defaultXml);
  Blockly.Xml.domToWorkspace(xml, Code.workspace);
};

/**
 * Save the blocks and reload with a different language.
 */
Code.changeLanguage = function(lang) {
  // Store the blocks for the duration of the reload.
  // MSIE 11 does not support sessionStorage on file:// URLs.
  if (window.sessionStorage) {
    var xml = Blockly.Xml.workspaceToDom(Code.workspace);
    var text = Blockly.Xml.domToText(xml);
    window.sessionStorage.loadOnceBlocks = text;
  }

  var newLang = lang
  var search = window.location.search;
  if (search.length <= 1) {
    search = '?lang=' + newLang;
  } else if (search.match(/[?&]lang=[^&]*/)) {
    search = search.replace(/([?&]lang=)[^&]*/, '$1' + newLang);
  } else {
    search = search.replace(/\?/, '?lang=' + newLang + '&');
  }

  window.location = window.location.protocol + '//' +
      window.location.host + window.location.pathname + search;
};

/**
 * Bind a function to a button's click event.
 * On touch enabled browsers, ontouchend is treated as equivalent to onclick.
 * @param {!Element|string} el Button element or ID thereof.
 * @param {!Function} func Event handler to bind.
 */
Code.bindClick = function(el, func) {
  if (typeof el == 'string') {
    el = document.getElementById(el);
  }
  el.addEventListener('click', func, true);
  el.addEventListener('touchend', func, true);
};

/**
 * Load the Prettify CSS and JavaScript.
 */
Code.importPrettify = function() {
  var script = document.createElement('script');
  script.setAttribute('src', 'https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js');
  document.head.appendChild(script);
};

/**
 * Compute the absolute coordinates and dimensions of an HTML element.
 * @param {!Element} element Element to match.
 * @return {!Object} Contains height, width, x, and y properties.
 * @private
 */
Code.getBBox_ = function(element) {
  var height = element.offsetHeight;
  var width = element.offsetWidth;
  var x = 0;
  var y = 0;
  do {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  } while (element);
  return {
    height: height,
    width: width,
    x: x,
    y: y
  };
};

/**
 * User's language (e.g. "en").
 * @type {string}
 */
Code.LANG = Code.getLang();

/**
 * List of tab names.
 * @private
 */
Code.TABS_ = ['blocks', 'python'];

/**
 * List of tab names with casing, for display in the UI.
 * @private
 */
Code.TABS_DISPLAY_ = [
  'Blocks', 'Python'
];

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
Code.renderContent = function() {
  Code.attemptCodeGeneration(python.pythonGenerator);
};

/**
 * Attempt to generate the code and display it in the UI, pretty printed.
 * @param generator {!Blockly.Generator} The generator to use.
 */
Code.attemptCodeGeneration = function(generator) {
  if (Code.checkAllGeneratorFunctionsDefined(generator)) {
    var code = generator.workspaceToCode(Code.workspace);
    Code.editor.setValue(code);
  }
};

/**
 * Check whether all blocks in use have generator functions.
 * @param generator {!Blockly.Generator} The generator to use.
 */
Code.checkAllGeneratorFunctionsDefined = function(generator) {
  const blocks = Code.workspace.getAllBlocks(false);
  const missingBlockGenerators = [];
  for (let i = 0; i < blocks.length; i++) {
    const blockType = blocks[i].type;
    if (!generator.forBlock[blockType]) {
      if (missingBlockGenerators.indexOf(blockType) == -1) {
        missingBlockGenerators.push(blockType);
      }
    }
  }

  const valid = missingBlockGenerators.length == 0;
  if (!valid) {
    const msg = 'The generator code for the following blocks not specified for ' +
        generator.name_ + ':\n - ' + missingBlockGenerators.join('\n - ');
    window.popup.alert(msg);  // Assuming synchronous. No callback.
  }
  return valid;
};

Code.setNavWidth = function() {
  var width = $("#tab_list").width() - $("#toggle_python").width() - $("#tab_user").width() - $("#tab_lang").width() - $("#tab_option").width() - 150;
  $("#opened_xml").css("max-width", `${width}px`);
};

/**
 * Initialize Blockly.  Called on page load.
 */
Code.init = async function() {
  // Add version to the title.
  document.title += ` ${app.getVersion()}`;
  
  // Hide fileset download part when competition mode is true.
  if (app.getVersion().indexOf("competition") != -1) {
    $("#fileset_download_div").css("display", "none");
  }

  // Init default project path.
  $("#project-path").val(window.project.getPath());
  
  // Load dialog body for selecting game arguments.
  Code.initGameArgs();

  // Make modal draggable.
  $(".modal-header").on("mousedown", function(mousedownEvt) {
    var $draggable = $(this);
    var x = mousedownEvt.pageX - $draggable.offset().left,
        y = mousedownEvt.pageY - $draggable.offset().top;
    $("body").on("mousemove.draggable", function(mousemoveEvt) {
        $draggable.closest(".modal-dialog").offset({
            "left": mousemoveEvt.pageX - x,
            "top": mousemoveEvt.pageY - y
        });
    });
    $("body").one("mouseup", function() {
        $("body").off("mousemove.draggable");
    });
    $draggable.closest(".modal").one("bs.modal.hide", function() {
        $("body").off("mousemove.draggable");
    });
  });

  // Make opened xml tabs scrollable.
  $("#opened_xml").on("mousewheel", function(event) {
    var curPos = $("#opened_xml").scrollLeft();
    $("#opened_xml").scrollLeft(curPos - event.originalEvent.wheelDelta / 5);
  })

  Code.initLanguage();

  // Initialize python editor.
  Code.editor = CodeMirror.fromTextArea(document.getElementById('python_code'), {
    mode: "python",
    lineNumbers: true,
    smartIndent: true,
    indentUnit: 4,
    indentWithTabs: false,
    lineWrapping: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"], 
    foldGutter: true,
    autofocus: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    readOnly: true
  });

  // Set callback function when window is resized.
  var onresize = function(e) {
    var container = document.getElementById('tab_content');
    var bBox = Code.getBBox_(container);
    for (var i = 0; i < Code.TABS_.length; i++) {
      var el = document.getElementById('content_' + Code.TABS_[i]);
      el.style.top = bBox.y + 'px';
      el.style.left = bBox.x + 'px';
      // Height and width need to be set, read back, then set again to
      // compensate for scrollbars.
      el.style.height = bBox.height + 'px';
      el.style.height = (2 * bBox.height - el.offsetHeight) + 'px';
      el.style.width = bBox.width + 'px';
      el.style.width = (2 * bBox.width - el.offsetWidth) + 'px';
    }
    Code.setNavWidth();
  };
  window.addEventListener('resize', onresize, false);

  // The toolbox XML specifies each category name using Blockly's messaging
  // format (eg. `<category name="%{BKY_CATLOGIC}">`).
  // These message keys need to be defined in `Blockly.Msg` in order to
  // be decoded by the library. Therefore, we'll use the `MSG` dictionary that's
  // been defined for each language to import each category name message
  // into `Blockly.Msg`.
  // TODO: Clean up the message files so this is done explicitly instead of
  // through this for-loop.
  for (var messageKey in MSG) {
    if (messageKey.indexOf('cat') == 0) {
      Blockly.Msg[messageKey.toUpperCase()] = MSG[messageKey];
    }
  }

  // Initialize block msg and generate toolbox
  const toolboxXml = Code.initMlgameBlocks();

  // Overide the color settings.
  Blockly.utils.colour.setHsvSaturation(0.4);
  Blockly.utils.colour.setHsvValue(0.85);
  
  // Initialize blockly workspace.
  Code.workspace = Blockly.inject('content_blocks',
      {grid:
          {spacing: 25,
           length: 3,
           colour: '#FFF',
           snap: true},
       media: 'media/',
       rtl: Code.isRtl(),
       toolbox: toolboxXml,
       zoom:
          {controls: true,
           wheel: true},
       move:
          {wheel: true}
      });
  
  // Set callback function when workspace is changed.
  Code.workspace.addChangeListener((e) => {
    if (!e.isUiEvent) {
      if (Code.FOCUSED_XML != "" && !Code.OPENED_XMLS[Code.FOCUSED_XML].isLoading) {
        Code.OPENED_XMLS[Code.FOCUSED_XML].xml = Blockly.Xml.workspaceToDom(Code.workspace);
        if (Blockly.Xml.domToPrettyText(Code.OPENED_XMLS[Code.FOCUSED_XML].xml) != Code.OPENED_XMLS[Code.FOCUSED_XML].xmlText) {
          Code.OPENED_XMLS[Code.FOCUSED_XML].$link.find('.not-saved').html('*');
        } else {
          Code.OPENED_XMLS[Code.FOCUSED_XML].$link.find('.not-saved').html('');
        }
      }
      if (e.type == "finished_loading") {
        Code.OPENED_XMLS[Code.FOCUSED_XML].isLoading = false;
        if (Code.OPENED_XMLS[Code.FOCUSED_XML].trashcan === undefined || Code.OPENED_XMLS[Code.FOCUSED_XML].trashcan.length == 0) {
          Code.workspace.trashcan.emptyContents();
        } else {
          Code.workspace.trashcan.contents = Code.OPENED_XMLS[Code.FOCUSED_XML].trashcan.slice();
        }
      }
      var topBlocks = Code.workspace.getTopBlocks();
      Code.MODE = 'execute';
      $('#run').html(MSG['execute']);
      for (var i = 0; i < topBlocks.length; i++) {
        if (topBlocks[i].type == 'mlplay_class' && topBlocks[i].isEnabled()) {
          Code.MODE = 'play';
          $('#run').html(MSG['play']);
          return;
        }
      }
    } else {
      if (Code.FOCUSED_XML != "") {
        Code.OPENED_XMLS[Code.FOCUSED_XML].settings = {x: Code.workspace.scrollX, y: Code.workspace.scrollY, scale: Code.workspace.scale};
      }
    }
  });
  
  // Overide prompt function because prompt is not implemented in Electron.
  Blockly.dialog.setPrompt((message, defaultValue, callback) => {
    vex.dialog.prompt({
      message: message,
      placeholder: defaultValue,
      callback: callback
    });
  });

  // Overide the length of indent.
  python.pythonGenerator.INDENT = "    ";
  
  // Update library dropdown menu
  var libraryDir = path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  if (!fs.existsSync(libraryDir)) {
    fs.mkdirSync(libraryDir, { recursive: true });
  }
  fs.watch(libraryDir, (eventType, filename) => {
    Code.updateLibraryList();
  });
  Code.updateLibraryList();

  if ('BlocklyStorage' in window) {
    // Hook a save function onto unload.
    BlocklyStorage.backupOnUnload(Code.workspace);
  }

  // Replace the README of easy_game with tutorials.
  if (Code.GAME == 'easy_game') {
    $('#show_readme').html('教學');
    $('#readme-title').html('Tutorials');
    $('#readme-dialog .modal-content').append('<div class="modal-footer"><button type="button" onclick="Code.prevTutorials();" class="btn btn-outline-secondary mr-auto">&lt; 前一頁</button><button type="button" onclick="Code.nextTutorials();" class="btn btn-outline-secondary">下一頁 &gt;</button></div>')
    Code.tutorialsTotalPage = 0;
    const dir = path.join(__dirname, 'tutorial', 'tutorials');
    fs.readdirSync(dir).forEach(file => {
      if (file.endsWith('.md')) {
        Code.tutorialsTotalPage++;
      };
    });
    Code.tutorialsCurPage = 1;
    const readme_path = path.join(__dirname, 'tutorial', 'tutorials', String(Code.tutorialsCurPage) + '.md');
    const readme_text = window.file.read(readme_path);
    const readme = window.markdown.convert(readme_text);
    $('#readme-body').html(readme);
    Code.bindClick('show_readme',
      function() {Code.showTutorials(); Code.renderContent();});
  } else {
    Code.bindClick('show_readme',
      function() {Code.showReadme(); Code.renderContent();});
  }

  Code.bindClick('run',
      function() {Code.run(); Code.renderContent();});
  Code.bindClick('custom_python',
      function() {Code.showCustomPython(); Code.renderContent();});
  Code.bindClick('custom_python_button',
      function() {Code.selectCustomPython(); Code.renderContent();});
  Code.bindClick('discard',
      function() {Code.discard(); Code.renderContent();});
  Code.bindClick('clean_trashcan',
      function() {Code.workspace.trashcan.emptyContents(); Code.renderContent();});
  Code.bindClick('custom_blocks',
      function() {
        var dir = path.join(__dirname, 'custom_blocks').replace('app.asar', 'app.asar.unpacked');
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        window.path.open(dir);
      });
  Code.bindClick('toggle_python',
      function() {Code.togglePython(); Code.renderContent();});
  Code.bindClick('logout',
      function() {Code.logout(); Code.renderContent();});
  Code.bindClick('show_filesets',
      function() {Code.showFilesets(); Code.renderContent();});
  Code.bindClick('load_project',
      function() {Code.loadProject(); Code.renderContent();});
  Code.bindClick('reveal_project',
      function() {Code.revealProject(); Code.renderContent();});
  Code.bindClick('export_project',
      function() {Code.exportProject(); Code.renderContent();});
  Code.bindClick('open_xml',
      function() {Code.openXml(); Code.renderContent();});
  Code.bindClick('save_xml',
      function() {Code.saveXml(); Code.renderContent();});
  Code.bindClick('save_python',
      function() {Code.savePython(); Code.renderContent();});
  Code.bindClick('open_example_dir',
      function() {window.path.open(window.path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked')); Code.renderContent();});
  Code.bindClick('en',
      function() {Code.changeLanguage('en'); Code.renderContent();});
  Code.bindClick('zh-hant',
      function() {Code.changeLanguage('zh-hant'); Code.renderContent();});

  onresize();
  Blockly.svgResize(Code.workspace);
  onresize();
  Blockly.svgResize(Code.workspace);

  
  // Initialize content visibility.
  $("#content_python").css("visibility", "hidden");
  $("#content_blocks").css("visibility", "visible");
  Code.workspace.setVisible(true);
  
  // Try to Use saved token to login.
  if (await Code.token_login())
    $('#project-dialog').modal('show');

  // Set PAIA ads url
  $("#paia-ads").attr("src", window.paia.ads());

  // GA4
  window.paia.ga('screen_view', {
    app_name: "paia_desktop",
	  app_version: window.app.getVersion(),
    screen_name: `blockly?game=${Code.GAME}`
  });

  // Lazy-load the syntax-highlighting.
  window.setTimeout(Code.importPrettify, 1);
};

/**
 * Initialize the page language.
 */
Code.initLanguage = function() {
  // Set the HTML's language and direction.
  var rtl = Code.isRtl();
  document.dir = rtl ? 'rtl' : 'ltr';
  document.head.parentElement.setAttribute('lang', Code.LANG);

  // Inject language strings.
  document.getElementById('game_name').textContent = Code.GAME;
  document.getElementById('discard').textContent = MSG['discard'];
  document.getElementById('en').textContent = MSG['en'];
  document.getElementById('zh-hant').textContent = MSG['zh_hant'];
};

/**
 * Initialize dialog body for selecting game arguments.
 */
Code.initGameArgs = function() {
  const config = JSON.parse(window.file.read(path.join(__dirname, 'games', Code.GAME, 'game_config.json').replace('app.asar', 'app.asar.unpacked')));
  const $div = $('<div class="m-2"></div>')
  $div.append('<div class="form-group"><label>每秒顯示張數 (FPS)</label><input type="number" class="form-control", id="game_fps", min="1", max="300", step="1", value="30", data-bind="value:replyNumber"></div>');
  const userNumConfig = config['user_num'];
  $div.append(`<div class="form-group"><label>玩家人數</label><input type="number" class="form-control", id="user_num", min="${userNumConfig.min}", max="${userNumConfig.max}", step="1", value="${userNumConfig.min}", data-bind="value:replyNumber"></div>`);
  $('#game-args').append($div);
  for (let params of config['game_params']) {
    const $param = $('<div class="form-group"></div>');
    $param.append(`<label>${params["verbose"]}</label>`);
    if (params["type"] == "int") {
      if ("choices" in params) {
        const $choices = $(`<select class="form-control game-arg", id="param-${params["name"]}"></select>`);
        for (let value of params['choices']) {
          $choices.append(`<option ${(params["default"] == value)? "selected" : ""} value="${value}">${value}</option>`);
        };
        $param.append($choices);
      } else {
        let step = 1;
        if ("step" in params) {
          step = params["step"];
        }
        $param.append(`<input type="number" class="form-control game-arg", id="param-${params["name"]}", min="${params["min"]}", max="${params["max"]}", step="${step}", value="${params["default"]}", data-bind="value:replyNumber">`);
      }
    } else if (params["type"] == "str") {
      const $choices = $(`<select class="form-control game-arg", id="${params["name"]}"></select>`);
      for (let choice of params['choices']) {
        if (typeof(choice) === "object") {
          $choices.append(`<option ${(params["default"] == choice["value"])? "selected" : ""} value="${choice["value"]}">${choice["verbose"]}</option>`);
        } else {
          $choices.append(`<option ${(params["default"] == choice)? "selected" : ""} value="${choice}">${choice}</option>`);
        }
        $param.append($choices);
      }
    } else if (params["type"] == "path") {
      const $path = $(`<input type="text" class="form-control game-arg" id="param-${params["name"]}" onclick="Code.selectParamPath('param-${params["name"]}')" readonly></input>`);
      $param.append($path);
    } else if (params["type"] == "list") {
      const $list = $(`<input type="text" class="form-control game-arg" id="param-${params["name"]}" value="${params["default"]}">`);
      $param.append($list);
    }
    $div.append($param);
  };
};

Code.selectParamPath = function(paramId) {
  const paramPath = window.path.select({
    title: "選擇檔案",
    defaultPath: $(`#${paramId}`).val(),
    properties: ["openFile"]
  });
  if (paramPath !== undefined) {
    $(`#${paramId}`).val(paramPath[0]);
  }
}

/**
 * Use blockly.json to initialize options of MLGame blocks.
 */
Code.initMlgameBlocks = function() {
  // Construct the toolbox XML, replacing translated variable names.
  var toolboxPath = toolboxPath = path.join(__dirname, 'blockly', 'toolbox', 'default.xml');
  var toolboxText = window.file.read(toolboxPath);
  toolboxText = toolboxText.replace(/(^|[^%]){(\w+)}/g,
      function(m, p1, p2) {return p1 + MSG[p2];});
  var toolboxXml = Blockly.utils.xml.textToDom(toolboxText);
  var mlgameCat = toolboxXml.getElementsByClassName('MLGame_blocks')[0];
  
  var configPath = path.join(__dirname, 'games', Code.GAME, 'blockly.json').replace('app.asar', 'app.asar.unpacked');
  if (fs.existsSync(configPath)) {
    var gameOptions = JSON.parse(window.file.read(configPath));
    var reservedWords = ['MLPlay', 'self', 'scene_info', 'keyboard', 'args', 'kwargs', 'os', 'cmath', 'csv', 'plt', 'pickle', 'pygame', 'neighbors', 'tree', 'svm', 'ensemble', 'neural_network', 'linear_model', 'metrics', 'model_selection'];
    if ("INIT_INFO" in gameOptions) {
      var options = [];
      gameOptions["INIT_INFO"].forEach((op, index) => {
        var opName = `${Code.GAME.toUpperCase()}_INIT_INFO_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        reservedWords.push(op[0]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_INIT_INFO_OPTIONS"] = options;

      var block = document.createElement("block");
      block.setAttribute("type", "mlplay_init_info");
      mlgameCat.appendChild(block);
    }

    var gameConfigPath = path.join(__dirname, 'games', Code.GAME, 'game_config.json').replace('app.asar', 'app.asar.unpacked');
    if (fs.existsSync(gameConfigPath)) {
      var options = [];
      for (var params of JSON.parse(window.file.read(gameConfigPath)).game_params) {
        if (Code.LANG == 'en') {
          options.push([params.name.split('_').join(' '), `kwargs['game_params']['${params.name}']`]);
        } else if (Code.LANG == 'zh-hant') {
          options.push([params.verbose, `kwargs['game_params']['${params.name}']`]);
        }
      }
      Blockly.Msg["MLPLAY_GAME_PARAM_OPTIONS"] = options;
      var block = document.createElement("block");
      block.setAttribute("type", "mlplay_game_param");
      mlgameCat.appendChild(block);
    }

    if ("GAME_STATUS" in gameOptions) {
      var options = [];
      gameOptions["GAME_STATUS"].forEach((op, index) => {
        var opName = `${Code.GAME.toUpperCase()}_GAME_STATUS_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_GAME_STATUS_OPTIONS"] = options;

      var block = document.createElement("block");
      block.setAttribute("type", "mlplay_game_status");
      mlgameCat.appendChild(block);
    }

    if ("SCENE_INFO" in gameOptions) {
      var options = [];
      gameOptions["SCENE_INFO"].forEach((op, index) => {
        var opName = `${Code.GAME.toUpperCase()}_SCENE_INFO_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_GET_INFO_OPTIONS"] = options;

      var block = document.createElement("block");
      block.setAttribute("type", "mlplay_get_info");
      mlgameCat.appendChild(block);
    }

    if ("CONSTANT" in gameOptions) {
      var options = [];
      gameOptions["CONSTANT"].forEach((op, index) => {
        var opName = `${Code.GAME.toUpperCase()}_CONSTANT_${index+1}`;
        options.push([`%{BKY_${opName}}`, `${index+1}/${op[0]}`]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_GET_CONSTANT_OPTIONS"] = options;

      var block = document.createElement("block");
      block.setAttribute("type", "mlplay_get_constant");
      mlgameCat.appendChild(block);
    }

    if ("ACTION" in gameOptions) {
      var options = [];
      gameOptions["ACTION"].forEach((op, index) => {
        var opName = `${Code.GAME.toUpperCase()}_ACTION_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_RETURN_ACTION_OPTIONS"] = options;

      var block = document.createElement("block");
      block.setAttribute("type", "mlplay_return_action");
      mlgameCat.appendChild(block);
    }

    if ("ACTION_VALUE" in gameOptions) {
      Blockly.Blocks['mlplay_return_value'].init = function() {
        this.inputCount_ = 0;
        this.inputKey_ = [];
        gameOptions["ACTION_VALUE"].forEach((op, index) => {
          this.inputCount_++;
          this.inputKey_.push(op[0]);
          var text = (index == 0)? Blockly.Msg["MLPLAY_RETURN_VALUE"] + " " : "";
          if (Code.LANG == 'en') {
            text += op[3] + ':';
          } else if (Code.LANG == 'zh-hant') {
            text += op[4] + '：';
          }
          this.appendValueInput('INPUT' + index)
              .setAlign(Blockly.ALIGN_RIGHT)
              .appendField(text);;
        });
        this.init_settings_();
      }

      var block = document.createElement("block");
      block.setAttribute("type", "mlplay_return_value");
      gameOptions["ACTION_VALUE"].forEach((op, index) => {
        if (op[1] == "NUMBER") {
          var field = document.createElement("field");
          field.setAttribute("name", "NUM");
          field.appendChild(document.createTextNode(op[2]));
          var shadow = document.createElement("shadow");
          shadow.setAttribute("type", "math_number");
          shadow.appendChild(field);
          var value = document.createElement("value");
          value.setAttribute("name", 'INPUT' + index);
          value.appendChild(shadow);
          block.appendChild(value);
        } else if (op[1] == "STRING") {
          var field = document.createElement("field");
          field.setAttribute("name", "TEXT");
          field.appendChild(document.createTextNode(op[2]));
          var shadow = document.createElement("shadow");
          shadow.setAttribute("type", "text");
          shadow.appendChild(field);
          var value = document.createElement("value");
          value.setAttribute("name", 'INPUT' + index);
          value.appendChild(shadow);
          block.appendChild(value);
        }
      });
      mlgameCat.appendChild(block);
    }

    python.pythonGenerator.addReservedWords(reservedWords.join());
  }

  var customBlocksPath = path.join(__dirname, 'custom_blocks', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  if (fs.existsSync(customBlocksPath)) {
    fs.readdirSync(customBlocksPath).forEach(file => {
      if (file.endsWith(".xml")) {
        var customToolboxPath = toolboxPath = path.join(customBlocksPath, file);
        var customToolboxText = window.file.read(customToolboxPath);
        var customToolboxXml = Blockly.utils.xml.textToDom(customToolboxText);
        toolboxXml.appendChild(document.createElement("sep"));
        toolboxXml.appendChild(customToolboxXml.getElementsByTagName("category")[0]);
      }
    });
  }

  return toolboxXml;
};

/**
 * Show dialog for custom Python.
 */
Code.showCustomPython = function() {
  const state = window.python_env.getCustom();
  $("#custom-python-check").prop('checked', state.custom_python);
  $("#custom-python-path").html(state.custom_python_path);
  $('#custom-python-dialog').modal('show');
};

/**
 * Select path for custom Python.
 */
Code.selectCustomPython = function() {
  let curPath = window.python_env.getCustom().custom_python_path;
  if (curPath == "" || !window.fs.existsSync(curPath)) {
    curPath = window.path.join(window.path.homedir(), 'Desktop');
  }
  const pythonPath = window.path.select({
    title: "選擇 Python 直譯器",
    defaultPath: curPath,
    properties: ["openFile"]
  });
  if (pythonPath !== undefined) {
    $("#custom-python-path").html(pythonPath[0]);
  }
};

/**
 * Save custom Python.
 */
Code.saveCustomPython = function() {
  window.python_env.setCustom($("#custom-python-check").prop('checked'), $("#custom-python-path").html());
  $('#custom-python-dialog').modal('hide');
};

/**
 * Update library dropdown list.
 */
Code.updateLibraryList = function() {
  $('#library').empty();
  let index = 0;
  let libraryDir = (app.getVersion().indexOf("competition-tn") != -1 && Code.GAME != "easy_game")? 
    window.path.join(__dirname, 'examples', Code.GAME, 'tainan') :
    window.path.join(__dirname, 'examples', Code.GAME, 'xml');
  if (window.fs.existsSync(libraryDir)) {
    window.fs.readdirSync(libraryDir).forEach(dirent => {
      const filesetDir = window.path.join(libraryDir, dirent);
      $('#library').append($(`<a href="#library-${index}" data-toggle="collapse" aria-expanded="false" class="group mt-2" title="${filesetDir}"><i class="bi bi-caret-right-fill pointer mr-1"></i>${dirent}</a>`))
      const $list = $(`<ul class="collapse list-unstyled" id="library-${index}"></ul>`)
      $('#library').append($list);
      index++;
      window.fs.readdirSync(filesetDir).forEach(file => {
        if (file.endsWith(".xml")) {
          var filePath = path.join(filesetDir, file);
          $list.append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
          Code.bindClick(filePath,
            function() {Code.loadXml(filePath); Code.renderContent();});
        }
      });
    });
  }

  libraryDir = window.path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  window.fs.readdirSync(libraryDir).forEach(dirent => {
    const filesetDir = window.path.join(libraryDir, dirent);
    $('#library').append($(`<a href="#library-${index}" data-toggle="collapse" aria-expanded="false" class="group mt-2" title="${filesetDir}"><i class="bi bi-caret-right-fill pointer mr-1"></i>${dirent}</a>`))
    const $list = $(`<ul class="collapse list-unstyled" id="library-${index}"></ul>`)
    $('#library').append($list);
    index++;
    window.fs.readdirSync(filesetDir).forEach(file => {
      if (file.endsWith(".xml")) {
        const filePath = window.path.join(filesetDir, file);
        $list.append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
        Code.bindClick(filePath,
          function() {Code.loadXml(filePath); Code.renderContent();});
      }
    });
  });
};

/**
 * Update project files dropdown list.
 */
Code.updateProjectList = function() {
  $('#project-files').empty();
  fs.readdirSync(Code.PROJECT_PATH).forEach(file => {
    if (file.endsWith(".xml")) {
      var filePath = path.join(Code.PROJECT_PATH, file);
      $('#project-files').append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
      Code.bindClick(filePath,
        function() {Code.loadXml(filePath); Code.renderContent();});
    }
  });
};

/**
 * Discard all blocks from the workspace.
 */
Code.discard = function() {
  var count = Code.workspace.getAllBlocks(false).length;
  if (count < 2 ||
      window.popup.confirm(Blockly.Msg['DELETE_ALL_BLOCKS'].replace('%1', count))) {
    Code.workspace.clear();
    if (window.location.hash) {
      window.location.hash = '';
    }
  }
};

Code.login = async function () {
  const response = await window.paia.login($('#email').val(), $('#password').val());
  if (response.ok) {
      $('#state-content').html('登入成功');
      $('#login-dialog').modal('hide');
      window.paia.user().then((res) => {
        if (res.ok) {
          $('#tab_user').text(res.content.username);
        }
      })
      if (Code.PROJECT == '')
        $('#project-dialog').modal('show');
  } else {
    $('#state-content').html(response.content);
  }
};

// Code.google_login = function() {
//   $('#state-content').html('請於瀏覽器登入，成功後會自動返回');
//   try {
//     myApiOauth.openAuthWindowAndGetTokens()
//       .then(token => {
//         var data = {
//           type: "social",
//           account: {
//             provider: "google-desktop",
//             id_token: token.id_token
//           }
//         };
//         window.paiaAPI("POST", "auth/token", data, false, null, (res) => {
//           window.setToken(res.access, res.refresh);
//           Code.LOGIN = true;
//           Code.afterLogin();
//         }, (jqXHR, exception) => {
//           var msg = '';
//           if (jqXHR.status === 0) {
//               msg = '連線錯誤，請確認網路';
//           } else if (jqXHR.status == 401) {
//               msg = `${jqXHR.responseText} [401]`;
//           } else if (exception === 'abort') {
//               msg = 'Ajax request aborted.';
//           } else {
//               msg = 'Uncaught Error.\n' + jqXHR.responseText;
//           }
//           console.log(msg);
//         });
//       });
//   } catch(e) {
//     console.log(e);
//   }
// };

Code.token_login = async function (token=null) {
  const auth = await window.paia.auth(token);
  if (!auth.ok) {
    $('#state-content').html(auth.content);
    if (Code.PROJECT == '')
        $('#project-dialog').modal('hide');
    $('#login-dialog').modal('show');
    return false;
  } else {
    window.paia.user().then((res) => {
      if (res.ok) {
        $('#tab_user').text(res.content.username);
      }
    })
    $('#login-dialog').modal('hide');
    if (Code.PROJECT == '')
        $('#project-dialog').modal('show');
    return true;
  }
};

/**
 * Log out. 
 */
Code.logout = function () {
  window.paia.logout();
  $('#tab_user').text('尚未登入');
  $('#state-content').html('');
  $('#login-dialog').modal('show');
}

/**
 * Update UI after login. 
 */
// Code.afterLogin = function() {
//   Code.LOGIN = true;
//   $('#login_logout').html('登出');
//   document.querySelectorAll('.need-login').forEach(e => {
//     e.classList.remove("disabled");
//   });
//   window.paiaAPI("GET", "me", null, false, 'USER_TOKEN', (res) => {
//     $('#tab_user').text(`${res.first_name} ${res.last_name}`);
//   }, (jqXHR, exception) => {
//     console.log("取得使用者資料錯誤");
//     window.logout();
//   });
//   Code.setNavWidth();
//   $('#login-dialog').modal('hide');
// };

/**
 * Let user select the path to a xml file and load it. 
 */
Code.openXml = function() {
  var xmlPath = window.path.select({
    title: "開啟 XML 檔",
    filters: [
      {name: 'xml', extensions: ['xml']}
    ],
    properties: ["openFile"]
  });
  if (xmlPath === undefined) {
    return;
  } else {
    xmlPath = xmlPath[0];
  }
  Code.loadXml(xmlPath);
}

/**
 * Load xml file to workscpace. 
 */
Code.loadXml = function(xmlPath) {
  // Save trashcan state before open another xml.
  if (Code.FOCUSED_XML != "") {
    Code.OPENED_XMLS[Code.FOCUSED_XML].trashcan = Code.workspace.trashcan.contents.slice();
  }
  let name = window.path.basename(xmlPath);
  if (xmlPath in Code.PATH_MAP) {
    if (Code.PYTHON_EDITOR) {
      Code.togglePython();
    }
    name = Code.PATH_MAP[xmlPath];
    if (name == Code.FOCUSED_XML) {
      return;
    }
    if (!window.fs.existsSync(xmlPath)) {
      if (!window.popup.confirm(`${name} 已被刪除，是否繼續保留？`)) {
        Code.closeXml(xmlPath);
        return;
      }
    } else {
      const xmlText = window.file.read(xmlPath);
      if (xmlText != Code.OPENED_XMLS[name].xmlText) {
        Code.OPENED_XMLS[name].xmlText = xmlText;
        if (window.popup.confirm(`${name} 已被更改過，是否重新載入？`)) {
          Code.OPENED_XMLS[name].$link.find('.not-saved').html('');
          Code.OPENED_XMLS[name].xml = Blockly.utils.xml.textToDom(xmlText);
        }
      }
    }
    Code.workspace.clear();
    Blockly.Xml.domToWorkspace(Code.OPENED_XMLS[name].xml, Code.workspace);
    Code.OPENED_XMLS[name].isLoading = true;
    Code.workspace.setScale(Code.OPENED_XMLS[name].settings.scale);
    Code.workspace.scroll(Code.OPENED_XMLS[name].settings.x, Code.OPENED_XMLS[name].settings.y);
    $("#opened_xml a").removeClass("active");
    Code.OPENED_XMLS[name].$link.addClass("active");
    const tabPos = $("#opened_xml").scrollLeft() + Code.OPENED_XMLS[name].$item.position().left;
    const scrollTarget = ($("#opened_xml").width() - Code.OPENED_XMLS[name].$item.width()) / 2;
    $("#opened_xml").animate({ scrollLeft: tabPos - scrollTarget });
    Code.FOCUSED_XML = name;
    return;
  } else {
    let index = 1;
    while (name in Code.OPENED_XMLS) {
      name = `${path.basename(xmlPath)} (${index})`;
      index++;
    }
    try {
      const xmlText = window.file.read(xmlPath);
      const xml = Blockly.utils.xml.textToDom(xmlText);
      Code.workspace.clear();
      Blockly.Xml.domToWorkspace(xml, Code.workspace);
      Code.PATH_MAP[xmlPath] = name;
      Code.OPENED_XMLS[name] = {};
      Code.OPENED_XMLS[name].path = xmlPath;
      Code.OPENED_XMLS[name].xml = xml;
      Code.OPENED_XMLS[name].xmlText = xmlText;
      Code.OPENED_XMLS[name].settings = {x: Code.workspace.scrollX, y: Code.workspace.scrollY, scale: Code.workspace.scale};
      Code.OPENED_XMLS[name].isLoading = true;
      const $item = $('<li class="nav-item"></li>');
      const $link = $(`<a class="nav-link pr-4" href="#" id="tab-${xmlPath}" title="${xmlPath}">${name}<span class="not-saved"></span>&ensp;</a>`);
      const $close = $(`<button class="p-0 border-0 bg-white tab-close" id="close-${xmlPath}"><i class="bi bi-x"></i></button>`);
      $item.append($link);
      $item.append($close);
      $("#opened_xml").append($item);
      Code.bindClick(`tab-${xmlPath}`,
        function() {Code.loadXml(xmlPath); Code.renderContent();});
      Code.bindClick(`close-${xmlPath}`,
        function() {Code.closeXml(xmlPath); Code.renderContent();});
      if (Code.PYTHON_EDITOR) {
        Code.togglePython();
      }
      $("#opened_xml a").removeClass("active");
      $link.addClass("active");
      const tabPos = $("#opened_xml").scrollLeft() + $item.position().left;
      const scrollTarget = ($("#opened_xml").width() - $item.width()) / 2;
      $("#opened_xml").animate({ scrollLeft: tabPos - scrollTarget });
      Code.OPENED_XMLS[name].$item = $item;
      Code.OPENED_XMLS[name].$link = $link;
      Code.FOCUSED_XML = name;
    } catch (err) {
      window.popup.alert(err);
    }
  }
};

/**
 * Close xml file and try to load another opened xml. 
 */
Code.closeXml = function(xmlPath) {
  var name = Code.PATH_MAP[xmlPath];
  if (Code.OPENED_XMLS[name].$link.find('.not-saved').html() == '*' &&
      !window.popup.confirm(`${name} 有尚未儲存的修改，關閉後將遺失，是否確定關閉檔案？`)) {
    return;
  }
  if (Code.OPENED_XMLS[name].$link.hasClass('active')) {
    var $links = $("#opened_xml .nav-link");
    var index = $links.index(Code.OPENED_XMLS[name].$link);
    if (index - 1 >= 0) {
      $links[index - 1].click();
    } else if (index + 1 < $links.length) {
      $links[index + 1].click();
    } else {
      Code.workspace.clear();
      Code.FOCUSED_XML = "";
    }
  }
  Code.OPENED_XMLS[name].$item.remove();
  delete Code.OPENED_XMLS[name];
  delete Code.PATH_MAP[xmlPath];
};

/**
 * Let user select the path to a xml file and save workscpace to it. 
 */
Code.saveXml = function() {
  const xmlPath = window.path.save({
    title: "儲存 XML 檔",
    defaultPath: path.join(Code.PROJECT_PATH, Code.FOCUSED_XML),
    filters: [
        {name: 'XML', extensions: ['xml']}
    ]
  });
  if (xmlPath === undefined) {
    return;
  } else {
    const xml = Blockly.Xml.workspaceToDom(Code.workspace);
    const xmlText = Blockly.Xml.domToPrettyText(xml);
    window.file.write(xmlPath, xmlText);
    if (Code.FOCUSED_XML != "") {
      Code.OPENED_XMLS[Code.FOCUSED_XML].$link.find('.not-saved').html('');
      if (xmlPath == Code.OPENED_XMLS[Code.FOCUSED_XML].path) {
        Code.OPENED_XMLS[Code.FOCUSED_XML].xmlText = xmlText;
      } else {
        Code.closeXml(Code.OPENED_XMLS[Code.FOCUSED_XML].path);
        Code.loadXml(xmlPath);
      }
    } else {
      Code.loadXml(xmlPath);
    }
    // Add log
    // window.addLog('store_xml', {
    //   type: "file",
    //   data: {
    //     name: path.basename(xmlPath)
    //   }
    // });
  }
};

// Toggle python editor.
Code.togglePython = function() {
  if (Code.PYTHON_EDITOR) {
    $("#toggle_python").html("Python");
    $("#content_python").css("visibility", "hidden");
    $("#content_blocks").css("visibility", "visible");
    Code.workspace.setVisible(true);
    Code.PYTHON_EDITOR = false;
  } else {
    $("#toggle_python").html("積木");
    $("#content_python").css("visibility", "visible");
    $("#content_blocks").css("visibility", "hidden");
    Code.workspace.setVisible(false);
    Code.PYTHON_EDITOR = true;
  }
  Code.setNavWidth();
};

/**
 * Save temporary python file for execution. 
 */
Code.saveTmpPython = function(dir) {
  const python_text = python.pythonGenerator.workspaceToCode(Code.workspace);
  const file_name = 'ml_play_' + new Date().getTime() + '.py';
  const file_path = window.path.join(dir, file_name);
  window.file.write(file_path, python_text);
  return file_name;
};

/**
 * Let user select the path to a python file and save to it. 
 */
Code.savePython = function() {
  const pythonPath = window.path.save({
    title: "另存 Python 檔",
    defaultPath: path.join(Code.PROJECT_PATH, 'ml_play.py'),
    filters: [
        {name: 'Python', extensions: ['py']}
    ]
  });
  if (pythonPath === undefined) {
    return;
  } else {
    const pythonText = python.pythonGenerator.workspaceToCode(Code.workspace);
    const state = window.python_env.getCustom();
    const mlgameVerPath = (state.custom_python)? 
      window.path.join(path.dirname(state.custom_python_path), 'Lib', 'site-packages', 'mlgame', 'version.py') :
      window.path.join(__dirname, 'python', 'dist', 'interpreter', 'mlgame', 'version.py').replace('app.asar', 'app.asar.unpacked');
    const mlgameVerStr = (window.fs.existsSync(mlgameVerPath))? window.file.read(mlgameVerPath) : "version = unknown";
    const mlgameVer = (mlgameVerStr.match(/version\s*==*\s*"([\w.]*)"/) || ['', 'unknown'])[1];
    const verInfo = '"""\n' +
                    `created_at_utc  : ${dateformat(new Date(), "isoUtcDateTime")}\n` +
                    `created_at_w3c  : ${dateformat(new Date(), "yyyy-mm-dd'T'HH:MM:ssp")}\n` +
                    `PAIA-Desktop    : ${app.getVersion()}\n` +
                    `MLGame          : ${mlgameVer}\n` +
                    `game            : ${Code.GAME}\n` +
                    `game_version    : ${Code.GAME_VERSION}\n` +
                    '"""\n\n';
    window.file.write(pythonPath, verInfo + pythonText);
    // Add log
    // window.addLog('store_py', {
    //   type: "file",
    //   data: {
    //     name: path.basename(pythonPath)
    //   }
    // });
  }
};

/**
 * Show dialog for playing or run the code. 
 */
Code.run = function() {
  if (Code.MODE == 'play') {
    $('#run-mlgame-dialog').modal('show');
  } else {
    Code.execute();
  }
};

/**
 * Play the game according to the parameters. 
 */
Code.play = function() {
  const file_name = Code.saveTmpPython(Code.PROJECT_PATH);
  const file_path = path.join(Code.PROJECT_PATH, file_name);
  const fps = document.getElementById('game_fps').value;
  const args_elements = document.getElementById('game-args').getElementsByClassName('game-arg');
  const user_num = document.getElementById('user_num').value;;
  const args = [];
  const params = {};
  for (let i = 0; i < args_elements.length; i++) {
    const e = args_elements[i];
    args.push(`--${e.id.replace('param-', '')}`);
    if (e.tagName == "SELECT") {
      const value = e.options[e.selectedIndex].getAttribute("value");
      args.push(value);
      params[e.id] = value;
    } else {
      args.push(e.value);
      params[e.id] = e.value;
    }
  }
  let total_args = [];
  for (let i = 0; i < user_num; i++) {
    total_args = total_args.concat(['-i', file_name])
  }
  total_args = total_args.concat(['-f', fps, window.path.join(__dirname, 'games', Code.GAME).replace('app.asar', 'app.asar.unpacked')]).concat(args);
  const state = window.python_env.getCustom();
  const python_path = (state.custom_python)? state.custom_python_path :
    window.path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter').replace('app.asar', 'app.asar.unpacked');
  const options = {
    mode: 'text',
    pythonPath: python_path,
    pythonOptions: ['-m'],
    args: total_args
  };
  $('#run-mlgame-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').modal('show');
  window.python_env.run(options, "mlgame", file_path, Code.PROJECT_PATH);
  // GA4
  window.paia.ga('playAI', {
    event_category: 'playAI_desktop',
    game_name: Code.GAME,
    game_version: Code.GAME_VERSION
  });
};

/**
 * Execute python program. 
 */
Code.execute = function() {
  const file_name = Code.saveTmpPython(Code.PROJECT_PATH);
  const file_path = window.path.join(Code.PROJECT_PATH, file_name);
  const state = window.python_env.getCustom();
  const python_path = (state.custom_python)? state.custom_python_path :
    window.path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter').replace('app.asar', 'app.asar.unpacked');
  const options = {
    mode: 'text',
    pythonPath: python_path,
    scriptPath: Code.PROJECT_PATH,
    args: []
  };
  $('#run-python-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').modal('show');
  window.python_env.run(options, file_name, file_path, Code.PROJECT_PATH);
  // Add log
  // window.addLog('execute_py', {
  //   type: "game",
  //   data: {
  //     name: Code.GAME,
  //     id: 1,
  //     params: {}
  //   }
  // });
};

Code.showReadme = function() {
  const readme_path = path.join(__dirname, 'games', Code.GAME, 'README.md').replace('app.asar', 'app.asar.unpacked');
  const readme_text = window.file.read(readme_path);
  const readme = window.markdown.convert(readme_text);
  $('#readme-body').html(readme);
  $('#readme-dialog').modal('show');
};

Code.showTutorials = function() {
  $('#readme-dialog').modal('show');
};

Code.nextTutorials = function() {
  if (Code.tutorialsCurPage != Code.tutorialsTotalPage) {
    Code.tutorialsCurPage += 1;
  }
  const readme_path = path.join(__dirname, 'tutorial', 'tutorials', String(Code.tutorialsCurPage) + '.md');
  const readme_text = window.file.read(readme_path);
  const readme = window.markdown.convert(readme_text);
  $('#readme-body').html(readme);
};

Code.prevTutorials = function() {
  if (Code.tutorialsCurPage != 1) {
    Code.tutorialsCurPage -= 1;
  }
  const readme_path = path.join(__dirname, 'tutorial', 'tutorials', String(Code.tutorialsCurPage) + '.md');
  const readme_text = window.file.read(readme_path);
  const readme = window.markdown.convert(readme_text);
  $('#readme-body').html(readme);
};

/**
 * Show dialog for adding new project or load existing project. 
 */
Code.loadProject = function() {
  $('#project-dialog').data('bs.modal')._config.backdrop = true;
  $('#project-dialog').modal('show');
};

/**
 * Select the path of project.
 */
Code.selectProjectPath = function() {
  const dir = window.path.select({
    title: "選擇專案位置",
    defaultPath: $("#project-path").val(),
    properties: ["openDirectory"]
  });
  if (dir !== undefined) {
    $("#project-path").val(dir[0]);
    window.project.setPath(dir[0]);
  }
};

/**
 * Add new project. 
 */
Code.newProject = function() {
  if (Code.PROJECT_PATH != '') {
    window.file.unwatch(Code.PROJECT_PATH);
  }
  Code.PROJECT = $('#project-name').val();
  Code.PROJECT_PATH = path.join($('#project-path').val(), $('#project-name').val());
  const start = (app.getVersion().indexOf("competition-tn") != -1 && Code.GAME != "easy_game")?
    window.path.join(__dirname, 'examples', Code.GAME, 'tainan', '範例程式', '1. auto.xml') :
    window.path.join(__dirname, 'examples', Code.GAME, 'xml', '範例程式 1', '1. start.xml');
  try {
    if (!window.fs.existsSync(Code.PROJECT_PATH)) {
      window.fs.mkdirSync(Code.PROJECT_PATH, { recursive: true });
      $('#project_name').html(Code.PROJECT);
      if (window.fs.existsSync(start)) {
        Code.loadXml(start);
      }
      $('#project-dialog').modal('hide');
    } else if (window.popup.confirm(`${Code.PROJECT} 已存在，是否改為載入此專案？`)) {
      $('#project_name').html(Code.PROJECT);
      if(window.fs.existsSync(path.join(Code.PROJECT_PATH, 'ml_play.xml'))) {
        Code.loadXml(path.join(Code.PROJECT_PATH, 'ml_play.xml'))
      } else if (window.fs.existsSync(start)) {
        Code.loadXml(start);
      }
      $('#project-dialog').modal('hide');
      // Add log
      // window.addLog('import_project', {
      //   type: "project",
      //   data: {
      //     name: Code.PROJECT,
      //     game_name: Code.GAME,
      //     game_id: 1
      //   }
      // });
    }
  } catch(err) {
    window.popup.alert(err);
  }
  $("#project-link").attr("title", Code.PROJECT_PATH);
  window.file.watch(Code.PROJECT_PATH, (eventType, filename) => {
    Code.updateProjectList();
  });
  Code.updateProjectList();
};

/**
 * Load existing project.
 */
Code.openProject = function() {
  const dir = window.path.select({
    title: "開啟專案資料夾",
    defaultPath: window.project.getPath(),
    properties: ["openDirectory"]
  });
  if (dir === undefined) {
    return;
  } else {
    if (Code.PROJECT_PATH != '') {
      window.file.unwatch(Code.PROJECT_PATH);
    }
    Code.PROJECT_PATH = dir[0];
  }
  const start = (app.getVersion().indexOf("competition-tn") != -1 && Code.GAME != "easy_game")?
    window.path.join(__dirname, 'examples', Code.GAME, 'tainan', '範例程式', '1. auto.xml') :
    window.path.join(__dirname, 'examples', Code.GAME, 'xml', '範例程式 1', '1. start.xml');
  Code.PROJECT = window.path.basename(Code.PROJECT_PATH);
  $('#project_name').html(Code.PROJECT);
  if(window.fs.existsSync(window.path.join(Code.PROJECT_PATH, 'ml_play.xml'))) {
    Code.loadXml(path.join(Code.PROJECT_PATH, 'ml_play.xml'))
  } else if (fs.existsSync(start)) {
    Code.loadXml(start);
  }
  $('#project-dialog').modal('hide');
  // Add log
  // window.addLog('import_project', {
  //   type: "project",
  //   data: {
  //     name: Code.PROJECT,
  //     game_name: Code.GAME,
  //     game_id: 1
  //   }
  // });
  $("#project-link").attr("title", Code.PROJECT_PATH);
  window.file.watch(Code.PROJECT_PATH, (eventType, filename) => {
    Code.updateProjectList();
  });
  Code.updateProjectList();
};

/**
 * Reveal project directory.
 */
Code.revealProject = function() {
  window.path.open(Code.PROJECT_PATH);
};

/**
 * Export project directory.
 */
Code.exportProject = function() {
  var dest = window.path.select({
    title: "匯出專案資料夾",
    properties: ["openDirectory"]
  });
  if (dest === undefined) {
    return;
  } else {
    dest = dest[0];
  }
  var projectDir = path.join(dest, Code.PROJECT);
  if (!fs.existsSync(projectDir) || window.popup.confirm(`${projectDir} 已經存在，您要覆蓋它嗎？`)) {
    window.copyDir(Code.PROJECT_PATH, dest);
    // Add log
    // window.addLog('export_project', {
    //   type: "project",
    //   data: {
    //     name: Code.PROJECT,
    //     game_name: Code.GAME,
    //     game_id: 1
    //   }
    // });
  }
};

/**
 * Copy fileset token to clipboard.
 */
Code.copyClipboard = function(token, id) {
  window.clipboard.writeText(token);
  $(id).empty();
  $(id).append('<i class="bi bi-clipboard-check"></i>');
};

/**
 * Update fileset
 */
Code.updateFileset = function(index) {
  Code.FILESET_ID = index;
  $("#filset-dialog").modal("hide");
  $("#upload-filset-dialog").modal('show');
};

/**
 * Upload a fileset.
 */
Code.uploadFileset = function() {
  const data = {
    name: $("#filset-name").val(),
    description: $("#filset-description").val(),
    game: Code.GAME
  }
  let method = "POST";
  let apiPath = "fileset";
  if (Code.FILESET_ID >= 0) {
    method = "PATCH";
    apiPath += `/${Code.FILESET_ID}`;
  }
  window.api.paia(method, apiPath, data, 'USER_TOKEN').then((res) => {
    if (res.ok) {
      if (res.content.status == "success") {
        if (Code.FILESET_ID >= 0) {
          window.popup.alert(`檔案集更新成功`);
        } else {
          window.popup.alert(`檔案集新增成功，下載代碼：${res.content.data}`);
        }
        $("#upload-filset-dialog").modal('hide');
        Code.showFilesets();
      } else {
        window.popup.alert(`範例程式上傳失敗：${res.content.detail}`);
      }

    } else {
      console.log(res.content);
    }
  });
};

/**
 * Show all filesets in a dialog.
 */
Code.showFilesets = async function() {
  $("#fileset-list").empty();
  const response = await window.api.paia("GET", "fileset", null, 'USER_TOKEN');
  if (response.ok) {
    response.content.data.forEach((e) => {
      const $item = $('<div class="card" style="width: 100%;"></div>');
      const $header = $(`<div class="card-header" id="accordion-${e.id}"></div>`);
      $header.append(`<h2><button class="btn btn-focus-box-shadow btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse-${e.id}" aria-expanded="true" aria-controls="collapse-${e.id}"><span>${e.game} - ${e.name}</span><span class="float-right">更新時間：${e.updated_at.substring(0, 19)}</span></button></h2>`);
      $item.append($header);
      const $body = $(`<div id="collapse-${e.id}" class="collapse" aria-labelledby="accordion-${e.id}" data-parent="#fileset-list"></div>`);
      const $card_body = $(`<div class="card-body"></div>`);
      const $card_nav = $(`<div class="d-flex mb-3"></div>`)
      $card_nav.append(`<span class="ml-1">下載代碼：${e.token}</span>`);
      $card_nav.append(`<a onclick="Code.copyClipboard('${e.token}', '#clipboard-${e.id}');" id="clipboard-${e.id}" class="ml-3 btn btn-sm btn-secondary"><i class="bi bi-clipboard"></i></a>`);
      $card_nav.append(`<a onclick="Code.updateFilesetFile(${e.id});" class="ml-auto btn btn-sm btn-success float-right">新增檔案</a>`);
      $card_nav.append(`<a onclick="Code.updateFileset(${e.id});" class="ml-1 btn btn-sm btn-info float-right">更新檔案集</a>`);
      $card_nav.append(`<a onclick="Code.deleteFileset(${e.id});" class="ml-1 btn btn-sm btn-danger float-right">刪除檔案集</a>`);
      $card_body.append($card_nav);
      const $file_list = $('<ul class="list-group"><ul>');
      window.api.paia("GET", `fileset/${e.id}`, null, 'USER_TOKEN').then((res) => {
        if (res.ok) {  
          res.content.data.files.forEach((f) => {
            const $file = $(`<li class="list-group-item d-flex justify-content-between align-items-center">${f.file_name}</li>`);
            $file.append($(`<a onclick="Code.deleteFilesetFile(${e.id}, '${f.file_name}');" class="ml-auto btn btn-sm btn-danger float-right">刪除檔案</a>`));
            $file_list.append($file);
          });
        } else {
          console.log(res.content);
        }
      });
      $card_body.append($file_list);
      $body.append($card_body);
      $item.append($body);
      $("#fileset-list").append($item);
    })
  } else {
    console.log(response.content);
  };
  $("#filset-dialog").modal('show');
};

/**
 * Upload files to fileset.
 */
Code.updateFilesetFile = async function(index) {
  const filePath = window.path.select({
    title: "上傳檔案",
    defaultPath: Code.PROJECT_PATH,
    properties: ["openFile", "multiSelections"]
  });
  if (filePath === undefined) {
    return;
  }
  let error = 0;
  filePath.forEach((f) => {
    const data = new FormData();
    const name = path.basename(f);
    const file = new File([window.file.read(f)], name);
    data.append("files", file, name);
    window.api.paia("PUT", `fileset/${index}/file`, data, 'USER_TOKEN').then((res) => {
      if (res.ok)
        Code.showFilesets();
      else {
        console.log(response.content);
      }
    });
  })
  if (error > 0) {
    window.popup.alert(`${filePath.length} 個檔案上傳完成，其中 ${error} 個發生錯誤`);
  } else {
    window.popup.alert(`${filePath.length} 個檔案上傳完成`);
  }
  $("#download-filset-dialog").modal('hide');
};

/**
 * Use token to find fileset.
 */
Code.findFileset = function() {
  window.paiaAPI("GET", `shared_fileset?token=${$("#fileset-download-token").val()}`, null, false, 'DESKTOP_TOKEN', (res) => {
    if (res.status == "success") {
      Code.FILESET_FOUND = res.data;
      $("#fileset-author").html(res.data.author);  
      $("#fileset-name").html(res.data.name);  
      $("#fileset-updated-at").html(res.data.updated_at.substring(0, 19));  
      $("#fileset-data").collapse('show');
    } else {
      Code.FILESET_FOUND = null;
      $("#fileset-data").collapse('hide');
      window.popup.alert(`${res.detail}`);
    }
  }, (jqXHR, exception) => {
    Code.FILESET_FOUND = null;
    console.log("取得檔案集錯誤");
  });
};

/**
 * Download fileset.
 */
Code.downloadFileset = function() {
  var dir = path.join(__dirname, 'library', Code.GAME, `${Code.FILESET_FOUND.name}@${Code.FILESET_FOUND.token}`).replace('app.asar', 'app.asar.unpacked');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  } else if (!window.popup.confirm(`${dir} 已存在，是否要覆蓋此程式集？`)) {
    return;
  }
  $("#saved_filesets").html(`程式庫 <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`);
  var total = Code.FILESET_FOUND.files.length;
  var finish = 0;
  var error = 0;
  Code.FILESET_FOUND.files.forEach((e) => {
    var file = fs.createWriteStream(path.join(dir, e.file_name));
    require('https').get(e.file_url, (response) => {
      response.on('data', (d) => {
        file.write(d);
      });
      response.on('end', () => {
        file.close();
        finish++;
        if (finish + error == total) {
          if (error == 0) {
            window.popup.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成`);
          } else {
            window.popup.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成，${error} 個檔案發生錯誤`);
          }
          $("#saved_filesets").html(`程式庫`);
        }
      });
    }).on('error', (e) => {
      error++;
      if (finish + error == total) {
        window.popup.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成，${error} 個檔案發生錯誤`);
        $("#saved_filesets").html(`程式庫`);
      }
      console.error(e);
    });
  });
};

/**
 * Delete fileset.
 */
Code.deleteFileset = function(index) {
  if (window.popup.confirm("確定要刪除此檔案集嗎？")) {
    window.api.paia("DELETE", `fileset/${index}`, null, 'USER_TOKEN').then((res) => {
      if (res.ok) {
        if (res.content.status == "success") {
          window.popup.alert(`成功刪除檔案集`);
        } else {
          window.popup.alert(`${res.content.detail}`);
        }
        Code.showFilesets();
      } else {
        console.log(response.content);
        window.popup.alert(`刪除失敗：${response.content}`);
      }
    });
  }
};

/**
 * Download a file from fileset.
 */
Code.deleteFilesetFile = function(index, filename) {
  if (window.popup.confirm(`確定要刪除 ${filename} 嗎？`)) {
    var data = {
      filename: filename
    }
    window.paiaAPI("DELETE", `fileset/${index}/file`, data, false, 'USER_TOKEN', (res) => {
      if (res.status == "success") {
        window.popup.alert(`成功刪除檔案`);
      } else {
        window.popup.alert(`${res.detail}`);
      }
      Code.showFilesets();
    }, (jqXHR, exception) => {
      var msg = '';
      if (jqXHR.status === 0) {
          msg = '連線錯誤，請確認網路';
      } else if (jqXHR.status == 401) {
          msg = `${jqXHR.responseText} [401]`;
      } else if (exception === 'abort') {
          msg = 'Ajax request aborted.';
      } else {
          msg = 'Uncaught Error.\n' + jqXHR.responseText;
      }
      window.popup.alert(`刪除失敗：${msg}`);
    });
  }
};

// Load the Code demo's language strings.
document.write('<script src="js/ui_msg/' + Code.LANG + '.js"></script>\n');
// Load Blockly's language strings.
document.write('<script src="node_modules/blockly/msg/' + Code.LANG + '.js"></script>\n');
document.write('<script src="blockly/msg/' + Code.LANG + '.js"></script>\n');

const __dirname = window.path.dirname();

let customBlocksPath = window.path.join(__dirname, 'blockly', 'blocks');
if (window.fs.existsSync(customBlocksPath)) {
  window.fs.readdirSync(customBlocksPath).forEach(file => {
    if (file.endsWith(".js")) {
      document.write(`<script src="${window.path.join(customBlocksPath, file)}"></script>\n`);
    }
  });
}

customBlocksPath = window.path.join(__dirname, 'blockly', 'python');
if (window.fs.existsSync(customBlocksPath)) {
  window.fs.readdirSync(customBlocksPath).forEach(file => {
    if (file.endsWith(".js")) {
      document.write(`<script src="${window.path.join(customBlocksPath, file)}"></script>\n`);
    }
  });
}

customBlocksPath = path.join(__dirname, 'custom_blocks', Code.GAME).replace('app.asar', 'app.asar.unpacked');
if (fs.existsSync(customBlocksPath)) {
  fs.readdirSync(customBlocksPath).forEach(file => {
    if (file.endsWith(".js")) {
      document.write(`<script src="${path.join(customBlocksPath, file)}"></script>\n`);
    }
  });
}

window.addEventListener('load', Code.init);
window.deeplink.onLogin((event, token) => {
  Code.token_login(token);
  window.paia.ga('login', {
    event_category: 'deeplink_desktop',
    value: 'login'
  });
});
