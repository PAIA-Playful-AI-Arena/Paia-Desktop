// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { remote } = require('electron');
const { dialog, shell, app } = require('electron').remote;
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const Store = require('electron-store');
const dateformat = require('dateformat');
const { v4: uuidv4 } = require('uuid');
const result = require('dotenv').config({ path: path.join(__dirname, '.env') });
if (result.error) {
  throw result.error
}
const schema = {
	access: {
		type: "string",
		default: "no token"
	},
	refresh: {
		type: "string",
		default: "no token"
	},
  id: {
    type: "string",
    default: "no id"
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
  process.env.GOOGLE_OAUTH2_CLIENT_ID,
  process.env.GOOGLE_OAUTH2_PASSWORD,
  [], { successRedirectURL: 'https://www.paia-arena.com/' }
);

window.pythonRun = function(options, script, file, cwd) {
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
    fs.unlinkSync(file);
    process.chdir(old_cwd);
  });
  python.on('error', function () {
    window.alert('Error: process exited with code ' + python.exitCode);
    fs.unlinkSync(file);
    process.chdir(old_cwd);
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

window.addLog = function(action, obj) {
  var id = store.get('id');
  if (id == "no id") {
    id = uuidv4();
    store.set('id', id);
  }
  var log = {};
  log.anonymous_id = id;
  log.action = action;
  log.paia_obj = obj;
  log.created_at = dateformat(new Date(), "yyyy-mm-dd HH:MM:sso");
  logList = store.get('log');
  logList.push(log);
  store.set('log', logList);
};

window.sendLog = function() {
  const logList = store.get('log');
  if (logList.length == 0) {
    return;
  }
  $.getJSON('https://api.ipify.org?format=jsonp&callback=?', function(data) {
    const ip = data.ip;
    for (const log of logList) {
      log.ip = ip;
    }
    if (window.getAccessToken() != "no token") {
      window.paiaAPI("POST", "log/named_log", logList, true, 'USER_TOKEN',
        (res) => {
          store.reset('log');
          console.log("Named log sent.");
        }, (jqXHR, exception) => {
          var msg = '';
          if (jqXHR.status === 0) {
              msg = '連線錯誤，請確認網路';
          } else if (exception === 'abort') {
              msg = 'Ajax request aborted.';
          } else {
              msg = 'Uncaught Error.\n' + jqXHR.responseText;
              store.reset('log');
          }
          console.log(msg);
        }
      );
    } else {
      window.paiaAPI("POST", "log/anonymous_log", logList, true, 'DESKTOP_TOKEN',
        (res) => {
          store.reset('log');
          console.log("Anonymous log sent.");
        }, (jqXHR, exception) => {
          var msg = '';
          if (jqXHR.status === 0) {
              msg = '連線錯誤，請確認網路';
          } else if (exception === 'abort') {
              msg = 'Ajax request aborted.';
          } else {
              msg = 'Uncaught Error.\n' + jqXHR.responseText;
              store.reset('log');
          }
          console.log(msg);
        }
      );
    }
  });
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

window.paiaAPI = function(method, url, data, async, auth, response, error) {
  var headers = {};
  if (auth == 'USER_TOKEN') {
    headers['Authorization'] = `Bearer ${window.getAccessToken()}`;
  } else if (auth == 'DESKTOP_TOKEN') {
    headers['Authorization'] = `Bearer ${process.env.PAIA_DESKTOP_TOKEN}`;
  }
  if (Object.prototype.toString.call(data) !== "[object FormData]") {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
    $.ajax({
      url: `${process.env.PAIA_API_HOST}/api/${process.env.PAIA_API_VERSION}/${url}`,
      headers: headers,
      method: method,
      async: async,
      timeout: 0,
      data: JSON.stringify(data),
      success: response,
      error: error
    });
  } else {
    $.ajax({
      url: `${process.env.PAIA_API_HOST}/api/${process.env.PAIA_API_VERSION}/${url}`,
      headers: headers,
      method: method,
      async: async,
      timeout: 0,
      processData: false,
      contentType: false,
      data: data,
      success: response,
      error: error
    });
  }
};

const intervalID = setInterval(window.sendLog, 60000);
