python.pythonGenerator.forBlock['plot_plot'] = function(block, generator) {
  // Plot.
  generator.definitions_['import_plt'] = 'import matplotlib.pyplot as plt';
  const x = generator.valueToCode(block, 'X',
    generator.ORDER_NONE) || '[]';
  const y = generator.valueToCode(block, 'Y',
    generator.ORDER_NONE) || '[]';
  const marker = block.getFieldValue('MARKER');
  const line = block.getFieldValue('LINE');
  const color = block.getFieldValue('COLOR');
  const code =
    'plt.plot(' + x + ', ' + y + ', "' + marker + line + '", color="' + color + '")\n' +
    'plt.show()\n';
  return code;
};
