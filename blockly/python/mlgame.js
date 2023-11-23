python.pythonGenerator.forBlock['mlplay_class'] = function(block, generator) {
  // First, add a 'global' statement for every variable that is not shadowed by
  // a local parameter.
  let globals = [];
  let varName;
  const workspace = block.workspace;
  const variables = Blockly.Variables.allUsedVarModels(workspace) || [];
  for (let i = 0, variable; (variable = variables[i]); i++) {
    varName = variable.name;
    if (block.getVars().indexOf(varName) == -1) {
      globals.push(generator.nameDB_.getName(varName,
          Blockly.VARIABLE_CATEGORY_NAME));
    }
  }
  // Add developer variables.
  const devVarList = Blockly.Variables.allDeveloperVariables(workspace);
  for (var i = 0; i < devVarList.length; i++) {
    globals.push(generator.nameDB_.getName(devVarList[i],
        Blockly.Names.DEVELOPER_VARIABLE_TYPE));
  }

  globals = globals.length ?
      generator.INDENT + 'global ' + globals.join(', ') + '\n' : '';
  const init = generator.statementToCode(block, 'INIT') || generator.PASS;
  let init_var = "";
  if ('MLPLAY_INIT_INFO_OPTIONS' in Blockly.Msg) {
    for (let i = 0; i < Blockly.Msg['MLPLAY_INIT_INFO_OPTIONS'].length; i++) {
      init_var += (', ' + Blockly.Msg['MLPLAY_INIT_INFO_OPTIONS'][i][1]);
    }
  }
  const update = generator.statementToCode(block, 'UPDATE') || generator.PASS;
  const reset = generator.statementToCode(block, 'RESET') || generator.PASS;
  const code = 'class MLPlay:\n' + generator.prefixLines(
      'def __init__(self' + init_var + ', *args, **kwargs):\n' + globals + init +
      'def update(self, scene_info, keyboard=[], *args, **kwargs):\n' + globals + update +
      'def reset(self):\n' + globals + reset, generator.INDENT);
  return code;
};

python.pythonGenerator.forBlock['mlplay_init_info'] = function(block, generator) {
  const code = block.getFieldValue('FIELD');
  return [code, generator.ORDER_STRING_CONVERSION];
};

python.pythonGenerator.forBlock['mlplay_game_param'] = function(block, generator) {
  const code = block.getFieldValue('FIELD');
  return [code, generator.ORDER_STRING_CONVERSION];
};

python.pythonGenerator.forBlock['mlplay_player_status'] = function(block, generator) {
  const code = '"' + block.getFieldValue('STATUS') + '"';
  return [code, generator.ORDER_STRING_CONVERSION];
};

python.pythonGenerator.forBlock['mlplay_game_status'] = function(block, generator) {
  const code = '"' + block.getFieldValue('STATUS') + '"';
  return [code, generator.ORDER_STRING_CONVERSION];
};

python.pythonGenerator.forBlock['mlplay_get_info'] = function(block, generator) {
  const code = block.getFieldValue('FIELD');
  return [code, generator.ORDER_STRING_CONVERSION];
};

python.pythonGenerator.forBlock['mlplay_get_constant'] = function(block, generator) {
  const code = block.getFieldValue('CONSTANT').split("/").pop();
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['mlplay_return_action'] = function(block, generator) {
  const action = block.getFieldValue('ACTION');
  const code = (action[0] == '[' || action[0] == '{')?
    'return ' + action + '\n' : 'return "' + action + '"\n';
  return code;
};

python.pythonGenerator.forBlock['mlplay_return_value'] = function(block, generator) {
  const input = new Array(block.inputCount_);
  for (let i = 0; i < block.inputCount_; i++) {
    const value = generator.valueToCode(block, 'INPUT' + i,
        generator.ORDER_NONE) || '0';
    input[i] = "'" + block.inputKey_[i] + "': " + value;
  }
  const code = "return {" + input.join(', ') + "}\n";
  return code;
};

python.pythonGenerator.forBlock['mlplay_return_mazecar_action'] = function(block, generator) {
  var left = generator.valueToCode(block, 'LEFT_RPM',
      generator.ORDER_NONE) || '0';
  var right = generator.valueToCode(block, 'RIGHT_RPM',
      generator.ORDER_NONE) || '0';
  var code = "return {'left_PWM': " + left + ", 'right_PWM': " + right + "}\n";
  return code;
};

python.pythonGenerator.forBlock['mlplay_is_key_pressed'] = function(block, generator) {
  generator.definitions_['import_pygame'] = 'import pygame';
  var key = block.getFieldValue('KEY');
  var code = 'pygame.K_' + key + ' in keyboard';
  return [code, generator.ORDER_RELATIONAL];
};
