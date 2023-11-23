Blockly.Themes.Classic.blockStyles.list_blocks = {
  "colourPrimary": "210"
};

Blockly.defineBlocksWithJsonArray([
  // Block for extending a list with another list
  {
    "type": "lists_extend",
    "message0": "%{BKY_LISTS_EXTEND_TITLE}",
    "args0": [
      {
        "type": "field_variable",
        "name": "VAR",
        "variable": "%{BKY_LISTS_EXTEND_VARIABLE}"
      },
      {
        "type": "input_value",
        "name": "LIST",
        "check": "Array"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "list_blocks",
    "tooltip": "%{BKY_LISTS_EXTEND_TOOLTIP}"
  }
]);

Blockly.Blocks['lists_indexOf'] = {
  /**
   * Block for finding an item in the list.
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": "%{BKY_LISTS_INDEX_OF_TITLE}",
      "args0": [
        {
          "type": "input_value",
          "name": "VALUE",
          "check": "Array"
        },
        {
          "type": "field_dropdown",
          "name": "END",
          "options": [
            ['%{BKY_LISTS_INDEX_OF_FIRST}', 'FIRST'],
            ['%{BKY_LISTS_INDEX_OF_LAST}', 'LAST']
          ]
        },
        {
          "type": "input_value",
          "name": "find",
        }
      ],
      "output": "Number",
      "style": "list_blocks",
      "inputsInline": true,
      "helpUrl": "%{BKY_LISTS_INDEX_OF_HELPURL}",
      "tooltip": "%{BKY_LISTS_INDEX_OF_TOOLTIP}",
    });
    this.setTooltip(() => {
      return Blockly.Msg['LISTS_INDEX_OF_TOOLTIP'].replace(
        '%1',
        this.workspace.options.oneBasedIndex ? '0' : '-1'
      );
    });
  }
};

Blockly.Blocks['lists_getIndex'] = {
  /**
   * Block for getting element at index.
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": "%{BKY_LISTS_GET_INDEX_TITLE}",
      "args0": [
        {
          "type": "input_value",
          "name": "VALUE",
          "check": "Array"
        },
        {
          "type": "input_dummy",
          "name": "MODE_DUMMY"
        },
        {
          "type": "input_dummy",
          "name": "AT"
        }
      ],
      "style": "list_blocks",
      "inputsInline": true,
      "helpUrl": "%{BKY_LISTS_GET_INDEX_HELPURL}"
    });
    const MODE =
        [
          [Blockly.Msg['LISTS_GET_INDEX_GET'], 'GET'],
          [Blockly.Msg['LISTS_GET_INDEX_GET_REMOVE'], 'GET_REMOVE'],
          [Blockly.Msg['LISTS_GET_INDEX_REMOVE'], 'REMOVE']
        ];
    this.WHERE_OPTIONS =
        [
          [Blockly.Msg['LISTS_GET_INDEX_FROM_START'], 'FROM_START'],
          [Blockly.Msg['LISTS_GET_INDEX_FROM_END'], 'FROM_END'],
          [Blockly.Msg['LISTS_GET_INDEX_FIRST'], 'FIRST'],
          [Blockly.Msg['LISTS_GET_INDEX_LAST'], 'LAST'],
          [Blockly.Msg['LISTS_GET_INDEX_RANDOM'], 'RANDOM']
        ];
    const modeMenu = Blockly.fieldRegistry.fromJson({
      type: 'field_dropdown',
      options: MODE,
    });
    modeMenu.setValidator(
      function (value) {
        const isStatement = value === 'REMOVE';
        this.getSourceBlock().updateStatement_(isStatement);
        return undefined;
      }
    );
    this.getInput('MODE_DUMMY')
        .appendField(modeMenu, 'MODE')
        .appendField('', 'SPACE');
    if (Blockly.Msg['LISTS_GET_INDEX_TAIL']) {
      this.appendDummyInput('TAIL')
          .appendField(Blockly.Msg['LISTS_GET_INDEX_TAIL']);
    }
    this.setInputsInline(true);
    this.setOutput(true);
    this.updateAt_(true);
    this.setTooltip(() => {
      const mode = this.getFieldValue('MODE');
      const where = this.getFieldValue('WHERE');
      let tooltip = '';
      switch (mode + ' ' + where) {
        case 'GET FROM_START':
        case 'GET FROM_END':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_GET_FROM'];
          break;
        case 'GET FIRST':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_GET_FIRST'];
          break;
        case 'GET LAST':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_GET_LAST'];
          break;
        case 'GET RANDOM':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_GET_RANDOM'];
          break;
        case 'GET_REMOVE FROM_START':
        case 'GET_REMOVE FROM_END':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM'];
          break;
        case 'GET_REMOVE FIRST':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST'];
          break;
        case 'GET_REMOVE LAST':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST'];
          break;
        case 'GET_REMOVE RANDOM':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM'];
          break;
        case 'REMOVE FROM_START':
        case 'REMOVE FROM_END':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM'];
          break;
        case 'REMOVE FIRST':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST'];
          break;
        case 'REMOVE LAST':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST'];
          break;
        case 'REMOVE RANDOM':
          tooltip = Blockly.Msg['LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM'];
          break;
      }
      if (where === 'FROM_START' || where === 'FROM_END') {
        const msg = 
          where === 'FROM_START'
          ? Blockly.Msg['LISTS_INDEX_FROM_START_TOOLTIP']
          : Blockly.Msg['LISTS_INDEX_FROM_END_TOOLTIP'];
        tooltip +=
          '  ' + 
          msg.replace('%1', this.workspace.options.oneBasedIndex ? '#1' : '#0');
      }
      return tooltip;
    });
  },
  /**
   * Create XML to represent whether the block is a statement or a value.
   * Also represent whether there is an 'AT' input.
   * @return {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    const isStatement = !this.outputConnection;
    container.setAttribute('statement', isStatement);
    const isAt = this.getInput('AT');
    container.setAttribute('at', String(isAt));
    return container;
  },
  /**
   * Parse XML to restore the 'AT' input.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function(xmlElement) {
    // Note: Until January 2013 this block did not have mutations,
    // so 'statement' defaults to false and 'at' defaults to true.
    const isStatement = xmlElement.getAttribute('statement') === 'true';
    this.updateStatement_(isStatement);
    const isAt = (xmlElement.getAttribute('at') !== 'false');
    this.updateAt_(isAt);
  },
  /**
   * Switch between a value block and a statement block.
   * @param {boolean} newStatement True if the block should be a statement.
   *     False if the block should be a value.
   * @private
   * @this {Blockly.Block}
   */
  updateStatement_: function(newStatement) {
    const oldStatement = !this.outputConnection;
    if (newStatement !== oldStatement) {
      this.unplug(true, true);
      if (newStatement) {
        this.setOutput(false);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
      } else {
        this.setPreviousStatement(false);
        this.setNextStatement(false);
        this.setOutput(true);
      }
    }
  },
  /**
   * Create or delete an input for the numeric index.
   * @param {boolean} isAt True if the input should exist.
   * @private
   * @this {Blockly.Block}
   */
  updateAt_: function(isAt) {
    // Destroy old 'AT' and 'ORDINAL' inputs.
    this.removeInput('AT');
    this.removeInput('ORDINAL', true);
    // Create either a value 'AT' input or a dummy input.
    if (isAt) {
      this.appendValueInput('AT').setCheck('Number');
      if (Blockly.Msg['ORDINAL_NUMBER_SUFFIX']) {
        this.appendDummyInput('ORDINAL')
            .appendField(Blockly.Msg['ORDINAL_NUMBER_SUFFIX']);
      }
    } else {
      this.appendDummyInput('AT');
    }
    const menu = Blockly.fieldRegistry.fromJson({
      type: 'field_dropdown',
      options: this.WHERE_OPTIONS,
    });
    menu.setValidator(
      function (value) {
        const newAt = value === 'FROM_START' || value === 'FROM_END';
        // The 'isAt' variable is available due to this function being a closure.
        if (newAt !== isAt) {
          const block = this.getSourceBlock();
          block.updateAt_(newAt);
          // This menu has been destroyed and replaced.  Update the replacement.
          block.setFieldValue(value, 'WHERE');
          return null;
        }
        return undefined;
      }
    );
    this.getInput('AT').appendField(menu, 'WHERE');
    if (Blockly.Msg['LISTS_GET_INDEX_TAIL']) {
      this.moveInputBefore('TAIL', null);
    }
  }
};

Blockly.Blocks['lists_setIndex'] = {
  /**
   * Block for setting the element at index.
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": "%{BKY_LISTS_SET_INDEX_TITLE}",
      "args0": [
        {
          "type": "input_value",
          "name": "LIST",
          "check": "Array"
        },
        {
          "type": "input_dummy",
          "name": "AT"
        },
        {
          "type": "input_value",
          "name": "TO",
        }
      ],
      "style": "list_blocks",
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "helpUrl": "%{BKY_LISTS_SET_INDEX_HELPURL}"
    });
    this.WHERE_OPTIONS =
        [
          [Blockly.Msg['LISTS_SET_INDEX_FROM_START'], 'FROM_START'],
          [Blockly.Msg['LISTS_SET_INDEX_FROM_END'], 'FROM_END'],
          [Blockly.Msg['LISTS_SET_INDEX_FIRST'], 'FIRST'],
          [Blockly.Msg['LISTS_SET_INDEX_LAST'], 'LAST'],
          [Blockly.Msg['LISTS_SET_INDEX_RANDOM'], 'RANDOM']
        ];
    this.updateAt_(true);
    this.setTooltip(() => {
      const where = this.getFieldValue('WHERE');
      let tooltip = '';
      switch (where) {
        case 'FROM_START':
        case 'FROM_END':
          tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_FROM'];
          break;
        case 'FIRST':
          tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_FIRST'];
          break;
        case 'LAST':
          tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_LAST'];
          break;
        case 'RANDOM':
          tooltip = Blockly.Msg['LISTS_SET_INDEX_TOOLTIP_RANDOM'];
          break;
      }
      if (where === 'FROM_START' || where === 'FROM_END') {
        tooltip +=
          '  ' +
          Blockly.Msg['LISTS_INDEX_FROM_START_TOOLTIP'].replace(
            '%1',
            this.workspace.options.oneBasedIndex ? '#1' : '#0'
          );
      }
      return tooltip;
    });
  },
  /**
   * Create XML to represent whether there is an 'AT' input.
   * @return {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    const isAt = this.getInput('AT');
    container.setAttribute('at', String(isAt));
    return container;
  },
  /**
   * Parse XML to restore the 'AT' input.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function(xmlElement) {
    // Note: Until January 2013 this block did not have mutations,
    // so 'at' defaults to true.
    const isAt = (xmlElement.getAttribute('at') !== 'false');
    this.updateAt_(isAt);
  },
  /**
   * Create or delete an input for the numeric index.
   * @param {boolean} isAt True if the input should exist.
   * @private
   * @this {Blockly.Block}
   */
  updateAt_: function(isAt) {
    // Destroy old 'AT' and 'ORDINAL' input.
    this.removeInput('AT');
    this.removeInput('ORDINAL', true);
    // Create either a value 'AT' input or a dummy input.
    if (isAt) {
      this.appendValueInput('AT').setCheck('Number');
      if (Blockly.Msg['ORDINAL_NUMBER_SUFFIX']) {
        this.appendDummyInput('ORDINAL')
            .appendField(Blockly.Msg['ORDINAL_NUMBER_SUFFIX']);
      }
    } else {
      this.appendDummyInput('AT');
    }
    const menu = Blockly.fieldRegistry.fromJson({
      type: 'field_dropdown',
      options: this.WHERE_OPTIONS,
    });
    menu.setValidator(
      function (value) {
        const newAt = value === 'FROM_START' || value === 'FROM_END';
        // The 'isAt' variable is available due to this function being a closure.
        if (newAt !== isAt) {
          const block = this.getSourceBlock();
          block.updateAt_(newAt);
          // This menu has been destroyed and replaced.  Update the replacement.
          block.setFieldValue(value, 'WHERE');
          return null;
        }
        return undefined;
      }
    );
    this.moveInputBefore('AT', 'TO');
    if (this.getInput('ORDINAL')) {
      this.moveInputBefore('ORDINAL', 'TO');
    }

    this.getInput('AT').appendField(menu, 'WHERE');
  }
};

Blockly.Blocks['lists_insertIndex'] = {
  /**
   * Block for inserting the element at index.
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": "%{BKY_LISTS_INSERT_INDEX_TITLE}",
      "args0": [
        {
          "type": "input_value",
          "name": "LIST",
          "check": "Array"
        },
        {
          "type": "input_value",
          "name": "TO",
        },
        {
          "type": "input_dummy",
          "name": "AT"
        }
      ],
      "style": "list_blocks",
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "helpUrl": "%{BKY_LISTS_SET_INDEX_HELPURL}"
    });
    this.WHERE_OPTIONS =
        [
          [Blockly.Msg['LISTS_INSERT_INDEX_FROM_START'], 'FROM_START'],
          [Blockly.Msg['LISTS_INSERT_INDEX_FROM_END'], 'FROM_END'],
          [Blockly.Msg['LISTS_INSERT_INDEX_FIRST'], 'FIRST'],
          [Blockly.Msg['LISTS_INSERT_INDEX_LAST'], 'LAST'],
          [Blockly.Msg['LISTS_INSERT_INDEX_RANDOM'], 'RANDOM']
        ];
    this.updateAt_(true);
    this.setTooltip(() => {
      const where = this.getFieldValue('WHERE');
      let tooltip = '';
      switch (where) {
        case 'FROM_START':
        case 'FROM_END':
          tooltip = Blockly.Msg['LISTS_INSERT_INDEX_TOOLTIP_FROM'];
          break;
        case 'FIRST':
          tooltip = Blockly.Msg['LISTS_INSERT_INDEX_TOOLTIP_FIRST'];
          break;
        case 'LAST':
          tooltip = Blockly.Msg['LISTS_INSERT_INDEX_TOOLTIP_LAST'];
          break;
        case 'RANDOM':
          tooltip = Blockly.Msg['LISTS_INSERT_INDEX_TOOLTIP_RANDOM'];
          break;
      }
      if (where === 'FROM_START' || where === 'FROM_END') {
        tooltip +=
          '  ' +
          Blockly.Msg['LISTS_INDEX_FROM_START_TOOLTIP'].replace(
            '%1',
            this.workspace.options.oneBasedIndex ? '#1' : '#0'
          );
      }
      return tooltip;
    });
  },
  /**
   * Create XML to represent whether there is an 'AT' input.
   * @return {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    const isAt = this.getInput('AT');
    container.setAttribute('at', String(isAt));
    return container;
  },
  /**
   * Parse XML to restore the 'AT' input.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function(xmlElement) {
    // Note: Until January 2013 this block did not have mutations,
    // so 'at' defaults to true.
    const isAt = (xmlElement.getAttribute('at') !== 'false');
    this.updateAt_(isAt);
  },
  /**
   * Create or delete an input for the numeric index.
   * @param {boolean} isAt True if the input should exist.
   * @private
   * @this {Blockly.Block}
   */
  updateAt_: function(isAt) {
    // Destroy old 'AT' and 'ORDINAL' input.
    this.removeInput('AT');
    this.removeInput('ORDINAL', true);
    // Create either a value 'AT' input or a dummy input.
    if (isAt) {
      this.appendValueInput('AT').setCheck('Number');
      if (Blockly.Msg['ORDINAL_NUMBER_SUFFIX']) {
        this.appendDummyInput('ORDINAL')
            .appendField(Blockly.Msg['ORDINAL_NUMBER_SUFFIX']);
      }
    } else {
      this.appendDummyInput('AT');
    }
    const menu = Blockly.fieldRegistry.fromJson({
      type: 'field_dropdown',
      options: this.WHERE_OPTIONS,
    });
    menu.setValidator(
      function (value) {
        const newAt =  value === 'FROM_START' || value === 'FROM_END';
        // The 'isAt' variable is available due to this function being a closure.
        if (newAt != isAt) {
          const block = this.getSourceBlock();
          block.updateAt_(newAt);
          // This menu has been destroyed and replaced.  Update the replacement.
          block.setFieldValue(value, 'WHERE');
          return null;
        }
        return undefined;
      }
    );
    this.moveInputBefore('AT', null);
    if (this.getInput('ORDINAL')) {
      this.moveInputBefore('ORDINAL', null);
    }

    this.getInput('AT').appendField(menu, 'WHERE');
  }
};

Blockly.Blocks['lists_getSublist'] = {
  /**
   * Block for getting sublist.
   * @this {Blockly.Block}
   */
  init: function() {
    this['WHERE_OPTIONS_1'] =
        [
          [Blockly.Msg['LISTS_GET_SUBLIST_START_FROM_START'], 'FROM_START'],
          [Blockly.Msg['LISTS_GET_SUBLIST_START_FROM_END'], 'FROM_END'],
          [Blockly.Msg['LISTS_GET_SUBLIST_START_FIRST'], 'FIRST']
        ];
    this['WHERE_OPTIONS_2'] =
        [
          [Blockly.Msg['LISTS_GET_SUBLIST_END_FROM_START'], 'FROM_START'],
          [Blockly.Msg['LISTS_GET_SUBLIST_END_FROM_END'], 'FROM_END'],
          [Blockly.Msg['LISTS_GET_SUBLIST_END_LAST'], 'LAST']
        ];
    this.setHelpUrl(Blockly.Msg['LISTS_GET_SUBLIST_HELPURL']);
    this.setStyle('list_blocks');
    this.appendValueInput('LIST')
        .setCheck('Array')
        .appendField(Blockly.Msg['LISTS_GET_SUBLIST_IN_LIST']);
    this.appendDummyInput('AT1');
    this.appendDummyInput('AT2');
    if (Blockly.Msg['LISTS_GET_SUBLIST_TAIL']) {
      this.appendDummyInput('TAIL')
          .appendField(Blockly.Msg['LISTS_GET_SUBLIST_TAIL']);
    }
    this.setInputsInline(true);
    this.setOutput(true, 'Array');
    this.updateAt_(1, true);
    this.updateAt_(2, true);
    this.setTooltip(Blockly.Msg['LISTS_GET_SUBLIST_TOOLTIP']);
  },
  /**
   * Create XML to represent whether there are 'AT' inputs.
   * @return {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    const isAt1 = this.getInput('AT1');
    container.setAttribute('at1', String(isAt1));
    const isAt2 = this.getInput('AT2');
    container.setAttribute('at2', String(isAt2));
    return container;
  },
  /**
   * Parse XML to restore the 'AT' inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function(xmlElement) {
    const isAt1 = xmlElement.getAttribute('at1') === 'true';
    const isAt2 = xmlElement.getAttribute('at2') === 'true';
    this.updateAt_(1, isAt1);
    this.updateAt_(2, isAt2);
  },
  /**
   * Create or delete an input for a numeric index.
   * This block has two such inputs, independent of each other.
   * @param {number} n Specify first or second input (1 or 2).
   * @param {boolean} isAt True if the input should exist.
   * @private
   * @this {Blockly.Block}
   */
  updateAt_: function(n, isAt) {
    // Create or delete an input for the numeric index.
    // Destroy old 'AT' and 'ORDINAL' inputs.
    this.removeInput('AT' + n);
    this.removeInput('ORDINAL' + n, true);
    // Create either a value 'AT' input or a dummy input.
    if (isAt) {
      this.appendValueInput('AT' + n).setCheck('Number');
      if (Blockly.Msg['ORDINAL_NUMBER_SUFFIX']) {
        this.appendDummyInput('ORDINAL' + n)
            .appendField(Blockly.Msg['ORDINAL_NUMBER_SUFFIX']);
      }
    } else {
      this.appendDummyInput('AT' + n);
    }
    const menu = Blockly.fieldRegistry.fromJson({
      type: 'field_dropdown',
      options: this['WHERE_OPTIONS_' + n],
    });
    menu.setValidator(
      function (value) {
        const newAt = value === 'FROM_START' || value === 'FROM_END';
        // The 'isAt' variable is available due to this function being a
        // closure.
        if (newAt != isAt) {
          const block = this.getSourceBlock();
          block.updateAt_(n, newAt);
          // This menu has been destroyed and replaced.
          // Update the replacement.
          block.setFieldValue(value, 'WHERE' + n);
          return null;
        }
      }
    );
    this.getInput('AT' + n).appendField(menu, 'WHERE' + n);
    if (n === 1) {
      this.moveInputBefore('AT1', 'AT2');
      if (this.getInput('ORDINAL1')) {
        this.moveInputBefore('ORDINAL1', 'AT2');
      }
    }
    if (Blockly.Msg['LISTS_GET_SUBLIST_TAIL']) {
      this.moveInputBefore('TAIL', null);
    }
  }
};

Blockly.Blocks['lists_split'] = {
  /**
   * Block for splitting text into a list, or joining a list into text.
   * @this {Blockly.Block}
   */
  init: function() {
    // Assign 'this' to a variable for use in the closures below.
    this.jsonInit({
      "message0": Blockly.Msg['LISTS_SPLIT_TITLE'],
      "args0": [
        {
          "type": "input_value",
          "name": "INPUT",
          "check": ['String', 'Array']
        },
        {
          "type": "input_dummy",
          "name": "MODE_DUMMY",
        },
        {
          "type": "input_value",
          "name": "DELIM",
          "check": "String"
        }
      ],
      "output": "Array",
      "style": "list_blocks",
      "inputsInline": true,
      "tooltip": Blockly.Msg['LISTS_SPLIT_TOOLTIP'],
      "helpUrl": Blockly.Msg['LISTS_SPLIT_HELPURL']
    });
    const dropdown = Blockly.fieldRegistry.fromJson({
      type: 'field_dropdown',
      options: [
        [Blockly.Msg['LISTS_SPLIT_LIST_FROM_TEXT'], 'SPLIT'],
        [Blockly.Msg['LISTS_SPLIT_TEXT_FROM_LIST'], 'JOIN'],
      ],
    });
    dropdown.setValidator((newMode) => {
      this.updateType_(newMode);
    });
    this.getInput('MODE_DUMMY').appendField(dropdown, 'MODE');
    this.setTooltip(() => {
      const mode = thisBlock.getFieldValue('MODE');
      if (mode === 'SPLIT') {
        return Blockly.Msg['LISTS_SPLIT_TOOLTIP_SPLIT'];
      } else if (mode == 'JOIN') {
        return Blockly.Msg['LISTS_SPLIT_TOOLTIP_JOIN'];
      }
      throw Error('Unknown mode: ' + mode);
    });
  },
  /**
   * Modify this block to have the correct input and output types.
   * @param {string} newMode Either 'SPLIT' or 'JOIN'.
   * @private
   * @this {Blockly.Block}
   */
  updateType_: function(newMode) {
    const mode = this.getFieldValue('MODE');
    if (mode !== newMode) {
      const inputConnection = this.getInput('INPUT').connection;
      inputConnection.setShadowDom(null);
      const inputBlock = inputConnection.targetBlock();
      if (inputBlock) {
        inputConnection.disconnect();
        if (inputBlock.isShadow()) {
          inputBlock.dispose();
        } else {
          this.bumpNeighbours();
        }
      }
    }
    if (newMode === 'SPLIT') {
      this.outputConnection.setCheck('Array');
      this.getInput('INPUT').setCheck('String');
    } else {
      this.outputConnection.setCheck('String');
      this.getInput('INPUT').setCheck('Array');
    }
  },
  /**
   * Create XML to represent the input and output types.
   * @return {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('mode', this.getFieldValue('MODE'));
    return container;
  },
  /**
   * Parse XML to restore the input and output types.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function(xmlElement) {
    this.updateType_(xmlElement.getAttribute('mode'));
  }
};
