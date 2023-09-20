python.pythonGenerator.forBlock['procedures_ifreturn'] = function(block, generator) {
  let code = '';
  if (generator.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the return is triggered.
    code += generator.injectId(generator.STATEMENT_SUFFIX, block);
  }
  if (block.hasReturnValue_) {
    const value = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || 'None';
    code += 'return ' + value + '\n';
  } else {
    code += 'return\n';
  }
  return code;
};
