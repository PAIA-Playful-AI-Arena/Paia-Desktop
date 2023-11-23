Blockly.Themes.Classic.blockStyles.ndarray_blocks = {
  "colourPrimary": "250"
};

Blockly.defineBlocksWithJsonArray([
  // Block for creating an ndarray from a list..
  {
    "type": "ndarrays_create_with_list",
    "message0": "%{BKY_NDARRAYS_CREATE_WITH_LIST}",
    "args0": [
      {
        "type": "input_value",
        "name": "LIST"
      }
    ],
    "output": "Array",
    "inputsInline": true,
    "style": "ndarray_blocks",
    "tooltip": "%{BKY_NDARRAYS_CREATE_WITH_LIST_TOOLTIP}"
  },
  // Block for converting an ndarray to a list.
  {
    "type": "ndarrays_to_list",
    "message0": "%{BKY_NDARRAYS_TO_LIST}",
    "args0": [
      {
        "type": "input_value",
        "name": "ARRAY"
      }
    ],
    "output": "Array",
    "inputsInline": true,
    "style": "ndarray_blocks",
    "tooltip": "%{BKY_NDARRAYS_TO_LIST_TOOLTIP}"
  }
]);

Blockly.Blocks['ndarrays_create_with'] = {
  /**
   * Block for creating an ndarray of any shape filled with a specific element.
   * @this {Blockly.Block}
   */
  init: function() {
    this.setStyle('ndarray_blocks');
    this.dimCount_ = 2;
    this.updateShape_();
    this.setInputsInline(true);
    this.setOutput(true, 'Array');
    this.setMutator(new Blockly.icons.MutatorIcon(['ndarrays_create_with_dim'], this));
    this.setTooltip(Blockly.Msg['NDARRAYS_CREATE_WITH_TOOLTIP']);
  },
  /**
   * Create XML to represent dim inputs.
   * @return {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('dims', this.dimCount_);
    return container;
  },
  /**
   * Parse XML to restore the dim inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function(xmlElement) {
    this.dimCount_ = parseInt(xmlElement.getAttribute('dims'), 10);
    this.updateShape_();
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @return {!Blockly.Block} Root block in mutator.
   * @this {Blockly.Block}
   */
  decompose: function(workspace) {
    const containerBlock = workspace.newBlock('ndarrays_create_with_container');
    containerBlock.initSvg();
    let connection = containerBlock.getInput('STACK').connection;
    for (let i = 0; i < this.dimCount_; i++) {
      const dimBlock = workspace.newBlock('ndarrays_create_with_dim');
      dimBlock.initSvg();
      connection.connect(dimBlock.previousConnection);
      connection = dimBlock.nextConnection;
    }
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this {Blockly.Block}
   */
  compose: function(containerBlock) {
    let dimBlock = containerBlock.getInputTargetBlock('STACK');
    // Count number of inputs.
    const connections = [];
    while (dimBlock) {
      if (dimBlock.isInsertionMarker()) {
        dimBlock = dimBlock.getNextBlock();
        continue;
      }
      connections.push(dimBlock.valueConnection_);
      dimBlock = dimBlock.getNextBlock();
    }
    // Disconnect any children that don't belong.
    for (let i = 0; i < this.dimCount_; i++) {
      const connection = this.getInput('DIM' + i).connection.targetConnection;
      if (connection && connections.indexOf(connection) === -1) {
        connection.disconnect();
      }
    }
    this.dimCount_ = connections.length;
    this.updateShape_();
    // Reconnect any child blocks.
    for (let i = 0; i < this.dimCount_; i++) {
      connections[i]?.reconnect(this, 'DIM' + i);
    }
  },
  /**
   * Store pointers to any connected child blocks.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this {Blockly.Block}
   */
  saveConnections: function(containerBlock) {
    let dimBlock = containerBlock.getInputTargetBlock('STACK');
    let i = 0;
    while (dimBlock) {
      if (dimBlock.isInsertionMarker()) {
        dimBlock = dimBlock.getNextBlock();
        continue;
      }
      const input = this.getInput('DIM' + i);
      dimBlock.valueConnection_ = input?.connection.targetConnection;
      dimBlock = dimBlock.getNextBlock();
      i++;
    }
  },
  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this {Blockly.Block}
   */
  updateShape_: function() {
    if (this.dimCount_ && this.getInput('EMPTY')) {
      this.removeInput('EMPTY');
    } else if (!this.dimCount_ && !this.getInput('EMPTY')) {
      this.appendDummyInput('EMPTY')
          .appendField(Blockly.Msg['NDARRAYS_CREATE_EMPTY_TITLE']);
    }
    if (this.dimCount_ && !this.getInput('FILL')) {
      this.appendValueInput('FILL')
          .appendField(Blockly.Msg['NDARRAYS_CREATE_FILL_WITH']);
    } else if (!this.dimCount_ && this.getInput('FILL')) {
      this.removeInput('FILL');
    }
    // Add new inputs.
    for (let i = 0; i < this.dimCount_; i++) {
      if (!this.getInput('DIM' + i)) {
        const input = this.appendValueInput('DIM' + i);
        if (i === 0) {
          input.appendField(Blockly.Msg['NDARRAYS_CREATE_WITH_DIM_WITH']);
        } else {
          input.appendField("x");
        }
        this.moveInputBefore('DIM' + i, 'FILL');
      }
    }
    // Remove deleted inputs.
    for (let i = this.dimCount_; this.getInput('DIM' + i); i++) {
      this.removeInput('DIM' + i);
    }
  }
};

Blockly.Blocks['ndarrays_create_with_container'] = {
  /**
   * Mutator block for dimension container.
   * @this {Blockly.Block}
   */
  init: function() {
    this.setStyle('ndarray_blocks');
    this.appendDummyInput()
        .appendField(Blockly.Msg['NDARRAYS_CREATE_WITH_CONTAINER']);
    this.appendStatementInput('STACK');
    this.setTooltip(Blockly.Msg['NDARRAYS_CREATE_WITH_CONTAINER_TOOLTIP']);
    this.contextMenu = false;
  }
};

Blockly.Blocks['ndarrays_create_with_dim'] = {
  /**
   * Mutator block for adding dimensions.
   * @this {Blockly.Block}
   */
  init: function() {
    this.setStyle('ndarray_blocks');
    this.appendDummyInput()
        .appendField(Blockly.Msg['NDARRAYS_CREATE_WITH_DIM']);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Msg['NDARRAYS_CREATE_WITH_DIM_TOOLTIP']);
    this.contextMenu = false;
  }
};
