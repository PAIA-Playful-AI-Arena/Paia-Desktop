/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview JavaScript for Blockly's Code demo.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * Create a namespace for the application.
 */
const Code = {};

/**
 * Get the name of the game.
 */
Code.GAME = (new URLSearchParams(window.location.search)).get('game');

/**
 * Get the name of the game.
 */
Code.GAME_VERSION = (new URLSearchParams(window.location.search)).get('ver');

/**
 * Get the path of game logo.
 */
Code.LOGO_PATH = (new URLSearchParams(window.location.search)).get('logo');

/**
 * The name of opened project.
 */
Code.PROJECT = '';

/**
 * The full path of opened project.
 */
Code.PROJECT_PATH = '';

/**
 * The mode of running program.
 */
Code.MODE = 'play';

/**
 * The Python editor is toggled or not.
 */
Code.PYTHON_EDITOR = false;

 /**
 * The mode of running program.
 */
Code.FILESET_ID = null;

/**
 * The fileset data found by token.
 */
Code.FILESET_FOUND = null;

/**
 * All valid files under project dir.
 */
Code.FILE_LIST = {};

/**
 * The name of currently focused FILE.
 */
Code.FOCUSED_FILE = "";

/**
 * The name of currently focused group.
 */
Code.FOCUSED_GROUP = "";

Code.copyData = null;
Code.copyWorkspace = null;

/**
 * Lookup for names of supported languages.  Keys should be in ISO 639 format.
 */
Code.LANGUAGE_NAME = {
  'en': 'English',
  'zh-hant': '正體中文'
};

/**
 * List of RTL languages.
 */
Code.LANGUAGE_RTL = ['ar', 'fa', 'he', 'lki'];

/**
 * Blockly's main workspace.
 * @type {Blockly.WorkspaceSvg}
 */
Code.workspace = null;

/**
 * Dragging blocks.
 */
Code.draggingBlocks = null;

/**
 * Extracts a parameter from the URL.
 * If the parameter is absent default_value is returned.
 * @param {string} name The name of the parameter.
 * @param {string} defaultValue Value to return if parameter not found.
 * @return {string} The parameter value or the default value if not found.
 */
Code.getStringParamFromUrl = function(name, defaultValue) {
  var val = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
  return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};

/**
 * Get the language of this user from the URL.
 * @return {string} User's language.
 */
Code.getLang = function() {
  var lang = Code.getStringParamFromUrl('lang', '');
  if (Code.LANGUAGE_NAME[lang] === undefined) {
    // Default to Chinese.
    lang = 'zh-hant';
  }
  return lang;
};

/**
 * Is the current language (Code.LANG) an RTL language?
 * @return {boolean} True if RTL, false if LTR.
 */
Code.isRtl = function() {
  return Code.LANGUAGE_RTL.indexOf(Code.LANG) != -1;
};

/**
 * Load blocks saved on App Engine Storage or in session/local storage.
 * @param {string} defaultXml Text representation of default blocks.
 */
Code.loadBlocks = function(defaultXml) {
  var xml = Blockly.utils.xml.textToDom(defaultXml);
  Blockly.Xml.domToWorkspace(xml, Code.workspace);
};

/**
 * Save the blocks and reload with a different language.
 */
Code.changeLanguage = function(lang) {
  var newLang = lang
  var search = window.location.search;
  if (search.length <= 1) {
    search = '?lang=' + newLang;
  } else if (search.match(/[?&]lang=[^&]*/)) {
    search = search.replace(/([?&]lang=)[^&]*/, '$1' + newLang);
  } else {
    search = search.replace(/\?/, '?lang=' + newLang + '&');
  }

  window.location = window.location.protocol + '//' +
      window.location.host + window.location.pathname + search;
};

/**
 * Bind a function to a button's click event.
 * On touch enabled browsers, ontouchend is treated as equivalent to onclick.
 * @param {!Element|string} el Button element or ID thereof.
 * @param {!Function} func Event handler to bind.
 */
Code.bindClick = function(el, func) {
  if (typeof el == 'string') {
    el = document.getElementById(el);
  }
  el.addEventListener('click', func, true);
  el.addEventListener('touchend', func, true);
};

/**
 * Load the Prettify CSS and JavaScript.
 */
Code.importPrettify = function() {
  var script = document.createElement('script');
  script.setAttribute('src', 'https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js');
  document.head.appendChild(script);
};

/**
 * Compute the absolute coordinates and dimensions of an HTML element.
 * @param {!Element} element Element to match.
 * @return {!Object} Contains height, width, x, and y properties.
 * @private
 */
Code.getBBox_ = function(element) {
  var height = element.offsetHeight;
  var width = element.offsetWidth;
  var x = 0;
  var y = 0;
  do {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  } while (element);
  return {
    height: height,
    width: width,
    x: x,
    y: y
  };
};

/**
 * User's language (e.g. "en").
 * @type {string}
 */
Code.LANG = Code.getLang();

/**
 * List of tab names.
 * @private
 */
Code.TABS_ = ['blocks', 'python'];

/**
 * List of tab names with casing, for display in the UI.
 * @private
 */
Code.TABS_DISPLAY_ = [
  'Blocks', 'Python'
];

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
Code.renderContent = function() {
  Code.attemptCodeGeneration(python.pythonGenerator);
};

/**
 * Attempt to generate the code and display it in the UI, pretty printed.
 * @param generator {!Blockly.Generator} The generator to use.
 */
Code.attemptCodeGeneration = function(generator) {
  if (Code.checkAllGeneratorFunctionsDefined(generator)) {
    var code = generator.workspaceToCode(Code.workspace);
    Code.editor.setValue(code);
  }
};

/**
 * Check whether all blocks in use have generator functions.
 * @param generator {!Blockly.Generator} The generator to use.
 */
Code.checkAllGeneratorFunctionsDefined = function(generator) {
  const blocks = Code.workspace.getAllBlocks(false);
  const missingBlockGenerators = [];
  for (let i = 0; i < blocks.length; i++) {
    const blockType = blocks[i].type;
    if (!generator.forBlock[blockType]) {
      if (missingBlockGenerators.indexOf(blockType) == -1) {
        missingBlockGenerators.push(blockType);
      }
    }
  }

  const valid = missingBlockGenerators.length == 0;
  if (!valid) {
    const msg = 'The generator code for the following blocks not specified for ' +
        generator.name_ + ':\n - ' + missingBlockGenerators.join('\n - ');
    window.popup.alert(msg);  // Assuming synchronous. No callback.
  }
  return valid;
};

Code.setNavWidth = function() {
  var width = $("#tab_list").width() - $("#toggle_python").width() - $("#tab_user").width() - $("#tab_lang").width() - $("#tab_option").width() - 150;
  $("#opened_xml").css("max-width", `${width}px`);
};

/**
 * Create an SVG of the blocks on the workspace.
 * @param {!Blockly.WorkspaceSvg} workspace The workspace.
 */
Code.workspaceToSvg = function(workspace) {
  const bBox = workspace.getBlocksBoundingBox();
  const x = bBox.x || bBox.left;
  const y = bBox.y || bBox.top;
  const width = bBox.width || bBox.right - x;
  const height = bBox.height || bBox.bottom - y;

  const blockCanvas = workspace.getCanvas();
  const clone = blockCanvas.cloneNode(true);
  clone.removeAttribute('transform');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.appendChild(clone);
  svg.setAttribute('viewBox', x + ' ' + y + ' ' + width + ' ' + height);

  svg.setAttribute(
    'class',
    'blocklySvg ' +
      (workspace.options.renderer || 'geras') +
      '-renderer ' +
      (workspace.getTheme ? workspace.getTheme().name + '-theme' : ''),
  );
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.backgroundColor = 'transparent';

  const css = [].slice
    .call(document.head.querySelectorAll('style'))
    .filter(
      (el) =>
        /\.blocklySvg/.test(el.innerText) || el.id.indexOf('blockly-') === 0,
    )
    .map((el) => el.innerText)
    .join('\n');
  const style = document.createElement('style');
  style.innerHTML = css;
  svg.insertBefore(style, svg.firstChild);

  let svgAsXML = new XMLSerializer().serializeToString(svg);
  svgAsXML = svgAsXML.replace(/&nbsp/g, '&#160');
  return svgAsXML;
};

/**
 * Initialize Blockly.  Called on page load.
 */
