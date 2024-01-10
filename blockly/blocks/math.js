Blockly.Themes.Classic.blockStyles.math_blocks = {
  "colourPrimary": "#00428D"
};

Blockly.defineBlocksWithJsonArray([
  // Block for converting str to int or float.
  {
    "type": "math_convert",
    "message0": "%{BKY_MATH_CONVERT_TITLE}",
    "args0": [
      {
        "type": "input_value",
        "name": "STR",
        "check": "String"
      },
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          ["%{BKY_MATH_INT}", "int"],
          ["%{BKY_MATH_FLOAT}", "float"]
        ]
      }
    ],
    "inputsInline": true,
    "output": "Number",
    "style": "math_blocks",
    "tooltip": "%{BKY_MATH_CONVERT_TOOLTIP}"
  }
]);

Blockly.Blocks['math_on_list'] = {
  /**
   * Block for evaluating a list of numbers to return sum, average, min, max,
   * etc.  Some functions also work on text (min, max, mode, median).
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": "%{BKY_MATH_ONLIST_TITLE}",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "OP",
          "options": [
            ["%{BKY_MATH_ONLIST_OPERATOR_SUM}", "SUM"],
            ["%{BKY_MATH_ONLIST_OPERATOR_MIN}", "MIN"],
            ["%{BKY_MATH_ONLIST_OPERATOR_MAX}", "MAX"],
            ["%{BKY_MATH_ONLIST_OPERATOR_AVERAGE}", "AVERAGE"],
            ["%{BKY_MATH_ONLIST_OPERATOR_MEDIAN}", "MEDIAN"],
            ["%{BKY_MATH_ONLIST_OPERATOR_MODE}", "MODE"],
            ["%{BKY_MATH_ONLIST_OPERATOR_STD_DEV}", "STD_DEV"],
            ["%{BKY_MATH_ONLIST_OPERATOR_RANDOM}", "RANDOM"]
          ]
        },
        {
          "type": "input_value",
          "name": "LIST",
          "check": "Array"
        }
      ],
      "output": "Number",
      "style": "math_blocks",
      "helpUrl": "%{BKY_MATH_ONLIST_HELPURL}",
      "mutator": "math_modes_of_list_mutator",
      "extensions": ["math_op_tooltip"]
    });
  }
};
