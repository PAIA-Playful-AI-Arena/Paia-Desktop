Blockly.Themes.Classic.blockStyles.model_blocks = {
  "colourPrimary": "270"
};

Blockly.Themes.Classic.blockStyles.model_dl_blocks = {
  "colourPrimary": "275"
};

Blockly.Themes.Classic.blockStyles.model_rl_blocks = {
  "colourPrimary": "280"
};

Blockly.defineBlocksWithJsonArray([
  // Train a model.
  {
    "type": "model_train",
    "message0": "%{BKY_MODEL_TRAIN}",
    "args0": [
      {
        "type": "input_value",
        "name": "X"
      },
      {
        "type": "input_value",
        "name": "Y"
      },
      {
        "type": "input_value",
        "name": "MODEL"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "model_blocks",
    "tooltip": "%{BKY_MODEL_TRAIN_TOOLTIP}"
  },
  // Use model to predict.
  {
    "type": "model_predict",
    "message0": "%{BKY_MODEL_PREDICT}",
    "args0": [
      {
        "type": "input_value",
        "name": "MODEL"
      },
      {
        "type": "input_value",
        "name": "X"
      }
    ],
    "inputsInline": true,
    "output": null,
    "style": "model_blocks",
    "tooltip": "%{BKY_MODEL_PREDICT_TOOLTIP}"
  },
  // Evaluate the predicted classification results.
  {
    "type": "model_evaluate_classification",
    "message0": "%{BKY_MODEL_EVALUATE_CLASSIFICATION}",
    "args0": [
      {
        "type": "input_value",
        "name": "TRUE"
      },
      {
        "type": "input_value",
        "name": "PRED"
      }
    ],
    "inputsInline": true,
    "output": null,
    "style": "model_blocks",
    "tooltip": "%{BKY_MODEL_EVALUATE_CLASSIFICATION_TOOLTIP}"
  },
  // Evaluate the predicted regression results.
  {
    "type": "model_evaluate_regression",
    "message0": "%{BKY_MODEL_EVALUATE_REGRESSION}",
    "args0": [
      {
        "type": "input_value",
        "name": "TRUE"
      },
      {
        "type": "input_value",
        "name": "PRED"
      },
      {
        "type": "field_dropdown",
        "name": "FUNC",
        "options": [
          ["%{BKY_MODEL_EVALUATE_R2}", "R2"],
          ["%{BKY_MODEL_EVALUATE_MAE}", "MAE"],
          ["%{BKY_MODEL_EVALUATE_MSE}", "MSE"]
        ]
      }
    ],
    "inputsInline": true,
    "output": null,
    "style": "model_blocks",
    "tooltip": "%{BKY_MODEL_EVALUATE_REGRESSION_TOOLTIP}"
  },
  // Split data to training set and testing set.
  {
    "type": "model_train_test_split",
    "message0": "%{BKY_MODEL_TRAIN_TEST_SPLIT}",
    "args0": [
      {
        "type": "input_value",
        "name": "X"
      },
      {
        "type": "input_value",
        "name": "Y"
      },
      {
        "type": "input_value",
        "name": "TEST_SIZE",
        "check": "Number"
      },
      {
        "type": "field_dropdown",
        "name": "SHUFFLE",
        "options": [
          ["%{BKY_MODEL_SHUFFLE}", "True"],
          ["%{BKY_MODEL_NO_SHUFFLE}", "False"]
        ]
      },
      {
        "type": "input_value",
        "name": "TRAIN_DATA"
      },
      {
        "type": "input_value",
        "name": "TEST_DATA"
      },
      {
        "type": "input_value",
        "name": "TRAIN_TARGET"
      },
      {
        "type": "input_value",
        "name": "TEST_TARGET"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "model_blocks",
    "tooltip": "%{BKY_MODEL_TRAIN_TEST_SPLIT_TOOLTIP}"
  },
  // Split data to k-folds.
  {
    "type": "model_k_fold",
    "message0": "%{BKY_MODEL_K_FOLD}",
    "args0": [
      {
        "type": "input_value",
        "name": "X"
      },
      {
        "type": "input_value",
        "name": "Y"
      },
      {
        "type": "input_value",
        "name": "K",
        "check": "Number"
      },
      {
        "type": "field_dropdown",
        "name": "SHUFFLE",
        "options": [
          ["%{BKY_MODEL_NO_SHUFFLE}", "False"],
          ["%{BKY_MODEL_SHUFFLE}", "True"]
        ]
      }
    ],
    "inputsInline": true,
    "output": null,
    "style": "model_blocks",
    "tooltip": "%{BKY_MODEL_K_FOLD_TOOLTIP}"
  },
  // Block representing the input in deep learning modal mutator.
  {
    'type': 'model_dl_input_layer',
    'message0': '模型輸入',
    'nextStatement': null,
    'enableContextMenu': false,
    'style': 'model_dl_blocks',
    'tooltip': '%{BKY_MODEL_DL_INPUT_TOOLTIP}',
  },
  // Block representing the dense layer in deep learning modal mutator.
  {
    'type': 'model_dl_dense_layer',
    "message0": "全連接層 維度：%1",
    "args0": [
      {
        "type": "field_number",
        "name": "UNITS",
        "value": 16,
        "min": 1
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    'style': 'model_dl_blocks',
    "tooltip": ""
  },
  // Block representing the recurrent layer in deep learning modal mutator.
  {
    "type": "model_dl_recurrent_layer",
    "message0": "循環層 %1 維度：%2",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          [
            "RNN",
            "SimpleRNN"
          ],
          [
            "LSTM",
            "LSTM"
          ]
        ]
      },
      {
        "type": "field_number",
        "name": "UNITS",
        "value": 16,
        "min": 1
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    'style': 'model_dl_blocks',
    "tooltip": ""
  },
  // Block representing the convolution layer in deep learning modal mutator.
  {
    "type": "model_dl_convolution_layer",
    "message0": "卷積層 %1 維度：%2 卷積核大小：%3",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          [
            "1D",
            "1D"
          ],
          [
            "2D",
            "2D"
          ],
          [
            "3D",
            "3D"
          ]
        ]
      },
      {
        "type": "field_number",
        "name": "FILTERS",
        "value": 16,
        "min": 1
      },
      {
        "type": "field_number",
        "name": "KERNEL_SIZE",
        "value": 3,
        "min": 1
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    'style': 'model_dl_blocks',
    "tooltip": ""
  },
  // Block representing the pooling layer in deep learning modal mutator.
  {
    "type": "model_dl_pooling_layer",
    "message0": "池化層 %1 類型：%2 大小：%3",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          [
            "1D",
            "1D"
          ],
          [
            "2D",
            "2D"
          ],
          [
            "3D",
            "3D"
          ]
        ]
      },
      {
        "type": "field_dropdown",
        "name": "VALUE",
        "options": [
          [
            "最大值",
            "Max"
          ],
          [
            "平均值",
            "Average"
          ]
        ]
      },
      {
        "type": "field_number",
        "name": "POOL_SIZE",
        "value": 3,
        "min": 1
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    'style': 'model_dl_blocks',
    "tooltip": ""
  },
  // Block representing the loss function layer in deep learning modal mutator.
  {
    "type": "model_dl_loss_layer",
    "message0": "損失函數 %1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          [
            "均方誤差",
            "mean_squared_error"
          ],
          [
            "二元交叉熵",
            "binary_crossentropy"
          ],
          [
            "分類交叉熵",
            "categorical_crossentropy"
          ],
          [
            "KL 散度",
            "kl_divergence"
          ]
        ]
      }
    ],
    "previousStatement": null,
    'style': 'model_dl_blocks',
    "tooltip": ""
  },
  // Block for training deep learning modal.
  {
    "type": "model_dl_train",
    "message0": "使用訓練資料：%1 目標：%2 訓練 %3 批次大小：%4 訓練次數：%5",
    "args0": [
      {
        "type": "input_value",
        "name": "X"
      },
      {
        "type": "input_value",
        "name": "Y"
      },
      {
        "type": "input_value",
        "name": "MODEL"
      },
      {
        "type": "field_number",
        "name": "BATCH_SIZE",
        "value": 32,
        "min": 1
      },
      {
        "type": "field_number",
        "name": "EPOCHS",
        "value": 1,
        "min": 1
      },
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "model_blocks",
    "tooltip": "%{BKY_MODEL_TRAIN_TOOLTIP}"
  },
  // Block for summarizing deep learning modal.
  {
    'type': 'model_dl_summary',
    "message0": "輸出 %1 架構",
    "args0": [
      {
        "type": "input_value",
        "name": "MODEL"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    'style': 'model_dl_blocks',
    "tooltip": ""
  },
  // Block for training reinforcement learning modal.
  {
    "type": "model_rl_train",
    "message0": "使用狀態：%1 行動：%2 獎勵：%3 下一個狀態：%4 訓練 %5",
    "args0": [
      {
        "type": "input_value",
        "name": "STATE"
      },
      {
        "type": "input_value",
        "name": "ACTION"
      },
      {
        "type": "input_value",
        "name": "REWARD"
      },
      {
        "type": "input_value",
        "name": "NEXT_STATE"
      },
      {
        "type": "input_value",
        "name": "MODEL"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "model_rl_blocks",
    "tooltip": "%{BKY_MODEL_TRAIN_TOOLTIP}"
  },
  // Use rl model to predict.
  {
    "type": "model_rl_predict",
    "message0": "使用 %1 預測狀態 %2 對應的行動",
    "args0": [
      {
        "type": "input_value",
        "name": "MODEL"
      },
      {
        "type": "input_value",
        "name": "STATE"
      }
    ],
    "inputsInline": true,
    "output": null,
    "style": "model_rl_blocks",
    "tooltip": "%{BKY_MODEL_PREDICT_TOOLTIP}"
  },
]);

Blockly.Blocks["model_create_classification"] = {
  /**
   * Block for creating classification model.
   * @this {Blockly.Block}
   */
  init: function() {
    const MODEL =
        [
          [Blockly.Msg['MODEL_KNN'], 'KNeighborsClassifier'],
          [Blockly.Msg['MODEL_LINEAR_SVM'], 'LinearSVC'],
          [Blockly.Msg['MODEL_DECISION_TREE'], 'DecisionTreeClassifier'],
          [Blockly.Msg['MODEL_RANDOM_FOREST'], 'RandomForestClassifier'],
          [Blockly.Msg['MODEL_MLP'], 'MLPClassifier'],
          [Blockly.Msg['MODEL_SGD'], 'SGDClassifier']
        ];
    this.setStyle('model_blocks');
    const modelMenu = new Blockly.FieldDropdown(MODEL, function(value) {
      this.getSourceBlock().updateParameters_(value);
    });
    this.appendDummyInput()
        .appendField(Blockly.Msg['MODEL_CREATE'])
        .appendField(modelMenu, 'MODEL')
        .appendField(Blockly.Msg['MODEL_CLASSIFICATION']);
    this.setInputsInline(true);
    this.setOutput(true);
    this.setTooltip(Blockly.Msg['MODEL_CREATE_CLASSIFICATION_TOOLTIP']);
    this.paramCount_ = 0;
  },
  updateParameters_: function(model) {
    for (let i = 0; i < this.paramCount_; i++) {
      this.removeInput('PARAM' + i);
    }
    switch (model) {
      case 'KNeighborsClassifier':
        this.appendDummyInput('PARAM0')
            .appendField(" k :")
            .appendField(new Blockly.FieldNumber(5, 1, 10000, 1), 'PARAM_K')
            .appendField(" " + Blockly.Msg['MODEL_WEIGHT'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_WEIGHT_UNIFORM'], 'uniform'],
              [Blockly.Msg['MODEL_WEIGHT_DISTANCE'], 'distance']
            ]), 'PARAM_WEIGHTS')
            .appendField(" " + Blockly.Msg['MODEL_ALGORITHM'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_ALGORITHM_AUTO'], 'auto'],
              [Blockly.Msg['MODEL_ALGORITHM_BALL_TREE'], 'ball_tree'],
              [Blockly.Msg['MODEL_ALGORITHM_KD_TREE'], 'kd_tree'],
              [Blockly.Msg['MODEL_ALGORITHM_BRUTE'], 'brute'],
            ]), 'PARAM_ALGORITHM');
        this.paramCount_ = 1;
        break;
      case 'LinearSVC':
        this.appendDummyInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_C'] + " :")
            .appendField(new Blockly.FieldNumber(1, 0.0001, null, 0.0001), 'PARAM_C')
            .appendField(" " + Blockly.Msg['MODEL_PENALTY'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_PENALTY_L2'], 'l2'],
              [Blockly.Msg['MODEL_PENALTY_L1'], 'l1']
            ]), 'PARAM_PENALTY')
            .appendField(" " + Blockly.Msg['MODEL_LOSS'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_LOSS_SQUARED_HINGE'], 'squared_hinge'],
              [Blockly.Msg['MODEL_LOSS_HINGE'], 'hinge']
            ]), 'PARAM_LOSS');
        this.paramCount_ = 1;
        break;
      case 'DecisionTreeClassifier':
        this.appendDummyInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_MAX_DEPTH'] + " :")
            .appendField(new Blockly.FieldNumber(5, 0, null, 1), 'PARAM_MAX_DEPTH')
            .appendField(" " + Blockly.Msg['MODEL_MIN_SAMPLES_SPLIT'] + " :")
            .appendField(new Blockly.FieldNumber(2, 2, null, 1), 'PARAM_MIN_SAMPLES_SPLIT');
        this.paramCount_ = 1;
        break;
      case 'RandomForestClassifier':
        this.appendDummyInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_N_ESTIMATORS'] + " :")
            .appendField(new Blockly.FieldNumber(100, 1, null, 1), 'PARAM_N_ESTIMATORS')
            .appendField(" " + Blockly.Msg['MODEL_MAX_DEPTH'] + " :")
            .appendField(new Blockly.FieldNumber(5, 0, null, 1), 'PARAM_MAX_DEPTH')
            .appendField(" " + Blockly.Msg['MODEL_MIN_SAMPLES_SPLIT'] + " :")
            .appendField(new Blockly.FieldNumber(2, 2, null, 1), 'PARAM_MIN_SAMPLES_SPLIT');
        this.paramCount_ = 1;
        break;
      case 'MLPClassifier':
        this.appendValueInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_HIDDEN_LAYER_SIZES'] + " :");
        this.appendDummyInput('PARAM1')
            .appendField(" " + Blockly.Msg['MODEL_ACTIVATION'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_ACTIVATION_LOGISTIC'], 'logistic'],
              [Blockly.Msg['MODEL_ACTIVATION_TANH'], 'tanh'],
              [Blockly.Msg['MODEL_ACTIVATION_RELU'], 'relu']
            ]), 'PARAM_ACTIVATION')
            .appendField(" " + Blockly.Msg['MODEL_BATCH_SIZE'] + " :")
            .appendField(new Blockly.FieldNumber(200, 1, null, 1), 'PARAM_BATCH_SIZE');
        this.paramCount_ = 2;
        break;
      case 'SGDClassifier':
        this.appendDummyInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_LOSS'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_LOSS_HINGE'], 'hinge'],
              [Blockly.Msg['MODEL_LOSS_MODIFIED_HUBER'], 'modified_huber'],
              [Blockly.Msg['MODEL_LOSS_LOG'], 'log']
            ]), 'PARAM_LOSS')
            .appendField(" " + Blockly.Msg['MODEL_PENALTY'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_PENALTY_L2'], 'l2'],
              [Blockly.Msg['MODEL_PENALTY_L1'], 'l1']
            ]), 'PARAM_PENALTY');
        this.paramCount_ = 1;
        break;
    }
  }
};