Code.init = async function() {
  // Add version to the title.
  document.title += ` ${app.getVersion()}`;

  // Init game logo
  $("#game-logo").attr("src", Code.LOGO_PATH);
  
  // Hide fileset download part when competition mode is true.
  if (app.getVersion().indexOf("competition") != -1) {
    $("#fileset_download_div").css("display", "none");
  }

  // Init default project path.
  $("#project-path").val(window.project.getPath());
  
  // Load dialog body for selecting game arguments.
  Code.initGameArgs();

  // Make modal draggable.
  $(".modal-header").on("mousedown", function(mousedownEvt) {
    var $draggable = $(this);
    var x = mousedownEvt.pageX - $draggable.offset().left,
        y = mousedownEvt.pageY - $draggable.offset().top;
    $("body").on("mousemove.draggable", function(mousemoveEvt) {
      const left = Math.max(0, Math.min(mousemoveEvt.pageX - x, $(window).width() - $draggable.closest(".modal-dialog").width()));
      const top = Math.max(0, Math.min(mousemoveEvt.pageY - y, $(window).height() - $draggable.closest(".modal-dialog").height()));
      $draggable.closest(".modal-dialog").offset({
          "left": left,
          "top": top
      });
    });
    $("body").one("mouseup", function() {
        $("body").off("mousemove.draggable");
    });
  });

  // Make opened xml tabs scrollable.
  $("#opened_xml").on("mousewheel", function(event) {
    var curPos = $("#opened_xml").scrollLeft();
    $("#opened_xml").scrollLeft(curPos - event.originalEvent.wheelDelta / 5);
  })

  Code.initLanguage();

  // Initialize python editor.
  Code.editor = CodeMirror.fromTextArea(document.getElementById('python_code'), {
    mode: "python",
    lineNumbers: true,
    smartIndent: true,
    indentUnit: 4,
    indentWithTabs: false,
    lineWrapping: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"], 
    foldGutter: true,
    autofocus: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    readOnly: true
  });

  // Set callback function when window is resized.
  var onresize = function(e) {
    var container = document.getElementById('tab_content');
    var bBox = Code.getBBox_(container);
    for (var i = 0; i < Code.TABS_.length; i++) {
      var el = document.getElementById('content_' + Code.TABS_[i]);
      el.style.top = bBox.y + 'px';
      el.style.left = bBox.x + 'px';
      // Height and width need to be set, read back, then set again to
      // compensate for scrollbars.
      el.style.height = bBox.height + 'px';
      el.style.height = (2 * bBox.height - el.offsetHeight) + 'px';
      el.style.width = bBox.width + 'px';
      el.style.width = (2 * bBox.width - el.offsetWidth) + 'px';
    }
    var el = document.getElementById('project-file-window');
    el.style.top = bBox.y + 'px';
    el.style.left = (bBox.x + bBox.width - 280) + 'px';
    var el = document.getElementById('blockly-icons');
    el.style.top = (bBox.y + Math.max(bBox.height - 100, 0)) + 'px';
    el.style.left = (bBox.x + Math.max(bBox.width - 580, 0)) + 'px';
    Code.setNavWidth();
  };
  window.addEventListener('resize', onresize, false);

  // The toolbox XML specifies each category name using Blockly's messaging
  // format (eg. `<category name="%{BKY_CATLOGIC}">`).
  // These message keys need to be defined in `Blockly.Msg` in order to
  // be decoded by the library. Therefore, we'll use the `MSG` dictionary that's
  // been defined for each language to import each category name message
  // into `Blockly.Msg`.
  // TODO: Clean up the message files so this is done explicitly instead of
  // through this for-loop.
  for (var messageKey in MSG) {
    if (messageKey.indexOf('cat') == 0) {
      Blockly.Msg[messageKey.toUpperCase()] = MSG[messageKey];
    }
  }

  // Initialize block msg and generate toolbox
  const toolboxXml = Code.initMlgameBlocks();

  // Overide the color settings.
  Blockly.utils.colour.setHsvSaturation(0.4);
  Blockly.utils.colour.setHsvValue(0.85);

  class CustomCategory extends Blockly.ToolboxCategory {
    /**
     * Constructor for a custom category.
     * @override
     */
    constructor(categoryDef, toolbox, opt_parent) {
      super(categoryDef, toolbox, opt_parent);
    }
  
    /**
     * Adds the colour to the toolbox.
     * This is called on category creation and whenever the theme changes.
     * @override
     */
    addColourBorder_(colour){
      // this.rowDiv_.style.backgroundColor = colour;
      this.labelDom_.style.color = colour;
    }
  
    /**
     * Sets the style for the category when it is selected or deselected.
     * @param {boolean} isSelected True if the category has been selected,
     *     false otherwise.
     * @override
     */
    setSelected(isSelected){
      // We do not store the label span on the category, so use getElementsByClassName.
      // const labelDom = this.rowDiv_.getElementsByClassName('blocklyTreeLabel')[0];
      // if (isSelected) {
      //   // Change the background color of the div to white.
      //   this.rowDiv_.style.backgroundColor = 'white';
      //   // Set the colour of the text to the colour of the category.
      //   labelDom.style.color = this.colour_;
      //   this.iconDom_.style.color = this.colour_;
      // } else {
      //   // Set the background back to the original colour.
      //   this.rowDiv_.style.backgroundColor = this.colour_;
      //   // Set the text back to white.
      //   labelDom.style.color = 'white';
      //   this.iconDom_.style.color = 'white';
      // }
      // This is used for accessibility purposes.
      Blockly.utils.aria.setState(/** @type {!Element} */ (this.htmlDiv_),
          Blockly.utils.aria.State.SELECTED, isSelected);
    }
  
    /**
     * Creates the dom used for the icon.
     * @returns {HTMLElement} The element for the icon.
     * @override
     */
    createIconDom_() {
      const iconImg = document.createElement('img');
      switch (this.toolboxItemDef_.name) {
        case '%{BKY_CATLOGIC}':
          iconImg.src = 'media/logic-icon.svg';
          break;
        case '%{BKY_CATLOOPS}':
          iconImg.src = 'media/loops-icon.svg';
          break;
        case '%{BKY_CATMATH}':
          iconImg.src = 'media/math-icon.svg';
          break;
        case '%{BKY_CATTEXT}':
          iconImg.src = 'media/text-icon.svg';
          break;
        case '%{BKY_CATLISTS}':
          iconImg.src = 'media/lists-icon.svg';
          break;
        case '%{BKY_CATDICTS}':
          iconImg.src = 'media/dicts-icon.svg';
          break;
        case '%{BKY_CATNDARRAYS}':
          iconImg.src = 'media/ndarrays-icon.svg';
          break;
        case '%{BKY_CATMODEL}':
          iconImg.src = 'media/model-icon.svg';
          break;
        case '%{BKY_CATVARIABLES}':
          iconImg.src = 'media/variables-icon.svg';
          break;
        case '%{BKY_CATFUNCTIONS}':
          iconImg.src = 'media/functions-icon.svg';
          break;
        case '%{BKY_CATPLOT}':
          iconImg.src = 'media/plot-icon.svg';
          break;
        case '%{BKY_CATFILE}':
          iconImg.src = 'media/file-icon.svg';
          break;
        case '%{BKY_CATMLGAME}':
          iconImg.src = 'media/game-icon.svg';
          break;
        case '%{BKY_CATOTHER}':
          iconImg.src = 'media/other-icon.svg';
          break;
        default:
          iconImg.src = 'media/paia-logo.png';
          break;
      }
      iconImg.alt = 'Blockly Logo';
      iconImg.width = '25';
      iconImg.height = '25';
      return iconImg;
    }
  }
  
  Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    CustomCategory, true);

  class CustomConstantProvider extends Blockly.zelos.ConstantProvider {
    
    SHAPES = {HEXAGONAL: 1, ROUND: 2, SQUARE: 3, PUZZLE: 4, TRAPEZOID: 5, PARALLELOGRAM: 6, NOTCH: 7};

    SHAPE_IN_SHAPE_PADDING = {
      1: {
        // Outer shape: hexagon.
        0: 5 * this.GRID_UNIT, // Field in hexagon.
        1: 2 * this.GRID_UNIT, // Hexagon in hexagon.
        2: 5 * this.GRID_UNIT, // Round in hexagon.
        3: 5 * this.GRID_UNIT, // Square in hexagon.
        4: 5 * this.GRID_UNIT, // Puzzle in hexagon.
        5: 5 * this.GRID_UNIT, // Trapezoid in hexagon.
        6: 5 * this.GRID_UNIT, // Parallelogram in hexagon.
      },
      2: {
        // Outer shape: round.
        0: 3 * this.GRID_UNIT, // Field in round.
        1: 3 * this.GRID_UNIT, // Hexagon in round.
        2: 2 * this.GRID_UNIT, // Round in round.
        3: 4 * this.GRID_UNIT, // Square in round.
        4: 4 * this.GRID_UNIT, // Puzzle in round.
        5: 5 * this.GRID_UNIT, // Trapezoid in round.
        6: 5 * this.GRID_UNIT, // Parallelogram in round.
      },
      3: {
        // Outer shape: square.
        0: 8 * this.GRID_UNIT, // Field in square.
        1: 5 * this.GRID_UNIT, // Hexagon in square.
        2: 8 * this.GRID_UNIT, // Round in square.
        3: 2 * this.GRID_UNIT, // Square in square.
        4: 5 * this.GRID_UNIT, // Puzzle in square.
        5: 5 * this.GRID_UNIT, // Trapezoid in square.
        6: 5 * this.GRID_UNIT, // Parallelogram in square.
      },
      4: {
        // Outer shape: puzzle.
        0: 3 * this.GRID_UNIT, // Field in puzzle.
        1: 2 * this.GRID_UNIT, // Hexagon in puzzle.
        2: 2 * this.GRID_UNIT, // Round in puzzle.
        3: 2 * this.GRID_UNIT, // Square in puzzle.
        4: 3 * this.GRID_UNIT, // Puzzle in puzzle.
        5: 5 * this.GRID_UNIT, // Trapezoid in puzzle.
        6: 5 * this.GRID_UNIT, // Parallelogram in puzzle.
      },
      5: {
        // Outer shape: trapezoid.
        0: 5 * this.GRID_UNIT, // Field in trapezoid.
        1: 5 * this.GRID_UNIT, // Hexagon in trapezoid.
        2: 5 * this.GRID_UNIT, // Round in trapezoid.
        3: 5 * this.GRID_UNIT, // Square in trapezoid.
        4: 5 * this.GRID_UNIT, // Puzzle in trapezoid.
        5: 2 * this.GRID_UNIT, // Trapezoid in trapezoid.
        6: 5 * this.GRID_UNIT, // Parallelogram in trapezoid.
      },
      6: {
        // Outer shape: parallelogram.
        0: 8 * this.GRID_UNIT, // Field in parallelogram.
        1: 5 * this.GRID_UNIT, // Hexagon in parallelogram.
        2: 5 * this.GRID_UNIT, // Round in parallelogram.
        3: 5 * this.GRID_UNIT, // Square in parallelogram.
        4: 5 * this.GRID_UNIT, // Puzzle in parallelogram.
        5: 5 * this.GRID_UNIT, // Trapezoid in parallelogram.
        6: 2 * this.GRID_UNIT, // Parallelogram in parallelogram.
      },
    };

    init() {
      super.init();
      this.PUZZLE_TAB = this.makePuzzle();
      this.TRAPEZOID = this.makeTrapezoid();
      this.PARALLELOGRAM = this.makeParallelogram();
    }

    makeSquared() {
      const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;

      function makeMainPath(height, up, right) {
        const halfHeight = height / 2;
        const width = halfHeight > maxWidth ? maxWidth : halfHeight;
        const forward = up ? -1 : 1;
        const direction = right ? -1 : 1;
        const dy = (forward * height);
        if (right) {
          return (
            Blockly.utils.svgPaths.lineOnAxis('h', width) +
            Blockly.utils.svgPaths.lineTo(direction * width, dy)
          );
        } else {
            return (
            Blockly.utils.svgPaths.lineTo(-direction * width, dy) +
            Blockly.utils.svgPaths.lineOnAxis('h', width)
          );
        }
      }

      return {
        type: this.SHAPES.SQUARE,
        isDynamic: true,
        width(height) {
          const halfHeight = height / 2;
          return halfHeight > maxWidth ? maxWidth : halfHeight;
        },
        height(height) {
          return height;
        },
        connectionOffsetY(connectionHeight) {
          return connectionHeight / 2;
        },
        connectionOffsetX(connectionWidth) {
          return -connectionWidth;
        },
        pathDown(height) {
          return makeMainPath(height, false, false);
        },
        pathUp(height) {
          return makeMainPath(height, true, false);
        },
        pathRightDown(height) {
          return makeMainPath(height, false, true);
        },
        pathRightUp(height) {
          return makeMainPath(height, false, true);
        },
      };
    }

    makePuzzle() {
      const radius = this.CORNER_RADIUS;
      const tabWidth = this.TAB_WIDTH;
      const tabHeight = this.TAB_HEIGHT;
  
      function makeMainPath(height, up, right) {
        if (right) {
          const innerHeight = height - radius * 2;
          return (
            Blockly.utils.svgPaths.arc(
              'a',
              '0 0,1',
              radius,
              Blockly.utils.svgPaths.point((up ? -1 : 1) * radius, (up ? -1 : 1) * radius),
            ) +
            Blockly.utils.svgPaths.lineOnAxis('v', (right ? 1 : -1) * innerHeight) +
            Blockly.utils.svgPaths.arc(
              'a',
              '0 0,1',
              radius,
              Blockly.utils.svgPaths.point((up ? 1 : -1) * radius, (up ? -1 : 1) * radius),
            )
          );
        } else {
          const forward = up ? -1 : 1;
          const back = -forward;
          const overlap = 2.5;
          const innerHeight = (height - radius - tabHeight - 2 * overlap + 1) / 2;
          const halfHeight = tabHeight / 2;
          const width = tabWidth;
          const control1Y = halfHeight + overlap;
          const control2Y = halfHeight + 0.5;
          const control3Y = overlap; // 2.5

          const endPoint1 = Blockly.utils.svgPaths.point(-width, forward * halfHeight);
          const endPoint2 = Blockly.utils.svgPaths.point(width, forward * halfHeight);

          return (
            Blockly.utils.svgPaths.arc(
              'a',
              '0 0,1',
              radius,
              Blockly.utils.svgPaths.point((up ? -1 : 1) * radius, (up ? -1 : 1) * radius),
            ) +
            Blockly.utils.svgPaths.lineOnAxis('v', (right ? 1 : -1) * innerHeight) +
            Blockly.utils.svgPaths.curve('c', [
              Blockly.utils.svgPaths.point(0, forward * control1Y),
              Blockly.utils.svgPaths.point(-width, back * control2Y),
              endPoint1,
            ]) +
            Blockly.utils.svgPaths.curve('s', [
              Blockly.utils.svgPaths.point(width, back * control3Y),
              endPoint2,
            ]) +
            Blockly.utils.svgPaths.lineOnAxis('v', (right ? 1 : -1) * innerHeight) +
            Blockly.utils.svgPaths.arc(
              'a',
              '0 0,1',
              radius,
              Blockly.utils.svgPaths.point((up ? 1 : -1) * radius, (up ? -1 : 1) * radius),
            )
          );
        }
      }
  
      return {
        type: this.SHAPES.PUZZLE,
        isDynamic: true,
        width(_height) {
          return tabWidth;
        },
        height(height) {
          return height;
        },
        connectionOffsetY(connectionHeight) {
          return connectionHeight / 2;
        },
        connectionOffsetX(connectionWidth) {
          return -connectionWidth;
        },
        pathDown(height) {
          return makeMainPath(height, false, false);
        },
        pathUp(height) {
          return makeMainPath(height, true, false);
        },
        pathRightDown(height) {
          return makeMainPath(height, false, true);
        },
        pathRightUp(height) {
          return makeMainPath(height, false, true);
        },
      };
    }

    makeTrapezoid() {
      const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;

      function makeMainPath(height, up, right) {
        const halfHeight = height / 2;
        const width = halfHeight > maxWidth ? maxWidth : halfHeight;
        const forward = up ? -1 : 1;
        const direction = right ? -1 : 1;
        const dy = (forward * height);
        if (right) {
          return (
            Blockly.utils.svgPaths.lineTo(-direction * width, dy) +
            Blockly.utils.svgPaths.lineOnAxis('h', -width)
          );
        } else {
          return (
            Blockly.utils.svgPaths.lineOnAxis('h', -width) +
            Blockly.utils.svgPaths.lineTo(direction * width, dy)
          );
        }
      }

      return {
        type: this.SHAPES.TRAPEZOID,
        isDynamic: true,
        width(height) {
          const halfHeight = height / 2;
          return halfHeight > maxWidth ? maxWidth : halfHeight;
        },
        height(height) {
          return height;
        },
        connectionOffsetY(connectionHeight) {
          return connectionHeight / 2;
        },
        connectionOffsetX(connectionWidth) {
          return -connectionWidth;
        },
        pathDown(height) {
          return makeMainPath(height, false, false);
        },
        pathUp(height) {
          return makeMainPath(height, true, false);
        },
        pathRightDown(height) {
          return makeMainPath(height, false, true);
        },
        pathRightUp(height) {
          return makeMainPath(height, false, true);
        },
      };
    }

    makeParallelogram() {
      const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;

      function makeMainPath(height, up, right) {
        const halfHeight = height / 2;
        const width = halfHeight > maxWidth ? maxWidth : halfHeight;
        const forward = up ? -1 : 1;
        const direction = right ? -1 : 1;
        const dy = (forward * height);
        return (
          Blockly.utils.svgPaths.lineOnAxis('h', (right ? 1 : -1) * width) +
          Blockly.utils.svgPaths.lineTo(direction * width, dy)
        );
      }

      return {
        type: this.SHAPES.PARALLELOGRAM,
        isDynamic: true,
        width(height) {
          const halfHeight = height / 2;
          return halfHeight > maxWidth ? maxWidth : halfHeight;
        },
        height(height) {
          return height;
        },
        connectionOffsetY(connectionHeight) {
          return connectionHeight / 2;
        },
        connectionOffsetX(connectionWidth) {
          return -connectionWidth;
        },
        pathDown(height) {
          return makeMainPath(height, false, false);
        },
        pathUp(height) {
          return makeMainPath(height, true, false);
        },
        pathRightDown(height) {
          return makeMainPath(height, false, true);
        },
        pathRightUp(height) {
          return makeMainPath(height, false, true);
        },
      };
    }
    
    shapeFor(connection) {
      let checks = connection.getCheck();
      if (!checks && connection.targetConnection) {
        checks = connection.targetConnection.getCheck();
      }
      let outputShape;
      switch (connection.type) {
        case Blockly.ConnectionType.INPUT_VALUE:
        case Blockly.ConnectionType.OUTPUT_VALUE:
          outputShape = connection.getSourceBlock().getOutputShape();
          // If the block has an output shape set, use that instead.
          if (outputShape !== null) {
            switch (outputShape) {
              case this.SHAPES.HEXAGONAL:
                return this.HEXAGONAL;
              case this.SHAPES.ROUND:
                return this.ROUNDED;
              case this.SHAPES.SQUARE:
                return this.SQUARED;
              case this.SHAPES.PUZZLE:
                return this.PUZZLE_TAB;
            }
          }
          // Includes doesn't work in IE.
          if (checks && checks.indexOf('Boolean') !== -1) {
            return this.HEXAGONAL;
          }
          if (checks && checks.indexOf('Number') !== -1) {
            return this.ROUNDED;
          }
          if (checks && checks.indexOf('String') !== -1) {
            return this.PUZZLE_TAB;
          }
          if (checks && checks.indexOf('Array') !== -1) {
            return this.SQUARED;
          }
          if (checks && checks.indexOf('Dictionary') !== -1) {
            return this.TRAPEZOID;
          }
          if (checks && checks.indexOf('Model') !== -1) {
            return this.PARALLELOGRAM;
          }
          return this.ROUNDED;
        case Blockly.ConnectionType.PREVIOUS_STATEMENT:
        case Blockly.ConnectionType.NEXT_STATEMENT:
          return this.NOTCH;
        default:
          throw Error('Unknown type');
      }
    }

    getCSS_(selector) {
      return [
        /* eslint-disable indent */
        // Text.
        `${selector} .blocklyText,`,
        `${selector} .blocklyFlyoutLabelText {`,
        `font: ${this.FIELD_TEXT_FONTWEIGHT} ${this.FIELD_TEXT_FONTSIZE}` +
          `pt ${this.FIELD_TEXT_FONTFAMILY};`,
        `}`,
  
        // Fields.
        `${selector} .blocklyText {`,
        `fill: #575E75;`,
        `}`,
        `${selector} .blocklyNonEditableText>rect:not(.blocklyDropdownRect),`,
        `${selector} .blocklyEditableText>rect:not(.blocklyDropdownRect) {`,
        `fill: ${this.FIELD_BORDER_RECT_COLOUR};`,
        `}`,
        `${selector} .blocklyNonEditableText>text,`,
        `${selector} .blocklyEditableText>text,`,
        `${selector} .blocklyNonEditableText>g>text,`,
        `${selector} .blocklyEditableText>g>text {`,
        `fill: #575E75;`,
        `}`,
  
        // Flyout labels.
        `${selector} .blocklyFlyoutLabelText {`,
        `fill: #575E75;`,
        `}`,
        
        // Flyout buttons.
        `${selector} .blocklyFlyoutButton {`,
        `fill: #E4F5FF;`,
        `cursor: pointer;`,
        `}`,
  
        // Bubbles.
        `${selector} .blocklyText.blocklyBubbleText {`,
        `fill: #575E75;`,
        `}`,
  
        // Editable field hover.
        `${selector} .blocklyDraggable:not(.blocklyDisabled)`,
        ` .blocklyEditableText:not(.editing):hover>rect,`,
        `${selector} .blocklyDraggable:not(.blocklyDisabled)`,
        ` .blocklyEditableText:not(.editing):hover>.blocklyPath {`,
        `stroke: #fff;`,
        `stroke-width: 2;`,
        `}`,
  
        // Text field input.
        `${selector} .blocklyHtmlInput {`,
        `font-family: ${this.FIELD_TEXT_FONTFAMILY};`,
        `font-weight: ${this.FIELD_TEXT_FONTWEIGHT};`,
        `color: #575E75;`,
        `}`,
  
        // Dropdown field.
        `${selector} .blocklyDropdownText {`,
        `fill: #575E75 !important;`,
        `}`,
  
        // Widget and Dropdown Div
        `${selector}.blocklyWidgetDiv .goog-menuitem,`,
        `${selector}.blocklyDropDownDiv .goog-menuitem {`,
        `font-family: ${this.FIELD_TEXT_FONTFAMILY};`,
        `}`,
        `${selector}.blocklyDropDownDiv .goog-menuitem-content {`,
        `color: #575E75;`,
        `}`,
  
        // Connection highlight.
        `${selector} .blocklyHighlightedConnectionPath {`,
        `stroke: ${this.SELECTED_GLOW_COLOUR};`,
        `}`,
  
        // Disabled outline paths.
        `${selector} .blocklyDisabled > .blocklyOutlinePath {`,
        `fill: url(#blocklyDisabledPattern${this.randomIdentifier})`,
        `}`,
  
        // Insertion marker.
        `${selector} .blocklyInsertionMarker>.blocklyPath {`,
        `fill-opacity: ${this.INSERTION_MARKER_OPACITY};`,
        `stroke: none;`,
        `}`,
      ];
    }
  } 

  class CustomRenderInfo extends Blockly.zelos.RenderInfo { 
    getInRowSpacing_(prev, next) {
      if (!prev || !next) {
        if (
          this.outputConnection &&
          this.outputConnection.isDynamicShape &&
          !this.hasStatementInput &&
          !this.bottomRow.hasNextConnection
        ) {
          if ((this.outputConnection.shape.type == this.constants_.SHAPES.SQUARE ||
            this.outputConnection.shape.type == this.constants_.SHAPES.PUZZLE) && next && next.icon)
            return this.constants_.MEDIUM_PADDING;
          if ((this.outputConnection.shape.type == this.constants_.SHAPES.TRAPEZOID ||
            this.outputConnection.shape.type == this.constants_.SHAPES.SQUARE ||
            this.outputConnection.shape.type == this.constants_.SHAPES.PARALLELOGRAM) &&
            ((prev && prev.parentInput && prev.parentInput.sourceBlock && prev.parentInput.sourceBlock.icons.length != 0) ||
            (next && next.icon)))
            return this.constants_.MEDIUM_PADDING;
          return this.constants_.NO_PADDING;
        }
      }
      if (!prev) {
        // Statement input padding.
        if (next && Blockly.blockRendering.Types.isStatementInput(next)) {
          return this.constants_.STATEMENT_INPUT_PADDING_LEFT;
        }
      }
      // Spacing between a rounded corner and a previous or next connection.
      if (prev && Blockly.blockRendering.Types.isLeftRoundedCorner(prev) && next) {
        if (Blockly.blockRendering.Types.isPreviousConnection(next) || Blockly.blockRendering.Types.isNextConnection(next)) {
          return next.notchOffset - this.constants_.CORNER_RADIUS;
        }
      }
      // Spacing between a square corner and a hat.
      if (prev && Blockly.blockRendering.Types.isLeftSquareCorner(prev) && next && Blockly.blockRendering.Types.isHat(next)) {
        return this.constants_.NO_PADDING;
      }
      return this.constants_.MEDIUM_PADDING;
    }
  };

  class CustomRenderer extends Blockly.zelos.Renderer { 
    makeConstants_() {
      return new CustomConstantProvider();
    }

    makeRenderInfo_(block) {
      return new CustomRenderInfo(this, block);
    }
  };
  // const DebugRenderer = createNewRenderer(CustomRenderer);
  // Blockly.blockRendering.register('custom_renderer', DebugRenderer);
  Blockly.blockRendering.register('custom_renderer', CustomRenderer);
  Blockly.Msg["MLPLAY_CLASS_NAME"] = Code.GAME;

  Code.registerShortcuts();
  
  // Initialize blockly workspace.
  Code.workspace = Blockly.inject('content_blocks', {
    // plugins: {
    //   'toolbox': CustomContinuousToolbox,
    //   'flyoutsVerticalToolbox': CustomContinuousFlyout,
    //   'metricsManager': ContinuousMetrics,
    // },
    grid: {
      spacing: 25,
      length: 3,
      colour: '#FFF',
      snap: true
    },
    renderer: 'custom_renderer',
    media: 'media/',
    rtl: Code.isRtl(),
    toolbox: toolboxXml,
    zoom: {
      wheel: true
    },
    move: {
      wheel: true
    }
  });

  var stringButtonClickHandler = function(button) {
    Blockly.Variables.createVariableButtonHandler(
      button.getTargetWorkspace(),
      undefined,
      'String',
    );
  };
  var numberButtonClickHandler = function(button) {
    Blockly.Variables.createVariableButtonHandler(
      button.getTargetWorkspace(),
      undefined,
      'Number',
    );
  };
  var arrayButtonClickHandler = function(button) {
    Blockly.Variables.createVariableButtonHandler(
      button.getTargetWorkspace(),
      undefined,
      'Array',
    );
  };
  var dictButtonClickHandler = function(button) {
    Blockly.Variables.createVariableButtonHandler(
      button.getTargetWorkspace(),
      undefined,
      'Dictionary',
    );
  };
  var modelButtonClickHandler = function(button) {
    Blockly.Variables.createVariableButtonHandler(
      button.getTargetWorkspace(),
      undefined,
      'Model',
    );
  };

  var flyoutCategoryBlocks = function(workspace) {
    const variableModelList = workspace.getAllVariables();
  
    const xmlList = [];
    if (variableModelList.length > 0) {
      if (Blockly.Blocks['variables_set_dynamic']) {
        const firstVariable = variableModelList[variableModelList.length - 1];
        const block = Blockly.utils.xml.createElement('block');
        block.setAttribute('type', 'variables_set');
        block.setAttribute('gap', '24');
        block.appendChild(Blockly.Variables.generateVariableFieldDom(firstVariable));
        xmlList.push(block);
      }
      if (Blockly.Blocks['variables_get_dynamic']) {
        variableModelList.sort(Blockly.VariableModel.compareByName);
        for (let i = 0, variable; (variable = variableModelList[i]); i++) {
          const block = Blockly.utils.xml.createElement('block');
          block.setAttribute('type', 'variables_get');
          block.setAttribute('gap', '8');
          block.appendChild(Blockly.Variables.generateVariableFieldDom(variable));
          xmlList.push(block);
        }
      }
    }
    return xmlList;
  }

  var flyoutCategory = function(workspace) {
    let xmlList = new Array();
    let button = document.createElement('button');
    button.setAttribute('text', Blockly.Msg['NEW_STRING_VARIABLE']);
    button.setAttribute('callbackKey', 'CREATE_VARIABLE_STRING');
    xmlList.push(button);
    button = document.createElement('button');
    button.setAttribute('text', Blockly.Msg['NEW_NUMBER_VARIABLE']);
    button.setAttribute('callbackKey', 'CREATE_VARIABLE_NUMBER');
    xmlList.push(button);
    button = document.createElement('button');
    button.setAttribute('text', Blockly.Msg['NEW_ARRAY_VARIABLE']);
    button.setAttribute('callbackKey', 'CREATE_VARIABLE_ARRAY');
    xmlList.push(button);
    button = document.createElement('button');
    button.setAttribute('text', Blockly.Msg['NEW_DICT_VARIABLE']);
    button.setAttribute('callbackKey', 'CREATE_VARIABLE_DICT');
    xmlList.push(button);
    button = document.createElement('button');
    button.setAttribute('text', Blockly.Msg['NEW_MODEL_VARIABLE']);
    button.setAttribute('callbackKey', 'CREATE_VARIABLE_MODEL');
    xmlList.push(button);
  
    workspace.registerButtonCallback(
      'CREATE_VARIABLE_NUMBER',
      numberButtonClickHandler,
    );
    workspace.registerButtonCallback(
      'CREATE_VARIABLE_STRING',
      stringButtonClickHandler,
    );
    workspace.registerButtonCallback(
      'CREATE_VARIABLE_ARRAY',
      arrayButtonClickHandler,
    );
    workspace.registerButtonCallback(
      'CREATE_VARIABLE_DICT',
      dictButtonClickHandler,
    );
    workspace.registerButtonCallback(
      'CREATE_VARIABLE_MODEL',
      modelButtonClickHandler,
    );
  
    const blockList = flyoutCategoryBlocks(workspace);
    xmlList = xmlList.concat(blockList);
    return xmlList;
  }

  Code.workspace.registerToolboxCategoryCallback(
    "CUSTOM_VARIABLE",
    flyoutCategory,
  );
  
  // Set callback function when workspace is changed.
  Code.workspace.addChangeListener((e) => {
    if (!e.isUiEvent) {
      if (e.type == "finished_loading") {
        Code.FILE_LIST[Code.FOCUSED_FILE].isLoading = false;
        if (Code.FILE_LIST[Code.FOCUSED_FILE].trashcan === undefined || Code.FILE_LIST[Code.FOCUSED_FILE].trashcan.length == 0) {
          Code.workspace.trashcan.emptyContents();
        } else {
          Code.workspace.trashcan.contents = Code.FILE_LIST[Code.FOCUSED_FILE].trashcan.slice();
        }
        Code.workspace.clearUndo();
        if (Code.FILE_LIST[Code.FOCUSED_FILE].redoStack !== undefined) {
          const redoStack = Code.workspace.getRedoStack();
          redoStack.push(...Code.FILE_LIST[Code.FOCUSED_FILE].redoStack)
        }
        if (Code.FILE_LIST[Code.FOCUSED_FILE].undoStack !== undefined) {
          const undoStack = Code.workspace.getUndoStack();
          undoStack.push(...Code.FILE_LIST[Code.FOCUSED_FILE].undoStack)
        }
      }
      var topBlocks = Code.workspace.getTopBlocks();
      Code.MODE = 'execute';
      $('#run').html(MSG['execute']);
      for (var i = 0; i < topBlocks.length; i++) {
        if (topBlocks[i].type == 'mlplay_class' && topBlocks[i].isEnabled()) {
          Code.MODE = 'play';
          $('#run').html(MSG['play']);
          return;
        }
      }
    } else {
      if (Code.FOCUSED_FILE != "") {
        Code.FILE_LIST[Code.FOCUSED_FILE].settings = {x: Code.workspace.scrollX, y: Code.workspace.scrollY, scale: Code.workspace.scale};
      }
      if (e.type == "drag") {
        if (e.isStart) {
          Code.draggingBlocks = e.blocks;
        } else {
          Code.draggingBlocks = null;
        }
      }
    }
  });

  Blockly.browserEvents.bind(document.getElementById('stack-icon'), 'pointerover', null, (e) => {
    if (Code.draggingBlocks !== null)
      $('#stack-icon').addClass('shake');
  });

  Blockly.browserEvents.bind(document.getElementById('stack-icon'), 'pointerout', null, (e) => {
    $('#stack-icon').removeClass('shake');
  });
  
  Blockly.browserEvents.bind(document.getElementById('stack-icon'), 'pointerup', null, (e) => {
    if (Code.draggingBlocks !== null) {
      const undoStack = Code.workspace.getUndoStack();
      Code.draggingBlocks[0].dispose();
      const undoStack2 = Code.workspace.getUndoStack();
    }
    $('#stack-icon').removeClass('shake');
  });
  
  // Overide prompt function because prompt is not implemented in Electron.
  Blockly.dialog.setPrompt((message, defaultValue, callback) => {
    vex.dialog.prompt({
      message: message,
      placeholder: defaultValue,
      callback: callback
    });
  });

  Blockly.dialog.setAlert((message) => {
    window.popup.alert(message);
  });

  Blockly.dialog.setConfirm((message, callback) => {
    callback(window.popup.confirm(message));
  });

  // Overide the length of indent.
  python.pythonGenerator.INDENT = "    ";
  
  // Update library dropdown menu
  const libraryDir = window.path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  if (!window.fs.existsSync(libraryDir)) {
    window.fs.mkdirSync(libraryDir, { recursive: true });
  }

  if ('BlocklyStorage' in window) {
    // Hook a save function onto unload.
    BlocklyStorage.backupOnUnload(Code.workspace);
  }

  Code.bindClick('show_readme',
    function() {Code.showReadme(); Code.renderContent();});
  Code.bindClick('run',
      function() {Code.run(); Code.renderContent();});
  Code.bindClick('custom_python',
      function() {Code.showCustomPython(); Code.renderContent();});
  Code.bindClick('custom_python_button',
      function() {Code.selectCustomPython(); Code.renderContent();});
  Code.bindClick('discard',
      function() {Code.discard(); Code.renderContent();});
  Code.bindClick('clean_trashcan',
      function() {Code.workspace.trashcan.emptyContents(); Code.renderContent();});
  Code.bindClick('custom_blocks',
      function() {
        const dir = window.path.join(__dirname, 'custom_blocks').replace('app.asar', 'app.asar.unpacked');
        if (!window.fs.existsSync(dir)) {
          window.fs.mkdirSync(dir, { recursive: true });
        }
        window.path.open(dir);
      });
  Code.bindClick('toggle_python',
      function() {Code.togglePython(); Code.renderContent();});
  Code.bindClick('show_filesets',
      function() {Code.showFilesets(); Code.renderContent();});
  // Code.bindClick('load_project',
  //     function() {Code.loadProject(); Code.renderContent();});
  // Code.bindClick('reveal_project',
  //     function() {Code.revealProject(); Code.renderContent();});
  // Code.bindClick('export_project',
  //     function() {Code.exportProject(); Code.renderContent();});
  Code.bindClick('open_xml',
      function() {Code.openXml(); Code.renderContent();});
  Code.bindClick('save_xml',
      function() {Code.saveXml(); Code.renderContent();});
  Code.bindClick('save_python',
      function() {Code.savePython(); Code.renderContent();});
  // Code.bindClick('open_example_dir',
  //     function() {window.path.open(window.path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked')); Code.renderContent();});
  Code.bindClick('en',
      function() {Code.changeLanguage('en'); Code.renderContent();});
  Code.bindClick('zh-hant',
      function() {Code.changeLanguage('zh-hant'); Code.renderContent();});

  onresize();
  Blockly.svgResize(Code.workspace);
  onresize();
  Blockly.svgResize(Code.workspace);

  // Initialize content visibility.
  $("#content_python").css("visibility", "hidden");
  $("#content_blocks").css("visibility", "visible");
  Code.workspace.setVisible(true);
  
  // Open project by url
  const index = parseInt((new URLSearchParams(window.location.search)).get('latest'));
  if (index != -1) {
    Code.openProject(window.project.getLatest(Code.GAME)[index]);
  }
  
  // Try to Use saved token to login.
  if (await Code.token_login() && Code.PROJECT == '') {
    $('#project-dialog').modal('show');
  }

  // Set paia ads.
  const webview = document.getElementById('paia-ads');
  webview.addEventListener('dom-ready', function() {
    webview.setZoomFactor(0.85);
    webview.insertCSS('body { overflow: hidden; }');
  });
  webview.addEventListener('will-navigate', (e) => {
    webview.stop();
    window.shell.openExternal(e.url);
  });

  // Set dropdown callback.
  (['collect', 'train', 'test', 'other']).forEach(group => {
    $(`#group-${group}-dropdown`).on('show.bs.dropdown', function () {
      if (group == Code.FOCUSED_GROUP) {
        $(`#group-${group}-name`).val(`${MSG[group]}`);
      }
    });
    $(`#group-${group}-dropdown`).on('hide.bs.dropdown', function () {
      if (group == Code.FOCUSED_GROUP) {
        $(`#group-${group}-name`).val(Code.FILE_LIST[Code.FOCUSED_FILE].name);
      }
    });
    $(`#group-${group}-button`).dropdown("update");
  });

  // GA4
  window.paia.ga('screen_view', {
    app_name: "paia_desktop",
	  app_version: window.app.getVersion(),
    screen_name: `blockly?game=${Code.GAME}`
  });

  // Lazy-load the syntax-highlighting.
  window.setTimeout(Code.importPrettify, 1);
};

