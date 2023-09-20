python.pythonGenerator.forBlock['file_save'] = function(block, generator) {
  // Save an object as a pickle file.
  generator.definitions_['import_pickle'] = 'import pickle';
  generator.definitions_['import_os'] = 'import os';
  const obj = generator.valueToCode(block, 'OBJECT',
    generator.ORDER_NONE) || 'None';
  const name = generator.valueToCode(block, 'FILENAME',
    generator.ORDER_NONE) || ("'save_" + new Date().getTime() + "'");
  const code = "with open(os.path.join(os.path.dirname(__file__), " + name + " + '.pickle'), 'wb') as f:\n" +
    generator.prefixLines("pickle.dump(" + obj + ", f)\n", generator.INDENT);
  return code;
};

python.pythonGenerator.forBlock['file_load'] = function(block, generator) {
  // Load an object from a pickle file.
  generator.definitions_['import_pickle'] = 'import pickle';
  generator.definitions_['import_os'] = 'import os';
  const obj = generator.valueToCode(block, 'OBJECT',
    generator.ORDER_NONE) || '_';
  const name = generator.valueToCode(block, 'FILENAME',
    generator.ORDER_NONE) || "''";
  const code = "with open(os.path.join(os.path.dirname(__file__), " + name + " + '.pickle'), 'rb') as f:\n" +
    generator.prefixLines(obj + " = pickle.load(f)\n", generator.INDENT);
  return code;
};

python.pythonGenerator.forBlock['file_csv_save'] = function(block, generator) {
  // Save an object as a csv file.
  generator.definitions_['import_csv'] = 'import csv';
  generator.definitions_['import_os'] = 'import os';
  const obj = generator.valueToCode(block, 'OBJECT',
    generator.ORDER_NONE) || 'None';
  const name = generator.valueToCode(block, 'FILENAME',
    generator.ORDER_NONE) || ("'save_" + new Date().getTime() + "'");
  const delimiter = block.getFieldValue('DELIMITER');
  const code = "with open(os.path.join(os.path.dirname(__file__), " + name + " + '.csv'), 'w', newline='', encoding='utf-8') as f:\n" +
    generator.prefixLines("csv.writer(f, delimiter='" + delimiter + "').writerows(" + obj + ")\n", generator.INDENT);
  return code;
};
  
python.pythonGenerator.forBlock['file_csv_load'] = function(block, generator) {
  // Load an object from a csv file.
  generator.definitions_['import_csv'] = 'import csv';
  generator.definitions_['import_os'] = 'import os';
  const obj = generator.valueToCode(block, 'OBJECT',
    generator.ORDER_NONE) || '_';
  const name = generator.valueToCode(block, 'FILENAME',
    generator.ORDER_NONE) || "''";
  const delimiter = block.getFieldValue('DELIMITER');
  const code = "with open(os.path.join(os.path.dirname(__file__), " + name + " + '.csv'), 'r', newline='', encoding='utf-8') as f:\n" +
    generator.prefixLines(obj + " = [row for row in csv.reader(f, delimiter='" + delimiter + "')]\n", generator.INDENT);
  return code;
};
