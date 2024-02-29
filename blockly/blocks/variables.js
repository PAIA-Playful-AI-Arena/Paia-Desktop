Blockly.defineBlocksWithJsonArray([
  // Block for variable getter.
  {
    'type': 'variables_get',
    'message0': '%1',
    'args0': [
      {
        'type': 'field_variable',
        'name': 'VAR',
        'variable': '%{BKY_VARIABLES_DEFAULT_NAME}',
      },
    ],
    'output': null,
    'style': 'variable_blocks',
    'helpUrl': '%{BKY_VARIABLES_GET_HELPURL}',
    'tooltip': '%{BKY_VARIABLES_GET_TOOLTIP}',
    'extensions': ['custom_contextMenu_variableSetterGetter'],
  },
  // Block for variable setter.
  {
    'type': 'variables_set',
    'message0': '%{BKY_VARIABLES_SET}',
    'args0': [
      {
        'type': 'field_variable',
        'name': 'VAR',
        'variable': '%{BKY_VARIABLES_DEFAULT_NAME}',
      },
      {
        'type': 'input_value',
        'name': 'VALUE',
      },
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'variable_blocks',
    'tooltip': '%{BKY_VARIABLES_SET_TOOLTIP}',
    'helpUrl': '%{BKY_VARIABLES_SET_HELPURL}',
    'extensions': ['custom_contextMenu_variableSetterGetter'],
  },
]);

const CUSTOM_CONTEXT_MENU_VARIABLE_GETTER_SETTER_MIXIN = {
  customContextMenu: function (options) {
    // Getter blocks have the option to create a setter block, and vice versa.
    if (!this.isInFlyout) {
      let oppositeType;
      let contextMenuMsg;
      if (this.type === 'variables_get') {
        oppositeType = 'variables_set';
        contextMenuMsg = Blockly.Msg['VARIABLES_GET_CREATE_SET'];
      } else {
        oppositeType = 'variables_get';
        contextMenuMsg = Blockly.Msg['VARIABLES_SET_CREATE_GET'];
      }

      const varField = this.getField('VAR');
      const newVarBlockState = {
        type: oppositeType,
        fields: {VAR: varField.saveState(true)},
      };

      options.push({
        enabled: this.workspace.remainingCapacity() > 0,
        text: contextMenuMsg.replace('%1', varField.getText()),
        callback: Blockly.ContextMenu.callbackFactory(this, newVarBlockState),
      });
    } else {
      if (
        this.type === 'variables_get' ||
        this.type === 'variables_get_reporter'
      ) {
        const renameOption = {
          text: Blockly.Msg['RENAME_VARIABLE'],
          enabled: true,
          callback: renameOptionCallbackFactory(this),
        };
        const name = this.getField('VAR').getText();
        const deleteOption = {
          text: Blockly.Msg['DELETE_VARIABLE'].replace('%1', name),
          enabled: true,
          callback: deleteOptionCallbackFactory(this),
        };
        options.unshift(renameOption);
        options.unshift(deleteOption);
      }
    }
  },
  onchange: function (_e) {
    const id = this.getFieldValue('VAR');
    const variableModel = Blockly.Variables.getVariable(this.workspace, id);
    if (this.type === 'variables_get') {
      this.outputConnection.setCheck(variableModel.type);
    } else {
      this.getInput('VALUE').connection.setCheck(variableModel.type);
    }
  },
};

Blockly.Extensions.registerMixin(
  'custom_contextMenu_variableSetterGetter',
  CUSTOM_CONTEXT_MENU_VARIABLE_GETTER_SETTER_MIXIN,
);

