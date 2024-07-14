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
Code.ID = (new URLSearchParams(window.location.search)).get('id');

/**
 * Get the name of the game.
 */
Code.GAME = (new URLSearchParams(window.location.search)).get('game');

/**
 * Get the name of the game.
 */
Code.GAME_VERSION = (new URLSearchParams(window.location.search)).get('ver');

/**
 * Get the path of game logo.
 */
Code.LOGO_PATH = (new URLSearchParams(window.location.search)).get('logo');

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
Code.MODE = 'play';

 /**
 * The mode of running program.
 */
Code.FILESET_ID = null;

/**
 * The fileset data found by token.
 */
Code.FILESET_FOUND = null;

/**
 * All valid files under project dir.
 */
Code.FILE_LIST = {};

/**
 * The name of currently focused FILE.
 */
Code.FOCUSED_FILE = "";

/**
 * The name of currently focused group.
 */
Code.FOCUSED_GROUP = "";

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
Code.TABS_ = ['python'];

/**
 * List of tab names with casing, for display in the UI.
 * @private
 */
Code.TABS_DISPLAY_ = [
  'Python'
];

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

  // Init game logo
  $("#game-logo").attr("src", Code.LOGO_PATH);
  
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
      const left = Math.max(0, Math.min(mousemoveEvt.pageX - x, $(window).width() - $draggable.closest(".modal-dialog").width()));
      const top = Math.max(0, Math.min(mousemoveEvt.pageY - y, $(window).height() - $draggable.closest(".modal-dialog").height()));
      $draggable.closest(".modal-dialog").offset({
          "left": left,
          "top": top
      });
    });
    $("body").one("mouseup", function() {
        $("body").off("mousemove.draggable");
    });
  });

  Code.initLanguage();

  Code.editor = CodeMirror.fromTextArea(document.getElementById('python_code'), {
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
  var onresize = function(e) {
    var container = document.getElementById('tab_content');
    var bBox = Code.getBBox_(container);
    var el = document.getElementById('python_code');
    el.style.top = bBox.y + 'px';
    el.style.left = bBox.x + 'px';
    // Height and width need to be set, read back, then set again to
    // compensate for scrollbars.
    el.style.height = bBox.height + 'px';
    el.style.height = (2 * bBox.height - el.offsetHeight) + 'px';
    el.style.width = bBox.width + 'px';
    el.style.width = (2 * bBox.width - el.offsetWidth) + 'px';
    var el = document.getElementById('project-file-window');
    el.style.top = bBox.y + 'px';
    el.style.left = (bBox.x + bBox.width - 280) + 'px';
  };
  window.addEventListener('resize', onresize, false);

  // Change tab key to spaces
  Code.editor.setOption("extraKeys", {
    Tab: function(cm) {
      var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
      cm.replaceSelection(spaces);
    }
  });

  // Set the mode if editor is changed.
  Code.editor.on("change", (changeObj) => {
    if (Code.editor.getValue().indexOf("class MLPlay:") != -1) {
      Code.MODE = 'play';
    } else {
      Code.MODE = 'execute';
    }
  });

  // Update library dropdown menu
  const libraryDir = window.path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  if (!window.fs.existsSync(libraryDir)) {
    window.fs.mkdirSync(libraryDir, { recursive: true });
  }

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
  Code.bindClick('save_python',
      function() {Code.savePython();});
  Code.bindClick('open_python',
      function() {Code.openPython();});
  Code.bindClick('en',
      function() {Code.changeLanguage('en');});
  Code.bindClick('zh-hant',
      function() {Code.changeLanguage('zh-hant');});
  
  // Open project by url
  const index = parseInt((new URLSearchParams(window.location.search)).get('latest'));
  if (index != -1) {
    Code.openProject(window.project.getLatest(Code.GAME)[index]);
  }
  
  // Try to Use saved token to login.
  if (await Code.token_login() && Code.PROJECT == '') {
    $('#project-dialog').modal('show');
  }

  // Set paia ads.
  const webview = document.getElementById('paia-ads');
  webview.addEventListener('dom-ready', function() {
    webview.setZoomFactor(0.85);
    webview.insertCSS('body { overflow: hidden; }');
  });
  webview.addEventListener('will-navigate', (e) => {
    webview.stop();
    window.shell.openExternal(e.url);
  });

  // Set dropdown callback.
  (['collect', 'train', 'test', 'other']).forEach(group => {
    $(`#group-${group}-dropdown`).on('show.bs.dropdown', function () {
      if (group == Code.FOCUSED_GROUP) {
        $(`#group-${group}-name`).val(`${MSG[group]}`);
      }
    });
    $(`#group-${group}-dropdown`).on('hide.bs.dropdown', function () {
      if (group == Code.FOCUSED_GROUP) {
        $(`#group-${group}-name`).val(Code.FILE_LIST[Code.FOCUSED_FILE].name);
      }
    });
    $(`#group-${group}-button`).dropdown("update");
  });

  onresize();

  // GA4
  window.paia.ga('screen_view', {
    app_name: "paia_desktop",
	  app_version: window.app.getVersion(),
    screen_name: `python?game=${Code.GAME}`
  });
};

/**
 * Initialize the page language.
 */
Code.initLanguage = function() {
  // Inject language strings.
  document.getElementById('en').textContent = MSG['en'];
  document.getElementById('zh-hant').textContent = MSG['zh_hant'];
  (['collect', 'train', 'test', 'other']).forEach((group) => {
    document.getElementById(`group-${group}-name`).value = MSG[group];
  })
};

/**
 * Initialize dialog body for selecting game arguments.
 */
Code.initGameArgs = function() {
  const config = JSON.parse(window.file.read(window.path.join(window.app.getUserData(), 'games', Code.GAME, 'game_config.json')));
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
    defaultPath: ($(`#${paramId}`).val() !== "")? $(`#${paramId}`).val() : window.path.join(window.app.getUserData(), 'games', Code.GAME),
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
  for (const group of ['collect', 'train', 'test', 'other']) {
    $(`#group-${group}-list`).empty();
    const groupPath = window.path.join(Code.PROJECT_PATH, group);
    if (!window.fs.existsSync(groupPath)) {
      window.fs.mkdirSync(groupPath, { recursive: true });
    }
    window.fs.readdirSync(groupPath).forEach(file => {
      if (file.endsWith(".py")) {
        const filePath = window.path.join(groupPath, file);
        if (filePath in Code.FILE_LIST) {
          $(`#group-${group}-list`).append(Code.FILE_LIST[filePath].$button);
        } else {
          const name = file.substring(0, file.length-3);
          const $button = $(`<a class="dropdown-item d-flex" href="#" id="file-${filePath}" title="${filePath}" style="width: 138px; height: 46px; border-radius: 15px; border: 1px solid #676767; background: #FFF; vertical-align: baseline; padding: 10px 6px 6px 12px; margin: 1px;"></a>`);
          const $state = $(`<img src="media/state-unexecuted.svg" id="file-${filePath}-state" style="width: 20px; padding-bottom: 2px;">`);
          const $name = $(`<div id="file-${filePath}-name" style="max-width: 100px; font-size: 16px; color: black; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin: 0px auto 0px 15px;"><span class="not-saved"></span>${name}</div>`);
          $button.append($state, $name);
          $(`#group-${group}-list`).append($button);
          Code.bindClick(`file-${filePath}`,
            function() {Code.loadPython(filePath);});
          Code.FILE_LIST[filePath] = {
            group: group,
            name: name,
            state: "unexecuted",
            $button: $button,
            $state: $state
          }
        }
      }
    });
  };
};

/**
 * Update project file list.
 */
Code.updateProjectFileList = function(parent='') {
  if (parent == '')
    $(`#project-file-list`).empty();
  window.fs.readdirSync(window.path.join(Code.PROJECT_PATH, parent), { recursive: true }).forEach(file => {
    if (window.dir.isDirectory(file)) {
      if (file != "__pycache__")
        Code.updateProjectFileList(window.path.join(parent, file));
    } else {
      const $file = $(`<div title="${window.path.join(parent, file)}" style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden; padding: 5px 0px;">${window.path.join(parent, file)}</div>`);
      $(`#project-file-list`).append($file);
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

Code.token_login = async function (token=null) {
  const auth = await window.paia.auth(token);
  if (!auth.ok) {
    // $('#state-content').html(auth.content);
    if (Code.PROJECT == '')
        $('#project-dialog').modal('hide');
    $('#login-dialog').modal('show');
    return false;
  } else {
    window.paia.user().then((res) => {
      if (res.ok) {
        $('#user-name').html(res.content.username);
        $('#user-name').attr("title", res.content.username);
        $('#user-info-icon').attr("src", "media/login-owl2.png");
        $('#user-info-backgroud').attr("fill", "#ECC8D6");
        $('#login-button').attr("onclick", "");
        $('#login-button').removeClass("disabled");
        $('#login-dialog').modal('hide');
        window.paia.ga('login', {
          event_category: 'general_desktop',
          value: 'login'
        });
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
  $('#state-content').html('');
  $('#user-name').html('未登入');
  $('#user-info-icon').attr("src", "media/login-owl1.png");
  $('#user-info-backgroud').attr("fill", "#B6B6B6");
  $('#login-button').attr("onclick", "location.href=window.paia.redirect();");
  $('#login-button').addClass("disabled");
  $('#tab_user').text('尚未登入');
  $('#state-content').html('');
  $('#login-dialog').modal('show');
};

/**
 * Let user select the path to a python file and load it. 
 */
Code.openPython = function() {
  let pythonPath = window.path.select({
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
 * Let user select the path to a python file and load it. 
 */
Code.newPython = function(group) {
  let index = 1;
  let pythonPath = window.path.join(Code.PROJECT_PATH, group, `${MSG[group]}${index}.py`);
  while (window.fs.existsSync(pythonPath)) {
    index++;
    pythonPath = window.path.join(Code.PROJECT_PATH, group, `${MSG[group]}${index}.py`);
  }
  const pythonText = "";
  window.file.write(pythonPath, pythonText);
  Code.updateProjectList();
  Code.loadPython(pythonPath);
}

/**
 * Load python file to editor. 
 */
Code.loadPython = function(pythonPath) {
  // Return if try to load focused file.
  if (pythonPath == Code.FOCUSED_FILE) {
    return;
  }
  // Return if file under incorrect dir.
  const group = window.path.basename(window.path.dirname(pythonPath));
  const project = window.path.dirname(window.path.dirname(pythonPath));
  if (project != Code.PROJECT_PATH || (['collect', 'train', 'test', 'other']).indexOf(group) == -1) {
    window.popup.alert("只能開啟位於專案資料夾 collect、train、test、other 底下的檔案。");
    return;
  }
  // Save file before open another python.
  if (Code.FOCUSED_FILE != "") {
    Code.savePython(Code.FOCUSED_FILE);
  }
  try {
    const pythonText = window.file.read(pythonPath);
    Code.editor.setValue(pythonText);
  } catch (err) {
    window.popup.alert(err);
    return;
  }

  if (Code.FOCUSED_FILE != '') {
    Code.FILE_LIST[Code.FOCUSED_FILE].$button.css("border", "1px solid #676767");
  }
  Code.FILE_LIST[pythonPath].$button.css("border", "2px solid #0039CF");
  Code.FOCUSED_FILE = pythonPath;
  if (Code.FOCUSED_GROUP != '') {
    $(`#group-${Code.FOCUSED_GROUP}-button`).css("outline", "1px solid #676767");
    $(`#group-${Code.FOCUSED_GROUP}-name`).val(MSG[Code.FOCUSED_GROUP]);
  }
  $(`#group-${group}-button`).css("outline", "3px solid #0039CF");
  $(`#group-${group}-name`).val(Code.FILE_LIST[pythonPath].name);
  $(`#group-${group}-state`).attr("src" , Code.FILE_LIST[pythonPath].$state.attr("src"));
  Code.FOCUSED_GROUP = group;
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
Code.savePython = function(pythonPath=null) {
  // Select python path if it is null.
  if (pythonPath === null) {
    pythonPath = window.path.save({
      title: "儲存 Python 檔",
      defaultPath: window.path.join(Code.PROJECT_PATH, Code.FOCUSED_FILE),
      filters: [
          {name: 'Python', extensions: ['py']}
      ]
    });
    if (pythonPath === undefined) {
      return;
    }
  }
  const pythonText = Code.editor.getValue();
  window.file.write(pythonPath, pythonText);
  console.log(`Save editor to ${pythonPath}.`);
  // Save project config.
  const configPath = window.path.join(Code.PROJECT_PATH, 'project.json');
  if (window.fs.existsSync(configPath)) {
    const config = JSON.parse(window.file.read(configPath));
    config.last_saved = pythonPath;
    config.saved_at = dateformat(new Date(), "yyyy-mm-dd HH:MM:ss");
    window.file.write(configPath, JSON.stringify(config));
  } else {
    window.file.write(configPath, JSON.stringify({
      game: Code.GAME,
      last_saved: pythonPath,
      saved_at: dateformat(new Date(), "yyyy-mm-dd HH:MM:ss")
    }));
  }
  
  // Load saved python if it is not focused.
  if (Code.FOCUSED_FILE == "" || pythonPath != Code.FOCUSED_FILE) {
    Code.loadPython(pythonPath);
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
 * Show dialog for playing or run the code. 
 */
Code.run = async function() {
  // Check trial
  if (Code.ID > 0) {
    const permission = await window.paia.gamePermission(Code.ID);
    if (!permission.ok || permission.content.state == "locked") {
      $('#msg-dialog-msg').html("授權錯誤，無法執行程式。");
      $('#msg-dialog').modal('show');
      return;
    }
    if (permission.content.state == "expired") {
      $('#msg-dialog-msg').html("試用結束，無法執行程式。");
      $('#msg-dialog').modal('show');
      return;
    }
    if (permission.content.state == "trying") {
      window.paia.gameTrialIncrease(Code.ID);
    }
  }
  
  // Set PAIA ads url
  if ($("#paia-ads").attr("src") == "") {
    $("#paia-ads").attr("src", window.paia.adsConsole());
  } else {
    const webview = document.getElementById('paia-ads');
    webview.reload();
  }

  if (Code.MODE == 'play') {
    Code.play();
  } else {
    Code.execute();
  }
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
    if (e.tagName == "SELECT") {
      const value = e.options[e.selectedIndex].getAttribute("value");
      args.push(`--${e.id.replace('param-', '')}`);
      args.push(value);
      params[e.id] = value;
    } else if (e.value !== "") {
      args.push(`--${e.id.replace('param-', '')}`);
      args.push(e.value);
    }
  }
  let total_args = [];
  for (let i = 0; i < user_num; i++) {
    total_args = total_args.concat(['-i', file_name])
  }
  total_args = total_args.concat(['-f', fps, window.path.join(window.app.getUserData(), 'games', Code.GAME)]).concat(args);
  const python_path = window.path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter').replace('app.asar', 'app.asar.unpacked');
  const options = {
    mode: 'text',
    pythonPath: python_path,
    pythonOptions: ['-m'],
    args: total_args
  };
  $('#run-mlgame-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').css('display', 'block');
  window.python_env.run(options, "mlgame", file_path, Code.PROJECT_PATH, Code.FOCUSED_GROUP, Code.FOCUSED_FILE);
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
  const python_path = window.path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter').replace('app.asar', 'app.asar.unpacked');
  const options = {
    mode: 'text',
    pythonPath: python_path,
    scriptPath: Code.PROJECT_PATH,
    args: []
  };
  $('#run-python-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').css('display', 'block');
  window.python_env.run(options, file_name, file_path, Code.PROJECT_PATH, Code.FOCUSED_GROUP, Code.FOCUSED_FILE);
};

Code.showReadme = function() {
  const readme_path = window.path.join(window.app.getUserData(), 'games', Code.GAME, 'README.md');
  const readme_text = window.file.read(readme_path);
  const readme = window.markdown.convert(readme_text);
  $('#readme-body').html(readme);
  $('#readme-dialog').modal('show');
};

/**
 * Select the files for uploading.
 */
Code.selectUploadFile = function() {
  const files = window.path.select({
    title: "選擇上傳檔案",
    defaultPath: Code.PROJECT_PATH,
    filters: [
      { name: 'AI Files', extensions: ['py', 'pickle'] }
    ],
    properties: ["openFile", "multiSelections"]
  });
  if (files !== undefined) {
    for (const file of files) {
      let exist = false;
      for (const child of $("#upload-file-list").children()) {
        if ($(child).prop("title") == file)
          exist = true;
      }
      if (!exist) {
        const $tab = $(
          `<div class="p-2 my-2 d-flex" title="${file}" style="background-color: #E4F5FF;">
            <div>${window.path.basename(file)}</div>
            <i class="bi bi-x ml-auto" style="cursor: pointer;" onclick="$(this).parent().remove();">
          </div>`);
        $("#upload-file-list").append($tab);
      }
    }
  }
};

/**
 * Upload files to cloud.
 */
Code.uploadFile = async function() {
  $('#upload-dialog').modal('hide');
  const files = []
  for (const child of $("#upload-file-list").children()) {
    files.push($(child).prop("title"))
  }
  const res1 = await window.paia.uploadAzure(files);
  if (!res1.ok) {
    window.popup.alert(res1.content);
    return;
  }
  const res2 = await window.paia.uploadAi(Code.ID, $("#upload-name").val(), $("#upload-description").val(), res1.content.urls);
  if (res2.ok) {
    $("#upload-file-list").empty();
    location.href=window.paia.ais(Code.ID);
  } else {
    window.popup.alert(res2.content.detail);
  }
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
  const project_path = window.path.join($('#project-path').val(), $('#project-name').val());
  try {
    if (!window.fs.existsSync(project_path)) {
      window.fs.mkdirSync(project_path, { recursive: true });
      const example_path = window.path.join(__dirname, 'examples', Code.GAME, 'python');
      const collect_path = window.path.join(example_path, "collect");
      if (window.fs.existsSync(collect_path)) {
        window.dir.copy(collect_path, project_path);
      } else {
        window.fs.mkdirSync(window.path.join(project_path, "collect"));
      }
      const train_path = window.path.join(example_path, "train");
      if (window.fs.existsSync(train_path)) {
        window.dir.copy(train_path, project_path);
      } else {
        window.fs.mkdirSync(window.path.join(project_path, "train"));
      }
      const test_path = window.path.join(example_path, "test");
      if (window.fs.existsSync(test_path)) {
        window.dir.copy(test_path, project_path);
      } else {
        window.fs.mkdirSync(window.path.join(project_path, "test"));
      }
      const other_path = window.path.join(example_path, "other");
      if (window.fs.existsSync(other_path)) {
        window.dir.copy(other_path, project_path);
      } else {
        window.fs.mkdirSync(window.path.join(project_path, "other"));
      }
      let start = "";
      const config_path = window.path.join(example_path, "start.json");
      if (window.fs.existsSync(config_path)) {
        const config = JSON.parse(window.file.read(config_path));
        start = window.path.join(project_path, config.start);
      } 
      window.file.write(window.path.join(project_path, "project.json"), JSON.stringify({
        game: Code.GAME,
        created_at: dateformat(new Date(), "yyyy-mm-dd HH:MM:ss"),
        saved_at: dateformat(new Date(), "yyyy-mm-dd HH:MM:ss"),
        last_saved: start
      }));
      Code.openProject(project_path);
    } else if (window.popup.confirm(`${project_path} 已存在，是否改為載入此專案？`)) {
      Code.openProject(project_path);
    }
  } catch(err) {
    window.popup.alert(err);
  }
};

/**
 * Select existing project.
 */
Code.selectProject = function() {
  const dir = window.path.select({
    title: "開啟專案資料夾",
    defaultPath: window.project.getPath(),
    properties: ["openDirectory"]
  });
  if (dir === undefined) {
    return;
  } else {
    Code.openProject(dir[0]);
  }
};

/**
 * Open existing project.
 */
Code.openProject = function(path) {
  if (Code.PROJECT_PATH != '') {
    window.file.unwatch(Code.PROJECT_PATH);
  }
  Code.PROJECT_PATH = path;
  Code.PROJECT = window.path.basename(Code.PROJECT_PATH);
  $('#project-title').val(Code.PROJECT);
  $('#project-title').attr("title", Code.PROJECT_PATH);
  window.project.saveLatest(Code.GAME, Code.PROJECT_PATH);
  window.file.watch(Code.PROJECT_PATH, (eventType, filename) => {
    Code.updateProjectList();
    Code.updateProjectFileList();
  });
  Code.updateProjectList();
  Code.updateProjectFileList();
  window.menu.enableItem({id: 'reveal_project', enabled: true});
  window.project.onExport((event) => {
    Code.exportProject();
  });
  let start = window.path.join(Code.PROJECT_PATH, 'collect', '蒐集.py');
  const configPath = window.path.join(Code.PROJECT_PATH, 'project.json');
  if (window.fs.existsSync(configPath)) {
    const config = JSON.parse(window.file.read(configPath));
    if (config.last_saved && config.last_saved.endsWith(".py"))
      start = config.last_saved;
  }
  if (window.fs.existsSync(start)) {
    Code.loadPython(start, "collect");
  } else {
    Code.newPython("collect");
  }
  $('#project-dialog').modal('hide');
};

/**
 * Reveal project directory.
 */
Code.revealProject = function() {
  window.project.open(Code.PROJECT_PATH);
};

/**
 * Export project directory.
 */
Code.exportProject = function() {
  let dest = window.path.select({
    title: "匯出專案資料夾",
    defaultPath: window.project.getPath(),
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
 * Change project name.
 */
Code.changeProjectName = function() {
  const oldName = Code.PROJECT_PATH;
  const newName = window.path.join(window.path.dirname(Code.PROJECT_PATH), $('#project-title').val());
  if (oldName == newName)
    return;
  if (window.fs.existsSync(newName)) {
    window.popup.alert(`${newName} 已存在`);
    $('#project-title').val(Code.PROJECT);
    return;
  }
  if (Code.FOCUSED_FILE != '')
    Code.savePython(Code.FOCUSED_FILE);
  try {
    window.fs.copySync(oldName, newName);
  } catch (err) {
    window.popup.alert(err);
    $('#project-title').val(Code.PROJECT);
    return;
  }
  Code.openProject(newName);
  try {
    window.fs.removeSync(oldName);
  } catch (err) {
    window.popup.alert(err);
    return;
  }
};

/**
 * Make file name editable.
 */
Code.editFileName = function() {
  if (Code.FOCUSED_FILE == '' || Code.FOCUSED_GROUP == '')
    return;
  $(`#group-${Code.FOCUSED_GROUP}-name`).prop('disabled', false);
  $(`#group-${Code.FOCUSED_GROUP}-button`).prop('disabled', true);
  $(`#group-${Code.FOCUSED_GROUP}-name`).css('cursor', 'text');
  $(`#group-${Code.FOCUSED_GROUP}-name`).trigger('focus');
};

/**
 * Change file name.
 */
Code.changeFileName = function() {
  if (Code.FOCUSED_FILE == '' || Code.FOCUSED_GROUP == '')
    return;
  Code.savePython(Code.FOCUSED_FILE);
  const oldName = Code.FOCUSED_FILE;
  const newName = window.path.join(window.path.dirname(Code.FOCUSED_FILE), $(`#group-${Code.FOCUSED_GROUP}-name`).val() + '.py');
  $(`#group-${Code.FOCUSED_GROUP}-name`).prop('disabled', true);
  $(`#group-${Code.FOCUSED_GROUP}-button`).prop('disabled', false);
  $(`#group-${Code.FOCUSED_GROUP}-name`).css('cursor', 'pointer');
  if (oldName == newName)
    return;
  if (window.fs.existsSync(newName)) {
    window.popup.alert(`${newName} 已存在`);
    $(`#group-${Code.FOCUSED_GROUP}-name`).val(Code.FILE_LIST[Code.FOCUSED_FILE].name);
    return;
  }
  window.fs.renameSync(oldName, newName);
  Code.updateProjectList();
  Code.FOCUSED_FILE = '';
  Code.loadPython(newName);
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

Code.showGroupdropdown = function(group, show) {
  if (show != $(`#group-${group}-list`).hasClass('show'))
    $(`#group-${group}-button`).trigger("click");
};

// Load the Code demo's language strings.
document.write('<script src="js/ui_msg/' + Code.LANG + '.js"></script>\n');

const __dirname = window.path.__dirname();

window.addEventListener('load', Code.init);
window.deeplink.onLogin((event, token) => {
  Code.token_login(token);
  window.paia.ga('login', {
    event_category: 'deeplink_desktop',
    value: 'login'
  });
});
window.menu.hide(false);
window.project.onLoad(() => {
  Code.loadProject();
});
window.project.onReveal((event) => {
  Code.revealProject();
});
window.editor.onSavePython(() => {
  Code.savePython();
});
window.lang.onChange((e, lang) => {
  Code.changeLanguage(lang);
});
window.onbeforeunload = (e) => {
  if (Code.FOCUSED_FILE != '')
    Code.savePython(Code.FOCUSED_FILE);
}
