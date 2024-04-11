Blockly.Themes.Classic.blockStyles.file_blocks = {
  "colourPrimary": "#EBD1D1"
};

Blockly.defineBlocksWithJsonArray([
  // Block for saving an object as a pickle file.
  {
    "type": "file_save",
    "message0": "%{BKY_FILE_SAVE}",
    "args0": [
      {
        "type": "input_value",
        "name": "OBJECT"
      },
      {
        "type": "input_value",
        "name": "FILENAME",
        "check": "String"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "file_blocks",
    "tooltip": "%{BKY_FILE_SAVE_TOOLTIP}"
  },
  // Block for loading an object from a pickle file.
  {
    "type": "file_load",
    "message0": "%{BKY_FILE_LOAD}",
    "args0": [
      {
        "type": "input_value",
        "name": "OBJECT"
      },
      {
        "type": "input_value",
        "name": "FILENAME",
        "check": "String"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "file_blocks",
    "tooltip": "%{BKY_FILE_LOAD_TOOLTIP}"
  },
  // Block for saving an object as a csv file.
  {
    "type": "file_csv_save",
    "message0": "%{BKY_FILE_CSV_SAVE}",
    "args0": [
      {
        "type": "input_value",
        "name": "OBJECT"
      },
      {
        "type": "input_value",
        "name": "FILENAME",
        "check": "String"
      },
      {
        "type": "field_dropdown",
        "name": "DELIMITER",
        "options": [
          [",", ","],
          [":", ":"],
          [";", ";"],
          ["|", "|"],
          ["SPACE", " "],
          ["TAB", "\\t"]
        ]
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "file_blocks",
    "tooltip": "%{BKY_FILE_SAVE_TOOLTIP}"
  },
  // Block for loading an object from a csv file.
  {
    "type": "file_csv_load",
    "message0": "%{BKY_FILE_CSV_LOAD}",
    "args0": [
      {
        "type": "input_value",
        "name": "OBJECT"
      },
      {
        "type": "input_value",
        "name": "FILENAME",
        "check": "String"
      },
      {
        "type": "field_dropdown",
        "name": "DELIMITER",
        "options": [
          [",", ","],
          [":", ":"],
          [";", ";"],
          ["|", "|"],
          ["SPACE", " "],
          ["TAB", "\\t"]
        ]
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "file_blocks",
    "tooltip": "%{BKY_FILE_LOAD_TOOLTIP}"
  },
  // Block for checking if the path exists.
  {
    "type": "file_exists",
    "message0": "%1 存在",
    "args0": [
      {
        "type": "input_value",
        "name": "FILENAME",
        "check": "String"
      }
    ],
    "inputsInline": true,
    "output": "Boolean",
    "style": "file_blocks",
    "tooltip": ""
  }
]);
