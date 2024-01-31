Blockly.Themes.Classic.blockStyles.text_blocks = {
  "colourPrimary": "#B7F2FF"
};

Blockly.Blocks['text_changeCase'] = {
  /**
   * Block for changing capitalization.
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": "%{BKY_TEXT_CHANGECASE_TITLE}",
      "args0": [
        {
          "type": "input_value",
          "name": "TEXT",
          "check": "String"
        },
        {
          "type": "field_dropdown",
          "name": "CASE",
          "options": [
            ['%{BKY_TEXT_CHANGECASE_OPERATOR_UPPERCASE}', 'UPPERCASE'],
            ['%{BKY_TEXT_CHANGECASE_OPERATOR_LOWERCASE}', 'LOWERCASE'],
            ['%{BKY_TEXT_CHANGECASE_OPERATOR_TITLECASE}', 'TITLECASE']
          ]
        }
      ],
      "output": "String",
      "style": "text_blocks",
      "helpUrl": "%{BKY_TEXT_CHANGECASE_HELPURL}",
      "tooltip": "%{BKY_TEXT_CHANGECASE_TOOLTIP}",
    });
  }
};

Blockly.Blocks['text_trim'] = {
  /**
   * Block for trimming spaces.
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": "%{BKY_TEXT_TRIM_TITLE}",
      "args0": [
        {
          "type": "input_value",
          "name": "TEXT",
          "check": "String"
        },
        {
          "type": "field_dropdown",
          "name": "MODE",
          "options": [
            ['%{BKY_TEXT_TRIM_OPERATOR_BOTH}', 'BOTH'],
            ['%{BKY_TEXT_TRIM_OPERATOR_LEFT}', 'LEFT'],
            ['%{BKY_TEXT_TRIM_OPERATOR_RIGHT}', 'RIGHT']
          ]
        }
      ],
      "output": "String",
      "style": "text_blocks",
      "helpUrl": "%{BKY_TEXT_TRIM_HELPURL}",
      "tooltip": "%{BKY_TEXT_TRIM_TOOLTIP}",
    });
  }
};
