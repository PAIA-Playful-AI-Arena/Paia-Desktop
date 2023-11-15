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
const Code = {};

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
  const libraryDir = window.path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  if (!window.fs.existsSync(libraryDir)) {
    window.fs.mkdirSync(libraryDir, { recursive: true });
  }
  window.fs.watch(libraryDir, (eventType, filename) => {
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
  Code.bindClick('logout',
      function() {Code.logout();});
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
      function() {window.openPath(window.path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked'));});
  Code.bindClick('en',
      function() {Code.changeLanguage('en');});
  Code.bindClick('zh-hant',
      function() {Code.changeLanguage('zh-hant');});

  // Try to Use saved token to login.
  if (await Code.token_login())
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
  const config = JSON.parse(window.file.read(window.path.join(__dirname, 'games', Code.GAME, 'game_config.json').replace('app.asar', 'app.asar.unpacked')));
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
    defaultPath: ($(`#${paramId}`).val() !== "")? $(`#${paramId}`).val() : window.path.join(__dirname, 'games', Code.GAME).replace('app.asar', 'app.asar.unpacked'),
    properties: ["openFile"]
  });
  if (paramPath !== undefined) {
    $(`#${paramId}`).val(paramPath[0]);
  } else {
    $(`#${paramId}`).val("");
  }
}

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
  let libraryDir = path.join(__dirname, 'examples', Code.GAME, 'python');
  if (window.fs.existsSync(libraryDir)) {
    window.fs.readdirSync(libraryDir).forEach(dirent => {
      const filesetDir = window.path.join(libraryDir, dirent);
      $('#library').append($(`<a href="#library-${index}" data-toggle="collapse" aria-expanded="false" class="group mt-2" title="${filesetDir}"><i class="bi bi-caret-right-fill pointer mr-1"></i>${dirent}</a>`))
      const $list = $(`<ul class="collapse list-unstyled" id="library-${index}"></ul>`)
      $('#library').append($list);
      index++;
      window.fs.readdirSync(filesetDir).forEach(file => {
        if (file.endsWith(".py")) {
          const filePath = window.path.join(filesetDir, file);
          $list.append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
          Code.bindClick(filePath,
            function() {Code.loadPython(filePath);});
        }
      });
    });
  }

  libraryDir = window.path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  window.fs.readdirSync(libraryDir).forEach(dirent => {
    const filesetDir = window.path.join(libraryDir, dirent);
    $('#library').append($(`<a href="#library-${index}" data-toggle="collapse" aria-expanded="false" class="group mt-2" title="${filesetDir}"><i class="bi bi-caret-right-fill pointer mr-1"></i>${dirent}</a>`));
    const $list = $(`<ul class="collapse list-unstyled" id="library-${index}"></ul>`)
    $('#library').append($list);
    index++;
    window.fs.readdirSync(filesetDir).forEach(file => {
      if (file.endsWith(".py")) {
        const filePath = window.path.join(filesetDir, file);
        $list.append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
        Code.bindClick(filePath,
          function() {Code.loadPython(filePath);});
      }
    });
  });
};

/**
 * Update project files dropdown list.
 */
Code.updateProjectList = function() {
  $('#project-files').empty();
  window.fs.readdirSync(Code.PROJECT_PATH).forEach(file => {
    if (file.endsWith(".py")) {
      const filePath = path.join(Code.PROJECT_PATH, file);
      $('#project-files').append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
      Code.bindClick(filePath,
        function() {Code.loadPython(filePath);});
    }
  });
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
};

/**
 * Let user select the path to a python file and load it. 
 */