Blockly.Blocks["model_create_regression"] = {
  /**
   * Block for creating regression model.
   * @this {Blockly.Block}
   */
  init: function() {
    const MODEL =
    [
      [Blockly.Msg['MODEL_KNN'], 'KNeighborsRegressor'],
      [Blockly.Msg['MODEL_LINEAR_SVM'], 'LinearSVR'],
      [Blockly.Msg['MODEL_DECISION_TREE'], 'DecisionTreeRegressor'],
      [Blockly.Msg['MODEL_RANDOM_FOREST'], 'RandomForestRegressor'],
      [Blockly.Msg['MODEL_MLP'], 'MLPRegressor'],
      [Blockly.Msg['MODEL_SGD'], 'SGDRegressor']
    ];
    this.setStyle('model_blocks');
    const modelMenu = new Blockly.FieldDropdown(MODEL, function(value) {
      this.getSourceBlock().updateParameters_(value);
    });
    this.appendDummyInput()
        .appendField(Blockly.Msg['MODEL_CREATE'])
        .appendField(modelMenu, 'MODEL')
        .appendField(Blockly.Msg['MODEL_REGRESSION']);
    this.setInputsInline(true);
    this.setOutput(true);
    this.setTooltip(Blockly.Msg['MODEL_CREATE_REGRESSION_TOOLTIP']);
    this.paramCount_ = 0;
  },
  updateParameters_: function(model) {
    for (let i = 0; i < this.paramCount_; i++) {
      this.removeInput('PARAM' + i);
    }
    switch (model) {
      case 'KNeighborsRegressor':
        this.appendDummyInput('PARAM0')
            .appendField(" k :")
            .appendField(new Blockly.FieldNumber(5, 1, 10000, 1), 'PARAM_K')
            .appendField(" " + Blockly.Msg['MODEL_WEIGHT'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_WEIGHT_UNIFORM'], 'uniform'],
              [Blockly.Msg['MODEL_WEIGHT_DISTANCE'], 'distance']
            ]), 'PARAM_WEIGHTS')
            .appendField(" " + Blockly.Msg['MODEL_ALGORITHM'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_ALGORITHM_AUTO'], 'auto'],
              [Blockly.Msg['MODEL_ALGORITHM_BALL_TREE'], 'ball_tree'],
              [Blockly.Msg['MODEL_ALGORITHM_KD_TREE'], 'kd_tree'],
              [Blockly.Msg['MODEL_ALGORITHM_BRUTE'], 'brute'],
            ]), 'PARAM_ALGORITHM');
        this.paramCount_ = 1;
        break;
      case 'LinearSVR':
        this.appendDummyInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_C'] + " :")
            .appendField(new Blockly.FieldNumber(1, 0.0001, null, 0.0001), 'PARAM_C');
        this.paramCount_ = 1;
        break;
      case 'DecisionTreeRegressor':
        this.appendDummyInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_MAX_DEPTH'] + " :")
            .appendField(new Blockly.FieldNumber(5, 0, null, 1), 'PARAM_MAX_DEPTH')
            .appendField(" " + Blockly.Msg['MODEL_MIN_SAMPLES_SPLIT'] + " :")
            .appendField(new Blockly.FieldNumber(2, 2, null, 1), 'PARAM_MIN_SAMPLES_SPLIT');
        this.paramCount_ = 1;
        break;
      case 'RandomForestRegressor':
        this.appendDummyInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_N_ESTIMATORS'] + " :")
            .appendField(new Blockly.FieldNumber(100, 1, null, 1), 'PARAM_N_ESTIMATORS')
            .appendField(" " + Blockly.Msg['MODEL_MAX_DEPTH'] + " :")
            .appendField(new Blockly.FieldNumber(5, 0, null, 1), 'PARAM_MAX_DEPTH')
            .appendField(" " + Blockly.Msg['MODEL_MIN_SAMPLES_SPLIT'] + " :")
            .appendField(new Blockly.FieldNumber(2, 2, null, 1), 'PARAM_MIN_SAMPLES_SPLIT');
        this.paramCount_ = 1;
        break;
      case 'MLPRegressor':
        this.appendValueInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_HIDDEN_LAYER_SIZES'] + " :");
        this.appendDummyInput('PARAM1')
            .appendField(" " + Blockly.Msg['MODEL_ACTIVATION'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_ACTIVATION_LOGISTIC'], 'logistic'],
              [Blockly.Msg['MODEL_ACTIVATION_TANH'], 'tanh'],
              [Blockly.Msg['MODEL_ACTIVATION_RELU'], 'relu']
            ]), 'PARAM_ACTIVATION')
            .appendField(" " + Blockly.Msg['MODEL_BATCH_SIZE'] + " :")
            .appendField(new Blockly.FieldNumber(200, 1, null, 1), 'PARAM_BATCH_SIZE');
        this.paramCount_ = 2;
        break;
      case 'SGDRegressor':
        this.appendDummyInput('PARAM0')
            .appendField(" " + Blockly.Msg['MODEL_LOSS'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_LOSS_SQUARED_LOSS'], 'squared_loss'],
              [Blockly.Msg['MODEL_LOSS_HUBER'], 'huber'],
              [Blockly.Msg['MODEL_LOSS_EPSILON_INSENSITIVE'], 'epsilon_insensitive']
            ]), 'PARAM_LOSS')
            .appendField(" " + Blockly.Msg['MODEL_PENALTY'] + " :")
            .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['MODEL_PENALTY_L2'], 'l2'],
              [Blockly.Msg['MODEL_PENALTY_L1'], 'l1']
            ]), 'PARAM_PENALTY');
        this.paramCount_ = 1;
        break;
    }
  }
};

