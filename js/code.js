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
 * The name of opened project.
 */
Code.PROJECT = '';

/**
 * The file system watcher of opened project.
 */
Code.PROJECT_WATCHER = null;

/**
 * The mode of running program.
 */
Code.MODE = 'play';

/**
 * The mode of running program.
 */
Code.LOGIN = false;

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
  var xml = Blockly.Xml.textToDom(defaultXml);
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
  Code.attemptCodeGeneration(Blockly.Python);
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
  var blocks = Code.workspace.getAllBlocks(false);
  var missingBlockGenerators = [];
  for (var i = 0; i < blocks.length; i++) {
    var blockType = blocks[i].type;
    if (!generator[blockType]) {
      if (missingBlockGenerators.indexOf(blockType) == -1) {
        missingBlockGenerators.push(blockType);
      }
    }
  }

  var valid = missingBlockGenerators.length == 0;
  if (!valid) {
    var msg = 'The generator code for the following blocks not specified for ' +
        generator.name_ + ':\n - ' + missingBlockGenerators.join('\n - ');
    Blockly.alert(msg);  // Assuming synchronous. No callback.
  }
  return valid;
};

/**
 * Initialize Blockly.  Called on page load.
 */
Code.init = function() {
  // Add version to the title.
  document.title += ` ${app.getVersion()}`;
  
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

  // Initialize block msg
  Code.initMlgameBlocks();

  // Construct the toolbox XML, replacing translated variable names.
  var toolboxText = window.readFile(path.join(__dirname, 'js', 'toolbox', `${Code.GAME}_${"desktop"}.xml`));
  window.paiaAPI("GET", `toolbox?game=${Code.GAME}&env=desktop`, {}, false, null, (res) => {
    toolboxText = res.data;
  }, (jqXHR, exception) => {
    var msg = '';
    if (jqXHR.status === 0) {
        msg = '請確認網路連線，以取得最新的遊戲資訊';
    } else if (exception === 'abort') {
        msg = 'Ajax request aborted.';
    } else {
        msg = 'Uncaught Error.\n' + jqXHR.responseText;
    }
    window.alert(msg);
  });
  toolboxText = toolboxText.replace(/(^|[^%]){(\w+)}/g,
      function(m, p1, p2) {return p1 + MSG[p2];});
  var toolboxXml = Blockly.Xml.textToDom(toolboxText);
  
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
      if (Code.FOCUSED_XML != "") {
        Code.OPENED_XMLS[Code.FOCUSED_XML].$link.find('.not-saved').html('*');
        Code.OPENED_XMLS[Code.FOCUSED_XML].xml = Blockly.Xml.workspaceToDom(Code.workspace);
      }
      if (e.type == "finished_loading") {
        if (Code.OPENED_XMLS[Code.FOCUSED_XML].trashcan === undefined || Code.OPENED_XMLS[Code.FOCUSED_XML].trashcan.length == 0) {
          Code.workspace.trashcan.emptyContents();
        } else {
          Code.workspace.trashcan.contents_ = Code.OPENED_XMLS[Code.FOCUSED_XML].trashcan.slice();
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
  Blockly.prompt = function(message, defaultValue, callback) {
    vex.dialog.prompt({
      message: message,
      placeholder: defaultValue,
      callback: callback
    });
  };

  // Overide the length of indent.
  Blockly.Python.INDENT = "    ";
  
  // Update library dropdown menu
  var libraryDir = path.join(__dirname, 'library', Code.GAME.toLowerCase());
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
    var dir = path.join(__dirname, 'tutorials');
    fs.readdirSync(dir).forEach(file => {
      if (file.endsWith('.md')) {
        Code.tutorialsTotalPage++;
      };
    });
    Code.tutorialsCurPage = 1;
    var readme_path = path.join(__dirname, 'tutorials', String(Code.tutorialsCurPage) + '.md');
    var readme_text = window.readFile(readme_path);
    var showdown  = require('showdown'),
        converter = new showdown.Converter(),
        readme    = converter.makeHtml(readme_text);
    $('#readme-body').html(readme);
    Code.bindClick('show_readme',
      function() {Code.showTutorials(); Code.renderContent();});
  } else {
    Code.bindClick('show_readme',
      function() {Code.showReadme(); Code.renderContent();});
  }

  Code.bindClick('run',
      function() {Code.run(); Code.renderContent();});
  Code.bindClick('discard',
      function() {Code.discard(); Code.renderContent();});
  Code.bindClick('clean_trashcan',
      function() {Code.workspace.trashcan.emptyContents(); Code.renderContent();});
  Code.bindClick('show_python',
      function() {Code.showPython(); Code.renderContent();});
  Code.bindClick('login_logout',
      function() {Code.loginout(); Code.renderContent();});
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
      function() {window.openPath(path.join(__dirname, 'xml', 'examples', Code.GAME.toLowerCase())); Code.renderContent();});
  Code.bindClick('en',
      function() {Code.changeLanguage('en'); Code.renderContent();});
  Code.bindClick('zh-hant',
      function() {Code.changeLanguage('zh-hant'); Code.renderContent();});

  onresize();
  Blockly.svgResize(Code.workspace);
  onresize();
  Blockly.svgResize(Code.workspace);

  // Try to Use saved token to login.
  Code.token_login();

  // Show project dialog
  $('#project-dialog').modal('show');

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
  var config = JSON.parse(window.readFile(path.join(__dirname, 'MLGame', 'games', Code.GAME, 'game_config.json')));
  var $body = $('<div class="modal-body my-2"></div>')
  $body.append('<div class="form-group"><label for="">每秒顯示張數 (FPS)</label><input type="number" class="form-control", id="game_fps", min="1", max="300", step="1", value="30", data-bind="value:replyNumber"></div>');
  $('#game-args').append($body);
  for (var params of config['game_params']) {
    var $param = $('<div class="form-group"></div>');
    $param.append('<label for="">' + params["verbose"] + '</label>');
    if (params["type"] == "int") {
      if ("choices" in params) {
        $choices = $('<select class="form-control game-arg", id="' + params["name"] + '"></select>');
        for (var value of params['choices']) {
          if (params["default"] == value) {
            $choices.append('<option selected value="' + value + '">' + value + '</option>');
          } else {
            $choices.append('<option value="' + value + '">' + value + '</option>');
          }
        };
        $param.append($choices);
      } else {
        var step = 1;
        if ("step" in params) {
          step = params["step"];
        }
        $param.append('<input type="number" class="form-control game-arg", id="' + params["name"] + '", min="' + params["min"] + '", max="' + params["max"] + '", step="' + step + '", value="' + params["default"] + '", data-bind="value:replyNumber">');
      }
    } else if (params["type"] == "str") {
      var $choices = $('<select class="form-control game-arg", id="' + params["name"] + '"></select>');
      for (var choice of params['choices']) {
        if (typeof(choice) === "object") {
          if (params["default"] == choice["value"]) {
            $choices.append('<option selected value="' + choice["value"] + '">' + choice["verbose"] + '</option>');
          } else {
            $choices.append('<option value="' + choice["value"] + '">' + choice["verbose"] + '</option>');
          }
        } else {
          if (params["default"] == choice) {
            $choices.append('<option selected value="' + choice + '">' + choice + '</option>');
          } else {
            $choices.append('<option value="' + choice + '">' + choice + '</option>');
          }
        }
      }
      $param.append($choices);
    }
    $body.append($param);
  };
};

