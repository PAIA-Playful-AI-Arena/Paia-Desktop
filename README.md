# PAIA Desktop

PAIA Desktop is a visual programming editor based on [Blockly](https://github.com/google/blockly), and built on [Electron](https://github.com/electron/electron). We designed it to make everyone can easily build AI to play games.

## Downloads

Pre-built installers of latest release can be downloaded from the links below.

### Windows 64-bit

[![](https://img.shields.io/badge/EXE%20Installer-v3.3.5-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v3.3.5/PAIA.Desktop-3.3.5.Setup.exe)

### macOS 64-bit (Apple Silicon)

[![](https://img.shields.io/badge/DMG%20Installer-v3.3.5-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v3.3.5/PAIA.Desktop-3.3.5-arm64.dmg)

### Linux 64-bit

Linux (`.deb`) builds are produced from source — see [Building](#building) below.

## Building

To build PAIA Desktop from source you'll need [Git](https://git-scm.com),
[Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)),
and Python 3 (only if you build the bundled interpreter yourself) installed.

```bash
# Clone this repository
git clone --recursive https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop.git
cd Paia-Desktop
# Install Node.js dependencies
npm install
# Download the prebuilt Python interpreter for your platform
npm run download-py-[win32, darwin, linux]
# Build PAIA Desktop
npm run make
```

The built artifacts are written to the `out/` directory. On Linux, `npm run make`
produces a `.deb` package (requires the `dpkg` and `fakeroot` tools to be installed).