Blockly.Blocks['model_dl_reshape_layer'] = {
  /**
   * Block for creating an ndarray of any shape filled with a specific element.
   * @this {Blockly.Block}
   */
  init: function() {
    this.setStyle('model_dl_blocks');
    this.appendDummyInput()
        .appendField("改變資料形狀 維度：")
        .appendField(new Blockly.FieldNumber(2, 1, 10, 1), "DIM")
        .appendField("形狀：(");
    this.appendDummyInput('END')
        .appendField(")");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
    this.dim_ = 0;
    this.shape_ = null;
  },
  onchange: function(e) {
    if (
      (this.workspace.isDragging && this.workspace.isDragging()) ||
      e.type === Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE
    ) {
      return;  // Don't change state at the start of a drag.
    }
    const value = this.getFieldValue('DIM');
    if (this.dim_ > value) {
      for (let i = value; i < this.dim_; i++) {
        this.removeInput('INPUT' + i);
      }
    }
    for (let i = this.dim_; i < value; i++) {
      this.appendDummyInput('INPUT' + i)
          .appendField((i === 0) ? "" : ", ")
          .appendField(new Blockly.FieldNumber(1, -1), 'DIM' + i);
      this.moveInputBefore('INPUT' + i, 'END');
    }
    if (this.shape_?.length === value) {
      for (let i = 0; i < value; i++) {
        this.setFieldValue(this.shape_[i], 'DIM' + i);
      }
      this.shape_ = null;
    }
    this.dim_ = value;
  }
};