/**
 * Use blockly.json to initialize options of MLGame blocks.
 */
Code.initMlgameBlocks = function() {
  var configPath = path.join(__dirname, 'MLGame', 'games', Code.GAME, 'blockly.json');
  if (fs.existsSync(configPath)) {
    var gameOptions = JSON.parse(window.readFile(configPath));
    if ("INIT_INFO" in gameOptions) {
      var options = [];
      gameOptions["INIT_INFO"].forEach((op, index) => {
        var opName = `${Code.GAME.toUpperCase()}_INIT_INFO_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_INIT_INFO_OPTIONS"] = options;
    }

    if ("PLAYER_STATUS" in gameOptions) {
      var options = [];
      gameOptions["PLAYER_STATUS"].forEach((op, index) => {
        var opName = `${Code.GAME.toUpperCase()}_PLAYER_STATUS_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_PLAYER_STATUS_OPTIONS"] = options;
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
    }
  }
};

/**
 * Update library dropdown list.
 */
 Code.updateLibraryList = function() {
  $('#library').empty();
  var libraryDir = path.join(__dirname, 'library', Code.GAME.toLowerCase());
  var index = 0;
  fs.readdirSync(libraryDir, { withFileTypes: true }).forEach(dirent => {
    if (dirent.isDirectory()) {
      var filesetDir = path.join(libraryDir, dirent.name);
      $('#library').append($(`<a href="#library-${index}" data-toggle="collapse" aria-expanded="false" class="group mt-2" title="${filesetDir}"><i class="bi bi-caret-right-fill pointer mr-1"></i>${dirent.name}</a>`))
      var $list = $(`<ul class="collapse list-unstyled" id="library-${index}"></ul>`)
      $('#library').append($list);
      index++;
      fs.readdirSync(filesetDir).forEach(file => {
        if (file.endsWith(".xml")) {
          var filePath = path.join(filesetDir, file);
          $list.append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
          Code.bindClick(filePath,
            function() {Code.loadXml(filePath); Code.renderContent();});
        }
      });
    }
  });
};

/**
 * Update project files dropdown list.
 */
 Code.updateProjectList = function() {
  $('#project-files').empty();
  var projectDir = path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT);
  fs.readdirSync(projectDir).forEach(file => {
    if (file.endsWith(".xml")) {
      var filePath = path.join(projectDir, file);
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
      window.confirm(Blockly.Msg['DELETE_ALL_BLOCKS'].replace('%1', count))) {
    Code.workspace.clear();
    if (window.location.hash) {
      window.location.hash = '';
    }
  }
};

/**
 * Login or logout according to the state. 
 */
Code.loginout = function() {
  if (Code.LOGIN) {
    Code.logout();
  } else {
    $('#state-content').html('');
    $('#login-dialog').modal('show');
  }
};

Code.login = function() {
  var email = $('#email').val();
  var password = $('#password').val();
  var data = {
    "type": "general",
    "account": {
      "username": email,
      "password": password
    }
  };
  window.paiaAPI("POST", "auth/token", data, false, null, (res) => {
    window.setToken(res.access, res.refresh);
    $('#state-content').html('登入成功');
    Code.afterLogin();
  }, (jqXHR, exception) => {
    var msg = '';
    if (jqXHR.status === 0) {
        msg = '連線錯誤，請確認網路';
    } else if (jqXHR.status == 401) {
        msg = '密碼驗證錯誤 [401]';
    } else if (exception === 'abort') {
        msg = 'Ajax request aborted.';
    } else {
        msg = 'Uncaught Error.\n' + jqXHR.responseText;
    }
    console.log(msg);
  });
};

Code.google_login = function() {
  $('#state-content').html('請於瀏覽器登入，成功後會自動返回');
  try {
    myApiOauth.openAuthWindowAndGetTokens()
      .then(token => {
        var data = {
          type: "social",
          account: {
            provider: "google-desktop",
            id_token: token.id_token
          }
        };
        window.paiaAPI("POST", "auth/token", data, false, null, (res) => {
          window.setToken(res.access, res.refresh);
          Code.LOGIN = true;
          Code.afterLogin();
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
          console.log(msg);
        });
      });
  } catch(e) {
    console.log(e);
  }
};

Code.token_login = function() {
  console.log(window.getAccessToken(), window.getRefreshToken())
  if (window.getAccessToken() == "no token") {
    return;
  } else {
    window.paiaAPI("GET", "auth/token/verify", null, false, 'USER_TOKEN', (res) => {
      Code.afterLogin();
    }, (jqXHR, exception) => {
      if (jqXHR.status == 401) {
        var data = {
          refresh: window.getRefreshToken()
        };
        window.paiaAPI("POST", "auth/token/refresh", data, false, null, (res) => {
            window.setToken(res.access, window.getRefreshToken());
          }, (jqXHR, exception) => {
            window.clearToken();
            console.log("登入逾期，請重新登入");
          }
        );
      } else {
        window.clearToken();
        console.log("登入逾期，請重新登入");
      }
    });
  };
};

/**
 * Log out. 
 */
Code.logout = function() {
  Code.LOGIN = false;
  $('#login_logout').html('登入');
  $('#tab_user').text('尚未登入');
  document.querySelectorAll('.need-login').forEach(e => {
    e.classList.add("disabled");
  });
  window.sendLog();
  window.clearToken();
  window.resetStore();
};

/**
 * Update UI after login. 
 */
Code.afterLogin = function() {
  Code.LOGIN = true;
  $('#login_logout').html('登出');
  document.querySelectorAll('.need-login').forEach(e => {
    e.classList.remove("disabled");
  });
  window.paiaAPI("GET", "me", null, false, 'USER_TOKEN', (res) => {
    $('#tab_user').text(`${res.first_name} ${res.last_name}`);
  }, (jqXHR, exception) => {
    console.log("取得使用者資料錯誤");
    window.logout();
  });
  $('#login-dialog').modal('hide');
};

/**
 * Load example xml file from the folder of examples. 
 */
Code.loadExample = function(name) {
  var xmlPath = path.join(__dirname, 'xml', 'examples', Code.GAME.toLowerCase(), name + '.xml');
  Code.loadXml(xmlPath);
};

/**
 * Let user select the path to a xml file and load it. 
 */
Code.openXml = function() {
  var xmlPath = window.selectPath({
    title: "開啟 XML 檔",
    defaultPath: path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT),
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
  var name = path.basename(xmlPath);
  var index = 1;
  if (Code.FOCUSED_XML != "") {
    Code.OPENED_XMLS[Code.FOCUSED_XML].trashcan = Code.workspace.trashcan.contents_.slice();
  }
  while (name in Code.OPENED_XMLS) {
    if (Code.OPENED_XMLS[name].$link.prop('title') == xmlPath) {
      Code.workspace.clear();
      Blockly.Xml.domToWorkspace(Code.OPENED_XMLS[name].xml, Code.workspace);
      Code.workspace.setScale(Code.OPENED_XMLS[name].settings.scale);
      Code.workspace.scroll(Code.OPENED_XMLS[name].settings.x, Code.OPENED_XMLS[name].settings.y);
      $("#opened_xml a").removeClass("active");
      Code.OPENED_XMLS[name].$link.addClass("active");
      $("#opened_xml").animate({ scrollLeft: $("#opened_xml").scrollLeft() + Code.OPENED_XMLS[name].$item.position().left - $("#opened_xml").width()});
      Code.FOCUSED_XML = name;
      Code.workspace.setVisible(true);
      $("#content_blocks").css("visibility", "visible");
      $("#content_python").css("visibility", "hidden");
      return;
    } else {
      name = `${path.basename(xmlPath)} (${index})`;
      index++;
    }
  }
  try {
    var xmlText = window.readFile(xmlPath);
    var xml = Blockly.Xml.textToDom(xmlText);
    Code.workspace.clear();
    Blockly.Xml.domToWorkspace(xml, Code.workspace);
    Code.OPENED_XMLS[name] = {};
    Code.OPENED_XMLS[name].path = xmlPath;
    Code.OPENED_XMLS[name].xml = xml;
    Code.OPENED_XMLS[name].settings = {x: Code.workspace.scrollX, y: Code.workspace.scrollY, scale: Code.workspace.scale};
    var $item = $('<li class="nav-item"></li>');
    var $link = $(`<a class="nav-link pr-4" href="#" id="tab-${xmlPath}" title="${xmlPath}">${name}<span class="not-saved"></span>&ensp;</a>`);
    var $close = $(`<button class="p-0 border-0 bg-white tab-close" onclick="Code.closeXml('${name}')"><i class="bi bi-x"></i></button>`);
    $item.append($link);
    $item.append($close);
    $("#opened_xml").append($item);
    Code.bindClick(`tab-${xmlPath}`,
    function() {Code.loadXml(xmlPath); Code.renderContent();});
    $("#opened_xml a").removeClass("active");
    $link.addClass("active");
    $("#opened_xml").animate({ scrollLeft: $("#opened_xml").scrollLeft() + $item.position().left - $("#opened_xml").width()});
    Code.OPENED_XMLS[name].$item = $item;
    Code.OPENED_XMLS[name].$link = $link;
    Code.FOCUSED_XML = name;
    Code.workspace.setVisible(true);
    $("#content_blocks").css("visibility", "visible");
    $("#content_python").css("visibility", "hidden");
  } catch (err) {
    window.alert(err);
  }
};

/**
 * Close xml file and try to load another opened xml. 
 */
Code.closeXml = function(name) {
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
};

/**
 * Let user select the path to a xml file and save workscpace to it. 
 */
Code.saveXml = function() {
  var xmlPath = window.savePath({
    title: "儲存 XML 檔",
    defaultPath: path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT, 'ml_play.xml'),
    filters: [
        {name: 'XML', extensions: ['xml']}
    ]
  });
  if (xmlPath === undefined) {
    return;
  } else {
    var xml = Blockly.Xml.workspaceToDom(Code.workspace);
    var xmlText = Blockly.Xml.domToPrettyText(xml);
    window.writeFile(xmlPath, xmlText);
    Code.OPENED_XMLS[Code.FOCUSED_XML].$link.find('.not-saved').html('');
    // Add log
    window.addLog('store_xml', {
      type: "file",
      data: {
        name: path.basename(xmlPath)
      }
    });
  }
};

// Show python editor.
Code.showPython = function() {
  $("#content_python").css("visibility", "visible");
  $("#content_blocks").css("visibility", "hidden");
  Code.workspace.setVisible(false);
};

/**
 * Save temporary python file for execution. 
 */
Code.saveTmpPython = function(dir) {
  var python_text = Blockly.Python.workspaceToCode(Code.workspace);
  var file_name = 'ml_play_' + new Date().getTime() + '.py';
  var file_path = path.join(dir, file_name);
  window.writeFile(file_path, python_text);
  return file_name;
};

/**
 * Let user select the path to a python file and save to it. 
 */
Code.savePython = function() {
  var pythonPath = window.savePath({
    title: "另存 Python 檔",
    defaultPath: path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT, 'ml_play.py'),
    filters: [
        {name: 'Python', extensions: ['py']}
    ]
  });
  if (pythonPath === undefined) {
    return;
  } else {
    var pythonText = Blockly.Python.workspaceToCode(Code.workspace);
    window.writeFile(pythonPath, pythonText);
    // Add log
    window.addLog('store_py', {
      type: "file",
      data: {
        name: path.basename(pythonPath)
      }
    });
  }
};

/**
 * Show dialog for playing or run the code. 
 */
Code.run = function() {
  if (Code.MODE == 'play') {
    $('#run-mlgame-dialog').modal('show')
  } else {
    Code.execute();
  }
};

/**
 * Play the game according to the parameters. 
 */
Code.play = function() {
  var project_path = path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT);
  var file_name = Code.saveTmpPython(project_path);
  var file_path = path.join(project_path, file_name);
  var fps = document.getElementById('game_fps').value;
  var args_elements = document.getElementById('game-args').getElementsByClassName('game-arg');
  var user_num = 1;
  var args = [];
  var params = {};
  for (var i = 0; i < args_elements.length; i++) {
    var e = args_elements[i];
    if (e.id == "user_num") {
      user_num = parseInt(e.value, 10);
    }
    args.push(`--${e.id}`);
    if (e.tagName == "SELECT") {
      var value = e.options[e.selectedIndex].getAttribute("value");
      args.push(value);
      params[e.id] = value;
    } else {
      args.push(e.value);
      params[e.id] = e.value;
    }
  }
  var total_args = [];
  for (var i = 0; i < user_num; i++) {
    total_args = total_args.concat(['-i', `${Code.PROJECT}/${file_name}`])
  }
  total_args = total_args.concat(['-f', fps, Code.GAME]).concat(args);
  var options = {
    mode: 'text',
    pythonPath: path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter'),
    scriptPath: path.join(__dirname, 'MLGame'),
    args: total_args
  };
  $('#run-mlgame-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').modal('show');
  window.pythonRun(options, "MLGame.py", file_path, project_path);
  // Add log
  window.addLog('play_game', {
    type: "game",
    data: {
      name: Code.GAME,
      id: 1,
      params: params
    }
  });
};

/**
 * Execute python program. 
 */
Code.execute = function() {
  var project_path = path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT);
  var file_name = Code.saveTmpPython(project_path);
  var file_path = path.join(project_path, file_name);
  var options = {
    mode: 'text',
    pythonPath: path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter'),
    scriptPath: project_path,
    args: []
  };
  $('#run-python-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').modal('show');
  window.pythonRun(options, file_name, file_path, project_path);
  // Add log
  window.addLog('execute_py', {
    type: "game",
    data: {
      name: Code.GAME,
      id: 1,
      params: {}
    }
  });
};

