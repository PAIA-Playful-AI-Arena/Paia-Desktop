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
Code.OPENED_PYTHONS = {};

/**
 * The mapping from paths to displayed names.
 */
Code.PATH_MAP = {};

 /**
 * The name of currently focused Python.
 */
Code.FOCUSED_PYTHON = "";

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

Code.setNavWidth = function() {
  var width = $("#tab_list").width() - $("#tab_user").width() - $("#tab_lang").width() - $("#tab_option").width() - 110;
  $("#opened_python").css("max-width", `${width}px`);
};

/**
 * Initialize Blockly.  Called on page load.
 */
Code.init = function() {
  // Add version to the title.
  document.title += ` ${app.getVersion()}`;
  
  // Hide fileset download part when competition mode is true.
  if (app.getVersion().indexOf("competition") != -1) {
    $("#fileset_download_div").css("display", "none");
  }
  
  // Init default project path.
  $("#project-path").val(window.getProjectPath());
  
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

  // Make opened python tabs scrollable.
  $("#opened_python").on("mousewheel", function(event) {
    var curPos = $("#opened_python").scrollLeft();
    $("#opened_python").scrollLeft(curPos - event.originalEvent.wheelDelta / 5);
  });
  Code.setNavWidth();
  
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

  // Set callback function when window is resized.
  window.addEventListener('resize', Code.setNavWidth, false);

  // Change tab key to spaces
  Code.editor.setOption("extraKeys", {
    Tab: function(cm) {
      var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
      cm.replaceSelection(spaces);
    }
  });

  // Set the mode if editor is changed.
  Code.editor.on("change", (changeObj) => {
    if (Code.FOCUSED_PYTHON != "") {
      Code.OPENED_PYTHONS[Code.FOCUSED_PYTHON].python = Code.editor.getValue();
      if (Code.OPENED_PYTHONS[Code.FOCUSED_PYTHON].python != Code.OPENED_PYTHONS[Code.FOCUSED_PYTHON].pythonText) {
        Code.OPENED_PYTHONS[Code.FOCUSED_PYTHON].$link.find('.not-saved').html('*');
      } else {
        Code.OPENED_PYTHONS[Code.FOCUSED_PYTHON].$link.find('.not-saved').html('');
      }
    }
  });

  // Update library dropdown menu
  var libraryDir = path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  if (!fs.existsSync(libraryDir)) {
    fs.mkdirSync(libraryDir, { recursive: true });
  }
  fs.watch(libraryDir, (eventType, filename) => {
    Code.updateLibraryList();
  });
  Code.updateLibraryList();

  Code.bindClick('show_readme',
      function() {Code.showReadme();});
  Code.bindClick('run_mlgame',
      function() {$('#run-mlgame-dialog').modal('show');});
  Code.bindClick('run_python',
      function() {Code.execute();});
  Code.bindClick('custom_python',
      function() {Code.showCustomPython();});
  Code.bindClick('custom_python_button',
      function() {Code.selectCustomPython();});
  Code.bindClick('login_logout',
      function() {Code.loginout();});
  Code.bindClick('show_filesets',
      function() {Code.showFilesets();});
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
      function() {window.openPath(path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked'));});
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
  var config = JSON.parse(window.readFile(path.join(__dirname, 'games', Code.GAME, 'game_config.json').replace('app.asar', 'app.asar.unpacked')));
  var $body = $('<div class="modal-body my-2"></div>')
  $body.append('<div class="form-group"><label for="">每秒顯示張數 (FPS)</label><input type="number" class="form-control", id="game_fps", min="1", max="300", step="1", value="30", data-bind="value:replyNumber"></div>');
  var userNumConfig = config['user_num'];
  $body.append(`<div class="form-group"><label for="">玩家人數</label><input type="number" class="form-control", id="user_num", min="${userNumConfig.min}", max="${userNumConfig.max}", step="1", value="${userNumConfig.min}", data-bind="value:replyNumber"></div>`);
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
 * Show dialog for custom Python.
 */
Code.showCustomPython = function() {
  var state = window.getCustomPython();
  $("#custom-python-check").prop('checked', state.custom_python);
  $("#custom-python-path").html(state.custom_python_path);
  $('#custom-python-dialog').modal('show');
};

/**
 * Select path for custom Python.
 */
Code.selectCustomPython = function() {
  var curPath = window.getCustomPython().custom_python_path;
  if (curPath == "" || !fs.existsSync(curPath)) {
    curPath = path.join(require('os').homedir(), 'Desktop');
  }
  var pythonPath = window.selectPath({
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
  window.setCustomPython($("#custom-python-check").prop('checked'), $("#custom-python-path").html());
  $('#custom-python-dialog').modal('hide');
};

/**
 * Update library dropdown list.
 */
Code.updateLibraryList = function() {
  $('#library').empty();
  var index = 0;
  var libraryDir = path.join(__dirname, 'examples', Code.GAME, 'python');
  if (fs.existsSync(libraryDir)) {
    fs.readdirSync(libraryDir, { withFileTypes: true }).forEach(dirent => {
      if (dirent.isDirectory()) {
        var filesetDir = path.join(libraryDir, dirent.name);
        $('#library').append($(`<a href="#library-${index}" data-toggle="collapse" aria-expanded="false" class="group mt-2" title="${filesetDir}"><i class="bi bi-caret-right-fill pointer mr-1"></i>${dirent.name}</a>`))
        var $list = $(`<ul class="collapse list-unstyled" id="library-${index}"></ul>`)
        $('#library').append($list);
        index++;
        fs.readdirSync(filesetDir).forEach(file => {
          if (file.endsWith(".py")) {
            var filePath = path.join(filesetDir, file);
            $list.append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
            Code.bindClick(filePath,
              function() {Code.loadPython(filePath);});
          }
        });
      }
    });
  }

  var libraryDir = path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  fs.readdirSync(libraryDir, { withFileTypes: true }).forEach(dirent => {
    if (dirent.isDirectory()) {
      var filesetDir = path.join(libraryDir, dirent.name);
      $('#library').append($(`<a href="#library-${index}" data-toggle="collapse" aria-expanded="false" class="group mt-2" title="${filesetDir}"><i class="bi bi-caret-right-fill pointer mr-1"></i>${dirent.name}</a>`))
      var $list = $(`<ul class="collapse list-unstyled" id="library-${index}"></ul>`)
      $('#library').append($list);
      index++;
      fs.readdirSync(filesetDir).forEach(file => {
        if (file.endsWith(".py")) {
          var filePath = path.join(filesetDir, file);
          $list.append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
          Code.bindClick(filePath,
            function() {Code.loadPython(filePath);});
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
  fs.readdirSync(Code.PROJECT_PATH).forEach(file => {
    if (file.endsWith(".py")) {
      var filePath = path.join(Code.PROJECT_PATH, file);
      $('#project-files').append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
      Code.bindClick(filePath,
        function() {Code.loadPython(filePath);});
    }
  });
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
  Code.setNavWidth();
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
  Code.setNavWidth();
  $('#login-dialog').modal('hide');
};

/**
 * Let user select the path to a python file and load it. 
 */
Code.openPython = function() {
  var pythonPath = window.selectPath({
    title: "開啟 Python 檔",
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
};

/**
 * Load python file to editor. 
 */
Code.loadPython = function(pythonPath) {
  var name = path.basename(pythonPath);
  if (pythonPath in Code.PATH_MAP) {
    name = Code.PATH_MAP[pythonPath];
    var pythonText = window.readFile(pythonPath);
    if (pythonText != Code.OPENED_PYTHONS[name].pythonText) {
      Code.OPENED_PYTHONS[name].pythonText = pythonText;
      if (window.confirm(`${name} 已被更改過，是否重新載入？`)) {
        Code.OPENED_PYTHONS[name].$link.find('.not-saved').html('');
        Code.OPENED_PYTHONS[name].python = pythonText;
      }
    }
    Code.FOCUSED_PYTHON = "";
    Code.editor.setValue(Code.OPENED_PYTHONS[name].python);
    $("#opened_python a").removeClass("active");
    Code.OPENED_PYTHONS[name].$link.addClass("active");
    var tabPos = $("#opened_python").scrollLeft() + Code.OPENED_PYTHONS[name].$item.position().left;
    var scrollTarget = ($("#opened_python").width() - Code.OPENED_PYTHONS[name].$item.width()) / 2;
    $("#opened_python").animate({ scrollLeft: tabPos - scrollTarget });
    Code.FOCUSED_PYTHON = name;
    return;
  } else {
    var index = 1;
    while (name in Code.OPENED_PYTHONS) {
      name = `${path.basename(pythonPath)} (${index})`;
      index++;
    }
    try {
      var pythonText = window.readFile(pythonPath);
      Code.FOCUSED_PYTHON = "";
      Code.editor.setValue(pythonText);
      Code.PATH_MAP[pythonPath] = name;
      Code.OPENED_PYTHONS[name] = {};
      Code.OPENED_PYTHONS[name].path = pythonPath;
      Code.OPENED_PYTHONS[name].python = pythonText;
      Code.OPENED_PYTHONS[name].pythonText = pythonText;
      var $item = $('<li class="nav-item"></li>');
      var $link = $(`<a class="nav-link pr-4" href="#" id="tab-${pythonPath}" title="${pythonPath}">${name}<span class="not-saved"></span>&ensp;</a>`);
      var $close = $(`<button class="p-0 border-0 bg-white tab-close" id="close-${pythonPath}"><i class="bi bi-x"></i></button>`);
      $item.append($link);
      $item.append($close);
      $("#opened_python").append($item);
      Code.bindClick(`tab-${pythonPath}`,
        function() {Code.loadPython(pythonPath);});
      Code.bindClick(`close-${pythonPath}`,
        function() {Code.closePython(pythonPath);});
      if (Code.PYTHON_EDITOR) {
        Code.togglePython();
      }
      $("#opened_python a").removeClass("active");
      $link.addClass("active");
      var tabPos = $("#opened_python").scrollLeft() + $item.position().left;
      var scrollTarget = ($("#opened_python").width() - $item.width()) / 2;
      $("#opened_python").animate({ scrollLeft: tabPos - scrollTarget });
      Code.OPENED_PYTHONS[name].$item = $item;
      Code.OPENED_PYTHONS[name].$link = $link;
      Code.FOCUSED_PYTHON = name;
    } catch (err) {
      window.alert(err);
    }
  }
};

/**
 * Close Python file and try to load another opened Python. 
 */
Code.closePython = function(pythonPath) {
  var name = Code.PATH_MAP[pythonPath];
  if (Code.OPENED_PYTHONS[name].$link.find('.not-saved').html() == '*' &&
      !window.confirm(`${name} 有尚未儲存的修改，關閉後將遺失，是否確定關閉檔案？`)) {
    return;
  }
  if (Code.OPENED_PYTHONS[name].$link.hasClass('active')) {
    var $links = $("#opened_python .nav-link");
    var index = $links.index(Code.OPENED_PYTHONS[name].$link);
    if (index - 1 >= 0) {
      $links[index - 1].click();
    } else if (index + 1 < $links.length) {
      $links[index + 1].click();
    } else {
      Code.FOCUSED_PYTHON = "";
    }
  }
  Code.OPENED_PYTHONS[name].$item.remove();
  delete Code.OPENED_PYTHONS[name];
  delete Code.PATH_MAP[pythonPath];
};

/**
 * Let user select the path to a python file and save to it. 
 */
Code.savePython = function() {
  var pythonPath = window.savePath({
    title: "儲存 Python 檔",
    defaultPath: path.join(Code.PROJECT_PATH, Code.FOCUSED_PYTHON),
    filters: [
        {name: 'Python', extensions: ['py']}
    ]
  });
  if (pythonPath === undefined) {
    return;
  } else {
    var pythonText = Code.editor.getValue();
    window.writeFile(pythonPath, pythonText);
    if (Code.FOCUSED_PYTHON != '') {
      Code.OPENED_PYTHONS[Code.FOCUSED_PYTHON].$link.find('.not-saved').html('');
      if (pythonPath == Code.OPENED_PYTHONS[Code.FOCUSED_PYTHON].path) {
        Code.OPENED_PYTHONS[Code.FOCUSED_PYTHON].pythonText = pythonText;
      } else {
        Code.closePython(Code.OPENED_PYTHONS[Code.FOCUSED_PYTHON].path);
        Code.loadPython(pythonPath);
      }
    } else {
      Code.loadPython(pythonPath);
    }
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
  var file_name = Code.saveTmpPython(Code.PROJECT_PATH);
  var file_path = path.join(Code.PROJECT_PATH, file_name);
  var fps = document.getElementById('game_fps').value;
  var args_elements = document.getElementById('game-args').getElementsByClassName('game-arg');
  var user_num = document.getElementById('user_num').value;;
  var args = [];
  var params = {};
  for (var i = 0; i < args_elements.length; i++) {
    var e = args_elements[i];
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
    total_args = total_args.concat(['-i', file_name])
  }
  total_args = total_args.concat(['-f', fps, path.join(__dirname, 'games', Code.GAME).replace('app.asar', 'app.asar.unpacked')]).concat(args);
  var state = window.getCustomPython();
  if (state.custom_python) {
    var python_path = state.custom_python_path;
  } else {
    var python_path = path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter').replace('app.asar', 'app.asar.unpacked');
  }
  var options = {
    mode: 'text',
    pythonPath: python_path,
    pythonOptions: ['-m'],
    args: total_args
  };
  $('#run-mlgame-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').modal('show');
  window.pythonRun(options, "mlgame", file_path, Code.PROJECT_PATH);
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
  var file_name = Code.saveTmpPython(Code.PROJECT_PATH);
  var file_path = path.join(Code.PROJECT_PATH, file_name);
  var state = window.getCustomPython();
  if (state.custom_python) {
    var python_path = state.custom_python_path;
  } else {
    var python_path = path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter').replace('app.asar', 'app.asar.unpacked');
  }
  var options = {
    mode: 'text',
    pythonPath: python_path,
    scriptPath: Code.PROJECT_PATH,
    args: []
  };
  $('#run-python-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').modal('show');
  window.pythonRun(options, file_name, file_path, Code.PROJECT_PATH);
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
  var readme_path = path.join(__dirname, 'games', Code.GAME, 'README.md').replace('app.asar', 'app.asar.unpacked');
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
 * Select the path of project.
 */
Code.selectProjectPath = function() {
  var dir = window.selectPath({
    title: "選擇專案位置",
    defaultPath: $("#project-path").val(),
    properties: ["openDirectory"]
  });
  if (dir !== undefined) {
    $("#project-path").val(dir[0]);
    window.setProjectPath(dir[0]);
  }
};

/**
 * Add new project. 
 */
Code.newProject = function() {
  Code.PROJECT = $('#project-name').val();
  Code.PROJECT_PATH = path.join($('#project-path').val(), $('#project-name').val());
  var dir = path.join(__dirname, 'games', Code.GAME, 'ml', Code.PROJECT).replace('app.asar', 'app.asar.unpacked');
  var start = path.join(__dirname, 'examples', Code.GAME, 'python', '範例程式', '1. start.py');
  try {
    if (!fs.existsSync(Code.PROJECT_PATH)) {
      fs.mkdirSync(Code.PROJECT_PATH, { recursive: true });
      $('#project_name').html(Code.PROJECT);
      if (fs.existsSync(start)) {
        Code.loadPython(start);
      }
      $('#project-dialog').modal('hide');
    } else if (window.confirm(`${Code.PROJECT} 已存在，是否改為載入此專案？`)) {
      $('#project_name').html(Code.PROJECT);
      if(fs.existsSync(path.join(Code.PROJECT_PATH, 'ml_play.py'))) {
        Code.loadPython(path.join(Code.PROJECT_PATH, 'ml_play.py'));
      } else if (fs.existsSync(start)) {
        Code.loadPython(start);
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
  $("#project-link").attr("title", Code.PROJECT_PATH);
  if (Code.PROJECT_WATCHER !== null) {
    Code.PROJECT_WATCHER.close();
  }
  Code.PROJECT_WATCHER = fs.watch(Code.PROJECT_PATH, (eventType, filename) => {
    Code.updateProjectList();
  });
  Code.updateProjectList();
};

/**
 * Load existing project.
 */
Code.openProject = function() {
  var mlPath = path.join(__dirname, 'games', Code.GAME, 'ml').replace('app.asar', 'app.asar.unpacked');
  var dir = window.selectPath({
    title: "開啟專案資料夾",
    defaultPath: window.getProjectPath(),
    properties: ["openDirectory"]
  });
  if (dir === undefined) {
    return;
  } else {
    Code.PROJECT_PATH = dir[0];
  }
  var start = path.join(__dirname, 'examples', Code.GAME, 'python', '範例程式', '1. start.py');
  Code.PROJECT = path.basename(Code.PROJECT_PATH);
  $('#project_name').html(Code.PROJECT);
  if(fs.existsSync(path.join(Code.PROJECT_PATH, 'ml_play.py'))) {
    Code.loadPython(path.join(Code.PROJECT_PATH, 'ml_play.py'));
  } else {
    Code.loadPython(start);
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
  $("#project-link").attr("title", Code.PROJECT_PATH);
  if (Code.PROJECT_WATCHER !== null) {
    Code.PROJECT_WATCHER.close();
  }
  Code.PROJECT_WATCHER = fs.watch(Code.PROJECT_PATH, (eventType, filename) => {
    Code.updateProjectList();
  });
  Code.updateProjectList();
};

/**
 * Reveal project directory.
 */
Code.revealProject = function() {
  window.openPath(Code.PROJECT_PATH);
};

/**
 * Export project directory.
 */
Code.exportProject = function() {
  var dest = window.selectPath({
    title: "匯出專案資料夾",
    properties: ["openDirectory"]
  });
  if (dest === undefined) {
    return;
  } else {
    dest = dest[0];
  }
  var projectDir = path.join(dest, Code.PROJECT);
  if (!fs.existsSync(projectDir) || window.confirm(`${projectDir} 已經存在，您要覆蓋它嗎？`)) {
    window.copyDir(Code.PROJECT_PATH, dest);
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
      Code.showFilesets();
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
    defaultPath: Code.PROJECT_PATH,
    properties: ["openFile", "multiSelections"]
  });
  if (filePath === undefined) {
    return;
  }
  var error = 0;
  filePath.forEach((f) => {
    var data = new FormData();
    var name = path.basename(f);
    var file = new File([window.readFile(f)], name);
    data.append("files", file, name);
    window.paiaAPI("PUT", `fileset/${index}/file`, data, false, 'USER_TOKEN', (res) => {
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
  var dir = path.join(__dirname, 'library', Code.GAME, `${Code.FILESET_FOUND.name}@${Code.FILESET_FOUND.token}`).replace('app.asar', 'app.asar.unpacked');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  } else if (!window.confirm(`${dir} 已存在，是否要覆蓋此程式集？`)) {
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
            window.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成`);
          } else {
            window.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成，${error} 個檔案發生錯誤`);
          }
          $("#saved_filesets").html(`程式庫`);
        }
      });
    }).on('error', (e) => {
      error++;
      if (finish + error == total) {
        window.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成，${error} 個檔案發生錯誤`);
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
  if (window.confirm("確定要刪除此檔案集嗎？")) {
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

window.addEventListener('load', Code.init);
