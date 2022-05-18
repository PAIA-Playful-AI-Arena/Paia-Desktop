# PAIA Desktop

PAIA Desktop is a visual programming editor based on [Blockly](https://github.com/google/blockly), and built on [Electron](https://github.com/electron/electron). We designed it to make everyone can easily build AI to play games.

## Downloads

Pre-built installers of latest release can be downloaded from the links below.

### 版本說明
- 一般使用版：便於教師教學使用，包含兩套範例程式，並且使用者可以建立自己的資料集，並分享給他人使用。
- 官方競賽版：競賽專用的版本，包含兩套範例程式，不能建立下載資料集。
- 台南市競賽版：為了台南市競賽客製化建置，包含台南市提供之範例程式，隱藏下載資料集的功能。

#### Windows 64-bit
##### 一般使用版
[![](https://img.shields.io/badge/EXE%20Installer-v2.2.0-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0.Setup.exe) [![](https://img.shields.io/badge/ZIP%20Portable-v2.2.0-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-win32-x64-2.2.0.zip)
##### 官方競賽版
[![](https://img.shields.io/badge/EXE%20Installer-v2.2.0--competition-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0-competition.Setup.exe) [![](https://img.shields.io/badge/ZIP%20Portable-v2.2.0--competition-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-win32-x64-2.2.0-competition.zip)
##### 台南競賽版
[![](https://img.shields.io/badge/EXE%20Installer-v2.2.0--competition--tn-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0-competition-tn.Setup.exe) [![](https://img.shields.io/badge/ZIP%20Portable-v2.2.0--competition--tn-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-win32-x64-2.2.0-competition-tn.zip)
#### macOS 64-bit
##### 一般使用版
[![](https://img.shields.io/badge/DMG%20Installer-v2.2.0-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0.dmg) [![](https://img.shields.io/badge/ZIP%20Portable-v2.2.0-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-darwin-x64-2.2.0.zip)
##### 官方競賽版
[![](https://img.shields.io/badge/DMG%20Installer-v2.2.0--competition-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0-competition.dmg) [![](https://img.shields.io/badge/ZIP%20Portable-v2.2.0--competition-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-darwin-x64-2.2.0-competition.zip)
##### 台南競賽版
[![](https://img.shields.io/badge/DMG%20Installer-v2.2.0--competition--tn-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0-competition-tn.dmg) [![](https://img.shields.io/badge/ZIP%20Portable-v2.2.0--competition--tn-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-darwin-x64-2.2.0-competition-tn.zip)

#### Linux 64-bit
##### 一般使用版
[![](https://img.shields.io/badge/DEB%20Installer-v2.2.0-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0.deb) [![](https://img.shields.io/badge/RPM%20Installer-v2.2.0-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0.rpm) 
##### 官方競賽版
[![](https://img.shields.io/badge/DEB%20Installer-v2.2.0--competition-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0-competition.deb) [![](https://img.shields.io/badge/RPM%20Installer-v2.2.0--competition-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0-competition.rpm) 
##### 台南競賽版
[![](https://img.shields.io/badge/DEB%20Installer-v2.2.0--competition--tn-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0-competition-tn.deb) [![](https://img.shields.io/badge/RPM%20Installer-v2.2.0--competition--tn-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.2.0/PAIA-Desktop-2.2.0-competition-tn.rpm) 


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
