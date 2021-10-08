# PAIA Desktop

PAIA Desktop is a visual programming editor based on Blockly, and built on Electron. We designed it to make everyone can easily build AI to play games.

## Downloads

Pre-built installers of latest release can be downloaded from the links below.

#### Windows 64-bit

[![](https://img.shields.io/badge/EXE%20Installer-v1.2.6-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v1.2.6/PAIA-Desktop-1.2.6.Setup.exe) [![](https://img.shields.io/badge/ZIP%20Portable-v1.2.6-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v1.2.6/PAIA-Desktop-win32-x64-1.2.6.zip)
#### macOS 64-bit

[![](https://img.shields.io/badge/DMG%20Installer-v1.2.6-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v1.2.6/PAIA-Desktop-1.2.6.dmg) [![](https://img.shields.io/badge/ZIP%20Portable-v1.2.6-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v1.2.6/PAIA-Desktop-darwin-x64-1.2.6.zip)

#### Linux 64-bit

[![](https://img.shields.io/badge/DEB%20Installer-v1.2.6-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v1.2.6/PAIA-Desktop-1.2.6.deb) [![](https://img.shields.io/badge/RPM%20Installer-v1.2.6-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v1.2.6/PAIA-Desktop-1.2.6.rpm) 

## Building

To build PAIA Desktop from source you'll need [Git](https://git-scm.com), [Python 3.6+](https://www.python.org/) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone --recursive https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop.git
# Go into the repository
cd Paia-Desktop
# Install Python dependencies
pip install -r requirements.txt
# Install Node.js dependencies
npm install
# Build Python executable
npm run make-py
# Build PAIA Desktop executable
npm run make
```
The built executables can be found in the `out` directory.