Code.showReadme = function() {
  var readme_path = path.join(__dirname, 'MLGame', 'games', Code.GAME, 'README.md');
  var readme_text = window.readFile(readme_path);
  var showdown  = require('showdown'),
      converter = new showdown.Converter(),
      readme    = converter.makeHtml(readme_text);
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
  var readme_path = path.join(__dirname, 'tutorials', String(Code.tutorialsCurPage) + '.md');
  var readme_text = window.readFile(readme_path);
  var showdown  = require('showdown'),
      converter = new showdown.Converter(),
      readme    = converter.makeHtml(readme_text);
  $('#readme-body').html(readme);
};

Code.prevTutorials = function() {
  if (Code.tutorialsCurPage != 1) {
    Code.tutorialsCurPage -= 1;
  }
  var readme_path = path.join(__dirname, 'tutorials', String(Code.tutorialsCurPage) + '.md');
  var readme_text = window.readFile(readme_path);
  var showdown  = require('showdown'),
      converter = new showdown.Converter(),
      readme    = converter.makeHtml(readme_text);
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
 * Add new project. 
 */
Code.newProject = function() {
  Code.PROJECT = $('#project-name').val();
  var dir = path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      $('#project_name').html(Code.PROJECT);
      Code.loadExample('1. start')
      $('#file_name').html('1. start.xml');
      $('#project-dialog').modal('hide');
    } else if (window.confirm(`${Code.PROJECT} 已存在，是否改為載入此專案？`)) {
      $('#project_name').html(Code.PROJECT);
      if(fs.existsSync(path.join(dir, 'ml_play.xml'))) {
        Code.loadXml(path.join(dir, 'ml_play.xml'))
        $('#file_name').html('ml_play.xml');
      } else {
        Code.loadExample('1. start')
        $('#file_name').html('1. start.xml');
      }
      $('#project-dialog').modal('hide');
      // Add log
      window.addLog('import_project', {
        type: "project",
        data: {
          name: Code.PROJECT,
          game_name: Code.GAME,
          game_id: 1
        }
      });
    }
  } catch(err) {
    window.alert(err);
  }
  $("#project-link").attr("title", dir);
  if (Code.PROJECT_WATCHER !== null) {
    Code.PROJECT_WATCHER.close();
  }
  Code.PROJECT_WATCHER = fs.watch(dir, (eventType, filename) => {
    Code.updateProjectList();
  });
  Code.updateProjectList();
};

