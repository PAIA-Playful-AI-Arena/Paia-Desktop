# PAIA Desktop

PAIA Desktop is a visual programming editor based on [Blockly](https://github.com/google/blockly), and built on [Electron](https://github.com/electron/electron). We designed it to make everyone can easily build AI to play games.

## Downloads

Pre-built installers of latest release can be downloaded from the links below.

#### Windows 64-bit

[![](https://img.shields.io/badge/EXE%20Installer-v2.0.1-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.0.1/PAIA-Desktop-2.0.1.Setup.exe) [![](https://img.shields.io/badge/ZIP%20Portable-v2.0.1-red)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.0.1/PAIA-Desktop-win32-x64-2.0.1.zip)
#### macOS 64-bit

[![](https://img.shields.io/badge/DMG%20Installer-v2.0.1-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.0.1/PAIA-Desktop-2.0.1.dmg) [![](https://img.shields.io/badge/ZIP%20Portable-v2.0.1-blue)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.0.1/PAIA-Desktop-darwin-x64-2.0.1.zip)

#### Linux 64-bit

[![](https://img.shields.io/badge/DEB%20Installer-v2.0.1-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.0.1/PAIA-Desktop-2.0.1.deb) [![](https://img.shields.io/badge/RPM%20Installer-v2.0.1-green)](https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/releases/download/v2.0.1/PAIA-Desktop-2.0.1.rpm) 


## Install FAQ
Q:在Ｗin10安裝完畢，無法使用 manual.xml 來操控遊戲物件?
A:可以參考此篇文章解決問題。
https://program-the-world.notion.site/PAIA-Desktop-2-0-0-e053f2440c994dcc98d77123bbc9b232
- 問題成因：專案中使用的鍵盤函式庫，在 2022/1月底被微軟的防毒軟體視為惡意程式，因此我們尚未尋找到替代模組可以使用，本團隊預計三月中會修正此問題，再更新至專案中。


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
