python.pythonGenerator.forBlock['text_print'] = function(block, generator) {
  // Print statement.
  const msg = generator.valueToCode(block, 'TEXT', generator.ORDER_NONE) || '\'\'';
  generator.definitions_['import_sys'] = 'import sys';
  generator.definitions_['import_io'] = 'import io';
  generator.provideFunction_(
    'stdout_redirect',
    [
      "if sys.stdout == sys.__stdout__:",
      "  sys.stdout = io.TextIOWrapper(open(sys.stdout.fileno(), 'wb', 0), encoding='utf-8', write_through=True)"
    ]
  );
  return 'print(' + msg + ')\n';
};
