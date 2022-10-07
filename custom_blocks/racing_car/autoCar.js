Blockly.Blocks['getcarinfo'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("提供場景資訊");
    this.appendDummyInput()
        .appendField("車距")
        .appendField(new Blockly.FieldDropdown([["60","60"], ["70","70"], ["80","80"], ["90","90"], ["100","100"]]), "車距")
        .appendField("以內");
    this.appendDummyInput()
        .appendField("賽道數量")
        .appendField(new Blockly.FieldDropdown([["3","3"], ["5","5"],  ["7","7"], ["9","9"]]), "賽道數量");
    this.appendDummyInput()
        .appendField("並回傳本次特徵：")
        .appendField(new Blockly.FieldVariable("本次特徵"), "feature")
        .appendField("和本車賽道：")
        .appendField(new Blockly.FieldVariable("本車賽道編號"), "mylane");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
 this.setTooltip("取得附近賽道和指定距離內的賽車特徵還有賽道編號");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iscenterlane'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("是否抵達目標賽道：")
        .appendField(new Blockly.FieldVariable("目標賽道"), "targetLane");
    this.setOutput(true, "Boolean");
    this.setColour(230);
 this.setTooltip("是否抵達賽道中心");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['printboard'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("印出本次特徵");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
 this.setTooltip("印出賽車的本次特徵");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['gettarget'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("取得前進方向：")
        .appendField(new Blockly.FieldVariable("前進方向"), "user_cmd")
        // .appendField("、指令：")
        // .appendField(new Blockly.FieldVariable("指令"), "command")
        .appendField("和目標賽道：")
        .appendField(new Blockly.FieldVariable("目標賽道"), "targetLane");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
 this.setTooltip("根據目前車子的位置，判斷要怎麼前進");
 this.setHelpUrl("");
  }
};