/**
 * Load existing project.
 */
Code.openProject = function() {
  var mlPath = path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml')
  var dir = window.selectPath({
    title: "開啟專案資料夾",
    defaultPath: mlPath,
    properties: ["openDirectory"]
  });
  if (dir === undefined) {
    return;
  } else {
    dir = dir[0];
  }
  var projectDir = path.join(mlPath, path.basename(dir));
  if (path.normalize(path.dirname(dir)) != path.normalize(mlPath)) {
    if (window.confirm('將複製此專案至遊戲資料夾下，是否繼續？')) {
      if (!fs.existsSync(projectDir)) {
        try {
          window.copyDir(dir, mlPath);
        } catch(err) {
          window.alert(err);
          return;
        }
      } else {
        window.alert(`無法複製專案：${projectDir} 已存在`);
        return;
      }
    } else {
      return;
    }
  }
  Code.PROJECT = path.basename(dir);
  $('#project_name').html(Code.PROJECT);
  if(fs.existsSync(path.join(projectDir, 'ml_play.xml'))) {
    Code.loadXml(path.join(projectDir, 'ml_play.xml'))
    $('#file_name').html('ml_play.xml');
  } else {
    Code.loadExample('1. start')
    $('#file_name').html('1. start.xml');
  }
  $('#project-dialog').modal('hide');
  // Add log
  window.addLog('import_project', {
    type: "project",
    data: {
      name: Code.PROJECT,
      game_name: Code.GAME,
      game_id: 1
    }
  });
  $("#project-link").attr("title", dir);
  if (Code.PROJECT_WATCHER !== null) {
    Code.PROJECT_WATCHER.close();
  }
  Code.PROJECT_WATCHER = fs.watch(dir, (eventType, filename) => {
    Code.updateProjectList();
  });
  Code.updateProjectList();
};