Blockly.Blocks['model_dl_create'] = {
  /**
   * Block for creating a deep learning model.
   * @this {Blockly.Block}
   */
  init: function() {
    this.setStyle('model_dl_blocks');
    this.appendDummyInput()
        .appendField('建立深度學習模型');
    this.layers_ = [];
    this.updateLayers_();
    this.setInputsInline(false);
    this.setOutput(true);
    this.setMutator(new Blockly.icons.MutatorIcon([
      'model_dl_dense_layer',
      'model_dl_recurrent_layer',
      'model_dl_convolution_layer',
      'model_dl_pooling_layer',
      'model_dl_reshape_layer',
      'model_dl_loss_layer'
    ], this));
    this.setTooltip('');
  },
  /**
   * Create XML to represent dim inputs.
   * @return {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function() {
    const mutation = Blockly.utils.xml.createElement('mutation');
    for (let i = 0; i < this.layers_.length; i++) {
      const layer = Blockly.utils.xml.createElement('layer');
      switch (this.layers_[i].name) {
        case 'model_dl_dense_layer':
          layer.setAttribute('name', this.layers_[i].name);
          layer.setAttribute('units', this.layers_[i].units);
          break;
        case 'model_dl_recurrent_layer':
          layer.setAttribute('name', this.layers_[i].name);
          layer.setAttribute('type', this.layers_[i].type);
          layer.setAttribute('units', this.layers_[i].units);
          break;
        case 'model_dl_convolution_layer':
          layer.setAttribute('name', this.layers_[i].name);
          layer.setAttribute('type', this.layers_[i].type);
          layer.setAttribute('filters', this.layers_[i].filters);
          layer.setAttribute('kernel_size', this.layers_[i].kernel_size);
          break;
        case 'model_dl_pooling_layer':
          layer.setAttribute('name', this.layers_[i].name);
          layer.setAttribute('type', this.layers_[i].type);
          layer.setAttribute('value', this.layers_[i].value);
          layer.setAttribute('pool_size', this.layers_[i].pool_size);
          break;
        case 'model_dl_reshape_layer':
          layer.setAttribute('name', this.layers_[i].name);
          layer.setAttribute('shape', this.layers_[i].shape.join(' '));
          break;
        case 'model_dl_loss_layer':
          layer.setAttribute('name', this.layers_[i].name);
          layer.setAttribute('type', this.layers_[i].type);
          break;
      }
      mutation.append(layer);
    }
    return mutation;
  },
  /**
   * Parse XML to restore the dim inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function(xmlElement) {
    this.layers_ = [];
    xmlElement.childNodes.forEach(element => {
      if (element.nodeName == 'layer') {
        switch (element.getAttribute('name')) {
          case 'model_dl_dense_layer':
            this.layers_.push({
              name: element.getAttribute('name'),
              units: element.getAttribute('units')
            });
            break;
          case 'model_dl_recurrent_layer':
            this.layers_.push({
              name: element.getAttribute('name'),
              type: element.getAttribute('type'),
              units: element.getAttribute('units')
            });
            break;
          case 'model_dl_convolution_layer':
            this.layers_.push({
              name: element.getAttribute('name'),
              type: element.getAttribute('type'),
              filters: element.getAttribute('filters'),
              kernel_size: element.getAttribute('kernel_size')
            });
            break;
          case 'model_dl_convolution_layer':
            this.layers_.push({
              name: element.getAttribute('name'),
              type: element.getAttribute('type'),
              filters: element.getAttribute('filters'),
              kernel_size: element.getAttribute('kernel_size')
            });
            break;
          case 'model_dl_pooling_layer':
            this.layers_.push({
              name: element.getAttribute('name'),
              type: element.getAttribute('type'),
              value: element.getAttribute('value'),
              pool_size: element.getAttribute('pool_size')
            });
            break;
          case 'model_dl_reshape_layer':
            this.layers_.push({
              name: element.getAttribute('name'),
              shape: element.getAttribute('shape').split(' ').map((x) => parseInt(x))
            });
            break;
          case 'model_dl_loss_layer':
            this.layers_.push({
              name: element.getAttribute('name'),
              type: element.getAttribute('type'),
            });
            break;
        }
      }
    });
    this.updateLayers_();
  },
  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @return {!Blockly.Block} Root block in mutator.
   * @this {Blockly.Block}
   */
  decompose: function(workspace) {
    const inputBlock = workspace.newBlock('model_dl_input_layer');
    inputBlock.initSvg();
    let connection = inputBlock.nextConnection;
    for (let i = 0; i < this.layers_.length; i++) {
      const layerBlock = workspace.newBlock(this.layers_[i].name);
      layerBlock.initSvg();
      switch (this.layers_[i].name) {
        case 'model_dl_dense_layer':
          layerBlock.setFieldValue(this.layers_[i].units, 'UNITS');
          break;
        case 'model_dl_recurrent_layer':
          layerBlock.setFieldValue(this.layers_[i].type, 'TYPE');
          layerBlock.setFieldValue(this.layers_[i].units, 'UNITS');
          break;
        case 'model_dl_convolution_layer':
          layerBlock.setFieldValue(this.layers_[i].type, 'TYPE');
          layerBlock.setFieldValue(this.layers_[i].filters, 'FILTERS');
          layerBlock.setFieldValue(this.layers_[i].kernel_size, 'KERNEL_SIZE');
          break;
        case 'model_dl_pooling_layer':
          layerBlock.setFieldValue(this.layers_[i].type, 'TYPE');
          layerBlock.setFieldValue(this.layers_[i].value, 'VALUE');
          layerBlock.setFieldValue(this.layers_[i].pool_size, 'POOL_SIZE');
          break;
        case 'model_dl_reshape_layer':
          layerBlock.setFieldValue(this.layers_[i].shape.length, 'DIM');
          layerBlock.shape_ = this.layers_[i].shape;
          break;
        case 'model_dl_loss_layer':
          layerBlock.setFieldValue(this.layers_[i].type, 'TYPE');
          break;
      }
      connection.connect(layerBlock.previousConnection);
      connection = layerBlock.nextConnection;
    }
    return inputBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this {Blockly.Block}
   */
  compose: function(containerBlock) {
    let layerBlock = containerBlock.nextConnection.targetBlock();
    this.layers_ = [];
    while (layerBlock) {
      if (layerBlock.isInsertionMarker()) {
        layerBlock = layerBlock.getNextBlock();
        continue;
      }
      switch (layerBlock.type) {
        case 'model_dl_dense_layer':
          this.layers_.push({
            name: layerBlock.type,
            units: layerBlock.getFieldValue('UNITS')
          });
          break;
        case 'model_dl_recurrent_layer':
          this.layers_.push({
            name: layerBlock.type,
            type: layerBlock.getFieldValue('TYPE'),
            units: layerBlock.getFieldValue('UNITS')
          });
          break;
        case 'model_dl_convolution_layer':
          this.layers_.push({
            name: layerBlock.type,
            type: layerBlock.getFieldValue('TYPE'),
            filters: layerBlock.getFieldValue('FILTERS'),
            kernel_size: layerBlock.getFieldValue('KERNEL_SIZE')
          });
          break;
        case 'model_dl_pooling_layer':
          this.layers_.push({
            name: layerBlock.type,
            type: layerBlock.getFieldValue('TYPE'),
            value: layerBlock.getFieldValue('VALUE'),
            pool_size: layerBlock.getFieldValue('POOL_SIZE')
          });
          break;
        case 'model_dl_reshape_layer':
          let shape = [];
          for (let i = 0; layerBlock.getInput('INPUT' + i); i++) {
            shape.push(layerBlock.getFieldValue('DIM' + i));
          }
          this.layers_.push({
            name: layerBlock.type,
            shape: shape
          });
          break;
        case 'model_dl_loss_layer':
          this.layers_.push({
            name: layerBlock.type,
            type: layerBlock.getFieldValue('TYPE')
          });
          break;
      }
      layerBlock = layerBlock.getNextBlock();
    }
    this.updateLayers_();
  },
  updateLayers_: function() {
    // Remove all layers.
    for (let i = 0; this.getInput('LAYER' + i); i++) {
      this.removeInput('LAYER' + i);
    }
    for (let i = 0; i < this.layers_.length; i++) {
      const layer = this.appendDummyInput('LAYER' + i);
      switch (this.layers_[i].name) {
        case 'model_dl_dense_layer':
          layer.appendField(`- 全連接層 (${this.layers_[i].units})`);
          break;
        case 'model_dl_recurrent_layer':
          layer.appendField(`- ${this.layers_[i].type} (${this.layers_[i].units})`);
          break;
        case 'model_dl_convolution_layer':
          const kernel_size = Array(parseInt(this.layers_[i].type[0])).fill(this.layers_[i].kernel_size).join(' x ');
          layer.appendField(`- 卷積層 ${this.layers_[i].type} (${this.layers_[i].filters} @ ${kernel_size})`);
          break;
        case 'model_dl_pooling_layer':
          const pool_size = Array(parseInt(this.layers_[i].type[0])).fill(this.layers_[i].pool_size).join(' x ');
          layer.appendField(`- 池化層 ${this.layers_[i].type} (${pool_size})`);
          break;
        case 'model_dl_reshape_layer':
          layer.appendField(`- 改變形狀 (${this.layers_[i].shape.join(', ')})`);
          break;
        case 'model_dl_loss_layer':
          layer.appendField(`- 損失函數 (${this.layers_[i].type})`);
          break;
      }
    }
  }
};

Blockly.Blocks["model_rl_create"] = {
  /**
   * Block for creating classification model.
   * @this {Blockly.Block}
   */
  init: function() {
    const MODEL =
        [
          ['Q-Learning', 'QLearning'],
          ['SARSA', 'SARSA'],
        ];
    this.setStyle('model_rl_blocks');
    const modelMenu = new Blockly.FieldDropdown(MODEL, function(value) {
      this.getSourceBlock().updateParameters_(value);
    });
    this.appendDummyInput()
        .appendField(Blockly.Msg['MODEL_CREATE'])
        .appendField(modelMenu, 'MODEL')
        .appendField('強化學習模型');
    this.setInputsInline(true);
    this.setOutput(true);
    this.setTooltip(Blockly.Msg['MODEL_CREATE_CLASSIFICATION_TOOLTIP']);
    this.paramCount_ = 0;
  },
  updateParameters_: function(model) {
    for (let i = 0; i < this.paramCount_; i++) {
      this.removeInput('PARAM' + i);
    }
    switch (model) {
      case 'QLearning':
      case 'SARSA':
        this.appendDummyInput('PARAM0')
            .appendField(" 狀態個數 :")
            .appendField(new Blockly.FieldNumber(5, 1), 'PARAM_N_STATE')
            .appendField(" " + '行動個數' + " :")
            .appendField(new Blockly.FieldNumber(5, 1), 'PARAM_N_ACTION')
            .appendField(" " + '折扣因子' + " :")
            .appendField(new Blockly.FieldNumber(0.9, 0, 1, 0.01), 'PARAM_GAMMA')
            .appendField(" " + '隨機行動機率' + " :")
            .appendField(new Blockly.FieldNumber(0.5, 0, 1, 0.01), 'PARAM_EPSILON')
            .appendField(" " + '學習率' + " :")
            .appendField(new Blockly.FieldNumber(0.01, 0, 1, 0.00001), 'PARAM_LEARNING_RATE')
        this.paramCount_ = 1;
        break;
    }
  }
};