python.pythonGenerator.forBlock['model_create_classification'] = function(block, generator) {
  // Create a classification model.
  const model = block.getFieldValue('MODEL');
  let code = '';
  switch (model) {
    case 'KNeighborsClassifier': {
      generator.definitions_['import_neighbors'] = 'from sklearn import neighbors';
      const k = block.getFieldValue('PARAM_K');
      const weights = block.getFieldValue('PARAM_WEIGHTS');
      const algorithm = block.getFieldValue('PARAM_ALGORITHM');
      code = "neighbors.KNeighborsClassifier(" + k + ", weights='" + weights + "', algorithm='" + algorithm + "')";
      break;
    }
    case 'LinearSVC': {
      generator.definitions_['import_svm'] = 'from sklearn import svm';
      const penalty = block.getFieldValue('PARAM_PENALTY');
      const loss = block.getFieldValue('PARAM_LOSS');
      const c = block.getFieldValue('PARAM_C');
      code = "svm.LinearSVC('" + penalty + "', '" + loss + "', C=" + c + ")";
      break;
    }
    case 'DecisionTreeClassifier': {
      generator.definitions_['import_tree'] = 'from sklearn import tree';
      const max_depth = block.getFieldValue('PARAM_MAX_DEPTH');
      let min_samples_split = block.getFieldValue('PARAM_MIN_SAMPLES_SPLIT');
      if (min_samples_split == 0) {
        min_samples_split = "None";
      }
      code = "tree.DecisionTreeClassifier(max_depth=" + max_depth + ", min_samples_split=" + min_samples_split + ")";
      break;
    }
    case 'RandomForestClassifier': {
      generator.definitions_['import_ensemble'] = 'from sklearn import ensemble';
      const n = block.getFieldValue('PARAM_N_ESTIMATORS');
      const max_depth = block.getFieldValue('PARAM_MAX_DEPTH');
      let min_samples_split = block.getFieldValue('PARAM_MIN_SAMPLES_SPLIT');
      if (min_samples_split == 0) {
        min_samples_split = "None";
      }
      code = "ensemble.RandomForestClassifier(" + n + ", max_depth=" + max_depth + ", min_samples_split=" + min_samples_split + ")";
      break;
    }
    case 'MLPClassifier': {
      generator.definitions_['import_neural_network'] = 'from sklearn import neural_network';
      const hidden_layer_sizes = generator.valueToCode(block, 'PARAM0',
          generator.ORDER_COLLECTION) || '[1]';
      const activation = block.getFieldValue('PARAM_ACTIVATION');
      const batch_size = block.getFieldValue('PARAM_BATCH_SIZE');
      code = "neural_network.MLPClassifier(" + hidden_layer_sizes + ", '" + activation + "', batch_size=" + batch_size + ")";
      break;
    }
    case 'SGDClassifier': {
      generator.definitions_['import_linear_model'] = 'from sklearn import linear_model';
      const loss = block.getFieldValue('PARAM_LOSS');
      const penalty = block.getFieldValue('PARAM_PENALTY');
      code = "linear_model.SGDClassifier('" + loss + "', penalty='" + penalty + "')";
      break;
    }
  }
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['model_create_regression'] = function(block, generator) {
  // Create a regression model.
  const model = block.getFieldValue('MODEL');
  let code = '';
  switch (model) {
    case 'KNeighborsRegressor': {
      generator.definitions_['import_neighbors'] = 'from sklearn import neighbors';
      const k = block.getFieldValue('PARAM_K');
      const weights = block.getFieldValue('PARAM_WEIGHTS');
      const algorithm = block.getFieldValue('PARAM_ALGORITHM');
      code = "neighbors.KNeighborsRegressor(" + k + ", weights='" + weights + "', algorithm='" + algorithm + "')";
      break; 
    }
    case 'LinearSVR': {
      generator.definitions_['import_svm'] = 'from sklearn import svm';
      const c = block.getFieldValue('PARAM_C');
      code = "svm.LinearSVR(C=" + c + ")";
      break;
    }
    case 'DecisionTreeRegressor': {
      generator.definitions_['import_tree'] = 'from sklearn import tree';
      const max_depth = block.getFieldValue('PARAM_MAX_DEPTH');
      let min_samples_split = block.getFieldValue('PARAM_MIN_SAMPLES_SPLIT');
      if (min_samples_split == 0) {
        min_samples_split = "None";
      }
      code = "tree.DecisionTreeRegressor(max_depth=" + max_depth + ", min_samples_split=" + min_samples_split + ")";
      break;
    }
    case 'RandomForestRegressor': {
      generator.definitions_['import_ensemble'] = 'from sklearn import ensemble';
      const n = block.getFieldValue('PARAM_N_ESTIMATORS');
      const max_depth = block.getFieldValue('PARAM_MAX_DEPTH');
      let min_samples_split = block.getFieldValue('PARAM_MIN_SAMPLES_SPLIT');
      if (min_samples_split == 0) {
        min_samples_split = "None";
      }
      code = "ensemble.RandomForestRegressor(" + n + ", max_depth=" + max_depth + ", min_samples_split=" + min_samples_split + ")";
      break;
    }
    case 'MLPRegressor': {
      generator.definitions_['import_neural_network'] = 'from sklearn import neural_network';
      const hidden_layer_sizes = generator.valueToCode(block, 'PARAM0',
          generator.ORDER_COLLECTION) || '[1]';
      const activation = block.getFieldValue('PARAM_ACTIVATION');
      const batch_size = block.getFieldValue('PARAM_BATCH_SIZE');
      code = "neural_network.MLPRegressor(" + hidden_layer_sizes + ", '" + activation + "', batch_size=" + batch_size + ")";
      break;
    }
    case 'SGDRegressor': {
      generator.definitions_['import_linear_model'] = 'from sklearn import linear_model';
      const loss = block.getFieldValue('PARAM_LOSS');
      const penalty = block.getFieldValue('PARAM_PENALTY');
      code = "linear_model.SGDRegressor('" + loss + "', penalty='" + penalty + "')";
      break;
    }
  }
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['model_train'] = function(block, generator) {
  // Train a model.
  const x = generator.valueToCode(block, 'X', generator.ORDER_COLLECTION) || '[]';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_COLLECTION) || '[]';
  const model = generator.valueToCode(block, 'MODEL', generator.ORDER_NONE) || 'None';
  const code = model + '.fit(' + x + ', ' + y + ')\n';
  return code;
};

python.pythonGenerator.forBlock['model_predict'] = function(block, generator) {
  // Use model to predict.
  const model = generator.valueToCode(block, 'MODEL', generator.ORDER_NONE) || 'None';
  const x = generator.valueToCode(block, 'X', generator.ORDER_COLLECTION) || '[]';
  const code = model + '.predict(' + x + ').tolist()';
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['model_evaluate_classification'] = function(block, generator) {
  // Evaluate classification results.
  generator.definitions_['import_metrics'] = 'from sklearn import metrics';
  const y_true = generator.valueToCode(block, 'TRUE', generator.ORDER_COLLECTION) || '[]';
  const y_pred = generator.valueToCode(block, 'PRED', generator.ORDER_COLLECTION) || '[]';
  const code = 'metrics.accuracy_score(' + y_true + ', ' + y_pred + ')';
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['model_evaluate_regression'] = function(block, generator) {
  // Evaluate regression results.
  generator.definitions_['import_metrics'] = 'from sklearn import metrics';
  const y_true = generator.valueToCode(block, 'TRUE', generator.ORDER_COLLECTION) || '[]';
  const y_pred = generator.valueToCode(block, 'PRED', generator.ORDER_COLLECTION) || '[]';
  const func = block.getFieldValue('FUNC');
  let code = '';
  switch (func) {
    case 'R2':
      code = 'metrics.r2_score(' + y_true + ', ' + y_pred + ')';
      break;
    case 'MAE':
      code = 'metrics.mean_absolute_error(' + y_true + ', ' + y_pred + ')';
      break;
    case 'MSE':
      code = 'metrics.mean_squared_error(' + y_true + ', ' + y_pred + ')';
      break;
  }
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['model_train_test_split'] = function(block, generator) {
  // Split training data and testing data.
  generator.definitions_['import_model_selection'] = 'from sklearn import model_selection';
  const x = generator.valueToCode(block, 'X', generator.ORDER_COLLECTION) || '[]';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_COLLECTION) || '[]';
  const test_size = generator.valueToCode(block, 'TEST_SIZE', generator.ORDER_ATOMIC) || '0';
  const shuffle = block.getFieldValue('SHUFFLE');
  const train_data = generator.valueToCode(block, 'TRAIN_DATA', generator.ORDER_COLLECTION) || '[]';
  const test_data = generator.valueToCode(block, 'TEST_DATA', generator.ORDER_COLLECTION) || '[]';
  const train_target = generator.valueToCode(block, 'TRAIN_TARGET', generator.ORDER_COLLECTION) || '[]';
  const test_target = generator.valueToCode(block, 'TEST_TARGET', generator.ORDER_COLLECTION) || '[]';
  const code = train_data + ', ' + test_data + ', ' + train_target + ', ' + test_target +
    ' = model_selection.train_test_split(' + x + ', ' + y + ', test_size=' + test_size + ', shuffle=' + shuffle + ')\n';
  return code;
};

python.pythonGenerator.forBlock['model_k_fold'] = function(block, generator) {
  // k-fold cross-validation.
  generator.definitions_['import_model_selection'] = 'from sklearn import model_selection';
  generator.definitions_['import_np'] = 'import numpy as np';
  const x = generator.valueToCode(block, 'X', generator.ORDER_COLLECTION) || '[]';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_COLLECTION) || '[]';
  const k = generator.valueToCode(block, 'K', generator.ORDER_ATOMIC) || '2';
  const shuffle = block.getFieldValue('SHUFFLE');
  const code = '[[np.array(' + x + ')[index1].tolist(), np.array(' + x + ')[index2].tolist(), ' +
    'np.array(' + y + ')[index1].tolist(), np.array(' + y + ')[index2].tolist()] ' +
    'for index1, index2 in model_selection.KFold(n_splits=' + k + ', shuffle=' + shuffle + ').split(' + x + ', ' + y + ')]';
  return [code, generator.ORDER_COLLECTION];
};

python.pythonGenerator.forBlock['model_dl_create'] = function(block, generator) {
  // Create a deep learning model.
  generator.definitions_['import_keras'] = 'from tensorflow import keras';
  const functionName = generator.provideFunction_('create_sequential_model', `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(layers, loss="mean_squared_error"):
  model = keras.Sequential()
  for layer in layers:
    model.add(layer)
  model.compile(loss=loss)
  return model
`);
  let code = functionName + '([\n';
  let layerCode = '';
  let loss = null;
  for (let i = 0; i < block.layers_.length; i++) {
    switch (block.layers_[i].name) {
      case 'model_dl_dense_layer':
        layerCode += `keras.layers.Dense(${block.layers_[i].units}),\n`;
        break;
      case 'model_dl_recurrent_layer':
        layerCode += `keras.layers.${block.layers_[i].type}(${block.layers_[i].units}),\n`;
        break;
      case 'model_dl_convolution_layer':
        layerCode += `keras.layers.Conv${block.layers_[i].type}(${block.layers_[i].filters},${block.layers_[i].kernel_size}),\n`;
        break;
      case 'model_dl_pooling_layer':
        layerCode += `keras.layers.${block.layers_[i].value}Pooling${block.layers_[i].type}(${block.layers_[i].pool_size}),\n`;
        break;
      case 'model_dl_reshape_layer':
        layerCode += `keras.layers.Reshape([${block.layers_[i].shape.join(', ')}]),\n`;
        break;
      case 'model_dl_loss_layer':
        loss = block.layers_[i].type
        break;
    }
  }
  code += generator.prefixLines(layerCode, generator.INDENT) + ']';
  code += (loss)? `, loss="${loss}")` : ')';
  return [code, generator.ORDER_ATOMIC];
};

python.pythonGenerator.forBlock['model_dl_train'] = function(block, generator) {
  // Train a model.
  const x = generator.valueToCode(block, 'X', generator.ORDER_COLLECTION) || '[]';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_COLLECTION) || '[]';
  const model = generator.valueToCode(block, 'MODEL', generator.ORDER_NONE) || 'None';
  const batch_size = block.getFieldValue('BATCH_SIZE');
  const epochs = block.getFieldValue('EPOCHS');
  const code = model + '.fit(' + x + ', ' + y + ', batch_size=' + batch_size + ', epochs=' + epochs + ')\n';
  return code;
};

python.pythonGenerator.forBlock['model_dl_summary'] = function(block, generator) {
  // Summarize a model.
  const model = generator.valueToCode(block, 'MODEL', generator.ORDER_NONE) || 'None';
  const code = model + '.summary()\n';
  return code;
};