/**
 * Initialize the page language.
 */
Code.initLanguage = function() {
  // Set the HTML's language and direction.
  var rtl = Code.isRtl();
  document.dir = rtl ? 'rtl' : 'ltr';
  document.head.parentElement.setAttribute('lang', Code.LANG);

  // Inject language strings.
  // document.getElementById('game_name').textContent = Code.GAME;
  // document.getElementById('discard').textContent = MSG['discard'];
  document.getElementById('en').textContent = MSG['en'];
  document.getElementById('zh-hant').textContent = MSG['zh_hant'];
  (['collect', 'train', 'test', 'other']).forEach((group) => {
    document.getElementById(`group-${group}-name`).value = MSG[group];
  })
};

/**
 * Initialize dialog body for selecting game arguments.
 */
Code.initGameArgs = function() {
  const config = JSON.parse(window.file.read(window.path.join(__dirname, 'games', Code.GAME, 'game_config.json').replace('app.asar', 'app.asar.unpacked')));
  const $div = $('<div class="m-2"></div>')
  $div.append('<div class="form-group"><label>每秒顯示張數 (FPS)</label><input type="number" class="form-control", id="game_fps", min="1", max="300", step="1", value="30", data-bind="value:replyNumber"></div>');
  const userNumConfig = config['user_num'];
  $div.append(`<div class="form-group"><label>玩家人數</label><input type="number" class="form-control", id="user_num", min="${userNumConfig.min}", max="${userNumConfig.max}", step="1", value="${userNumConfig.min}", data-bind="value:replyNumber"></div>`);
  $('#game-args').append($div);
  for (let params of config['game_params']) {
    const $param = $('<div class="form-group"></div>');
    $param.append(`<label>${params["verbose"]}</label>`);
    if (params["type"] == "int") {
      if ("choices" in params) {
        const $choices = $(`<select class="form-control game-arg", id="param-${params["name"]}"></select>`);
        for (let value of params['choices']) {
          $choices.append(`<option ${(params["default"] == value)? "selected" : ""} value="${value}">${value}</option>`);
        };
        $param.append($choices);
      } else {
        let step = 1;
        if ("step" in params) {
          step = params["step"];
        }
        $param.append(`<input type="number" class="form-control game-arg", id="param-${params["name"]}", min="${params["min"]}", max="${params["max"]}", step="${step}", value="${params["default"]}", data-bind="value:replyNumber">`);
      }
    } else if (params["type"] == "str") {
      const $choices = $(`<select class="form-control game-arg", id="${params["name"]}"></select>`);
      for (let choice of params['choices']) {
        if (typeof(choice) === "object") {
          $choices.append(`<option ${(params["default"] == choice["value"])? "selected" : ""} value="${choice["value"]}">${choice["verbose"]}</option>`);
        } else {
          $choices.append(`<option ${(params["default"] == choice)? "selected" : ""} value="${choice}">${choice}</option>`);
        }
        $param.append($choices);
      }
    } else if (params["type"] == "path") {
      const $path = $(`<input type="text" class="form-control game-arg" id="param-${params["name"]}" onclick="Code.selectParamPath('param-${params["name"]}')" readonly></input>`);
      $param.append($path);
    } else if (params["type"] == "list") {
      const $list = $(`<input type="text" class="form-control game-arg" id="param-${params["name"]}" value="${params["default"]}">`);
      $param.append($list);
    }
    $div.append($param);
  };
};

