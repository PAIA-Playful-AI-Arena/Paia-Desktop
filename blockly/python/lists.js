python.pythonGenerator.forBlock['lists_extend'] = function(block, generator) {
  // List extending.
  const varName = generator.nameDB_.getName(
    block.getFieldValue('VAR'),
    Blockly.VARIABLE_CATEGORY_NAME
  );
  const list = generator.valueToCode(block, 'LIST', generator.ORDER_NONE) || '[]';
  return varName + '.extend(' + list + ')\n';
};

python.pythonGenerator.forBlock['lists_setIndex'] = function(block, generator) {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  let list = generator.valueToCode(block, 'LIST', generator.ORDER_MEMBER) || '[]';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const value = generator.valueToCode(block, 'TO', generator.ORDER_NONE) || 'None';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  // Closure, which accesses and modifies 'list'.
  function cacheList() {
    if (list.match(/^\w+$/)) {
      return '';
    }
    const listVar =
        generator.nameDB_.getDistinctName('tmp_list', Blockly.VARIABLE_CATEGORY_NAME);
    const code = listVar + ' = ' + list + '\n';
    list = listVar;
    return code;
  }

  switch (where) {
    case 'FIRST':
      return list + '[0] = ' + value + '\n';
    case 'LAST':
      return list + '[-1] = ' + value + '\n';
    case 'FROM_START': {
      const at = generator.getAdjustedInt(block, 'AT');
      return list + '[' + at + '] = ' + value + '\n';
    }
    case 'FROM_END': {
      const at = generator.getAdjustedInt(block, 'AT', 1, true);
      return list + '[' + at + '] = ' + value + '\n';
    }
    case 'RANDOM': {
      generator.definitions_['import_random'] = 'import random';
      let code = cacheList();
      const xVar =
          generator.nameDB_.getDistinctName('tmp_x', Blockly.VARIABLE_CATEGORY_NAME);
      code += xVar + ' = int(random.random() * len(' + list + '))\n';
      code += list + '[' + xVar + '] = ' + value + '\n';
      return code;
    }
  }
  throw Error('Unhandled combination (lists_setIndex).');
};

python.pythonGenerator.forBlock['lists_insertIndex'] = function(block, generator) {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  let list = generator.valueToCode(block, 'LIST', generator.ORDER_MEMBER) || '[]';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const value = generator.valueToCode(block, 'TO', generator.ORDER_NONE) || 'None';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  // Closure, which accesses and modifies 'list'.
  function cacheList() {
    if (list.match(/^\w+$/)) {
      return '';
    }
    const listVar =
        generator.nameDB_.getDistinctName('tmp_list', Blockly.VARIABLE_CATEGORY_NAME);
    const code = listVar + ' = ' + list + '\n';
    list = listVar;
    return code;
  }

  switch (where) {
    case 'FIRST':
      return list + '.insert(0, ' + value + ')\n';
    case 'LAST':
      return list + '.append(' + value + ')\n';
    case 'FROM_START': {
      const at = generator.getAdjustedInt(block, 'AT');
      return list + '.insert(' + at + ', ' + value + ')\n';
    }
    case 'FROM_END': {
      const at = generator.getAdjustedInt(block, 'AT', 1, true);
      return list + '.insert(' + at + ', ' + value + ')\n';
    }
    case 'RANDOM': {
      generator.definitions_['import_random'] = 'import random';
      let code = cacheList();
      const xVar =
          generator.nameDB_.getDistinctName('tmp_x', Blockly.VARIABLE_CATEGORY_NAME);
      code += xVar + ' = int(random.random() * len(' + list + '))\n';
      code += list + '.insert(' + xVar + ', ' + value + ')\n';
      return code;
    }
  }
  throw Error('Unhandled combination (lists_setIndex).');
};
