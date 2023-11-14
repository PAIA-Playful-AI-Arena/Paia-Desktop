const { contextBridge, ipcRenderer, clipboard } = require('electron');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const Store = require('electron-store');
const dateformat = require('dateformat');
const download = require('download-git-repo');
const showdown = require('showdown');
const { v4: uuid4 } = require('uuid');
const { machineIdSync } = require('node-machine-id');
// const ElectronGoogleOAuth2 = require('@getstation/electron-google-oauth2').default;
const env = require('dotenv').config({ path: path.join(__dirname, '.env') });
if (env.error) {
  throw result.error;
}

const schema = {
  refresh_token: {
		type: "string",
		default: ""
	},
  project_path: {
    type: "string",
    default: path.join(os.homedir(), 'Desktop')
  },
  custom_python: {
    type: "boolean",
    default: false
  },
  custom_python_path: {
    type: "string",
    default: ""
  }
};
const store = new Store({schema});
// const myApiOauth = new ElectronGoogleOAuth2(
//   process.env.GOOGLE_OAUTH2_CLIENT_ID,
//   process.env.GOOGLE_OAUTH2_PASSWORD,
//   [], { successRedirectURL: 'https://www.paia-arena.com/' }
// );
const fileWatchers = {};
const session_id = uuid4();
let access_token = "";
let time = new Date().getTime();
let user_id = "";

contextBridge.exposeInMainWorld('deeplink', {
  onLogin: (callback) => ipcRenderer.on('login', callback)
});
contextBridge.exposeInMainWorld('clipboard', clipboard);
contextBridge.exposeInMainWorld('dateformat', dateformat);
contextBridge.exposeInMainWorld('fs', fs);
contextBridge.exposeInMainWorld('https', {
  get: (url, filepath, callback, end, error) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      res.on('data', (d) => {
        file.write(d);
        callback(d);
      });
      res.on('end', () => {
        file.close();
        end();
      });
    }).on('error', error);
  }
});
contextBridge.exposeInMainWorld('markdown', {
  convert: (text) => {
    const converter = new showdown.Converter();
    return converter.makeHtml(text);
  }
});
contextBridge.exposeInMainWorld('app', {
  getVersion: () => {
    return ipcRenderer.sendSync('getVersion');
  }
});
contextBridge.exposeInMainWorld('popup', {
  alert: (msg) => {
    fixedAlert(msg);
  },
  confirm: (msg) => {
    return fixedConfirm(msg);
  }
});
contextBridge.exposeInMainWorld('python_env', {
  run: (options, script, file, cwd) => {
    const old_cwd = process.cwd();
    process.chdir(cwd);
    let python = new PythonShell(script, options);
    python.on('message', function (message) {
      const full_message = document.getElementById('content_console').textContent + message + '\n';
      document.getElementById('content_console').textContent = full_message.slice(-50000);
      const e = document.getElementById('console-body');
      e.scrollTo(0, e.scrollHeight);
    });
    python.on('stderr', function (stderr) {
      document.getElementById('content_console').textContent += stderr + '\n';
      const e = document.getElementById('console-body');
      e.scrollTo(0, e.scrollHeight);
    });
    python.on('close', function () {
      document.getElementById('content_console').textContent += '> Python program finished\n';
      const e = document.getElementById('console-body');
      e.scrollTo(0, e.scrollHeight);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
      process.chdir(old_cwd);
    });
    python.on('error', function () {
      window.alert('Error: process exited with code ' + python.exitCode);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
      process.chdir(old_cwd);
    });
  },
  getCustom: () => {
    return {
      custom_python: store.get('custom_python'),
      custom_python_path: store.get('custom_python_path'),
    };
  },
  setCustom: (custom_python, custom_python_path) => {
    store.set('custom_python', custom_python);
    store.set('custom_python_path', custom_python_path);
  }
});
contextBridge.exposeInMainWorld('file', {
  write: (file, data) => {
    fs.writeFileSync(file, data, (err) => {
      if (err) window.alert(err);
      console.log('The file has been saved at ' + file);
    });
  },
  read: (file) => {
    return fs.readFileSync(file, 'utf8', (err, data) => {
      if (err) window.alert(err);
      return data;
    });
  },
  watch: (file, listener) => {
    fileWatchers[file] = fs.watch(file, listener);
  },
  unwatch: (file) => {
    if (file in fileWatchers) {
      fileWatchers[file].close();
      delete fileWatchers[file];
    }
  }
});
contextBridge.exposeInMainWorld('path', {
  select: (options) => {
    return ipcRenderer.sendSync('selectPath', options);
  },
  save: (options) => {
    return ipcRenderer.sendSync('savePath', options);
  },
  open: (pathname) => {
    ipcRenderer.send('openPath', pathname);
  },
  join: (...args) => {
    return path.join(...args)
  },
  dirname: () => {
    return __dirname;
  },
  basename: (pathname) => {
    return path.basename(pathname);
  },
  homedir: () => {
    return os.homedir();
  }
});
contextBridge.exposeInMainWorld('project', {
  getPath: () => {
    return store.get('project_path');
  },
  setPath: (path) => {
    store.set('project_path', path);
  },
  open: (pathname) => {
    ipcRenderer.send('openPath', pathname);
  }
});
contextBridge.exposeInMainWorld('dir', {
  copy: (src, dest) => {
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
  }
});
contextBridge.exposeInMainWorld('repo', {
  download: (repo, dest, callback) => {
    download(repo, dest, callback);
  }
});
contextBridge.exposeInMainWorld('paia', {
  auth: async (url_token=null) => {
    let refresh_token = store.get('refresh_token');
    if (url_token === null && refresh_token.length == 0) {
      return {ok: false, content: ''};
    } else {
      if (url_token !== null && refresh_token.length != 0) {
        if (url_token === refresh_token) {
          fixedAlert('您已登入此帳號');
          return {ok: true, content: ''};
        } else if (fixedConfirm('您正在嘗試從外部登入 PAIA，並將登出現有帳號，是否繼續執行？')) {
          refresh_token = url_token;
          store.set('refresh_token', url_token);
        }
      } else if (url_token !== null) {
        refresh_token = url_token;
        store.set('refresh_token', url_token);
      }
      const data = { refresh: refresh_token };
      try {
        const response = await paiaAPI("POST", "auth/refresh", data, null);
        if (response.ok) {
          const content = await response.json();
          access_token = content.access;
          return {ok: response.ok, content: content};
        } else {
          store.set('refresh_token', '');
          return {ok: response.ok, content: `Error: ${response.status}`};
        }
      } catch (error) {
        return {ok: false, content: error};;
      }
    }
  },
  login: async (email, password) => {
    const data = {
      "username": email,
      "password": password
    };
    try {
      const response = await paiaAPI("POST", "auth/login", data, null);
      if (response.ok) {
        const content = await response.json();
        store.set('refresh_token', content.refresh);
        access_token = content.access;
        return {ok: response.ok, content: content};
      } else {
        return {ok: response.ok, content: `Error: ${response.status}`};;
      }
    } catch (error) {
      console.error("Error:", error);
      return {ok: false, content: error};
    }
  },
  logout: () => {
    store.set('refresh_token', "");
    access_token = "";
  },
  user: async () => {
    try {
      const response = await paiaAPI("GET", "user/me", null, 'USER_TOKEN');
      const content = await response.json();
      user_id = content.id.toString();
      return {ok: response.ok, content: content};
    } catch(error) {
      console.error("Error:", error);
      return {ok: false, content: error};
    }
  },
  ads: () => {
    return `${env.parsed.PAIA_APP_HOST}/ads`
  },
  redirect: () => {
    return `${env.parsed.PAIA_APP_HOST}/login?app=true`
  },
  ga: async(name, params) => {
    await gaAPI(name, params);
  }
});
contextBridge.exposeInMainWorld('api', {
  paia: async (method, url, data, auth, ver=env.parsed.PAIA_API_VERSION, filename=null) => {
    if (filename !== null) {
      data = new FormData();
      const name = path.basename(filename);
      const file = new File([fs.readFileSync(filename, 'utf8')], name);
      data.append("files", file, name);
    }
    try {
      const response = await paiaAPI(method, url, data, auth, ver);
      return {ok: response.ok, content: await response.json()};
    } catch(error) {
      console.error("Error:", error);
      return {ok: false, content: error};
    }
  },
  github: async (method, url, data) => {
    try {
      const response = await githubAPI(method, url, data);
      return {ok: response.ok, content: await response.json()};
    } catch(error) {
      console.error("Error:", error);
      return {ok: false, content: error};
    }
  }
});