Code.selectParamPath = function(paramId) {
  const paramPath = window.path.select({
    title: "選擇檔案",
    defaultPath: ($(`#${paramId}`).val() !== "")? $(`#${paramId}`).val() : window.path.join(__dirname, 'games', Code.GAME).replace('app.asar', 'app.asar.unpacked'),
    properties: ["openFile"]
  });
  if (paramPath !== undefined) {
    $(`#${paramId}`).val(paramPath[0]);
  } else {
    $(`#${paramId}`).val("");
  }
}

/**
 * Use blockly.json to initialize options of MLGame blocks.
 */
Code.initMlgameBlocks = function() {
  // Construct the toolbox XML, replacing translated variable names.
  const toolboxPath = window.path.join(__dirname, 'blockly', 'toolbox', 'default.xml');
  let toolboxText = window.file.read(toolboxPath);
  toolboxText = toolboxText.replace(/(^|[^%]){(\w+)}/g,
      function(m, p1, p2) {return p1 + MSG[p2];});
  const toolboxXml = Blockly.utils.xml.textToDom(toolboxText);
  const mlgameCat = toolboxXml.getElementsByClassName('MLGame_blocks')[0];

  const block = document.createElement("block");
  block.setAttribute("type", "mlplay_class");
  mlgameCat.appendChild(block);
  
  const configPath = window.path.join(__dirname, 'games', Code.GAME, 'blockly.json').replace('app.asar', 'app.asar.unpacked');
  if (window.fs.existsSync(configPath)) {
    const gameOptions = JSON.parse(window.file.read(configPath));
    const reservedWords = ['MLPlay', 'self', 'scene_info', 'keyboard', 'args', 'kwargs', 'os', 'cmath', 'csv', 'plt', 'pickle', 'pygame', 'neighbors', 'tree', 'svm', 'ensemble', 'neural_network', 'linear_model', 'metrics', 'model_selection', 'keras', 'QLearning', 'MDPInfo', 'Discrete', 'EpsGreedy', 'Parameter', 'SARSA', 'arrays_as_dataset'];
    if ("INIT_INFO" in gameOptions) {
      const options = [];
      gameOptions["INIT_INFO"].forEach((op, index) => {
        const opName = `${Code.GAME.toUpperCase()}_INIT_INFO_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        reservedWords.push(op[0]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_INIT_INFO_OPTIONS"] = options;

      const block = document.createElement("block");
      block.setAttribute("type", "mlplay_init_info");
      mlgameCat.appendChild(block);
    }

    const gameConfigPath = window.path.join(__dirname, 'games', Code.GAME, 'game_config.json').replace('app.asar', 'app.asar.unpacked');
    if (window.fs.existsSync(gameConfigPath)) {
      const options = [];
      for (var params of JSON.parse(window.file.read(gameConfigPath)).game_params) {
        if (Code.LANG == 'en') {
          options.push([params.name.split('_').join(' '), `kwargs['game_params']['${params.name}']`]);
        } else if (Code.LANG == 'zh-hant') {
          options.push([params.verbose, `kwargs['game_params']['${params.name}']`]);
        }
      }
      Blockly.Msg["MLPLAY_GAME_PARAM_OPTIONS"] = options;
      const block = document.createElement("block");
      block.setAttribute("type", "mlplay_game_param");
      mlgameCat.appendChild(block);
    }

    if ("GAME_STATUS" in gameOptions) {
      const options = [];
      gameOptions["GAME_STATUS"].forEach((op, index) => {
        const opName = `${Code.GAME.toUpperCase()}_GAME_STATUS_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_GAME_STATUS_OPTIONS"] = options;

      const block = document.createElement("block");
      block.setAttribute("type", "mlplay_game_status");
      mlgameCat.appendChild(block);
    }

    if ("SCENE_INFO" in gameOptions) {
      const options = [];
      gameOptions["SCENE_INFO"].forEach((op, index) => {
        const opName = `${Code.GAME.toUpperCase()}_SCENE_INFO_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_GET_INFO_OPTIONS"] = options;

      const block = document.createElement("block");
      block.setAttribute("type", "mlplay_get_info");
      mlgameCat.appendChild(block);
    }

    if ("CONSTANT" in gameOptions) {
      const options = [];
      gameOptions["CONSTANT"].forEach((op, index) => {
        const opName = `${Code.GAME.toUpperCase()}_CONSTANT_${index+1}`;
        options.push([`%{BKY_${opName}}`, `${index+1}/${op[0]}`]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_GET_CONSTANT_OPTIONS"] = options;

      const block = document.createElement("block");
      block.setAttribute("type", "mlplay_get_constant");
      mlgameCat.appendChild(block);
    }

    if ("ACTION" in gameOptions) {
      const options = [];
      gameOptions["ACTION"].forEach((op, index) => {
        const opName = `${Code.GAME.toUpperCase()}_ACTION_${index+1}`;
        options.push([`%{BKY_${opName}}`, op[0]]);
        if (Code.LANG == 'en') {
          Blockly.Msg[opName] = op[1];
        } else if (Code.LANG == 'zh-hant') {
          Blockly.Msg[opName] = op[2];
        }
      });
      Blockly.Msg["MLPLAY_RETURN_ACTION_OPTIONS"] = options;

      const block = document.createElement("block");
      block.setAttribute("type", "mlplay_return_action");
      mlgameCat.appendChild(block);
    }

    if ("ACTION_VALUE" in gameOptions) {
      Blockly.Blocks['mlplay_return_value'].init = function() {
        this.inputCount_ = 0;
        this.inputKey_ = [];
        gameOptions["ACTION_VALUE"].forEach((op, index) => {
          this.inputCount_++;
          this.inputKey_.push(op[0]);
          var text = (index == 0)? Blockly.Msg["MLPLAY_RETURN_VALUE"] + " " : "";
          if (Code.LANG == 'en') {
            text += op[3] + ':';
          } else if (Code.LANG == 'zh-hant') {
            text += op[4] + '：';
          }
          this.appendValueInput('INPUT' + index)
              .setAlign(Blockly.ALIGN_RIGHT)
              .appendField(text);;
        });
        this.init_settings_();
      }

      const block = document.createElement("block");
      block.setAttribute("type", "mlplay_return_value");
      gameOptions["ACTION_VALUE"].forEach((op, index) => {
        if (op[1] == "NUMBER") {
          const field = document.createElement("field");
          field.setAttribute("name", "NUM");
          field.appendChild(document.createTextNode(op[2]));
          const shadow = document.createElement("shadow");
          shadow.setAttribute("type", "math_number");
          shadow.appendChild(field);
          const value = document.createElement("value");
          value.setAttribute("name", 'INPUT' + index);
          value.appendChild(shadow);
          block.appendChild(value);
        } else if (op[1] == "STRING") {
          const field = document.createElement("field");
          field.setAttribute("name", "TEXT");
          field.appendChild(document.createTextNode(op[2]));
          const shadow = document.createElement("shadow");
          shadow.setAttribute("type", "text");
          shadow.appendChild(field);
          const value = document.createElement("value");
          value.setAttribute("name", 'INPUT' + index);
          value.appendChild(shadow);
          block.appendChild(value);
        }
      });
      mlgameCat.appendChild(block);
    }
    
    const block = document.createElement("block");
    block.setAttribute("type", "mlplay_is_key_pressed");
    mlgameCat.appendChild(block);

    python.pythonGenerator.addReservedWords(reservedWords.join());
  }

  const customBlocksPath = window.path.join(__dirname, 'custom_blocks', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  if (window.fs.existsSync(customBlocksPath)) {
    window.fs.readdirSync(customBlocksPath).forEach(file => {
      if (file.endsWith(".xml")) {
        const customToolboxPath = toolboxPath = window.path.join(customBlocksPath, file);
        const customToolboxText = window.file.read(customToolboxPath);
        const customToolboxXml = Blockly.utils.xml.textToDom(customToolboxText);
        toolboxXml.appendChild(document.createElement("sep"));
        toolboxXml.appendChild(customToolboxXml.getElementsByTagName("category")[0]);
      }
    });
  }

  return toolboxXml;
};

/**
 * Show dialog for custom Python.
 */
Code.showCustomPython = function() {
  const state = window.python_env.getCustom();
  $("#custom-python-check").prop('checked', state.custom_python);
  $("#custom-python-path").html(state.custom_python_path);
  $('#custom-python-dialog').modal('show');
};

/**
 * Select path for custom Python.
 */
Code.selectCustomPython = function() {
  let curPath = window.python_env.getCustom().custom_python_path;
  if (curPath == "" || !window.fs.existsSync(curPath)) {
    curPath = window.path.join(window.path.homedir(), 'Desktop');
  }
  const pythonPath = window.path.select({
    title: "選擇 Python 直譯器",
    defaultPath: curPath,
    properties: ["openFile"]
  });
  if (pythonPath !== undefined) {
    $("#custom-python-path").html(pythonPath[0]);
  }
};

/**
 * Save custom Python.
 */
Code.saveCustomPython = function() {
  window.python_env.setCustom($("#custom-python-check").prop('checked'), $("#custom-python-path").html());
  $('#custom-python-dialog').modal('hide');
};

/**
 * Update library dropdown list.
 */
Code.updateLibraryList = function() {
  $('#library').empty();
  let index = 0;
  let libraryDir = (app.getVersion().indexOf("competition-tn") != -1 && Code.GAME != "easy_game")? 
    window.path.join(__dirname, 'examples', Code.GAME, 'tainan') :
    window.path.join(__dirname, 'examples', Code.GAME, 'xml');
  if (window.fs.existsSync(libraryDir)) {
    window.fs.readdirSync(libraryDir).forEach(dirent => {
      const filesetDir = window.path.join(libraryDir, dirent);
      $('#library').append($(`<a href="#library-${index}" data-toggle="collapse" aria-expanded="false" class="group mt-2" title="${filesetDir}"><i class="bi bi-caret-right-fill pointer mr-1"></i>${dirent}</a>`))
      const $list = $(`<ul class="collapse list-unstyled" id="library-${index}"></ul>`)
      $('#library').append($list);
      index++;
      window.fs.readdirSync(filesetDir).forEach(file => {
        if (file.endsWith(".xml")) {
          const filePath = window.path.join(filesetDir, file);
          $list.append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
          Code.bindClick(filePath,
            function() {Code.loadXml(filePath); Code.renderContent();});
        }
      });
    });
  }

  libraryDir = window.path.join(__dirname, 'library', Code.GAME).replace('app.asar', 'app.asar.unpacked');
  window.fs.readdirSync(libraryDir).forEach(dirent => {
    const filesetDir = window.path.join(libraryDir, dirent);
    $('#library').append($(`<a href="#library-${index}" data-toggle="collapse" aria-expanded="false" class="group mt-2" title="${filesetDir}"><i class="bi bi-caret-right-fill pointer mr-1"></i>${dirent}</a>`));
    const $list = $(`<ul class="collapse list-unstyled" id="library-${index}"></ul>`)
    $('#library').append($list);
    index++;
    window.fs.readdirSync(filesetDir).forEach(file => {
      if (file.endsWith(".xml")) {
        const filePath = window.path.join(filesetDir, file);
        $list.append($(`<li class="ml-3 mt-1"><a href="#" id="${filePath}" title="${filePath}">${file}</a></li>`));
        Code.bindClick(filePath,
          function() {Code.loadXml(filePath); Code.renderContent();});
      }
    });
  });
};

/**
 * Update project files dropdown list.
 */
Code.updateProjectList = function() {
  for (const group of ['collect', 'train', 'test', 'other']) {
    $(`#group-${group}-list`).empty();
    const groupPath = window.path.join(Code.PROJECT_PATH, group);
    if (!window.fs.existsSync(groupPath)) {
      window.fs.mkdirSync(groupPath, { recursive: true });
    }
    window.fs.readdirSync(groupPath).forEach(file => {
      if (file.endsWith(".xml")) {
        const filePath = window.path.join(groupPath, file);
        if (filePath in Code.FILE_LIST) {
          $(`#group-${group}-list`).append(Code.FILE_LIST[filePath].$button);
        } else {
          const name = file.substring(0, file.length-4);
          const $button = $(`<a class="dropdown-item d-flex" href="#" id="file-${filePath}" title="${filePath}" style="width: 138px; height: 46px; border-radius: 15px; border: 1px solid #676767; background: #FFF; vertical-align: baseline; padding: 10px 6px 6px 12px; margin: 1px;"></a>`);
          const $state = $(`<img src="media/state-unexecuted.svg" id="file-${filePath}-state" style="width: 20px;">`);
          const $name = $(`<div id="file-${filePath}-name" style="max-width: 100px; font-size: 16px; color: black; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin: 0px auto 0px 15px;"><span class="not-saved"></span>${name}</div>`);
          $button.append($state, $name);
          $(`#group-${group}-list`).append($button);
          Code.bindClick(`file-${filePath}`,
            function() {Code.loadXml(filePath); Code.renderContent();});
          Code.FILE_LIST[filePath] = {
            group: group,
            name: name,
            state: "unexecuted",
            $button: $button,
            $state: $state
          }
        }
      }
    });
  };
};

/**
 * Update project file list.
 */
Code.updateProjectFileList = function(parent='') {
  if (parent == '')
    $(`#project-file-list`).empty();
  window.fs.readdirSync(window.path.join(Code.PROJECT_PATH, parent), { recursive: true }).forEach(file => {
    if (window.dir.isDirectory(window.path.join(Code.PROJECT_PATH, parent, file))) {
      if (file != "__pycache__")
        Code.updateProjectFileList(window.path.join(parent, file));
    } else {
      const $file = $(`<div title="${window.path.join(parent, file)}" style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden; padding: 5px 0px;">${window.path.join(parent, file)}</div>`);
      $(`#project-file-list`).append($file);
    }
  });
};

/**
 * Discard all blocks from the workspace.
 */
Code.discard = function() {
  var count = Code.workspace.getAllBlocks(false).length;
  if (count < 2 ||
      window.popup.confirm(Blockly.Msg['DELETE_ALL_BLOCKS'].replace('%1', count))) {
    Code.workspace.clear();
    if (window.location.hash) {
      window.location.hash = '';
    }
  }
};

Code.login = async function () {
  const response = await window.paia.login($('#email').val(), $('#password').val());
  if (response.ok) {
      $('#state-content').html('登入成功');
      $('#login-dialog').modal('hide');
      window.paia.user().then((res) => {
        if (res.ok) {
          $('#tab_user').text(res.content.username);
        }
      })
      if (Code.PROJECT == '')
        $('#project-dialog').modal('show');
  } else {
    $('#state-content').html(response.content);
  }
};

Code.token_login = async function (token=null) {
  const auth = await window.paia.auth(token);
  if (!auth.ok) {
    // $('#state-content').html(auth.content);
    if (Code.PROJECT == '')
        $('#project-dialog').modal('hide');
    $('#login-dialog').modal('show');
    return false;
  } else {
    window.paia.user().then((res) => {
      if (res.ok) {
        $('#user-name').html(res.content.username);
        $('#user-name').attr("title", res.content.username);
        $('#user-info-icon').attr("src", "media/login-owl2.png");
        $('#user-info-backgroud').attr("fill", "#ECC8D6");
        $('#login-button').attr("onclick", "");
        $('#login-button').removeClass("disabled");
        $('#login-dialog').modal('hide');
        window.paia.ga('login', {
          event_category: 'general_desktop',
          value: 'login'
        });
      }
    })
    $('#login-dialog').modal('hide');
    if (Code.PROJECT == '')
        $('#project-dialog').modal('show');
    return true;
  }
};

/**
 * Log out. 
 */
Code.logout = function () {
  window.paia.logout();
  $('#state-content').html('');
  $('#user-name').html('未登入');
  $('#user-info-icon').attr("src", "media/login-owl1.png");
  $('#user-info-backgroud').attr("fill", "#B6B6B6");
  $('#login-button').attr("onclick", "location.href=window.paia.redirect();");
  $('#login-button').addClass("disabled");
  $('#tab_user').text('尚未登入');
  $('#state-content').html('');
  $('#login-dialog').modal('show');
};

/**
 * Let user select the path to a xml file and load it. 
 */
Code.openXml = function() {
  let xmlPath = window.path.select({
    title: "開啟 XML 檔",
    filters: [
      {name: 'xml', extensions: ['xml']}
    ],
    properties: ["openFile"]
  });
  if (xmlPath === undefined) {
    return;
  } else {
    xmlPath = xmlPath[0];
  }
  Code.loadXml(xmlPath);
}

/**
 * Let user select the path to a xml file and load it. 
 */
Code.newXml = function(group) {
  let index = 1;
  let xmlPath = window.path.join(Code.PROJECT_PATH, group, `${MSG[group]}${index}.xml`);
  while (window.fs.existsSync(xmlPath)) {
    index++;
    xmlPath = window.path.join(Code.PROJECT_PATH, group, `${MSG[group]}${index}.xml`);
  }
  const xmlText = "<xml></xml>";
  window.file.write(xmlPath, xmlText);
  Code.updateProjectList();
  Code.loadXml(xmlPath);
}

/**
 * Load xml file to workscpace. 
 */
Code.loadXml = function(xmlPath) {
  // Toggle to block editor.
  if (Code.PYTHON_EDITOR)
      Code.togglePython();
  // Return if try to load focused file.
  if (xmlPath == Code.FOCUSED_FILE) {
    return;
  }
  // Return if file under incorrect dir.
  const group = window.path.basename(window.path.dirname(xmlPath));
  const project = window.path.dirname(window.path.dirname(xmlPath));
  if (project != Code.PROJECT_PATH || (['collect', 'train', 'test', 'other']).indexOf(group) == -1) {
    window.popup.alert("只能開啟位於專案資料夾 collect、train、test、other 底下的檔案。");
    return;
  }
  // Save trashcan and undo/redo stack before open another xml.
  if (Code.FOCUSED_FILE != "") {
    Code.FILE_LIST[Code.FOCUSED_FILE].trashcan = Code.workspace.trashcan.contents.slice();
    Code.FILE_LIST[Code.FOCUSED_FILE].undoStack = Code.workspace.getUndoStack().slice();
    Code.FILE_LIST[Code.FOCUSED_FILE].redoStack = Code.workspace.getRedoStack().slice();
    Code.saveXml(Code.FOCUSED_FILE);
  }
  // Load xml to workspace.
  const curXml = Blockly.Xml.workspaceToDom(Code.workspace);
  try {
    const xmlText = window.file.read(xmlPath);
    const xml = Blockly.utils.xml.textToDom(xmlText);
    Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, Code.workspace);
  } catch (err) {
    window.popup.alert(err);
    Blockly.Xml.clearWorkspaceAndLoadFromXml(curXml, Code.workspace);
    return;
  }
  Code.FILE_LIST[xmlPath].settings = {x: Code.workspace.scrollX, y: Code.workspace.scrollY, scale: Code.workspace.scale};
  Code.FILE_LIST[xmlPath].isLoading = true;
  if (Code.FOCUSED_FILE != '') {
    Code.FILE_LIST[Code.FOCUSED_FILE].$button.css("border", "1px solid #676767");
  }
  Code.FILE_LIST[xmlPath].$button.css("border", "2px solid #0039CF");
  Code.FOCUSED_FILE = xmlPath;
  if (Code.FOCUSED_GROUP != '') {
    $(`#group-${Code.FOCUSED_GROUP}-button`).css("outline", "1px solid #676767");
    $(`#group-${Code.FOCUSED_GROUP}-name`).val(MSG[Code.FOCUSED_GROUP]);
  }
  $(`#group-${group}-button`).css("outline", "3px solid #0039CF");
  $(`#group-${group}-name`).val(Code.FILE_LIST[xmlPath].name);
  $(`#group-${group}-state`).attr("src" , Code.FILE_LIST[xmlPath].$state.attr("src"));
  Code.FOCUSED_GROUP = group;
};

/**
 * Close xml file and try to load another opened xml. 
 */
Code.closeXml = function(xmlPath) {
  const name = Code.PATH_MAP[xmlPath];
  if (Code.OPENED_XMLS[name].$link.find('.not-saved').html() == '*' &&
      !window.popup.confirm(`${name} 有尚未儲存的修改，關閉後將遺失，是否確定關閉檔案？`)) {
    return;
  }
  if (Code.OPENED_XMLS[name].$link.hasClass('active')) {
    const $links = $("#opened_xml .nav-link");
    const index = $links.index(Code.OPENED_XMLS[name].$link);
    if (index - 1 >= 0) {
      $links[index - 1].click();
    } else if (index + 1 < $links.length) {
      $links[index + 1].click();
    } else {
      Code.workspace.clear();
      Code.FOCUSED_XML = "";
    }
  }
  Code.OPENED_XMLS[name].$item.remove();
  delete Code.OPENED_XMLS[name];
  delete Code.PATH_MAP[xmlPath];
};

/**
 * Save workscpace to xml.
 */
Code.saveXml = function(xmlPath=null) {
  // Select xml path if it is null.
  if (xmlPath === null) {
    xmlPath = window.path.save({
      title: "儲存 XML 檔",
      defaultPath: window.path.join(Code.PROJECT_PATH, Code.FOCUSED_XML),
      filters: [
          {name: 'XML', extensions: ['xml']}
      ]
    });
    if (xmlPath === undefined) {
      return;
    }
  }
  // Save workscpace to xml.
  const xml = Blockly.Xml.workspaceToDom(Code.workspace);
  const xmlText = Blockly.Xml.domToPrettyText(xml);
  window.file.write(xmlPath, xmlText);
  console.log(`Save workspace to ${xmlPath}.`);
  // Save project config.
  const configPath = window.path.join(Code.PROJECT_PATH, 'project.json');
  if (window.fs.existsSync(configPath)) {
    const config = JSON.parse(window.file.read(configPath));
    config.last_saved = xmlPath;
    config.saved_at = dateformat(new Date(), "yyyy-mm-dd HH:MM:ss");
    window.file.write(configPath, JSON.stringify(config));
  } else {
    window.file.write(configPath, JSON.stringify({
      game: Code.GAME,
      last_saved: xmlPath,
      saved_at: dateformat(new Date(), "yyyy-mm-dd HH:MM:ss")
    }));
  }
  // Save blocks as cover.
  window.file.write(window.path.join(Code.PROJECT_PATH, "cover.svg"), Code.workspaceToSvg(Code.workspace));
  
  // Load saved xml if it is not focused.
  if (Code.FOCUSED_FILE == "" || xmlPath != Code.FOCUSED_FILE) {
    Code.loadXml(xmlPath);
  }
};

// Toggle python editor.
Code.togglePython = function() {
  Code.renderContent();
  if (Code.PYTHON_EDITOR) {
    $("#toggle_python").html("Python");
    $("#content_python").css("visibility", "hidden");
    $("#content_blocks").css("visibility", "visible");
    Code.workspace.setVisible(true);
    Code.PYTHON_EDITOR = false;
    window.menu.enableItem({id: 'show_python', enabled: true});
    window.menu.enableItem({id: 'show_block', enabled: false});
  } else {
    $("#toggle_python").html("積木");
    $("#content_python").css("visibility", "visible");
    $("#content_blocks").css("visibility", "hidden");
    Code.workspace.setVisible(false);
    Code.PYTHON_EDITOR = true;
    window.menu.enableItem({id: 'show_python', enabled: false});
    window.menu.enableItem({id: 'show_block', enabled: true});
  }
  Code.setNavWidth();
};

/**
 * Save temporary python file for execution. 
 */
Code.saveTmpPython = function(dir) {
  const python_text = python.pythonGenerator.workspaceToCode(Code.workspace);
  const file_name = 'ml_play_' + new Date().getTime() + '.py';
  const file_path = window.path.join(dir, file_name);
  window.file.write(file_path, python_text);
  return file_name;
};

/**
 * Let user select the path to a python file and save to it. 
 */
Code.savePython = function() {
  const pythonPath = window.path.save({
    title: "另存 Python 檔",
    defaultPath: window.path.join(Code.PROJECT_PATH, 'ml_play.py'),
    filters: [
        {name: 'Python', extensions: ['py']}
    ]
  });
  if (pythonPath === undefined) {
    return;
  } else {
    const pythonText = python.pythonGenerator.workspaceToCode(Code.workspace);
    const state = window.python_env.getCustom();
    const mlgameVerPath = (state.custom_python)? 
      window.path.join(window.path.dirname(state.custom_python_path), 'Lib', 'site-packages', 'mlgame', 'version.py') :
      window.path.join(__dirname, 'python', 'dist', 'interpreter', 'mlgame', 'version.py').replace('app.asar', 'app.asar.unpacked');
    const mlgameVerStr = (window.fs.existsSync(mlgameVerPath))? window.file.read(mlgameVerPath) : "version = unknown";
    const mlgameVer = (mlgameVerStr.match(/version\s*==*\s*"([\w.]*)"/) || ['', 'unknown'])[1];
    const verInfo = '"""\n' +
                    `created_at_utc  : ${dateformat(new Date(), "isoUtcDateTime")}\n` +
                    `created_at_w3c  : ${dateformat(new Date(), "yyyy-mm-dd'T'HH:MM:ssp")}\n` +
                    `PAIA-Desktop    : ${app.getVersion()}\n` +
                    `MLGame          : ${mlgameVer}\n` +
                    `game            : ${Code.GAME}\n` +
                    `game_version    : ${Code.GAME_VERSION}\n` +
                    '"""\n\n';
    window.file.write(pythonPath, verInfo + pythonText);
    // Add log
    // window.addLog('store_py', {
    //   type: "file",
    //   data: {
    //     name: path.basename(pythonPath)
    //   }
    // });
  }
};

/**
 * Show dialog for playing or run the code. 
 */
Code.run = function() {
  // Set PAIA ads url
  if ($("#paia-ads").attr("src") == "") {
    $("#paia-ads").attr("src", window.paia.adsConsole());
  } else {
    const webview = document.getElementById('paia-ads');
    webview.reload();
  }

  if (Code.MODE == 'play') {
    Code.play();
  } else {
    Code.execute();
  }
};

/**
 * Play the game according to the parameters. 
 */
Code.play = function() {
  const file_name = Code.saveTmpPython(Code.PROJECT_PATH);
  const file_path = window.path.join(Code.PROJECT_PATH, file_name);
  const fps = document.getElementById('game_fps').value;
  const args_elements = document.getElementById('game-args').getElementsByClassName('game-arg');
  const user_num = document.getElementById('user_num').value;;
  const args = [];
  const params = {};
  for (let i = 0; i < args_elements.length; i++) {
    const e = args_elements[i];
    args.push(`--${e.id.replace('param-', '')}`);
    if (e.tagName == "SELECT") {
      const value = e.options[e.selectedIndex].getAttribute("value");
      args.push(value);
      params[e.id] = value;
    } else {
      args.push(e.value);
      params[e.id] = e.value;
    }
  }
  let total_args = [];
  for (let i = 0; i < user_num; i++) {
    total_args = total_args.concat(['-i', file_name])
  }
  total_args = total_args.concat(['-f', fps, window.path.join(__dirname, 'games', Code.GAME).replace('app.asar', 'app.asar.unpacked')]).concat(args);
  const python_path = window.path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter').replace('app.asar', 'app.asar.unpacked');
  const options = {
    mode: 'text',
    pythonPath: python_path,
    pythonOptions: ['-m'],
    args: total_args
  };
  $('#run-mlgame-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').css('display', 'block');
  window.python_env.run(options, "mlgame", file_path, Code.PROJECT_PATH, Code.FOCUSED_GROUP, Code.FOCUSED_FILE);
  // GA4
  window.paia.ga('playAI', {
    event_category: 'playAI_desktop',
    game_name: Code.GAME,
    game_version: Code.GAME_VERSION
  });
};

/**
 * Execute python program. 
 */
Code.execute = function() {
  const file_name = Code.saveTmpPython(Code.PROJECT_PATH);
  const file_path = window.path.join(Code.PROJECT_PATH, file_name);
  const python_path = window.path.join(__dirname, 'python', 'dist', 'interpreter', 'interpreter').replace('app.asar', 'app.asar.unpacked');
  const options = {
    mode: 'text',
    pythonPath: python_path,
    scriptPath: Code.PROJECT_PATH,
    args: []
  };
  $('#run-python-dialog').modal('hide');
  document.getElementById('content_console').textContent = '> Python program running\n';
  $('#console-dialog').css('display', 'block');
  window.python_env.run(options, file_name, file_path, Code.PROJECT_PATH, Code.FOCUSED_GROUP, Code.FOCUSED_FILE);
};

Code.showReadme = function() {
  const readme_path = window.path.join(__dirname, 'games', Code.GAME, 'README.md').replace('app.asar', 'app.asar.unpacked');
  const readme_text = window.file.read(readme_path);
  const readme = window.markdown.convert(readme_text);
  $('#readme-body').html(readme);
  $('#readme-dialog').modal('show');
};

Code.showTutorials = function() {
  $('#readme-dialog').modal('show');
};

Code.nextTutorials = function() {
  if (Code.tutorialsCurPage != Code.tutorialsTotalPage) {
    Code.tutorialsCurPage += 1;
  }
  const readme_path = window.path.join(__dirname, 'tutorial', 'tutorials', String(Code.tutorialsCurPage) + '.md');
  const readme_text = window.file.read(readme_path);
  const readme = window.markdown.convert(readme_text);
  $('#readme-body').html(readme);
};

Code.prevTutorials = function() {
  if (Code.tutorialsCurPage != 1) {
    Code.tutorialsCurPage -= 1;
  }
  const readme_path = window.path.join(__dirname, 'tutorial', 'tutorials', String(Code.tutorialsCurPage) + '.md');
  const readme_text = window.file.read(readme_path);
  const readme = window.markdown.convert(readme_text);
  $('#readme-body').html(readme);
};

/**
 * Show dialog for adding new project or load existing project. 
 */
Code.loadProject = function() {
  $('#project-dialog').data('bs.modal')._config.backdrop = true;
  $('#project-dialog').modal('show');
};

/**
 * Select the path of project.
 */
Code.selectProjectPath = function() {
  const dir = window.path.select({
    title: "選擇專案位置",
    defaultPath: $("#project-path").val(),
    properties: ["openDirectory"]
  });
  if (dir !== undefined) {
    $("#project-path").val(dir[0]);
    window.project.setPath(dir[0]);
  }
};

/**
 * Add new project. 
 */
Code.newProject = function() {
  const project_path = window.path.join($('#project-path').val(), $('#project-name').val());
  try {
    if (!window.fs.existsSync(project_path)) {
      window.fs.mkdirSync(project_path, { recursive: true });
      const example_path = window.path.join(__dirname, 'examples', Code.GAME, 'block');
      const collect_path = window.path.join(example_path, "collect");
      if (window.fs.existsSync(collect_path)) {
        window.dir.copy(collect_path, project_path);
      } else {
        window.fs.mkdirSync(window.path.join(project_path, "collect"));
      }
      const train_path = window.path.join(example_path, "train");
      if (window.fs.existsSync(train_path)) {
        window.dir.copy(train_path, project_path);
      } else {
        window.fs.mkdirSync(window.path.join(project_path, "train"));
      }
      const test_path = window.path.join(example_path, "test");
      if (window.fs.existsSync(test_path)) {
        window.dir.copy(test_path, project_path);
      } else {
        window.fs.mkdirSync(window.path.join(project_path, "test"));
      }
      const other_path = window.path.join(example_path, "other");
      if (window.fs.existsSync(other_path)) {
        window.dir.copy(other_path, project_path);
      } else {
        window.fs.mkdirSync(window.path.join(project_path, "other"));
      }
      window.file.write(window.path.join(project_path, "project.json"), JSON.stringify({
        game: Code.GAME,
        created_at: dateformat(new Date(), "yyyy-mm-dd HH:MM:ss"),
        saved_at: dateformat(new Date(), "yyyy-mm-dd HH:MM:ss"),
        last_saved: ""
      }));
      Code.openProject(project_path);
    } else if (window.popup.confirm(`${project_path} 已存在，是否改為載入此專案？`)) {
      Code.openProject(project_path);
    }
  } catch(err) {
    window.popup.alert(err);
  }
};

/**
 * Select existing project.
 */
Code.selectProject = function() {
  const dir = window.path.select({
    title: "開啟專案資料夾",
    defaultPath: window.project.getPath(),
    properties: ["openDirectory"]
  });
  if (dir === undefined) {
    return;
  } else {
    Code.openProject(dir[0]);
  }
};

/**
 * Open existing project.
 */
Code.openProject = function(path) {
  if (Code.PROJECT_PATH != '') {
    window.file.unwatch(Code.PROJECT_PATH);
  }
  Code.PROJECT_PATH = path;
  Code.PROJECT = window.path.basename(Code.PROJECT_PATH);
  $('#project-title').val(Code.PROJECT);
  $('#project-title').attr("title", Code.PROJECT_PATH);
  window.project.saveLatest(Code.GAME, Code.PROJECT_PATH);
  window.file.watch(Code.PROJECT_PATH, (eventType, filename) => {
    Code.updateProjectList();
    Code.updateProjectFileList();
  });
  Code.updateProjectList();
  Code.updateProjectFileList();
  window.menu.enableItem({id: 'reveal_project', enabled: true});
  window.project.onExport((event) => {
    Code.exportProject();
  });
  let start = window.path.join(Code.PROJECT_PATH, 'collect', '蒐集.xml');
  const configPath = window.path.join(Code.PROJECT_PATH, 'project.json');
  if (window.fs.existsSync(configPath)) {
    const config = JSON.parse(window.file.read(configPath));
    if (config.last_saved && config.last_saved.endsWith(".xml"))
      start = config.last_saved;
  }
  if (window.fs.existsSync(start)) {
    Code.loadXml(start, "collect");
  } else {
    Code.newXml("collect");
  }
  $('#project-dialog').modal('hide');
};

/**
 * Reveal project directory.
 */
Code.revealProject = function() {
  window.project.open(Code.PROJECT_PATH);
};

/**
 * Export project directory.
 */
Code.exportProject = function() {
  let dest = window.path.select({
    title: "匯出專案資料夾",
    defaultPath: window.project.getPath(),
    properties: ["openDirectory"]
  });
  if (dest === undefined) {
    return;
  } else {
    dest = dest[0];
  }
  const projectDir = window.path.join(dest, Code.PROJECT);
  if (!window.fs.existsSync(projectDir) || window.popup.confirm(`${projectDir} 已經存在，您要覆蓋它嗎？`)) {
    window.dir.copy(Code.PROJECT_PATH, dest);
    window.path.open(dest);
  }
};

/**
 * Change project name.
 */
Code.changeProjectName = function() {
  const oldName = Code.PROJECT_PATH;
  const newName = window.path.join(window.path.dirname(Code.PROJECT_PATH), $('#project-title').val());
  if (oldName == newName)
    return;
  if (window.fs.existsSync(newName)) {
    window.popup.alert(`${newName} 已存在`);
    $('#project-title').val(Code.PROJECT);
    return;
  }
  if (Code.FOCUSED_FILE != '')
    Code.saveXml(Code.FOCUSED_FILE);
  try {
    window.fs.copySync(oldName, newName);
  } catch (err) {
    window.popup.alert(err);
    $('#project-title').val(Code.PROJECT);
    return;
  }
  Code.openProject(newName);
  try {
    window.fs.removeSync(oldName);
  } catch (err) {
    window.popup.alert(err);
    return;
  }
};

/**
 * Make file name editable.
 */
Code.editFileName = function() {
  if (Code.FOCUSED_FILE == '' || Code.FOCUSED_GROUP == '')
    return;
  $(`#group-${Code.FOCUSED_GROUP}-name`).prop('disabled', false);
  $(`#group-${Code.FOCUSED_GROUP}-button`).prop('disabled', true);
  $(`#group-${Code.FOCUSED_GROUP}-name`).css('cursor', 'text');
  $(`#group-${Code.FOCUSED_GROUP}-name`).trigger('focus');
};

/**
 * Change file name.
 */
Code.changeFileName = function() {
  if (Code.FOCUSED_FILE == '' || Code.FOCUSED_GROUP == '')
    return;
  Code.saveXml(Code.FOCUSED_FILE);
  const oldName = Code.FOCUSED_FILE;
  const newName = window.path.join(window.path.dirname(Code.FOCUSED_FILE), $(`#group-${Code.FOCUSED_GROUP}-name`).val() + '.xml');
  $(`#group-${Code.FOCUSED_GROUP}-name`).prop('disabled', true);
  $(`#group-${Code.FOCUSED_GROUP}-button`).prop('disabled', false);
  $(`#group-${Code.FOCUSED_GROUP}-name`).css('cursor', 'pointer');
  if (oldName == newName)
    return;
  if (window.fs.existsSync(newName)) {
    window.popup.alert(`${newName} 已存在`);
    $(`#group-${Code.FOCUSED_GROUP}-name`).val(Code.FILE_LIST[Code.FOCUSED_FILE].name);
    return;
  }
  window.fs.renameSync(oldName, newName);
  Code.updateProjectList();
  Code.FOCUSED_FILE = '';
  Code.loadXml(newName);
};

/**
 * Copy fileset token to clipboard.
 */
Code.copyClipboard = function(token, id) {
  window.clipboard.writeText(token);
  $(id).empty();
  $(id).append('<i class="bi bi-clipboard-check"></i>');
};

/**
 * Update fileset
 */
Code.updateFileset = function(index, name="", description="") {
  Code.FILESET_ID = index;
  $("#filset-name").val(name)
  $("#filset-description").val(description)
  $("#filset-dialog").modal("hide");
  $("#upload-filset-dialog").modal('show');
};

/**
 * Upload a fileset.
 */
Code.uploadFileset = function() {
  const data = {
    name: $("#filset-name").val(),
    description: $("#filset-description").val(),
    game: "arkanoid"
  }
  let method = "POST";
  let apiPath = "fileset";
  if (Code.FILESET_ID >= 0) {
    method = "PATCH";
    apiPath += `/${Code.FILESET_ID}`;
  }
  window.api.paia(method, apiPath, data, 'USER_TOKEN', "v1").then((res) => {
    if (res.ok) {
      if (res.content.status == "success") {
        if (Code.FILESET_ID >= 0) {
          window.popup.alert(`檔案集更新成功`);
        } else {
          window.popup.alert(`檔案集新增成功，下載代碼：${res.content.data}`);
        }
        $("#upload-filset-dialog").modal('hide');
        Code.showFilesets();
      } else {
        window.popup.alert(`範例程式上傳失敗：${res.content.detail}`);
      }

    } else {
      console.log(res.content);
    }
  });
};

/**
 * Show all filesets in a dialog.
 */
Code.showFilesets = async function() {
  $("#fileset-list").empty();
  const response = await window.api.paia("GET", "fileset", null, 'USER_TOKEN', "v1");
  if (response.ok) {
    response.content.data.forEach((e) => {
      const $item = $('<div class="card" style="width: 100%;"></div>');
      const $header = $(`<div class="card-header" id="accordion-${e.id}"></div>`);
      $header.append(`<h2><button class="btn btn-focus-box-shadow btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse-${e.id}" aria-expanded="true" aria-controls="collapse-${e.id}"><span>${e.name}</span><span class="float-right">更新時間：${e.updated_at.substring(0, 19)}</span></button></h2>`);
      $item.append($header);
      const $body = $(`<div id="collapse-${e.id}" class="collapse" aria-labelledby="accordion-${e.id}" data-parent="#fileset-list"></div>`);
      const $card_body = $(`<div class="card-body"></div>`);
      const $description = $(`<div class="d-flex ml-1 mb-3">描述：${e.description}</div>`)
      $card_body.append($description);
      const $card_nav = $(`<div class="d-flex mb-3"></div>`)
      $card_nav.append(`<span class="ml-1">下載代碼：${e.token}</span>`);
      $card_nav.append(`<a onclick="Code.copyClipboard('${e.token}', '#clipboard-${e.id}');" id="clipboard-${e.id}" class="ml-3 btn btn-sm btn-secondary"><i class="bi bi-clipboard"></i></a>`);
      $card_nav.append(`<a onclick="Code.updateFilesetFile(${e.id});" class="ml-auto btn btn-sm btn-success float-right">新增檔案</a>`);
      $card_nav.append(`<a onclick="Code.updateFileset(${e.id}, '${e.name}', '${e.description}');" class="ml-1 btn btn-sm btn-info float-right">更新檔案集</a>`);
      $card_nav.append(`<a onclick="Code.deleteFileset(${e.id});" class="ml-1 btn btn-sm btn-danger float-right">刪除檔案集</a>`);
      $card_body.append($card_nav);
      const $file_list = $('<ul class="list-group"><ul>');
      window.api.paia("GET", `fileset/${e.id}`, null, 'USER_TOKEN', "v1").then((res) => {
        if (res.ok) {  
          res.content.data.files.forEach((f) => {
            const $file = $(`<li class="list-group-item d-flex justify-content-between align-items-center">${f.file_name}</li>`);
            $file.append($(`<a onclick="Code.deleteFilesetFile(${e.id}, '${f.file_name}');" class="ml-auto btn btn-sm btn-danger float-right">刪除檔案</a>`));
            $file_list.append($file);
          });
        } else {
          console.log(res.content);
        }
      });
      $card_body.append($file_list);
      $body.append($card_body);
      $item.append($body);
      $("#fileset-list").append($item);
    })
  } else {
    console.log(response.content);
  };
  $("#filset-dialog").modal('show');
};

/**
 * Upload files to fileset.
 */
Code.updateFilesetFile = function(index) {
  const filePath = window.path.select({
    title: "上傳檔案",
    defaultPath: Code.PROJECT_PATH,
    properties: ["openFile", "multiSelections"]
  });
  if (filePath === undefined) {
    return;
  }
  let error = 0;
  let finish = 0;
  filePath.forEach((f) => {
    window.api.paia("PUT", `fileset/${index}/file`, null, 'USER_TOKEN', "v1", f).then((res) => {
      if (res.ok) {
        if (res.content.status == "success")  
          finish++;
        else 
          console.log(res.content);
      }
      else {
        error++;
        console.log(res)
      }
      if (error + finish == filePath.length) {
        if (error > 0) {
          window.popup.alert(`${filePath.length} 個檔案上傳完成，其中 ${error} 個發生錯誤`);
        } else {
          window.popup.alert(`${filePath.length} 個檔案上傳完成`);
        }
        $("#download-filset-dialog").modal('hide');
        Code.showFilesets();
      }
    });
  })
};

/**
 * Use token to find fileset.
 */
Code.findFileset = function() {
  window.api.paia("GET", `shared_fileset?token=${$("#fileset-download-token").val()}`, null, 'DESKTOP_TOKEN', "v1").then((res) => {
    if (res.ok) {
      if (res.content.status == "success") {
        Code.FILESET_FOUND = res.content.data;
        $("#fileset-author").html(res.content.data.author);  
        $("#fileset-name").html(res.content.data.name);  
        $("#fileset-updated-at").html(res.content.data.updated_at.substring(0, 19));  
        $("#fileset-data").collapse('show');
      } else {
        Code.FILESET_FOUND = null;
        $("#fileset-data").collapse('hide');
        window.popup.alert(`${res.content.detail}`);
      }
    } else {
      console.log(response.content);
    };
  })
};

/**
 * Download fileset.
 */
Code.downloadFileset = function() {
  const dir = window.path.join(__dirname, 'library', Code.GAME, `${Code.FILESET_FOUND.name}@${Code.FILESET_FOUND.token}`).replace('app.asar', 'app.asar.unpacked');
  if (!window.fs.existsSync(dir)) {
    window.fs.mkdirSync(dir, { recursive: true });
  } else if (!window.popup.confirm(`${dir} 已存在，是否要覆蓋此程式集？`)) {
    return;
  }
  $("#saved_filesets").html(`程式庫 <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`);
  const total = Code.FILESET_FOUND.files.length;
  let finish = 0;
  let error = 0;
  Code.FILESET_FOUND.files.forEach((e) => {
    window.https.get(e.file_url, window.path.join(dir, e.file_name), (d) => {
    }, () => {
      finish++;
      if (finish + error == total) {
        if (error == 0) {
          window.popup.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成`);
        } else {
          window.popup.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成，${error} 個檔案發生錯誤`);
        }
        $("#saved_filesets").html(`程式庫`);
      }
    }, (e) => {
      error++;
      if (finish + error == total) {
        window.popup.alert(`${Code.FILESET_FOUND.name} 檔案集下載完成，${error} 個檔案發生錯誤`);
        $("#saved_filesets").html(`程式庫`);
      }
      console.error(e);
    });
  });
};

/**
 * Delete fileset.
 */
Code.deleteFileset = function(index) {
  if (window.popup.confirm("確定要刪除此檔案集嗎？")) {
    window.api.paia("DELETE", `fileset/${index}`, null, 'USER_TOKEN', "v1").then((res) => {
      if (res.ok) {
        if (res.content.status == "success") {
          window.popup.alert(`成功刪除檔案集`);
        } else {
          window.popup.alert(`${res.content.detail}`);
        }
        Code.showFilesets();
      } else {
        console.log(response.content);
        window.popup.alert(`刪除失敗：${response.content}`);
      }
    });
  }
};

/**
 * Download a file from fileset.
 */
Code.deleteFilesetFile = function(index, filename) {
  if (window.popup.confirm(`確定要刪除 ${filename} 嗎？`)) {
    const data = {
      filename: filename
    }
    window.api.paia("DELETE", `fileset/${index}/file`, data, 'USER_TOKEN', "v1").then((res) => {
      if (res.content.status == "success") {
        window.popup.alert(`成功刪除檔案`);
      } else {
        window.popup.alert(`${res.content.detail}`);
      }
      Code.showFilesets();
    })
  }
};

Code.registerShortcuts = function() {
  const ctrlC = Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.C, [
    Blockly.utils.KeyCodes.CTRL,
  ]);
  const altC = Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.C, [
    Blockly.utils.KeyCodes.ALT,
  ]);
  const metaC = Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.C, [
    Blockly.utils.KeyCodes.META,
  ]);

  const copyShortcut = {
    name: Blockly.ShortcutItems.names.COPY,
    allowCollision: true,
    preconditionFn(workspace) {
      const selected = Blockly.common.getSelected();
      return (
        !workspace.options.readOnly &&
        !Blockly.Gesture.inProgress() &&
        selected != null &&
        selected.isDeletable() &&
        selected.isMovable() &&
        !selected.workspace.isMutator &&
        Blockly.isCopyable(selected)
      );
    },
    callback(workspace, e) {
      // Prevent the default copy behavior, which may beep or otherwise indicate
      // an error due to the lack of a selection.
      e.preventDefault();
      workspace.hideChaff();
      const selected = Blockly.common.getSelected();
      if (!selected || !Blockly.isCopyable(selected)) return false;
      Code.copyData = selected.toCopyData();
      Code.copyWorkspace = selected.workspace;
      return !!Code.copyData;
    },
    keyCodes: [ctrlC, altC, metaC],
  };
  Blockly.ShortcutRegistry.registry.register(copyShortcut, true);

  const ctrlX = Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.X, [
    Blockly.utils.KeyCodes.CTRL,
  ]);
  const altX = Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.X, [
    Blockly.utils.KeyCodes.ALT,
  ]);
  const metaX = Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.X, [
    Blockly.utils.KeyCodes.META,
  ]);

  const cutShortcut = {
    name: Blockly.ShortcutItems.names.CUT,
    allowCollision: true,
    preconditionFn(workspace) {
      const selected = Blockly.common.getSelected();
      return (
        !workspace.options.readOnly &&
        !Blockly.Gesture.inProgress() &&
        selected != null &&
        selected instanceof Blockly.BlockSvg &&
        selected.isDeletable() &&
        selected.isMovable() &&
        !selected.workspace.isFlyout &&
        !selected.workspace.isMutator
      );
    },
    callback(workspace) {
      const selected = Blockly.common.getSelected();
      if (!selected || !Blockly.isCopyable(selected)) return false;
      Code.copyData = selected.toCopyData();
      Code.copyWorkspace = selected.workspace;
      selected.checkAndDelete();
      return true;
    },
    keyCodes: [ctrlX, altX, metaX],
  };

  Blockly.ShortcutRegistry.registry.register(cutShortcut, true);

  const ctrlV = Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.V, [
    Blockly.utils.KeyCodes.CTRL,
  ]);
  const altV = Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.V, [
    Blockly.utils.KeyCodes.ALT,
  ]);
  const metaV = Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.V, [
    Blockly.utils.KeyCodes.META,
  ]);

  const pasteShortcut = {
    name: Blockly.ShortcutItems.names.PASTE,
    allowCollision: true,
    preconditionFn(workspace) {
      return !workspace.options.readOnly && !Blockly.Gesture.inProgress();
    },
    callback() {
      if (!Code.copyData || !Code.copyWorkspace) return false;
      return !!Blockly.clipboard.paste(Code.copyData, Code.copyWorkspace);
    },
    keyCodes: [ctrlV, altV, metaV],
  };

  Blockly.ShortcutRegistry.registry.register(pasteShortcut, true);
};

