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
 * Save the blocks and reload with a different language.
 */
Code.changeLanguage = function(lang) {
  // Store the blocks for the duration of the reload.
  // MSIE 11 does not support sessionStorage on file:// URLs.

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
 * User's language (e.g. "en").
 * @type {string}
 */
Code.LANG = Code.getLang();

/**
 * List of tab names.
 * @private
 */
// Code.TABS_ = ['blocks', 'javascript', 'php', 'python', 'dart', 'lua', 'xml'];
Code.TABS_ = ['python'];

/**
 * List of tab names with casing, for display in the UI.
 * @private
 */
Code.TABS_DISPLAY_ = [
  'Python'
];

Code.selected = 'python';

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

  Code.initLanguage();

  Code.editor = CodeMirror.fromTextArea(document.getElementById('content_python'), {
    mode: "python",
    lineNumbers: true,
    smartIndent: true,
    indentUnit: 4,
    indentWithTabs: false,
    lineWrapping: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"], 
    foldGutter: true,
    autofocus: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true
  });

  // Change tab key to spaces
  Code.editor.setOption("extraKeys", {
    Tab: function(cm) {
      var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
      cm.replaceSelection(spaces);
    }
  });

  // Set the mode if editor is changed.
  Code.editor.on("change", (changeObj) => {
    $('#not_saved').html('*');
  });

  var example_dir = path.join(__dirname, 'python', 'examples', Code.GAME.toLowerCase());
  fs.readdirSync(example_dir).forEach(file => {
    if (file.endsWith('.py')) {
      var name = file.slice(0, -3);
      var element = document.createElement('a');
      element.setAttribute('class', 'dropdown-item');
      element.setAttribute('href', '#');
      element.setAttribute('id', name);
      element.textContent = file
      $('#examples').append(element);
      Code.bindClick(name,
          function() {Code.loadExample(name); Code.renderContent();});
    };
  });

  Code.bindClick('show_readme',
      function() {Code.showReadme();});
  Code.bindClick('run_mlgame',
      function() {$('#run-mlgame-dialog').modal('show');});
  Code.bindClick('run_python',
      function() {Code.execute();});
  Code.bindClick('load_project',
      function() {Code.loadProject();});
  Code.bindClick('reveal_project',
      function() {Code.revealProject();});
  Code.bindClick('export_project',
      function() {Code.exportProject();});
  Code.bindClick('save_python',
      function() {Code.savePython();});
  Code.bindClick('open_python',
      function() {Code.openPython();});
  Code.bindClick('open_example_dir',
      function() {window.openPath(path.join(__dirname, 'python', 'examples', Code.GAME.toLowerCase()));});
  Code.bindClick('en',
      function() {Code.changeLanguage('en');});
  Code.bindClick('zh-hant',
      function() {Code.changeLanguage('zh-hant');});

  // project
  $('#project-dialog').modal('show');

};

/**
 * Initialize the page language.
 */
Code.initLanguage = function() {
  // Inject language strings.
  document.getElementById('game_name').textContent = Code.GAME;
  document.getElementById('tab_lang').textContent = MSG['lang'];
  document.getElementById('tab_option').textContent = MSG['options'];
  document.getElementById('run_mlgame').textContent = MSG['runMLGame'];
  document.getElementById('run_python').textContent = MSG['runPython'];
  document.getElementById('save_python').textContent = MSG['download'];
  document.getElementById('open_python').textContent = MSG['openPython'];
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

Code.loadExample = function(name) {
  try {
    var pythonPath = path.join(__dirname, 'python', 'examples', Code.GAME.toLowerCase(), name + '.py');
    Code.loadPython(pythonPath);
  } catch (e) {
    console.log(e);
    return;
  }
};

/**
 * Load python file to editor. 
 */
 Code.loadPython = function(pythonPath) {
  try {
    Code.editor.setValue(window.readFile(pythonPath));
    $('#file_name').html(path.basename(pythonPath));
  } catch (err) {
    window.alert(err);
  }
};

/**
 * Let user select the path to a python file and load it. 
 */
 Code.openPython = function() {
  var pythonPath = window.selectPath({
    title: "開啟 Python 檔",
    defaultPath: path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT),
    filters: [
      {name: 'Python', extensions: ['py']}
    ],
    properties: ["openFile"]
  });
  if (pythonPath === undefined) {
    return;
  } else {
    pythonPath = pythonPath[0];
  }
  Code.loadPython(pythonPath);
}

/**
 * Let user select the path to a python file and save to it. 
 */
 Code.savePython = function() {
  var pythonPath = window.savePath({
    title: "儲存 Python 檔",
    defaultPath: path.join(__dirname, 'MLGame', 'games', Code.GAME, 'ml', Code.PROJECT, 'ml_play.py'),
    filters: [
        {name: 'Python', extensions: ['py']}
    ]
  });
  if (pythonPath === undefined) {
    return;
  } else {
    var pythonText = Code.editor.getValue();
    window.writeFile(pythonPath, pythonText);
    $('#not_saved').html('');
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
 * Save temporary python file for execution. 
 */
 Code.saveTmpPython = function(dir) {
  var python_text = Code.editor.getValue();
  var file_name = 'ml_play_' + new Date().getTime() + '.py';
  var file_path = path.join(dir, file_name);
  window.writeFile(file_path, python_text);
  return file_name;
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
      params[e.id] = user_num;
    }
    if (e.tagName == "SELECT") {
      var value = e.options[e.selectedIndex].getAttribute("value")
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
      $('#file_name').html('1. start.py');
      $('#project-dialog').modal('hide');
    } else if (window.confirm(`${Code.PROJECT} 已存在，是否改為載入此專案？`)) {
      $('#project_name').html(Code.PROJECT);
      if(fs.existsSync(path.join(dir, 'ml_play.py'))) {
        Code.editor.setValue(window.readFile(path.join(dir, 'ml_play.py')));
        $('#file_name').html('ml_play.py');
      } else {
        Code.loadExample('1. start')
        $('#file_name').html('1. start.py');
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
  if(fs.existsSync(path.join(dir, 'ml_play.py'))) {
    Code.editor.setValue(window.readFile(path.join(dir, 'ml_play.py')));
    $('#file_name').html('ml_play.py');
  } else {
    Code.loadExample('1. start')
    $('#file_name').html('1. start.py');
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

// Load the Code demo's language strings.
document.write('<script src="js/ui_msg/' + Code.LANG + '.js"></script>\n');

window.addEventListener('load', Code.init);