const paiaAPI = function(method, url, data, auth, ver=env.parsed.PAIA_API_VERSION) {
  const headers = {};
  if (auth == 'USER_TOKEN') {
    headers['Authorization'] = `Bearer ${access_token}`;
  } else if (auth == 'DESKTOP_TOKEN') {
    headers['Authorization'] = `Bearer ${env.parsed.PAIA_DESKTOP_TOKEN}`;
  }
  if (data instanceof FormData) {
    return fetch(`${env.parsed.PAIA_API_HOST}/api/${ver}/${url}`, {
      method: method,
      headers: headers,
      body: data
    });
  } else {
    headers['Content-Type'] = 'application/json';
    return fetch(`${env.parsed.PAIA_API_HOST}/api/${ver}/${url}`, {
      method: method,
      headers: headers,
      body: (data !== null)? JSON.stringify(data) : null
    });
  }
};

const githubAPI = function(method, url, data) {
  const headers = {};
  headers['Content-Type'] = 'application/json';
  headers['Accept'] = 'application/vnd.github.v3+json';
  return fetch(`https://api.github.com/${url}`, {
    method: method,
    headers: headers,
    body: (data !== null)? JSON.stringify(data) : null
  });
};

const gaAPI = function(name, params) {
  const headers = {};
  headers['Content-Type'] = 'application/json';
  const prev_time = time;
  time = new Date().getTime();
  return fetch(`https://google-analytics.com/mp/collect?measurement_id=${env.parsed.GA_MEASUREMENT_ID}&api_secret=${env.parsed.GA_API_SECRET}`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      client_id: machineIdSync(),
      user_id: user_id,
      events: [{
        name: name,
        params: {
          engagement_time_msec: (time - prev_time).toString(),
          session_id: session_id,
          ...params
        }
      }]
    })
  });
}

const fixedAlert = function(msg) {
  window.alert(msg);
  if (process.platform === 'win32') {
    ipcRenderer.send('fixFocus');
  }
};

const fixedConfirm = function(msg) {
  const res = window.confirm(msg);
  if (process.platform === 'win32') {
    ipcRenderer.send('fixFocus');
  }
  return res;
}