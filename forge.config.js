const env = require('dotenv').config({ path: 'dev.env' });
if (env.error) {
  throw result.error;
}

module.exports = {
  "packagerConfig": {
    "icon": "media/paia-owl",
    "ignore": [
      "/.gitignore",
      "/.gitmodules",
      "/.vscode",
      "/js/blocks",
      "/js/generators",
      "/js/i18n",
      "/js/mlgame",
      "/js/msg",
      "/js/build.py",
      "(.*)__pycache__",
      "/python/build",
      "/python/interpreter.spec",
      "/python/interpreter.py",
      "/python/.gitignore",
      "/python/requirements.txt",
      "/python/README.md",
      "/venv",
      "/dev.env"
    ],
    "asar": {
      "unpackDir": "{python,games,custom_blocks}"
    },
    "protocols": [
      {
        "name": "Electron Fiddle",
        "schemes": [
          "paia-dekstop"
        ]
      }
    ],
    "windowsSign": {
      "signWithParams": ""
    },
    "osxSign": {},
    "osxNotarize": {
      "appleId": process.env.APPLE_ID,
      "appleIdPassword": process.env.APPLE_PASSWORD,
      "teamId": process.env.APPLE_TEAM_ID
    }
  },
  "makers": [
    {
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "signWithParams": ""
      }
    },
    {
      "name": "@electron-forge/maker-dmg",
      "platforms": [
        "darwin"
      ]
    },
    {
      "name": "@electron-forge/maker-deb",
      "config": {
        "options": {
          "icon": "media/paia-owl.png",
          "bin": "PAIA Desktop"
        }
      }
    },
    {
      "name": "@electron-forge/maker-rpm",
      "config": {
        "options": {
          "icon": "media/paia-owl.png",
          "bin": "PAIA Desktop"
        }
      }
    }
  ],
  "publishers": [
    {
      "name": "@electron-forge/publisher-github",
      "config": {
        "repository": {
          "owner": "PAIA-Playful-AI-Arena",
          "name": "Paia-Desktop"
        },
        "authToken": process.env.GITHUB_TOKEN,
        "prerelease": false,
        "draft": true
      }
    }
  ]
};