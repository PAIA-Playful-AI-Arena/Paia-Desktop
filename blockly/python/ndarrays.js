python.pythonGenerator.forBlock['ndarrays_create_with'] = function(block, generator) {
  // Create an ndarray of any shape filled with a specific element.
  generator.definitions_['import_np'] = 'import numpy as np';
  const shape = new Array(block.dimCount_);
  for (var i = 0; i < block.dimCount_; i++) {
    shape[i] = generator.valueToCode(
      block, 'DIM' + i, generator.ORDER_NONE
    ) || '0';
  }
  const fill = generator.valueToCode(
    block, 'FILL', generator.ORDER_NONE
  ) || '0';
  const code = 'np.full((' + shape.join(', ') + '), ' + fill + ')';
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['ndarrays_create_with_list'] = function(block, generator) {
  // Create an ndarray of any shape filled with a specific element.
  generator.definitions_['import_np'] = 'import numpy as np';
  const list = generator.valueToCode(
    block, 'LIST', generator.ORDER_NONE
  ) || '0';
  const code = 'np.array(' + list + ')';
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['ndarrays_to_list'] = function(block, generator) {
  // Create an ndarray of any shape filled with a specific element.
  generator.definitions_['import_np'] = 'import numpy as np';
  const array = generator.valueToCode(
    block, 'ARRAY', generator.ORDER_NONE
  ) || '0';
  const code = array + '.tolist()';
  return [code, generator.ORDER_ATOMIC];
};
