python.pythonGenerator.forBlock['dicts_get_keys'] = function(block, generator) {
  // Get dict keys.
  const dict = generator.valueToCode(block, 'DICT',
    generator.ORDER_NONE) || '{}';
  return [dict + '.keys()', generator.ORDER_ATOMIC];
};


python.pythonGenerator.forBlock['dicts_create_with'] = function(block, generator) {
  if (block.itemCount_ == 0) {
    return ['{}', generator.ORDER_ATOMIC];
  }
  
  const items = new Array(block.itemCount_);
  
  for (let n = 0; n < block.itemCount_; n++) {
    const key = generator.valueToCode(block, 'KEY' + n,
      generator.ORDER_NONE) || 'None';
    const value = generator.valueToCode(block, 'VALUE' + n,
      generator.ORDER_NONE) || 'None';
    items[n] = key + ": " + value;
  }
  const code = '{\n' +  generator.prefixLines(items.join(',\n'), generator.INDENT) + '\n}';
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['dicts_get_value'] = function(block, generator) {
  const dict = generator.valueToCode(block, 'DICT',
    generator.ORDER_MEMBER) || '{}';
  const key = generator.valueToCode(block, 'KEY',
    generator.ORDER_NONE) || 'None';
  const code = dict + '[' + key + ']';
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['dicts_set_value'] = function(block, generator) {
  const dict = generator.valueToCode(block, 'DICT',
      generator.ORDER_MEMBER) || '{}';
  const key = generator.valueToCode(block, 'KEY',
      generator.ORDER_NONE) || 'None';
  const value = generator.valueToCode(block, 'VALUE',
      generator.ORDER_NONE) || 'None';
  const code = dict + '[' + key + '] = ' + value + '\n';
  return code;
};