/**
 * Reveal project directory.
 */
Code.revealProject = function() {
  window.openPath(path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT));
};

/**
 * Export project directory.
 */
Code.exportProject = function() {
  var desktop = path.join(require('os').homedir(), 'Desktop');
  var dest = window.selectPath({
    title: "匯出專案資料夾",
    defaultPath: desktop,
    properties: ["openDirectory"]
  });
  if (dest === undefined) {
    return;
  } else {
    dest = dest[0];
  }
  var projectDir = path.join(dest, Code.PROJECT);
  if (!fs.existsSync(projectDir) || window.confirm(`${projectDir} 已經存在，您要覆蓋它嗎？`)) {
    var src = path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT);
    window.copyDir(src, dest);
    // Add log
    window.addLog('export_project', {
      type: "project",
      data: {
        name: Code.PROJECT,
        game_name: Code.GAME,
        game_id: 1
      }
    });
  }
};

/**
 * Copy fileset token to clipboard.
 */
Code.copyClipboard = function(token, id) {
  const { clipboard } = require('electron');
  clipboard.writeText(token);
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
  var data = {
    name: $("#filset-name").val(),
    description: $("#filset-description").val(),
    game: Code.GAME
  }
  var method = "POST";
  var apiPath = "fileset";
  if (Code.FILESET_ID >= 0) {
    method = "PATCH";
    apiPath += `/${Code.FILESET_ID}`;
  }
  window.paiaAPI(method, apiPath, data, false, 'USER_TOKEN', (res) => {
    if (res.status == "success") {
      if (Code.FILESET_ID >= 0) {
        window.alert(`檔案集更新成功`);
      } else {
        window.alert(`檔案集新增成功，下載代碼：${res.data}`);
      }
      $("#upload-filset-dialog").modal('hide');
    } else {
      window.alert(`範例程式上傳失敗：${res.detail}`);
    }
  }, (jqXHR, exception) => {
    var msg = '';
    if (jqXHR.status === 0) {
        msg = '連線錯誤，請確認網路';
    } else if (jqXHR.status == 401) {
        msg = '驗證錯誤 [401]';
    } else if (exception === 'abort') {
        msg = 'Ajax request aborted.';
    } else {
        msg = 'Uncaught Error.\n' + jqXHR.responseText;
    }
    window.alert(msg);
  });
};

