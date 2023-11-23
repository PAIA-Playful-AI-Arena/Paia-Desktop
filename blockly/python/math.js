python.pythonGenerator.forBlock['math_convert'] = function(block, generator) {
  // Converting str to int or float
  var str = generator.valueToCode(block, 'STR', generator.ORDER_NONE) || '0';
  var type = block.getFieldValue('TYPE');
  return [type + '(' + str + ')', generator.ORDER_MULTIPLICATIVE];
};
