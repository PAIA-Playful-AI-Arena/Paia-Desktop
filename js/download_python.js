const { argv } = require('process');
const download = require('download-git-repo');
const version = 'v1.0.0'

if (argv.length < 3 || (['win32', 'darwin', 'linux']).indexOf(argv[2]) == -1) {
  console.log('Usage: node download-python.js [win32, darwin, linux]')
  return;
}

console.log(`Python for ${argv[2]} downloading...`);
download(`direct:https://github.com/jason53415/PAIA-Desktop-Python/releases/download/${version}/interpreter-${argv[2]}.zip`, 'python/dist/interpreter', function (err) {
  if (err) {
    console.log(`error: ${err}`);
  } else {
    console.log('Download success');
  }
});