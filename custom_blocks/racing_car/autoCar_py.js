Blockly.Python['getcarinfo'] = function(block) {
  Blockly.Python.definitions_['import_autoRcar'] = 'from src import autoRCar';
  Blockly.Python.provideFunction_(
      'init_autoRcar',
      ["autoCar = autoRCar.autoRCar()"]);
  var lane_size = block.getFieldValue('車距');
  var feature_size = block.getFieldValue('賽道數量');
  var variable_feature = Blockly.Python.nameDB_.getName(block.getFieldValue('feature'), Blockly.Variables.NAME_TYPE);
  var variable_mylane = Blockly.Python.nameDB_.getName(block.getFieldValue('mylane'), Blockly.Variables.NAME_TYPE);
  // TODO: Assemble Python into code variable.
  var code = `${variable_feature}, ${variable_mylane} = autoCar.getCarInfo(scene_info, ${lane_size}, ${feature_size})\n`;
  return code;
};

Blockly.Python['iscenterlane'] = function(block) {
  Blockly.Python.definitions_['import_autoRcar'] = 'from src import autoRCar';
  Blockly.Python.provideFunction_(
      'init_autoRcar',
      ["autoCar = autoRCar.autoRCar()"]);
  var variable_targetlane = Blockly.Python.nameDB_.getName(block.getFieldValue('targetLane'), Blockly.Variables.NAME_TYPE);
  // TODO: Assemble Python into code variable.
  var code = `autoCar.isCenterLane(${variable_targetlane})`;
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['printboard'] = function(block) {
  Blockly.Python.definitions_['import_autoRcar'] = 'from src import autoRCar';
  Blockly.Python.provideFunction_(
      'init_autoRcar',
      ["autoCar = autoRCar.autoRCar()"]);
  // TODO: Assemble Python into code variable.
  var code = 'autoCar.printBoard()\n';
  return code;
};

Blockly.Python['gettarget'] = function(block) {
  Blockly.Python.definitions_['import_autoRcar'] = 'from src import autoRCar';
  Blockly.Python.provideFunction_(
      'init_autoRcar',
      ["autoCar = autoRCar.autoRCar()"]);
  var variable_user_cmd = Blockly.Python.nameDB_.getName(block.getFieldValue('user_cmd'), Blockly.Variables.NAME_TYPE);
  // var variable_command = Blockly.Python.nameDB_.getName(block.getFieldValue('command'), Blockly.Variables.NAME_TYPE);
  var variable_targetlane = Blockly.Python.nameDB_.getName(block.getFieldValue('targetLane'), Blockly.Variables.NAME_TYPE);
  // TODO: Assemble Python into code variable.
  var code = `${variable_user_cmd}, ${variable_targetlane} = autoCar.getTarget()\n`;
  return code;
};
