const fs = require('fs');
const { argv } = require('process');
const download = require('download-git-repo');
const version = 'v1.0.4'

if (argv.length < 3 || (['win32', 'darwin', 'linux']).indexOf(argv[2]) == -1) {
  console.log('Usage: node download-python.js [win32, darwin, linux]')
  return;
}

var dest = 'python/dist/interpreter';
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true });
}

console.log(`Python for ${argv[2]} downloading...`);
download(`direct:https://github.com/jason53415/PAIA-Desktop-Python/releases/download/${version}/interpreter-${argv[2]}.zip`, dest, function (err) {
  if (err) {
    console.log(`error: ${err}`);
  } else {
    console.log('Download success');
  }
});