/**
 * Show all filesets in a dialog.
 */
Code.showFilesets = function() {
  $("#fileset-list").empty();
  window.paiaAPI("GET", "fileset", null, false, 'USER_TOKEN', (res) => {
    res.data.forEach((e) => {
      var $item = $('<div class="card" style="width: 100%;"></div>');
      var $header = $(`<div class="card-header" id="accordion-${e.id}"></div>`);
      $header.append(`<h2><button class="btn btn-focus-box-shadow btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse-${e.id}" aria-expanded="true" aria-controls="collapse-${e.id}"><span>${e.game} - ${e.name}</span><span class="float-right">更新時間：${e.updated_at.substring(0, 19)}</span></button></h2>`);
      $item.append($header);
      var $body = $(`<div id="collapse-${e.id}" class="collapse" aria-labelledby="accordion-${e.id}" data-parent="#fileset-list"></div>`);
      var $card_body = $(`<div class="card-body"></div>`);
      var $card_nav = $(`<div class="d-flex mb-3"></div>`)
      $card_nav.append(`<span class="ml-1">下載代碼：${e.token}</span>`);
      $card_nav.append(`<a onclick="Code.copyClipboard('${e.token}', '#clipboard-${e.id}');" id="clipboard-${e.id}" class="ml-3 btn btn-sm btn-secondary"><i class="bi bi-clipboard"></i></a>`);
      $card_nav.append(`<a onclick="Code.updateFilesetFile(${e.id});" class="ml-auto btn btn-sm btn-success float-right">新增檔案</a>`);
      $card_nav.append(`<a onclick="Code.updateFileset(${e.id});" class="ml-1 btn btn-sm btn-info float-right">更新檔案集</a>`);
      $card_nav.append(`<a onclick="Code.deleteFileset(${e.id});" class="ml-1 btn btn-sm btn-danger float-right">刪除檔案集</a>`);
      $card_body.append($card_nav);
      var $file_list = $('<ul class="list-group"><ul>');
      window.paiaAPI("GET", `fileset/${e.id}`, null, false, 'USER_TOKEN', (res) => {
          res.data.files.forEach((f) => {
            var $file = $(`<li class="list-group-item d-flex justify-content-between align-items-center">${f.file_name}</li>`);
            $file.append($(`<a onclick="Code.deleteFilesetFile(${e.id}, '${f.file_name}');" class="ml-auto btn btn-sm btn-danger float-right">刪除檔案</a>`));
            $file_list.append($file);
          });
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
          console.log("取得檔案錯誤");
          console.log(msg);
        }
      );
      $card_body.append($file_list);
      $body.append($card_body);
      $item.append($body);
      $("#fileset-list").append($item);
    })
  }, (jqXHR, exception) => {
    console.log("取得檔案集錯誤");
  });
  $("#filset-dialog").modal('show');
};