// Load the Code demo's language strings.
document.write('<script src="js/ui_msg/' + Code.LANG + '.js"></script>\n');
// Load Blockly's language strings.
document.write('<script src="node_modules/blockly/msg/' + Code.LANG + '.js"></script>\n');
document.write('<script src="blockly/msg/' + Code.LANG + '.js"></script>\n');

const __dirname = window.path.__dirname();

let customBlocksPath = window.path.join(__dirname, 'blockly', 'blocks');
if (window.fs.existsSync(customBlocksPath)) {
  window.fs.readdirSync(customBlocksPath).forEach(file => {
    if (file.endsWith(".js")) {
      document.write(`<script src="${window.path.join(customBlocksPath, file)}"></script>\n`);
    }
  });
}

customBlocksPath = window.path.join(__dirname, 'blockly', 'python');
if (window.fs.existsSync(customBlocksPath)) {
  window.fs.readdirSync(customBlocksPath).forEach(file => {
    if (file.endsWith(".js")) {
      document.write(`<script src="${window.path.join(customBlocksPath, file)}"></script>\n`);
    }
  });
}

customBlocksPath = window.path.join(__dirname, 'custom_blocks', Code.GAME).replace('app.asar', 'app.asar.unpacked');
if (window.fs.existsSync(customBlocksPath)) {
  window.fs.readdirSync(customBlocksPath).forEach(file => {
    if (file.endsWith(".js")) {
      document.write(`<script src="${window.path.join(customBlocksPath, file)}"></script>\n`);
    }
  });
}

window.addEventListener('load', Code.init);
window.deeplink.onLogin((event, token) => {
  Code.token_login(token);
  window.paia.ga('login', {
    event_category: 'deeplink_desktop',
    value: 'login'
  });
});
window.menu.hide(false);
window.project.onLoad(() => {
  Code.loadProject();
});
window.project.onReveal((event) => {
  Code.revealProject();
});
window.editor.onShowPython(() => {
  Code.togglePython();
});
window.editor.onShowBlock(() => {
  Code.togglePython();
});
window.editor.onSavePython(() => {
  Code.savePython();
});
window.editor.onSaveBlock(() => {
  Code.saveXml();
});
window.lang.onChange((e, lang) => {
  Code.changeLanguage(lang);
});
window.onbeforeunload = (e) => {
  if (Code.FOCUSED_FILE != '')
    Code.saveXml(Code.FOCUSED_FILE);
}
