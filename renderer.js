// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { remote } = require('electron')
const { dialog, shell, app } = require('electron').remote;
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const Store = require('electron-store');
const schema = {
	access: {
		type: "string",
		default: "no token"
	},
	refresh: {
		type: "string",
		default: "no token"
	},
  log: {
    type: "array",
    items: {
      type: "object",
    },
    default: []
  }
};
const store = new Store({schema});
const ElectronGoogleOAuth2 = require('@getstation/electron-google-oauth2').default;
const myApiOauth = new ElectronGoogleOAuth2(
  '514485686482-n8ies0d9kdk6o86tl9mndc8vu4tvv84p.apps.googleusercontent.com',
  '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',
  [], { successRedirectURL: 'https://www.paia-arena.com/' }
);
const host = 'https://stage-backend.paia-arena.com';
const api_version = 'v1';
const baseHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

window.pythonRun = function(options, script, cwd) {
  var old_cwd = process.cwd();
  process.chdir(cwd);
  let python = new PythonShell(script, options);
  python.on('message', function (message) {
    var full_message = document.getElementById('content_console').textContent + message + '\n';
    document.getElementById('content_console').textContent = full_message.slice(-5000);
    var e = document.getElementById('console-body');
    e.scrollTo(0, e.scrollHeight);
  });
  python.on('stderr', function (stderr) {
    document.getElementById('content_console').textContent += stderr + '\n';
    var e = document.getElementById('console-body');
    e.scrollTo(0, e.scrollHeight);
  });
  python.on('close', function () {
    document.getElementById('content_console').textContent += '> Python program finished\n';
    var e = document.getElementById('console-body');
    e.scrollTo(0, e.scrollHeight);
    process.chdir(old_cwd);
  });
  python.on('error', function () {
    window.alert('Error: process exited with code ' + python.exitCode);
  });
};

window.writeFile = function(file, data) {
  fs.writeFileSync(file, data, (err) => {
    if (err) window.alert(err);
    console.log('The file has been saved at ' + file);
  });
};

window.readFile = function(file) {
  return fs.readFileSync(file, 'utf8', (err, data) => {
    if (err) window.alert(err);
    return data;
  });
};

window.selectPath = function(options) {
  return dialog.showOpenDialogSync(options);
};

window.savePath = function(options) {
  return dialog.showSaveDialogSync(options);
};

window.openPath = function(pathname) {
  shell.openPath(pathname);
};

window.copyDir = function(src, dest) {
  try {
    var destDir = path.join(dest, path.basename(src));
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir);
    }
    if (fs.lstatSync(src).isDirectory()) {
      var files = fs.readdirSync(src);
      files.forEach((file) => {
        var curSrc = path.join(src, file);
        if (fs.lstatSync(curSrc).isDirectory()) {
          window.copyDir(curSrc, destDir);
        } else {
          fs.copyFileSync(curSrc, path.join(destDir, file));
        }
      });
    }
  } catch(err) {
    window.alert(err);
  }
};

window.getAccessToken = function() {
  return store.get('access')
};

window.getRefreshToken = function() {
  return store.get('refresh')
};

window.setToken = function(access, refresh) {
  store.set('access', access);
  store.set('refresh', refresh);
};

window.clearToken = function() {
  store.reset('access', 'refresh');
};

window.resetStore = function() {
  store.clear();
};

window.addLog = function(type, content) {
  return;
  var log = {};
  log.time = new Date().toISOString();
  log.platform = process.platform;
  log.type = type;
  log.content = content;
  logList = store.get('log');
  logList.push(log);
  store.set('log', logList);
};

window.getOauth2 = function() {
  var token = window.getToken();
  var oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({access_token: token.access_token});
  var oauth2 = google.oauth2({
    auth: oauth2Client,
    version: 'v2'
  });
  return oauth2;
};

window.loadPage = function(page) {
  remote.getCurrentWindow().loadFile(page);
};

window.paiaAPI = function(method, url, data, response, error) {
  var headers = baseHeaders;
  if (window.getAccessToken().length > 0) {
    headers['Authorization'] = `Bearer ${window.getAccessToken()}`;
  }
  $.ajax({
    url: `${host}/api/${api_version}/${url}`,
    headers: headers,
    method: method,
    timeout: 0,
    data: JSON.stringify(data),
    success: response,
    error: error
  });
};