/**
 * Upload files to fileset.
 */
Code.updateFilesetFile = function(index) {
  var filePath = window.selectPath({
    title: "上傳檔案",
    defaultPath: path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT),
    properties: ["openFile"]
  });
  if (filePath === undefined) {
    return;
  }
  $("#filset-dialog").modal('hide');
  var error = 0;
  filePath.forEach((f) => {
    var data = new FormData();
    var name = path.basename(f);
    var file = new File([window.readFile(f)], name);
    data.append("files", file, name);
    window.paiaAPI("PUT", `fileset/${index}/file`, data, false, 'USER_TOKEN', (res) => {
      $("#filset-dialog").modal('hide');
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
      console.log(`${path.basename(f)} 上傳失敗`);
      console.log(msg);
      error += 1;
    });
  })
  if (error > 0) {
    window.alert(`${filePath.length} 個檔案上傳完成，其中 ${error} 個發生錯誤`);
  } else {
    window.alert(`${filePath.length} 個檔案上傳完成`);
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
      window.alert(`${res.detail}`);
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
  var dir = path.join(__dirname, 'library', Code.GAME.toLowerCase(), `${Code.FILESET_FOUND.name}@${Code.FILESET_FOUND.token}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  } else if (!window.confirm(`${dir} 已存在，是否要覆蓋此程式集？`)) {
    return;
  }
  Code.FILESET_FOUND.files.forEach((e) => {
    var file = fs.createWriteStream(path.join(dir, e.file_name));
    require('https').get(e.file_url, (response) => {
      response.on('data', (d) => {
        file.write(d);
      });
    }).on('error', (error) => {
      window.alert(`${e.file_name} 下載錯誤： ${error}`);
    });
  });
};

/**
 * Delete fileset.
 */
Code.deleteFileset = function(index) {
  if (window.confirm("確定要刪除此檔案集嗎？")) {
    $("#filset-dialog").modal('hide');
    window.paiaAPI("DELETE", `fileset/${index}`, null, false, 'USER_TOKEN', (res) => {
      if (res.status == "success") {
        window.alert(`成功刪除檔案集`);
      } else {
        window.alert(`${res.detail}`);
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
      window.alert(`刪除失敗：${msg}`);
    });
  }
};

/**
 * Download a file from fileset.
 */
Code.deleteFilesetFile = function(index, filename) {
  if (window.confirm(`確定要刪除 ${filename} 嗎？`)) {
    $("#filset-dialog").modal('hide');
    var data = {
      filename: filename
    }
    window.paiaAPI("DELETE", `fileset/${index}/file`, data, false, 'USER_TOKEN', (res) => {
      if (res.status == "success") {
        window.alert(`成功刪除檔案`);
      } else {
        window.alert(`${res.detail}`);
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
      window.alert(`刪除失敗：${msg}`);
    });
  }
};

// Load the Code demo's language strings.
document.write('<script src="js/ui_msg/' + Code.LANG + '.js"></script>\n');
// Load Blockly's language strings.
document.write('<script src="node_modules/@paia-arena/blockly/msg/' + Code.LANG + '.js"></script>\n');
// Load game messages.
document.write('<script src="node_modules/@paia-arena/blockly/msg/mlgame/' + Code.GAME.toLowerCase() + '.js"></script>\n');

window.addEventListener('load', Code.init);