Code.openPython = function() {
  let pythonPath = window.selectPath({
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
  let name = path.basename(pythonPath);
  if (pythonPath in Code.PATH_MAP) {
    name = Code.PATH_MAP[pythonPath];
    const pythonText = window.file.read(pythonPath);
    if (pythonText != Code.OPENED_PYTHONS[name].pythonText) {
      Code.OPENED_PYTHONS[name].pythonText = pythonText;
      if (window.popup.confirm(`${name} 已被更改過，是否重新載入？`)) {
        Code.OPENED_PYTHONS[name].$link.find('.not-saved').html('');
        Code.OPENED_PYTHONS[name].python = pythonText;
      }
    }
    Code.FOCUSED_PYTHON = "";
    Code.editor.setValue(Code.OPENED_PYTHONS[name].python);
    $("#opened_python a").removeClass("active");
    Code.OPENED_PYTHONS[name].$link.addClass("active");
    const tabPos = $("#opened_python").scrollLeft() + Code.OPENED_PYTHONS[name].$item.position().left;
    const scrollTarget = ($("#opened_python").width() - Code.OPENED_PYTHONS[name].$item.width()) / 2;
    $("#opened_python").animate({ scrollLeft: tabPos - scrollTarget });
    Code.FOCUSED_PYTHON = name;
    return;
  } else {
    let index = 1;
    while (name in Code.OPENED_PYTHONS) {
      name = `${path.basename(pythonPath)} (${index})`;
      index++;
    }
    try {
      const pythonText = window.file.read(pythonPath);
      Code.FOCUSED_PYTHON = "";
      Code.editor.setValue(pythonText);
      Code.PATH_MAP[pythonPath] = name;
      Code.OPENED_PYTHONS[name] = {};
      Code.OPENED_PYTHONS[name].path = pythonPath;
      Code.OPENED_PYTHONS[name].python = pythonText;
      Code.OPENED_PYTHONS[name].pythonText = pythonText;
      const $item = $('<li class="nav-item"></li>');
      const $link = $(`<a class="nav-link pr-4" href="#" id="tab-${pythonPath}" title="${pythonPath}">${name}<span class="not-saved"></span>&ensp;</a>`);
      const $close = $(`<button class="p-0 border-0 bg-white tab-close" id="close-${pythonPath}"><i class="bi bi-x"></i></button>`);
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
      const tabPos = $("#opened_python").scrollLeft() + $item.position().left;
      const scrollTarget = ($("#opened_python").width() - $item.width()) / 2;
      $("#opened_python").animate({ scrollLeft: tabPos - scrollTarget });
      Code.OPENED_PYTHONS[name].$item = $item;
      Code.OPENED_PYTHONS[name].$link = $link;
      Code.FOCUSED_PYTHON = name;
    } catch (err) {
      window.popup.alert(err);
    }
  }
};

/**
 * Close Python file and try to load another opened Python. 
 */
Code.closePython = function(pythonPath) {
  const name = Code.PATH_MAP[pythonPath];
  if (Code.OPENED_PYTHONS[name].$link.find('.not-saved').html() == '*' &&
      !window.popup.confirm(`${name} 有尚未儲存的修改，關閉後將遺失，是否確定關閉檔案？`)) {
    return;
  }
  if (Code.OPENED_PYTHONS[name].$link.hasClass('active')) {
    const $links = $("#opened_python .nav-link");
    const index = $links.index(Code.OPENED_PYTHONS[name].$link);
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
    defaultPath: window.path.join(Code.PROJECT_PATH, Code.FOCUSED_PYTHON),
    filters: [
        {name: 'Python', extensions: ['py']}
    ]
  });
  if (pythonPath === undefined) {
    return;
  } else {
    const pythonText = Code.editor.getValue();
    window.file.write(pythonPath, pythonText);
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
  }
};

/**
 * Save temporary python file for execution. 
 */
 Code.saveTmpPython = function(dir) {
  const python_text = Code.editor.getValue();
  const file_name = 'ml_play_' + new Date().getTime() + '.py';
  const file_path = window.path.join(dir, file_name);
  window.file.write(file_path, python_text);
  return file_name;
};

/**
 * Play the game according to the parameters. 
 */
Code.play = function() {
  const file_name = Code.saveTmpPython(Code.PROJECT_PATH);
  const file_path = window.path.join(Code.PROJECT_PATH, file_name);
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
  total_args = total_args.concat(['-f', fps, path.join(__dirname, 'games', Code.GAME).replace('app.asar', 'app.asar.unpacked')]).concat(args);
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
};

Code.showReadme = function() {
  const readme_path = window.path.join(__dirname, 'games', Code.GAME, 'README.md').replace('app.asar', 'app.asar.unpacked');
  const readme_text = window.file.read(readme_path);
  const readme = window.markdown.convert(readme_text);
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
  const dir = window.selectPath({
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
  Code.PROJECT_PATH = window.path.join($('#project-path').val(), $('#project-name').val());
  const start = window.path.join(__dirname, 'examples', Code.GAME, 'python', '範例程式', '1. start.py');
  try {
    if (!window.fs.existsSync(Code.PROJECT_PATH)) {
      window.fs.mkdirSync(Code.PROJECT_PATH, { recursive: true });
      $('#project_name').html(Code.PROJECT);
      if (window.fs.existsSync(start)) {
        Code.loadPython(start);
      }
      $('#project-dialog').modal('hide');
    } else if (window.popup.confirm(`${Code.PROJECT} 已存在，是否改為載入此專案？`)) {
      $('#project_name').html(Code.PROJECT);
      if (window.fs.existsSync(window.path.join(Code.PROJECT_PATH, 'ml_play.py'))) {
        Code.loadPython(window.path.join(Code.PROJECT_PATH, 'ml_play.py'));
      } else if (window.fs.existsSync(start)) {
        Code.loadPython(start);
      }
      $('#project-dialog').modal('hide');
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
  const dir = window.selectPath({
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
  const start = window.path.join(__dirname, 'examples', Code.GAME, 'python', '範例程式', '1. start.py');
  Code.PROJECT = window.path.basename(Code.PROJECT_PATH);
  $('#project_name').html(Code.PROJECT);
  if(window.fs.existsSync(window.path.join(Code.PROJECT_PATH, 'ml_play.py'))) {
    Code.loadPython(window.path.join(Code.PROJECT_PATH, 'ml_play.py'));
  } else {
    Code.loadPython(start);
  }
  $('#project-dialog').modal('hide');
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
  let dest = window.selectPath({
    title: "匯出專案資料夾",
    properties: ["openDirectory"]
  });
  if (dest === undefined) {
    return;
  } else {
    dest = dest[0];
  }
  const projectDir = window.path.join(dest, Code.PROJECT);
  if (!window.fs.existsSync(projectDir) || window.popup.confirm(`${projectDir} 已經存在，您要覆蓋它嗎？`)) {
    window.dir.copy(Code.PROJECT_PATH, dest);
    window.path.open(dest);
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
Code.updateFileset = function(index, name="", description="") {
  Code.FILESET_ID = index;
  $("#filset-name").val(name)
  $("#filset-description").val(description)
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
    game: "arkanoid"
  }
  let method = "POST";
  let apiPath = "fileset";
  if (Code.FILESET_ID >= 0) {
    method = "PATCH";
    apiPath += `/${Code.FILESET_ID}`;
  }
  window.api.paia(method, apiPath, data, 'USER_TOKEN', "v1").then((res) => {
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
  const response = await window.api.paia("GET", "fileset", null, 'USER_TOKEN', "v1");
  if (response.ok) {
    response.content.data.forEach((e) => {
      const $item = $('<div class="card" style="width: 100%;"></div>');
      const $header = $(`<div class="card-header" id="accordion-${e.id}"></div>`);
      $header.append(`<h2><button class="btn btn-focus-box-shadow btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse-${e.id}" aria-expanded="true" aria-controls="collapse-${e.id}"><span>${e.name}</span><span class="float-right">更新時間：${e.updated_at.substring(0, 19)}</span></button></h2>`);
      $item.append($header);
      const $body = $(`<div id="collapse-${e.id}" class="collapse" aria-labelledby="accordion-${e.id}" data-parent="#fileset-list"></div>`);
      const $card_body = $(`<div class="card-body"></div>`);
      const $description = $(`<div class="d-flex ml-1 mb-3">描述：${e.description}</div>`)
      $card_body.append($description);
      const $card_nav = $(`<div class="d-flex mb-3"></div>`)
      $card_nav.append(`<span class="ml-1">下載代碼：${e.token}</span>`);
      $card_nav.append(`<a onclick="Code.copyClipboard('${e.token}', '#clipboard-${e.id}');" id="clipboard-${e.id}" class="ml-3 btn btn-sm btn-secondary"><i class="bi bi-clipboard"></i></a>`);
      $card_nav.append(`<a onclick="Code.updateFilesetFile(${e.id});" class="ml-auto btn btn-sm btn-success float-right">新增檔案</a>`);
      $card_nav.append(`<a onclick="Code.updateFileset(${e.id}, '${e.name}', '${e.description}');" class="ml-1 btn btn-sm btn-info float-right">更新檔案集</a>`);
      $card_nav.append(`<a onclick="Code.deleteFileset(${e.id});" class="ml-1 btn btn-sm btn-danger float-right">刪除檔案集</a>`);
      $card_body.append($card_nav);
      const $file_list = $('<ul class="list-group"><ul>');
      window.api.paia("GET", `fileset/${e.id}`, null, 'USER_TOKEN', "v1").then((res) => {
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
Code.updateFilesetFile = function(index) {
  const filePath = window.path.select({
    title: "上傳檔案",
    defaultPath: Code.PROJECT_PATH,
    properties: ["openFile", "multiSelections"]
  });
  if (filePath === undefined) {
    return;
  }
  let error = 0;
  let finish = 0;
  filePath.forEach((f) => {
    window.api.paia("PUT", `fileset/${index}/file`, null, 'USER_TOKEN', "v1", f).then((res) => {
      if (res.ok) {
        if (res.content.status == "success")  
          finish++;
        else 
          console.log(res.content);
      }
      else {
        error++;
        console.log(res)
      }
      if (error + finish == filePath.length) {
        if (error > 0) {
          window.popup.alert(`${filePath.length} 個檔案上傳完成，其中 ${error} 個發生錯誤`);
        } else {
          window.popup.alert(`${filePath.length} 個檔案上傳完成`);
        }
        $("#download-filset-dialog").modal('hide');
        Code.showFilesets();
      }
    });
  })
};

/**
 * Use token to find fileset.
 */
Code.findFileset = function() {
  window.api.paia("GET", `shared_fileset?token=${$("#fileset-download-token").val()}`, null, 'DESKTOP_TOKEN', "v1").then((res) => {
    if (res.ok) {
      if (res.content.status == "success") {
        Code.FILESET_FOUND = res.content.data;
        $("#fileset-author").html(res.content.data.author);  
        $("#fileset-name").html(res.content.data.name);  
        $("#fileset-updated-at").html(res.content.data.updated_at.substring(0, 19));  
        $("#fileset-data").collapse('show');
      } else {
        Code.FILESET_FOUND = null;
        $("#fileset-data").collapse('hide');
        window.popup.alert(`${res.content.detail}`);
      }
    } else {
      console.log(response.content);
    };
  })
};

/**
 * Download fileset.
 */
Code.downloadFileset = function() {
  const dir = window.path.join(__dirname, 'library', Code.GAME, `${Code.FILESET_FOUND.name}@${Code.FILESET_FOUND.token}`).replace('app.asar', 'app.asar.unpacked');
  if (!window.fs.existsSync(dir)) {
    window.fs.mkdirSync(dir, { recursive: true });
  } else if (!window.popup.confirm(`${dir} 已存在，是否要覆蓋此程式集？`)) {
    return;
  }
  $("#saved_filesets").html(`程式庫 <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`);
  const total = Code.FILESET_FOUND.files.length;
  let finish = 0;
  let error = 0;
  Code.FILESET_FOUND.files.forEach((e) => {
    window.https.get(e.file_url, window.path.join(dir, e.file_name), (d) => {
    }, () => {
      finish++;
      if (finish + error == total) {
        if (error == 0) {
          window.popup.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成`);
        } else {
          window.popup.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成，${error} 個檔案發生錯誤`);
        }
        $("#saved_filesets").html(`程式庫`);
      }
    }, (e) => {
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
    window.api.paia("DELETE", `fileset/${index}`, null, 'USER_TOKEN', "v1").then((res) => {
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
    const data = {
      filename: filename
    }
    window.api.paia("DELETE", `fileset/${index}/file`, data, 'USER_TOKEN', "v1").then((res) => {
      if (res.content.status == "success") {
        window.popup.alert(`成功刪除檔案`);
      } else {
        window.popup.alert(`${res.content.detail}`);
      }
      Code.showFilesets();
    })
  }
};

// Load the Code demo's language strings.
document.write('<script src="js/ui_msg/' + Code.LANG + '.js"></script>\n');

const __dirname = path.dirname();

window.addEventListener('load', Code.init);
window.deeplink.onLogin((event, token) => {
  Code.token_login(token);
  window.paia.ga('login', {
    event_category: 'deeplink_desktop',
    value: 'login'
  });
});
