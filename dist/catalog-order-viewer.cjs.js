'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var T = _interopDefault(require('scanex-translations'));

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global_1 =
  // eslint-disable-next-line no-undef
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  check(typeof self == 'object' && self) ||
  check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
  // eslint-disable-next-line no-new-func
  Function('return this')();

var fails = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var descriptors = !fails(function () {
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});

var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : nativePropertyIsEnumerable;

var objectPropertyIsEnumerable = {
	f: f
};

var createPropertyDescriptor = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var toString = {}.toString;

var classofRaw = function (it) {
  return toString.call(it).slice(8, -1);
};

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var indexedObject = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

// `RequireObjectCoercible` abstract operation
// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
var requireObjectCoercible = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

// toObject with fallback for non-array-like ES3 strings



var toIndexedObject = function (it) {
  return indexedObject(requireObjectCoercible(it));
};

var isObject = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

// `ToPrimitive` abstract operation
// https://tc39.github.io/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var toPrimitive = function (input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

var hasOwnProperty = {}.hasOwnProperty;

var has = function (it, key) {
  return hasOwnProperty.call(it, key);
};

var document$1 = global_1.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document$1) && isObject(document$1.createElement);

var documentCreateElement = function (it) {
  return EXISTS ? document$1.createElement(it) : {};
};

// Thank's IE8 for his funny defineProperty
var ie8DomDefine = !descriptors && !fails(function () {
  return Object.defineProperty(documentCreateElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
var f$1 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (ie8DomDefine) try {
    return nativeGetOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
};

var objectGetOwnPropertyDescriptor = {
	f: f$1
};

var anObject = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};

var nativeDefineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (ie8DomDefine) try {
    return nativeDefineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var objectDefineProperty = {
	f: f$2
};

var createNonEnumerableProperty = descriptors ? function (object, key, value) {
  return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var setGlobal = function (key, value) {
  try {
    createNonEnumerableProperty(global_1, key, value);
  } catch (error) {
    global_1[key] = value;
  } return value;
};

var SHARED = '__core-js_shared__';
var store = global_1[SHARED] || setGlobal(SHARED, {});

var sharedStore = store;

var functionToString = Function.toString;

// this helper broken in `3.4.1-3.4.4`, so we can't use `shared` helper
if (typeof sharedStore.inspectSource != 'function') {
  sharedStore.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

var inspectSource = sharedStore.inspectSource;

var WeakMap = global_1.WeakMap;

var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

var shared = createCommonjsModule(function (module) {
(module.exports = function (key, value) {
  return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.6.5',
  mode:  'global',
  copyright: '© 2020 Denis Pushkarev (zloirock.ru)'
});
});

var id = 0;
var postfix = Math.random();

var uid = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

var keys = shared('keys');

var sharedKey = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

var hiddenKeys = {};

var WeakMap$1 = global_1.WeakMap;
var set, get, has$1;

var enforce = function (it) {
  return has$1(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (nativeWeakMap) {
  var store$1 = new WeakMap$1();
  var wmget = store$1.get;
  var wmhas = store$1.has;
  var wmset = store$1.set;
  set = function (it, metadata) {
    wmset.call(store$1, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget.call(store$1, it) || {};
  };
  has$1 = function (it) {
    return wmhas.call(store$1, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return has(it, STATE) ? it[STATE] : {};
  };
  has$1 = function (it) {
    return has(it, STATE);
  };
}

var internalState = {
  set: set,
  get: get,
  has: has$1,
  enforce: enforce,
  getterFor: getterFor
};

var redefine = createCommonjsModule(function (module) {
var getInternalState = internalState.get;
var enforceInternalState = internalState.enforce;
var TEMPLATE = String(String).split('String');

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) createNonEnumerableProperty(value, 'name', key);
    enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
  }
  if (O === global_1) {
    if (simple) O[key] = value;
    else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else createNonEnumerableProperty(O, key, value);
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
});
});

var path = global_1;

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

var getBuiltIn = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
    : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
};

var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.github.io/ecma262/#sec-tointeger
var toInteger = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.github.io/ecma262/#sec-tolength
var toLength = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

var max = Math.max;
var min$1 = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
var toAbsoluteIndex = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
};

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var arrayIncludes = {
  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

var indexOf = arrayIncludes.indexOf;


var objectKeysInternal = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};

// IE8- don't enum bug keys
var enumBugKeys = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return objectKeysInternal(O, hiddenKeys$1);
};

var objectGetOwnPropertyNames = {
	f: f$3
};

var f$4 = Object.getOwnPropertySymbols;

var objectGetOwnPropertySymbols = {
	f: f$4
};

// all object keys, includes non-enumerable and symbols
var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = objectGetOwnPropertyNames.f(anObject(it));
  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

var copyConstructorProperties = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = objectDefineProperty.f;
  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

var isForced_1 = isForced;

var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
var _export = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global_1;
  } else if (STATIC) {
    target = global_1[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global_1[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor$1(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    // extend global
    redefine(target, key, sourceProperty, options);
  }
};

var aFunction$1 = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};

// optional / simple context binding
var functionBindContext = function (fn, that, length) {
  aFunction$1(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

// `ToObject` abstract operation
// https://tc39.github.io/ecma262/#sec-toobject
var toObject = function (argument) {
  return Object(requireObjectCoercible(argument));
};

// `IsArray` abstract operation
// https://tc39.github.io/ecma262/#sec-isarray
var isArray = Array.isArray || function isArray(arg) {
  return classofRaw(arg) == 'Array';
};

var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
  // Chrome 38 Symbol has incorrect toString conversion
  // eslint-disable-next-line no-undef
  return !String(Symbol());
});

var useSymbolAsUid = nativeSymbol
  // eslint-disable-next-line no-undef
  && !Symbol.sham
  // eslint-disable-next-line no-undef
  && typeof Symbol.iterator == 'symbol';

var WellKnownSymbolsStore = shared('wks');
var Symbol$1 = global_1.Symbol;
var createWellKnownSymbol = useSymbolAsUid ? Symbol$1 : Symbol$1 && Symbol$1.withoutSetter || uid;

var wellKnownSymbol = function (name) {
  if (!has(WellKnownSymbolsStore, name)) {
    if (nativeSymbol && has(Symbol$1, name)) WellKnownSymbolsStore[name] = Symbol$1[name];
    else WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
  } return WellKnownSymbolsStore[name];
};

var SPECIES = wellKnownSymbol('species');

// `ArraySpeciesCreate` abstract operation
// https://tc39.github.io/ecma262/#sec-arrayspeciescreate
var arraySpeciesCreate = function (originalArray, length) {
  var C;
  if (isArray(originalArray)) {
    C = originalArray.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    else if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
};

var push = [].push;

// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
var createMethod$1 = function (TYPE) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  return function ($this, callbackfn, that, specificCreate) {
    var O = toObject($this);
    var self = indexedObject(O);
    var boundFunction = functionBindContext(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var create = specificCreate || arraySpeciesCreate;
    var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var value, result;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      value = self[index];
      result = boundFunction(value, index, O);
      if (TYPE) {
        if (IS_MAP) target[index] = result; // map
        else if (result) switch (TYPE) {
          case 3: return true;              // some
          case 5: return value;             // find
          case 6: return index;             // findIndex
          case 2: push.call(target, value); // filter
        } else if (IS_EVERY) return false;  // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
  };
};

var arrayIteration = {
  // `Array.prototype.forEach` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  forEach: createMethod$1(0),
  // `Array.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.map
  map: createMethod$1(1),
  // `Array.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
  filter: createMethod$1(2),
  // `Array.prototype.some` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.some
  some: createMethod$1(3),
  // `Array.prototype.every` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.every
  every: createMethod$1(4),
  // `Array.prototype.find` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  find: createMethod$1(5),
  // `Array.prototype.findIndex` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
  findIndex: createMethod$1(6)
};

var engineUserAgent = getBuiltIn('navigator', 'userAgent') || '';

var process = global_1.process;
var versions = process && process.versions;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  version = match[0] + match[1];
} else if (engineUserAgent) {
  match = engineUserAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = engineUserAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  }
}

var engineV8Version = version && +version;

var SPECIES$1 = wellKnownSymbol('species');

var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/677
  return engineV8Version >= 51 || !fails(function () {
    var array = [];
    var constructor = array.constructor = {};
    constructor[SPECIES$1] = function () {
      return { foo: 1 };
    };
    return array[METHOD_NAME](Boolean).foo !== 1;
  });
};

var defineProperty = Object.defineProperty;
var cache = {};

var thrower = function (it) { throw it; };

var arrayMethodUsesToLength = function (METHOD_NAME, options) {
  if (has(cache, METHOD_NAME)) return cache[METHOD_NAME];
  if (!options) options = {};
  var method = [][METHOD_NAME];
  var ACCESSORS = has(options, 'ACCESSORS') ? options.ACCESSORS : false;
  var argument0 = has(options, 0) ? options[0] : thrower;
  var argument1 = has(options, 1) ? options[1] : undefined;

  return cache[METHOD_NAME] = !!method && !fails(function () {
    if (ACCESSORS && !descriptors) return true;
    var O = { length: -1 };

    if (ACCESSORS) defineProperty(O, 1, { enumerable: true, get: thrower });
    else O[1] = 1;

    method.call(O, argument0, argument1);
  });
};

var $filter = arrayIteration.filter;



var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('filter');
// Edge 14- issue
var USES_TO_LENGTH = arrayMethodUsesToLength('filter');

// `Array.prototype.filter` method
// https://tc39.github.io/ecma262/#sec-array.prototype.filter
// with adding support of @@species
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT || !USES_TO_LENGTH }, {
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var createProperty = function (object, key, value) {
  var propertyKey = toPrimitive(key);
  if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
  else object[propertyKey] = value;
};

var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('slice');
var USES_TO_LENGTH$1 = arrayMethodUsesToLength('slice', { ACCESSORS: true, 0: 0, 1: 2 });

var SPECIES$2 = wellKnownSymbol('species');
var nativeSlice = [].slice;
var max$1 = Math.max;

// `Array.prototype.slice` method
// https://tc39.github.io/ecma262/#sec-array.prototype.slice
// fallback for not array-like ES3 strings and DOM objects
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$1 || !USES_TO_LENGTH$1 }, {
  slice: function slice(start, end) {
    var O = toIndexedObject(this);
    var length = toLength(O.length);
    var k = toAbsoluteIndex(start, length);
    var fin = toAbsoluteIndex(end === undefined ? length : end, length);
    // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
    var Constructor, result, n;
    if (isArray(O)) {
      Constructor = O.constructor;
      // cross-realm fallback
      if (typeof Constructor == 'function' && (Constructor === Array || isArray(Constructor.prototype))) {
        Constructor = undefined;
      } else if (isObject(Constructor)) {
        Constructor = Constructor[SPECIES$2];
        if (Constructor === null) Constructor = undefined;
      }
      if (Constructor === Array || Constructor === undefined) {
        return nativeSlice.call(O, k, fin);
      }
    }
    result = new (Constructor === undefined ? Array : Constructor)(max$1(fin - k, 0));
    for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
    result.length = n;
    return result;
  }
});

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
var objectKeys = Object.keys || function keys(O) {
  return objectKeysInternal(O, enumBugKeys);
};

var FAILS_ON_PRIMITIVES = fails(function () { objectKeys(1); });

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
_export({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES }, {
  keys: function keys(it) {
    return objectKeys(toObject(it));
  }
});

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys$1(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys$1(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys$1(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function () {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if ($$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

var defineProperty$1 = objectDefineProperty.f;

var FunctionPrototype = Function.prototype;
var FunctionPrototypeToString = FunctionPrototype.toString;
var nameRE = /^\s*function ([^ (]*)/;
var NAME = 'name';

// Function instances `.name` property
// https://tc39.github.io/ecma262/#sec-function-instances-name
if (descriptors && !(NAME in FunctionPrototype)) {
  defineProperty$1(FunctionPrototype, NAME, {
    configurable: true,
    get: function () {
      try {
        return FunctionPrototypeToString.call(this).match(nameRE)[1];
      } catch (error) {
        return '';
      }
    }
  });
}

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG] = 'z';

var toStringTagSupport = String(test) === '[object z]';

var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
var classof = toStringTagSupport ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$1)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};

// `Object.prototype.toString` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
var objectToString = toStringTagSupport ? {}.toString : function toString() {
  return '[object ' + classof(this) + ']';
};

// `Object.prototype.toString` method
// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
if (!toStringTagSupport) {
  redefine(Object.prototype, 'toString', objectToString, { unsafe: true });
}

var nativePromiseConstructor = global_1.Promise;

var redefineAll = function (target, src, options) {
  for (var key in src) redefine(target, key, src[key], options);
  return target;
};

var defineProperty$2 = objectDefineProperty.f;



var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');

var setToStringTag = function (it, TAG, STATIC) {
  if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG$2)) {
    defineProperty$2(it, TO_STRING_TAG$2, { configurable: true, value: TAG });
  }
};

var SPECIES$3 = wellKnownSymbol('species');

var setSpecies = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
  var defineProperty = objectDefineProperty.f;

  if (descriptors && Constructor && !Constructor[SPECIES$3]) {
    defineProperty(Constructor, SPECIES$3, {
      configurable: true,
      get: function () { return this; }
    });
  }
};

var anInstance = function (it, Constructor, name) {
  if (!(it instanceof Constructor)) {
    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
  } return it;
};

var iterators = {};

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
var isArrayIteratorMethod = function (it) {
  return it !== undefined && (iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};

var ITERATOR$1 = wellKnownSymbol('iterator');

var getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR$1]
    || it['@@iterator']
    || iterators[classof(it)];
};

// call something on iterator step with safe closing on error
var callWithSafeIterationClosing = function (iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (error) {
    var returnMethod = iterator['return'];
    if (returnMethod !== undefined) anObject(returnMethod.call(iterator));
    throw error;
  }
};

var iterate_1 = createCommonjsModule(function (module) {
var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var iterate = module.exports = function (iterable, fn, that, AS_ENTRIES, IS_ITERATOR) {
  var boundFunction = functionBindContext(fn, that, AS_ENTRIES ? 2 : 1);
  var iterator, iterFn, index, length, result, next, step;

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = toLength(iterable.length); length > index; index++) {
        result = AS_ENTRIES
          ? boundFunction(anObject(step = iterable[index])[0], step[1])
          : boundFunction(iterable[index]);
        if (result && result instanceof Result) return result;
      } return new Result(false);
    }
    iterator = iterFn.call(iterable);
  }

  next = iterator.next;
  while (!(step = next.call(iterator)).done) {
    result = callWithSafeIterationClosing(iterator, boundFunction, step.value, AS_ENTRIES);
    if (typeof result == 'object' && result && result instanceof Result) return result;
  } return new Result(false);
};

iterate.stop = function (result) {
  return new Result(true, result);
};
});

var ITERATOR$2 = wellKnownSymbol('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR$2] = function () {
    return this;
  };
  // eslint-disable-next-line no-throw-literal
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

var checkCorrectnessOfIteration = function (exec, SKIP_CLOSING) {
  if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR$2] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};

var SPECIES$4 = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.github.io/ecma262/#sec-speciesconstructor
var speciesConstructor = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES$4]) == undefined ? defaultConstructor : aFunction$1(S);
};

var html = getBuiltIn('document', 'documentElement');

var engineIsIos = /(iphone|ipod|ipad).*applewebkit/i.test(engineUserAgent);

var location = global_1.location;
var set$1 = global_1.setImmediate;
var clear = global_1.clearImmediate;
var process$1 = global_1.process;
var MessageChannel = global_1.MessageChannel;
var Dispatch = global_1.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;

var run$1 = function (id) {
  // eslint-disable-next-line no-prototype-builtins
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run$1(id);
  };
};

var listener = function (event) {
  run$1(event.data);
};

var post = function (id) {
  // old engines have not location.origin
  global_1.postMessage(id + '', location.protocol + '//' + location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set$1 || !clear) {
  set$1 = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func
      (typeof fn == 'function' ? fn : Function(fn)).apply(undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (classofRaw(process$1) == 'process') {
    defer = function (id) {
      process$1.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  // except iOS - https://github.com/zloirock/core-js/issues/624
  } else if (MessageChannel && !engineIsIos) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = functionBindContext(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (
    global_1.addEventListener &&
    typeof postMessage == 'function' &&
    !global_1.importScripts &&
    !fails(post) &&
    location.protocol !== 'file:'
  ) {
    defer = post;
    global_1.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in documentCreateElement('script')) {
    defer = function (id) {
      html.appendChild(documentCreateElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run$1(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

var task = {
  set: set$1,
  clear: clear
};

var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;

var macrotask = task.set;


var MutationObserver = global_1.MutationObserver || global_1.WebKitMutationObserver;
var process$2 = global_1.process;
var Promise$1 = global_1.Promise;
var IS_NODE = classofRaw(process$2) == 'process';
// Node.js 11 shows ExperimentalWarning on getting `queueMicrotask`
var queueMicrotaskDescriptor = getOwnPropertyDescriptor$2(global_1, 'queueMicrotask');
var queueMicrotask = queueMicrotaskDescriptor && queueMicrotaskDescriptor.value;

var flush$1, head, last, notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!queueMicrotask) {
  flush$1 = function () {
    var parent, fn;
    if (IS_NODE && (parent = process$2.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (error) {
        if (head) notify();
        else last = undefined;
        throw error;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // Node.js
  if (IS_NODE) {
    notify = function () {
      process$2.nextTick(flush$1);
    };
  // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
  } else if (MutationObserver && !engineIsIos) {
    toggle = true;
    node = document.createTextNode('');
    new MutationObserver(flush$1).observe(node, { characterData: true });
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise$1 && Promise$1.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    promise = Promise$1.resolve(undefined);
    then = promise.then;
    notify = function () {
      then.call(promise, flush$1);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global_1, flush$1);
    };
  }
}

var microtask = queueMicrotask || function (fn) {
  var task = { fn: fn, next: undefined };
  if (last) last.next = task;
  if (!head) {
    head = task;
    notify();
  } last = task;
};

var PromiseCapability = function (C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction$1(resolve);
  this.reject = aFunction$1(reject);
};

// 25.4.1.5 NewPromiseCapability(C)
var f$5 = function (C) {
  return new PromiseCapability(C);
};

var newPromiseCapability = {
	f: f$5
};

var promiseResolve = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};

var hostReportErrors = function (a, b) {
  var console = global_1.console;
  if (console && console.error) {
    arguments.length === 1 ? console.error(a) : console.error(a, b);
  }
};

var perform = function (exec) {
  try {
    return { error: false, value: exec() };
  } catch (error) {
    return { error: true, value: error };
  }
};

var task$1 = task.set;










var SPECIES$5 = wellKnownSymbol('species');
var PROMISE = 'Promise';
var getInternalState = internalState.get;
var setInternalState = internalState.set;
var getInternalPromiseState = internalState.getterFor(PROMISE);
var PromiseConstructor = nativePromiseConstructor;
var TypeError$1 = global_1.TypeError;
var document$2 = global_1.document;
var process$3 = global_1.process;
var $fetch = getBuiltIn('fetch');
var newPromiseCapability$1 = newPromiseCapability.f;
var newGenericPromiseCapability = newPromiseCapability$1;
var IS_NODE$1 = classofRaw(process$3) == 'process';
var DISPATCH_EVENT = !!(document$2 && document$2.createEvent && global_1.dispatchEvent);
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;
var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

var FORCED = isForced_1(PROMISE, function () {
  var GLOBAL_CORE_JS_PROMISE = inspectSource(PromiseConstructor) !== String(PromiseConstructor);
  if (!GLOBAL_CORE_JS_PROMISE) {
    // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
    // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
    // We can't detect it synchronously, so just check versions
    if (engineV8Version === 66) return true;
    // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    if (!IS_NODE$1 && typeof PromiseRejectionEvent != 'function') return true;
  }
  // We can't use @@species feature detection in V8 since it causes
  // deoptimization and performance degradation
  // https://github.com/zloirock/core-js/issues/679
  if (engineV8Version >= 51 && /native code/.test(PromiseConstructor)) return false;
  // Detect correctness of subclassing with @@species support
  var promise = PromiseConstructor.resolve(1);
  var FakePromise = function (exec) {
    exec(function () { /* empty */ }, function () { /* empty */ });
  };
  var constructor = promise.constructor = {};
  constructor[SPECIES$5] = FakePromise;
  return !(promise.then(function () { /* empty */ }) instanceof FakePromise);
});

var INCORRECT_ITERATION = FORCED || !checkCorrectnessOfIteration(function (iterable) {
  PromiseConstructor.all(iterable)['catch'](function () { /* empty */ });
});

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};

var notify$1 = function (promise, state, isReject) {
  if (state.notified) return;
  state.notified = true;
  var chain = state.reactions;
  microtask(function () {
    var value = state.value;
    var ok = state.state == FULFILLED;
    var index = 0;
    // variable length - can't use forEach
    while (chain.length > index) {
      var reaction = chain[index++];
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then, exited;
      try {
        if (handler) {
          if (!ok) {
            if (state.rejection === UNHANDLED) onHandleUnhandled(promise, state);
            state.rejection = HANDLED;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value); // can throw
            if (domain) {
              domain.exit();
              exited = true;
            }
          }
          if (result === reaction.promise) {
            reject(TypeError$1('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (error) {
        if (domain && !exited) domain.exit();
        reject(error);
      }
    }
    state.reactions = [];
    state.notified = false;
    if (isReject && !state.rejection) onUnhandled(promise, state);
  });
};

var dispatchEvent = function (name, promise, reason) {
  var event, handler;
  if (DISPATCH_EVENT) {
    event = document$2.createEvent('Event');
    event.promise = promise;
    event.reason = reason;
    event.initEvent(name, false, true);
    global_1.dispatchEvent(event);
  } else event = { promise: promise, reason: reason };
  if (handler = global_1['on' + name]) handler(event);
  else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
};

var onUnhandled = function (promise, state) {
  task$1.call(global_1, function () {
    var value = state.value;
    var IS_UNHANDLED = isUnhandled(state);
    var result;
    if (IS_UNHANDLED) {
      result = perform(function () {
        if (IS_NODE$1) {
          process$3.emit('unhandledRejection', value, promise);
        } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      state.rejection = IS_NODE$1 || isUnhandled(state) ? UNHANDLED : HANDLED;
      if (result.error) throw result.value;
    }
  });
};

var isUnhandled = function (state) {
  return state.rejection !== HANDLED && !state.parent;
};

var onHandleUnhandled = function (promise, state) {
  task$1.call(global_1, function () {
    if (IS_NODE$1) {
      process$3.emit('rejectionHandled', promise);
    } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
  });
};

var bind = function (fn, promise, state, unwrap) {
  return function (value) {
    fn(promise, state, value, unwrap);
  };
};

var internalReject = function (promise, state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  state.value = value;
  state.state = REJECTED;
  notify$1(promise, state, true);
};

var internalResolve = function (promise, state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  try {
    if (promise === value) throw TypeError$1("Promise can't be resolved itself");
    var then = isThenable(value);
    if (then) {
      microtask(function () {
        var wrapper = { done: false };
        try {
          then.call(value,
            bind(internalResolve, promise, wrapper, state),
            bind(internalReject, promise, wrapper, state)
          );
        } catch (error) {
          internalReject(promise, wrapper, error, state);
        }
      });
    } else {
      state.value = value;
      state.state = FULFILLED;
      notify$1(promise, state, false);
    }
  } catch (error) {
    internalReject(promise, { done: false }, error, state);
  }
};

// constructor polyfill
if (FORCED) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance(this, PromiseConstructor, PROMISE);
    aFunction$1(executor);
    Internal.call(this);
    var state = getInternalState(this);
    try {
      executor(bind(internalResolve, this, state), bind(internalReject, this, state));
    } catch (error) {
      internalReject(this, state, error);
    }
  };
  // eslint-disable-next-line no-unused-vars
  Internal = function Promise(executor) {
    setInternalState(this, {
      type: PROMISE,
      done: false,
      notified: false,
      parent: false,
      reactions: [],
      rejection: false,
      state: PENDING,
      value: undefined
    });
  };
  Internal.prototype = redefineAll(PromiseConstructor.prototype, {
    // `Promise.prototype.then` method
    // https://tc39.github.io/ecma262/#sec-promise.prototype.then
    then: function then(onFulfilled, onRejected) {
      var state = getInternalPromiseState(this);
      var reaction = newPromiseCapability$1(speciesConstructor(this, PromiseConstructor));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = IS_NODE$1 ? process$3.domain : undefined;
      state.parent = true;
      state.reactions.push(reaction);
      if (state.state != PENDING) notify$1(this, state, false);
      return reaction.promise;
    },
    // `Promise.prototype.catch` method
    // https://tc39.github.io/ecma262/#sec-promise.prototype.catch
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    var state = getInternalState(promise);
    this.promise = promise;
    this.resolve = bind(internalResolve, promise, state);
    this.reject = bind(internalReject, promise, state);
  };
  newPromiseCapability.f = newPromiseCapability$1 = function (C) {
    return C === PromiseConstructor || C === PromiseWrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };

  if ( typeof nativePromiseConstructor == 'function') {
    nativeThen = nativePromiseConstructor.prototype.then;

    // wrap native Promise#then for native async functions
    redefine(nativePromiseConstructor.prototype, 'then', function then(onFulfilled, onRejected) {
      var that = this;
      return new PromiseConstructor(function (resolve, reject) {
        nativeThen.call(that, resolve, reject);
      }).then(onFulfilled, onRejected);
    // https://github.com/zloirock/core-js/issues/640
    }, { unsafe: true });

    // wrap fetch result
    if (typeof $fetch == 'function') _export({ global: true, enumerable: true, forced: true }, {
      // eslint-disable-next-line no-unused-vars
      fetch: function fetch(input /* , init */) {
        return promiseResolve(PromiseConstructor, $fetch.apply(global_1, arguments));
      }
    });
  }
}

_export({ global: true, wrap: true, forced: FORCED }, {
  Promise: PromiseConstructor
});

setToStringTag(PromiseConstructor, PROMISE, false);
setSpecies(PROMISE);

PromiseWrapper = getBuiltIn(PROMISE);

// statics
_export({ target: PROMISE, stat: true, forced: FORCED }, {
  // `Promise.reject` method
  // https://tc39.github.io/ecma262/#sec-promise.reject
  reject: function reject(r) {
    var capability = newPromiseCapability$1(this);
    capability.reject.call(undefined, r);
    return capability.promise;
  }
});

_export({ target: PROMISE, stat: true, forced:  FORCED }, {
  // `Promise.resolve` method
  // https://tc39.github.io/ecma262/#sec-promise.resolve
  resolve: function resolve(x) {
    return promiseResolve( this, x);
  }
});

_export({ target: PROMISE, stat: true, forced: INCORRECT_ITERATION }, {
  // `Promise.all` method
  // https://tc39.github.io/ecma262/#sec-promise.all
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability$1(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction$1(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate_1(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        $promiseResolve.call(C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  },
  // `Promise.race` method
  // https://tc39.github.io/ecma262/#sec-promise.race
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability$1(C);
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction$1(C.resolve);
      iterate_1(iterable, function (promise) {
        $promiseResolve.call(C, promise).then(capability.resolve, reject);
      });
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});

var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

// We can't use this feature detection in V8 since it causes
// deoptimization and serious performance degradation
// https://github.com/zloirock/core-js/issues/679
var IS_CONCAT_SPREADABLE_SUPPORT = engineV8Version >= 51 || !fails(function () {
  var array = [];
  array[IS_CONCAT_SPREADABLE] = false;
  return array.concat()[0] !== array;
});

var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

var isConcatSpreadable = function (O) {
  if (!isObject(O)) return false;
  var spreadable = O[IS_CONCAT_SPREADABLE];
  return spreadable !== undefined ? !!spreadable : isArray(O);
};

var FORCED$1 = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

// `Array.prototype.concat` method
// https://tc39.github.io/ecma262/#sec-array.prototype.concat
// with adding support of @@isConcatSpreadable and @@species
_export({ target: 'Array', proto: true, forced: FORCED$1 }, {
  concat: function concat(arg) { // eslint-disable-line no-unused-vars
    var O = toObject(this);
    var A = arraySpeciesCreate(O, 0);
    var n = 0;
    var i, k, length, len, E;
    for (i = -1, length = arguments.length; i < length; i++) {
      E = i === -1 ? O : arguments[i];
      if (isConcatSpreadable(E)) {
        len = toLength(E.length);
        if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
      } else {
        if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        createProperty(A, n++, E);
      }
    }
    A.length = n;
    return A;
  }
});

var arrayMethodIsStrict = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call,no-throw-literal
    method.call(null, argument || function () { throw 1; }, 1);
  });
};

var $every = arrayIteration.every;



var STRICT_METHOD = arrayMethodIsStrict('every');
var USES_TO_LENGTH$2 = arrayMethodUsesToLength('every');

// `Array.prototype.every` method
// https://tc39.github.io/ecma262/#sec-array.prototype.every
_export({ target: 'Array', proto: true, forced: !STRICT_METHOD || !USES_TO_LENGTH$2 }, {
  every: function every(callbackfn /* , thisArg */) {
    return $every(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var $forEach = arrayIteration.forEach;



var STRICT_METHOD$1 = arrayMethodIsStrict('forEach');
var USES_TO_LENGTH$3 = arrayMethodUsesToLength('forEach');

// `Array.prototype.forEach` method implementation
// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
var arrayForEach = (!STRICT_METHOD$1 || !USES_TO_LENGTH$3) ? function forEach(callbackfn /* , thisArg */) {
  return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
} : [].forEach;

// `Array.prototype.forEach` method
// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
_export({ target: 'Array', proto: true, forced: [].forEach != arrayForEach }, {
  forEach: arrayForEach
});

var min$2 = Math.min;
var nativeLastIndexOf = [].lastIndexOf;
var NEGATIVE_ZERO = !!nativeLastIndexOf && 1 / [1].lastIndexOf(1, -0) < 0;
var STRICT_METHOD$2 = arrayMethodIsStrict('lastIndexOf');
// For preventing possible almost infinite loop in non-standard implementations, test the forward version of the method
var USES_TO_LENGTH$4 = arrayMethodUsesToLength('indexOf', { ACCESSORS: true, 1: 0 });
var FORCED$2 = NEGATIVE_ZERO || !STRICT_METHOD$2 || !USES_TO_LENGTH$4;

// `Array.prototype.lastIndexOf` method implementation
// https://tc39.github.io/ecma262/#sec-array.prototype.lastindexof
var arrayLastIndexOf = FORCED$2 ? function lastIndexOf(searchElement /* , fromIndex = @[*-1] */) {
  // convert -0 to +0
  if (NEGATIVE_ZERO) return nativeLastIndexOf.apply(this, arguments) || 0;
  var O = toIndexedObject(this);
  var length = toLength(O.length);
  var index = length - 1;
  if (arguments.length > 1) index = min$2(index, toInteger(arguments[1]));
  if (index < 0) index = length + index;
  for (;index >= 0; index--) if (index in O && O[index] === searchElement) return index || 0;
  return -1;
} : nativeLastIndexOf;

// `Array.prototype.lastIndexOf` method
// https://tc39.github.io/ecma262/#sec-array.prototype.lastindexof
_export({ target: 'Array', proto: true, forced: arrayLastIndexOf !== [].lastIndexOf }, {
  lastIndexOf: arrayLastIndexOf
});

// `Array.prototype.{ reduce, reduceRight }` methods implementation
var createMethod$2 = function (IS_RIGHT) {
  return function (that, callbackfn, argumentsLength, memo) {
    aFunction$1(callbackfn);
    var O = toObject(that);
    var self = indexedObject(O);
    var length = toLength(O.length);
    var index = IS_RIGHT ? length - 1 : 0;
    var i = IS_RIGHT ? -1 : 1;
    if (argumentsLength < 2) while (true) {
      if (index in self) {
        memo = self[index];
        index += i;
        break;
      }
      index += i;
      if (IS_RIGHT ? index < 0 : length <= index) {
        throw TypeError('Reduce of empty array with no initial value');
      }
    }
    for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
      memo = callbackfn(memo, self[index], index, O);
    }
    return memo;
  };
};

var arrayReduce = {
  // `Array.prototype.reduce` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
  left: createMethod$2(false),
  // `Array.prototype.reduceRight` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduceright
  right: createMethod$2(true)
};

var $reduce = arrayReduce.left;



var STRICT_METHOD$3 = arrayMethodIsStrict('reduce');
var USES_TO_LENGTH$5 = arrayMethodUsesToLength('reduce', { 1: 0 });

// `Array.prototype.reduce` method
// https://tc39.github.io/ecma262/#sec-array.prototype.reduce
_export({ target: 'Array', proto: true, forced: !STRICT_METHOD$3 || !USES_TO_LENGTH$5 }, {
  reduce: function reduce(callbackfn /* , initialValue */) {
    return $reduce(this, callbackfn, arguments.length, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var $some = arrayIteration.some;



var STRICT_METHOD$4 = arrayMethodIsStrict('some');
var USES_TO_LENGTH$6 = arrayMethodUsesToLength('some');

// `Array.prototype.some` method
// https://tc39.github.io/ecma262/#sec-array.prototype.some
_export({ target: 'Array', proto: true, forced: !STRICT_METHOD$4 || !USES_TO_LENGTH$6 }, {
  some: function some(callbackfn /* , thisArg */) {
    return $some(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// `RegExp.prototype.flags` getter implementation
// https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
var regexpFlags = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.dotAll) result += 's';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};

// babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError,
// so we use an intermediate function.
function RE(s, f) {
  return RegExp(s, f);
}

var UNSUPPORTED_Y = fails(function () {
  // babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError
  var re = RE('a', 'y');
  re.lastIndex = 2;
  return re.exec('abcd') != null;
});

var BROKEN_CARET = fails(function () {
  // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
  var re = RE('^r', 'gy');
  re.lastIndex = 2;
  return re.exec('str') != null;
});

var regexpStickyHelpers = {
	UNSUPPORTED_Y: UNSUPPORTED_Y,
	BROKEN_CARET: BROKEN_CARET
};

var nativeExec = RegExp.prototype.exec;
// This always refers to the native implementation, because the
// String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
// which loads this file before patching the method.
var nativeReplace = String.prototype.replace;

var patchedExec = nativeExec;

var UPDATES_LAST_INDEX_WRONG = (function () {
  var re1 = /a/;
  var re2 = /b*/g;
  nativeExec.call(re1, 'a');
  nativeExec.call(re2, 'a');
  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
})();

var UNSUPPORTED_Y$1 = regexpStickyHelpers.UNSUPPORTED_Y || regexpStickyHelpers.BROKEN_CARET;

// nonparticipating capturing group, copied from es5-shim's String#split patch.
var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y$1;

if (PATCH) {
  patchedExec = function exec(str) {
    var re = this;
    var lastIndex, reCopy, match, i;
    var sticky = UNSUPPORTED_Y$1 && re.sticky;
    var flags = regexpFlags.call(re);
    var source = re.source;
    var charsAdded = 0;
    var strCopy = str;

    if (sticky) {
      flags = flags.replace('y', '');
      if (flags.indexOf('g') === -1) {
        flags += 'g';
      }

      strCopy = String(str).slice(re.lastIndex);
      // Support anchored sticky behavior.
      if (re.lastIndex > 0 && (!re.multiline || re.multiline && str[re.lastIndex - 1] !== '\n')) {
        source = '(?: ' + source + ')';
        strCopy = ' ' + strCopy;
        charsAdded++;
      }
      // ^(? + rx + ) is needed, in combination with some str slicing, to
      // simulate the 'y' flag.
      reCopy = new RegExp('^(?:' + source + ')', flags);
    }

    if (NPCG_INCLUDED) {
      reCopy = new RegExp('^' + source + '$(?!\\s)', flags);
    }
    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

    match = nativeExec.call(sticky ? reCopy : re, strCopy);

    if (sticky) {
      if (match) {
        match.input = match.input.slice(charsAdded);
        match[0] = match[0].slice(charsAdded);
        match.index = re.lastIndex;
        re.lastIndex += match[0].length;
      } else re.lastIndex = 0;
    } else if (UPDATES_LAST_INDEX_WRONG && match) {
      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
    }
    if (NPCG_INCLUDED && match && match.length > 1) {
      // Fix browsers whose `exec` methods don't consistently return `undefined`
      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
      nativeReplace.call(match[0], reCopy, function () {
        for (i = 1; i < arguments.length - 2; i++) {
          if (arguments[i] === undefined) match[i] = undefined;
        }
      });
    }

    return match;
  };
}

var regexpExec = patchedExec;

_export({ target: 'RegExp', proto: true, forced: /./.exec !== regexpExec }, {
  exec: regexpExec
});

// TODO: Remove from `core-js@4` since it's moved to entry points







var SPECIES$6 = wellKnownSymbol('species');

var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
  // #replace needs built-in support for named groups.
  // #match works fine because it just return the exec results, even if it has
  // a "grops" property.
  var re = /./;
  re.exec = function () {
    var result = [];
    result.groups = { a: '7' };
    return result;
  };
  return ''.replace(re, '$<a>') !== '7';
});

// IE <= 11 replaces $0 with the whole match, as if it was $&
// https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
var REPLACE_KEEPS_$0 = (function () {
  return 'a'.replace(/./, '$0') === '$0';
})();

var REPLACE = wellKnownSymbol('replace');
// Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function () {
  if (/./[REPLACE]) {
    return /./[REPLACE]('a', '$0') === '';
  }
  return false;
})();

// Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
// Weex JS has frozen built-in prototypes, so use try / catch wrapper
var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
  var re = /(?:)/;
  var originalExec = re.exec;
  re.exec = function () { return originalExec.apply(this, arguments); };
  var result = 'ab'.split(re);
  return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
});

var fixRegexpWellKnownSymbolLogic = function (KEY, length, exec, sham) {
  var SYMBOL = wellKnownSymbol(KEY);

  var DELEGATES_TO_SYMBOL = !fails(function () {
    // String methods call symbol-named RegEp methods
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  });

  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
    // Symbol-named RegExp methods call .exec
    var execCalled = false;
    var re = /a/;

    if (KEY === 'split') {
      // We can't use real regex here since it causes deoptimization
      // and serious performance degradation in V8
      // https://github.com/zloirock/core-js/issues/306
      re = {};
      // RegExp[@@split] doesn't call the regex's exec method, but first creates
      // a new one. We need to return the patched regex when creating the new one.
      re.constructor = {};
      re.constructor[SPECIES$6] = function () { return re; };
      re.flags = '';
      re[SYMBOL] = /./[SYMBOL];
    }

    re.exec = function () { execCalled = true; return null; };

    re[SYMBOL]('');
    return !execCalled;
  });

  if (
    !DELEGATES_TO_SYMBOL ||
    !DELEGATES_TO_EXEC ||
    (KEY === 'replace' && !(
      REPLACE_SUPPORTS_NAMED_GROUPS &&
      REPLACE_KEEPS_$0 &&
      !REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE
    )) ||
    (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
  ) {
    var nativeRegExpMethod = /./[SYMBOL];
    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
      if (regexp.exec === regexpExec) {
        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
          // The native String method already delegates to @@method (this
          // polyfilled function), leasing to infinite recursion.
          // We avoid it by directly calling the native @@method method.
          return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
        }
        return { done: true, value: nativeMethod.call(str, regexp, arg2) };
      }
      return { done: false };
    }, {
      REPLACE_KEEPS_$0: REPLACE_KEEPS_$0,
      REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE: REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE
    });
    var stringMethod = methods[0];
    var regexMethod = methods[1];

    redefine(String.prototype, KEY, stringMethod);
    redefine(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function (string, arg) { return regexMethod.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function (string) { return regexMethod.call(string, this); }
    );
  }

  if (sham) createNonEnumerableProperty(RegExp.prototype[SYMBOL], 'sham', true);
};

// `String.prototype.{ codePointAt, at }` methods implementation
var createMethod$3 = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = String(requireObjectCoercible($this));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

var stringMultibyte = {
  // `String.prototype.codePointAt` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod$3(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod$3(true)
};

var charAt = stringMultibyte.charAt;

// `AdvanceStringIndex` abstract operation
// https://tc39.github.io/ecma262/#sec-advancestringindex
var advanceStringIndex = function (S, index, unicode) {
  return index + (unicode ? charAt(S, index).length : 1);
};

// `RegExpExec` abstract operation
// https://tc39.github.io/ecma262/#sec-regexpexec
var regexpExecAbstract = function (R, S) {
  var exec = R.exec;
  if (typeof exec === 'function') {
    var result = exec.call(R, S);
    if (typeof result !== 'object') {
      throw TypeError('RegExp exec method returned something other than an Object or null');
    }
    return result;
  }

  if (classofRaw(R) !== 'RegExp') {
    throw TypeError('RegExp#exec called on incompatible receiver');
  }

  return regexpExec.call(R, S);
};

var max$2 = Math.max;
var min$3 = Math.min;
var floor$1 = Math.floor;
var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d\d?|<[^>]*>)/g;
var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d\d?)/g;

var maybeToString = function (it) {
  return it === undefined ? it : String(it);
};

// @@replace logic
fixRegexpWellKnownSymbolLogic('replace', 2, function (REPLACE, nativeReplace, maybeCallNative, reason) {
  var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = reason.REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE;
  var REPLACE_KEEPS_$0 = reason.REPLACE_KEEPS_$0;
  var UNSAFE_SUBSTITUTE = REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE ? '$' : '$0';

  return [
    // `String.prototype.replace` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.replace
    function replace(searchValue, replaceValue) {
      var O = requireObjectCoercible(this);
      var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
      return replacer !== undefined
        ? replacer.call(searchValue, O, replaceValue)
        : nativeReplace.call(String(O), searchValue, replaceValue);
    },
    // `RegExp.prototype[@@replace]` method
    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
    function (regexp, replaceValue) {
      if (
        (!REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE && REPLACE_KEEPS_$0) ||
        (typeof replaceValue === 'string' && replaceValue.indexOf(UNSAFE_SUBSTITUTE) === -1)
      ) {
        var res = maybeCallNative(nativeReplace, regexp, this, replaceValue);
        if (res.done) return res.value;
      }

      var rx = anObject(regexp);
      var S = String(this);

      var functionalReplace = typeof replaceValue === 'function';
      if (!functionalReplace) replaceValue = String(replaceValue);

      var global = rx.global;
      if (global) {
        var fullUnicode = rx.unicode;
        rx.lastIndex = 0;
      }
      var results = [];
      while (true) {
        var result = regexpExecAbstract(rx, S);
        if (result === null) break;

        results.push(result);
        if (!global) break;

        var matchStr = String(result[0]);
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
      }

      var accumulatedResult = '';
      var nextSourcePosition = 0;
      for (var i = 0; i < results.length; i++) {
        result = results[i];

        var matched = String(result[0]);
        var position = max$2(min$3(toInteger(result.index), S.length), 0);
        var captures = [];
        // NOTE: This is equivalent to
        //   captures = result.slice(1).map(maybeToString)
        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
        for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
        var namedCaptures = result.groups;
        if (functionalReplace) {
          var replacerArgs = [matched].concat(captures, position, S);
          if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
          var replacement = String(replaceValue.apply(undefined, replacerArgs));
        } else {
          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
        }
        if (position >= nextSourcePosition) {
          accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
          nextSourcePosition = position + matched.length;
        }
      }
      return accumulatedResult + S.slice(nextSourcePosition);
    }
  ];

  // https://tc39.github.io/ecma262/#sec-getsubstitution
  function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
    var tailPos = position + matched.length;
    var m = captures.length;
    var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
    if (namedCaptures !== undefined) {
      namedCaptures = toObject(namedCaptures);
      symbols = SUBSTITUTION_SYMBOLS;
    }
    return nativeReplace.call(replacement, symbols, function (match, ch) {
      var capture;
      switch (ch.charAt(0)) {
        case '$': return '$';
        case '&': return matched;
        case '`': return str.slice(0, position);
        case "'": return str.slice(tailPos);
        case '<':
          capture = namedCaptures[ch.slice(1, -1)];
          break;
        default: // \d\d?
          var n = +ch;
          if (n === 0) return match;
          if (n > m) {
            var f = floor$1(n / 10);
            if (f === 0) return match;
            if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
            return match;
          }
          capture = captures[n - 1];
      }
      return capture === undefined ? '' : capture;
    });
  }
});

// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
var domIterables = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};

for (var COLLECTION_NAME in domIterables) {
  var Collection = global_1[COLLECTION_NAME];
  var CollectionPrototype = Collection && Collection.prototype;
  // some Chrome versions have non-configurable methods on DOMTokenList
  if (CollectionPrototype && CollectionPrototype.forEach !== arrayForEach) try {
    createNonEnumerableProperty(CollectionPrototype, 'forEach', arrayForEach);
  } catch (error) {
    CollectionPrototype.forEach = arrayForEach;
  }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

var visibility = writable(false);

// `thisNumberValue` abstract operation
// https://tc39.github.io/ecma262/#sec-thisnumbervalue
var thisNumberValue = function (value) {
  if (typeof value != 'number' && classofRaw(value) != 'Number') {
    throw TypeError('Incorrect invocation');
  }
  return +value;
};

// `String.prototype.repeat` method implementation
// https://tc39.github.io/ecma262/#sec-string.prototype.repeat
var stringRepeat = ''.repeat || function repeat(count) {
  var str = String(requireObjectCoercible(this));
  var result = '';
  var n = toInteger(count);
  if (n < 0 || n == Infinity) throw RangeError('Wrong number of repetitions');
  for (;n > 0; (n >>>= 1) && (str += str)) if (n & 1) result += str;
  return result;
};

var nativeToFixed = 1.0.toFixed;
var floor$2 = Math.floor;

var pow = function (x, n, acc) {
  return n === 0 ? acc : n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc);
};

var log = function (x) {
  var n = 0;
  var x2 = x;
  while (x2 >= 4096) {
    n += 12;
    x2 /= 4096;
  }
  while (x2 >= 2) {
    n += 1;
    x2 /= 2;
  } return n;
};

var FORCED$3 = nativeToFixed && (
  0.00008.toFixed(3) !== '0.000' ||
  0.9.toFixed(0) !== '1' ||
  1.255.toFixed(2) !== '1.25' ||
  1000000000000000128.0.toFixed(0) !== '1000000000000000128'
) || !fails(function () {
  // V8 ~ Android 4.3-
  nativeToFixed.call({});
});

// `Number.prototype.toFixed` method
// https://tc39.github.io/ecma262/#sec-number.prototype.tofixed
_export({ target: 'Number', proto: true, forced: FORCED$3 }, {
  // eslint-disable-next-line max-statements
  toFixed: function toFixed(fractionDigits) {
    var number = thisNumberValue(this);
    var fractDigits = toInteger(fractionDigits);
    var data = [0, 0, 0, 0, 0, 0];
    var sign = '';
    var result = '0';
    var e, z, j, k;

    var multiply = function (n, c) {
      var index = -1;
      var c2 = c;
      while (++index < 6) {
        c2 += n * data[index];
        data[index] = c2 % 1e7;
        c2 = floor$2(c2 / 1e7);
      }
    };

    var divide = function (n) {
      var index = 6;
      var c = 0;
      while (--index >= 0) {
        c += data[index];
        data[index] = floor$2(c / n);
        c = (c % n) * 1e7;
      }
    };

    var dataToString = function () {
      var index = 6;
      var s = '';
      while (--index >= 0) {
        if (s !== '' || index === 0 || data[index] !== 0) {
          var t = String(data[index]);
          s = s === '' ? t : s + stringRepeat.call('0', 7 - t.length) + t;
        }
      } return s;
    };

    if (fractDigits < 0 || fractDigits > 20) throw RangeError('Incorrect fraction digits');
    // eslint-disable-next-line no-self-compare
    if (number != number) return 'NaN';
    if (number <= -1e21 || number >= 1e21) return String(number);
    if (number < 0) {
      sign = '-';
      number = -number;
    }
    if (number > 1e-21) {
      e = log(number * pow(2, 69, 1)) - 69;
      z = e < 0 ? number * pow(2, -e, 1) : number / pow(2, e, 1);
      z *= 0x10000000000000;
      e = 52 - e;
      if (e > 0) {
        multiply(0, z);
        j = fractDigits;
        while (j >= 7) {
          multiply(1e7, 0);
          j -= 7;
        }
        multiply(pow(10, j, 1), 0);
        j = e - 1;
        while (j >= 23) {
          divide(1 << 23);
          j -= 23;
        }
        divide(1 << j);
        multiply(1, 1);
        divide(2);
        result = dataToString();
      } else {
        multiply(0, z);
        multiply(1 << -e, 0);
        result = dataToString() + stringRepeat.call('0', fractDigits);
      }
    }
    if (fractDigits > 0) {
      k = result.length;
      result = sign + (k <= fractDigits
        ? '0.' + stringRepeat.call('0', fractDigits - k) + result
        : result.slice(0, k - fractDigits) + '.' + result.slice(k - fractDigits));
    } else {
      result = sign + result;
    } return result;
  }
});

var $map = arrayIteration.map;



var HAS_SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport('map');
// FF49- issue
var USES_TO_LENGTH$7 = arrayMethodUsesToLength('map');

// `Array.prototype.map` method
// https://tc39.github.io/ecma262/#sec-array.prototype.map
// with adding support of @@species
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$2 || !USES_TO_LENGTH$7 }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

function get_each_context(ctx, list, i) {
  var child_ctx = ctx.slice();
  child_ctx[18] = list[i];
  child_ctx[20] = i;
  return child_ctx;
} // (85:8) {:else}


function create_else_block(ctx) {
  var i0;
  var t;
  var i1;
  var dispose;
  return {
    c: function c() {
      i0 = element("i");
      t = space();
      i1 = element("i");
      attr(i0, "class", "icon");
      toggle_class(i0, "check-square",
      /*state*/
      ctx[1] === 1);
      toggle_class(i0, "square",
      /*state*/
      ctx[1] === 0);
      attr(i1, "class", "icon file");
    },
    m: function m(target, anchor, remount) {
      insert(target, i0, anchor);
      insert(target, t, anchor);
      insert(target, i1, anchor);
      if (remount) dispose();
      dispose = listen(i0, "click", stop_propagation(
      /*check*/
      ctx[8]));
    },
    p: function p(ctx, dirty) {
      if (dirty &
      /*state*/
      2) {
        toggle_class(i0, "check-square",
        /*state*/
        ctx[1] === 1);
      }

      if (dirty &
      /*state*/
      2) {
        toggle_class(i0, "square",
        /*state*/
        ctx[1] === 0);
      }
    },
    d: function d(detaching) {
      if (detaching) detach(i0);
      if (detaching) detach(t);
      if (detaching) detach(i1);
      dispose();
    }
  };
} // (75:8) {#if isDir}


function create_if_block(ctx) {
  var i0;
  var t;
  var i1;
  var dispose;
  return {
    c: function c() {
      i0 = element("i");
      t = space();
      i1 = element("i");
      attr(i0, "class", "icon");
      toggle_class(i0, "check-square",
      /*state*/
      ctx[1] === 1);
      toggle_class(i0, "square",
      /*state*/
      ctx[1] === 0);
      toggle_class(i0, "minus-square",
      /*state*/
      ctx[1] === -1);
      attr(i1, "class", "icon");
      toggle_class(i1, "folder", !
      /*expanded*/
      ctx[0]);
      toggle_class(i1, "folder-open",
      /*expanded*/
      ctx[0]);
    },
    m: function m(target, anchor, remount) {
      insert(target, i0, anchor);
      insert(target, t, anchor);
      insert(target, i1, anchor);
      if (remount) run_all(dispose);
      dispose = [listen(i0, "click", stop_propagation(
      /*check*/
      ctx[8])), listen(i1, "click", stop_propagation(
      /*toggle*/
      ctx[7]))];
    },
    p: function p(ctx, dirty) {
      if (dirty &
      /*state*/
      2) {
        toggle_class(i0, "check-square",
        /*state*/
        ctx[1] === 1);
      }

      if (dirty &
      /*state*/
      2) {
        toggle_class(i0, "square",
        /*state*/
        ctx[1] === 0);
      }

      if (dirty &
      /*state*/
      2) {
        toggle_class(i0, "minus-square",
        /*state*/
        ctx[1] === -1);
      }

      if (dirty &
      /*expanded*/
      1) {
        toggle_class(i1, "folder", !
        /*expanded*/
        ctx[0]);
      }

      if (dirty &
      /*expanded*/
      1) {
        toggle_class(i1, "folder-open",
        /*expanded*/
        ctx[0]);
      }
    },
    d: function d(detaching) {
      if (detaching) detach(i0);
      if (detaching) detach(t);
      if (detaching) detach(i1);
      run_all(dispose);
    }
  };
} // (95:8) {#each children as child, i}


function create_each_block(ctx) {
  var current;
  var file_spread_levels = [
  /*child*/
  ctx[18], {
    state:
    /*checked*/
    ctx[3]
  }];

  function check_handler() {
    var _ctx;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return (
      /*check_handler*/
      (_ctx = ctx)[15].apply(_ctx, [
      /*i*/
      ctx[20]].concat(args))
    );
  }

  var file_props = {};

  for (var i = 0; i < file_spread_levels.length; i += 1) {
    file_props = assign(file_props, file_spread_levels[i]);
  }

  var file = new File({
    props: file_props
  });
  file.$on("check", check_handler);
  file.$on("expand",
  /*expand_handler*/
  ctx[16]);
  file.$on("selection",
  /*selection_handler*/
  ctx[17]);
  return {
    c: function c() {
      create_component(file.$$.fragment);
    },
    m: function m(target, anchor) {
      mount_component(file, target, anchor);
      current = true;
    },
    p: function p(new_ctx, dirty) {
      ctx = new_ctx;
      var file_changes = dirty &
      /*children, checked*/
      40 ? get_spread_update(file_spread_levels, [dirty &
      /*children*/
      32 && get_spread_object(
      /*child*/
      ctx[18]), dirty &
      /*checked*/
      8 && {
        state:
        /*checked*/
        ctx[3]
      }]) : {};
      file.$set(file_changes);
    },
    i: function i(local) {
      if (current) return;
      transition_in(file.$$.fragment, local);
      current = true;
    },
    o: function o(local) {
      transition_out(file.$$.fragment, local);
      current = false;
    },
    d: function d(detaching) {
      destroy_component(file, detaching);
    }
  };
}

function create_fragment(ctx) {
  var div3;
  var div1;
  var t0;
  var div0;
  var t1;
  var t2;
  var div2;
  var current;

  function select_block_type(ctx, dirty) {
    if (
    /*isDir*/
    ctx[2]) return create_if_block;
    return create_else_block;
  }

  var current_block_type = select_block_type(ctx);
  var if_block = current_block_type(ctx);
  var each_value =
  /*children*/
  ctx[5];
  var each_blocks = [];

  for (var i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }

  var out = function out(i) {
    return transition_out(each_blocks[i], 1, 1, function () {
      each_blocks[i] = null;
    });
  };

  return {
    c: function c() {
      div3 = element("div");
      div1 = element("div");
      if_block.c();
      t0 = space();
      div0 = element("div");
      t1 = text(
      /*name*/
      ctx[4]);
      t2 = space();
      div2 = element("div");

      for (var _i = 0; _i < each_blocks.length; _i += 1) {
        each_blocks[_i].c();
      }

      attr(div1, "class", "header");
      attr(div2, "class", "children");
      toggle_class(div2, "hidden", !
      /*expanded*/
      ctx[0]);
      attr(div3, "class", "entry");
    },
    m: function m(target, anchor) {
      insert(target, div3, anchor);
      append(div3, div1);
      if_block.m(div1, null);
      append(div1, t0);
      append(div1, div0);
      append(div0, t1);
      append(div3, t2);
      append(div3, div2);

      for (var _i2 = 0; _i2 < each_blocks.length; _i2 += 1) {
        each_blocks[_i2].m(div2, null);
      }

      current = true;
    },
    p: function p(ctx, _ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          dirty = _ref2[0];

      if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
        if_block.p(ctx, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx);

        if (if_block) {
          if_block.c();
          if_block.m(div1, t0);
        }
      }

      if (!current || dirty &
      /*name*/
      16) set_data(t1,
      /*name*/
      ctx[4]);

      if (dirty &
      /*children, checked, select, dispatch*/
      616) {
        each_value =
        /*children*/
        ctx[5];

        var _i3;

        for (_i3 = 0; _i3 < each_value.length; _i3 += 1) {
          var child_ctx = get_each_context(ctx, each_value, _i3);

          if (each_blocks[_i3]) {
            each_blocks[_i3].p(child_ctx, dirty);

            transition_in(each_blocks[_i3], 1);
          } else {
            each_blocks[_i3] = create_each_block(child_ctx);

            each_blocks[_i3].c();

            transition_in(each_blocks[_i3], 1);

            each_blocks[_i3].m(div2, null);
          }
        }

        group_outros();

        for (_i3 = each_value.length; _i3 < each_blocks.length; _i3 += 1) {
          out(_i3);
        }

        check_outros();
      }

      if (dirty &
      /*expanded*/
      1) {
        toggle_class(div2, "hidden", !
        /*expanded*/
        ctx[0]);
      }
    },
    i: function i(local) {
      if (current) return;

      for (var _i4 = 0; _i4 < each_value.length; _i4 += 1) {
        transition_in(each_blocks[_i4]);
      }

      current = true;
    },
    o: function o(local) {
      each_blocks = each_blocks.filter(Boolean);

      for (var _i5 = 0; _i5 < each_blocks.length; _i5 += 1) {
        transition_out(each_blocks[_i5]);
      }

      current = false;
    },
    d: function d(detaching) {
      if (detaching) detach(div3);
      if_block.d();
      destroy_each(each_blocks, detaching);
    }
  };
}

function instance($$self, $$props, $$invalidate) {
  var _$$props$isDir = $$props.isDir,
      isDir = _$$props$isDir === void 0 ? false : _$$props$isDir;
  var _$$props$path = $$props.path,
      path = _$$props$path === void 0 ? "" : _$$props$path;
  var _$$props$expanded = $$props.expanded,
      expanded = _$$props$expanded === void 0 ? false : _$$props$expanded;
  var _$$props$state = $$props.state,
      state = _$$props$state === void 0 ? 0 : _$$props$state;
  var _$$props$size = $$props.size,
      size = _$$props$size === void 0 ? 0 : _$$props$size;
  var initialized = false;
  var selected = [];
  var checked = 0;
  var dispatch = createEventDispatcher();

  function expand(items) {
    if (children.length === 0) {
      $$invalidate(5, children = items);
      selected = children.map(function () {
        return 0;
      });
      $$invalidate(0, expanded = true);
    }
  }

  function toggle() {
    if (!initialized) {
      dispatch("expand", {
        expand: expand,
        filePath: path
      });
      initialized = true;
    }

    $$invalidate(0, expanded = !expanded);
  }

  function check() {
    switch (state) {
      case -1:
      case 0:
        $$invalidate(1, state = 1);
        break;

      case 1:
        $$invalidate(1, state = 0);
        break;
    }
  }

  function select(i, s) {
    selected[i] = s;

    if (selected.every(function (k) {
      return k === 1;
    })) {
      $$invalidate(1, state = 1);
    } else if (selected.every(function (k) {
      return k === 0;
    })) {
      $$invalidate(1, state = 0);
    } else {
      $$invalidate(1, state = -1);
    }
  }

  afterUpdate(function () {
    dispatch("check", state);
    dispatch("selection", {
      path: path,
      state: state,
      size: size
    });
  });

  var check_handler = function check_handler(i, _ref3) {
    var detail = _ref3.detail;
    return select(i, detail);
  };

  var expand_handler = function expand_handler(_ref4) {
    var detail = _ref4.detail;
    return dispatch("expand", detail);
  };

  var selection_handler = function selection_handler(_ref5) {
    var detail = _ref5.detail;
    return dispatch("selection", detail);
  };

  $$self.$set = function ($$props) {
    if ("isDir" in $$props) $$invalidate(2, isDir = $$props.isDir);
    if ("path" in $$props) $$invalidate(10, path = $$props.path);
    if ("expanded" in $$props) $$invalidate(0, expanded = $$props.expanded);
    if ("state" in $$props) $$invalidate(1, state = $$props.state);
    if ("size" in $$props) $$invalidate(11, size = $$props.size);
  };

  var name;
  var children;

  $$self.$$.update = function () {
    if ($$self.$$.dirty &
    /*path*/
    1024) {
       $$invalidate(4, name = path.substr(path.lastIndexOf("\\") + 1));
    }

    if ($$self.$$.dirty &
    /*state*/
    2) {
       if (state != -1) {
        $$invalidate(3, checked = state);
      }
    }
  };

   $$invalidate(5, children = []);

  return [expanded, state, isDir, checked, name, children, dispatch, toggle, check, select, path, size, initialized, selected, expand, check_handler, expand_handler, selection_handler];
}

var File = /*#__PURE__*/function (_SvelteComponent) {
  _inherits(File, _SvelteComponent);

  var _super = _createSuper(File);

  function File(options) {
    var _this;

    _classCallCheck(this, File);

    _this = _super.call(this);
    init(_assertThisInitialized(_this), options, instance, create_fragment, safe_not_equal, {
      isDir: 2,
      path: 10,
      expanded: 0,
      state: 1,
      size: 11
    });
    return _this;
  }

  return File;
}(SvelteComponent);

function get_each_context$1(ctx, list, i) {
  var child_ctx = ctx.slice();
  child_ctx[16] = list[i];
  return child_ctx;
} // (77:8) {:else}


function create_else_block$1(ctx) {
  var div;
  var t0_value =
  /*size*/
  ctx[4].toFixed(1) + "";
  var t0;
  var t1;
  var t2_value = T.getText("b") + "";
  var t2;
  return {
    c: function c() {
      div = element("div");
      t0 = text(t0_value);
      t1 = space();
      t2 = text(t2_value);
      attr(div, "class", "size");
    },
    m: function m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      append(div, t2);
    },
    p: function p(ctx, dirty) {
      if (dirty &
      /*size*/
      16 && t0_value !== (t0_value =
      /*size*/
      ctx[4].toFixed(1) + "")) set_data(t0, t0_value);
    },
    d: function d(detaching) {
      if (detaching) detach(div);
    }
  };
} // (75:32) 


function create_if_block_1(ctx) {
  var div;
  var t0_value =
  /*kBytes*/
  ctx[5].toFixed(1) + "";
  var t0;
  var t1;
  var t2_value = T.getText("kb") + "";
  var t2;
  return {
    c: function c() {
      div = element("div");
      t0 = text(t0_value);
      t1 = space();
      t2 = text(t2_value);
      attr(div, "class", "size");
    },
    m: function m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      append(div, t2);
    },
    p: function p(ctx, dirty) {
      if (dirty &
      /*kBytes*/
      32 && t0_value !== (t0_value =
      /*kBytes*/
      ctx[5].toFixed(1) + "")) set_data(t0, t0_value);
    },
    d: function d(detaching) {
      if (detaching) detach(div);
    }
  };
} // (73:8) {#if mBytes >= 1.0}


function create_if_block$1(ctx) {
  var div;
  var t0_value =
  /*mBytes*/
  ctx[6].toFixed(1) + "";
  var t0;
  var t1;
  var t2_value = T.getText("mb") + "";
  var t2;
  return {
    c: function c() {
      div = element("div");
      t0 = text(t0_value);
      t1 = space();
      t2 = text(t2_value);
      attr(div, "class", "size");
    },
    m: function m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      append(div, t2);
    },
    p: function p(ctx, dirty) {
      if (dirty &
      /*mBytes*/
      64 && t0_value !== (t0_value =
      /*mBytes*/
      ctx[6].toFixed(1) + "")) set_data(t0, t0_value);
    },
    d: function d(detaching) {
      if (detaching) detach(div);
    }
  };
} // (83:8) {#each files as file}


function create_each_block$1(ctx) {
  var current;
  var file_spread_levels = [
  /*file*/
  ctx[16]];
  var file_props = {};

  for (var i = 0; i < file_spread_levels.length; i += 1) {
    file_props = assign(file_props, file_spread_levels[i]);
  }

  var file = new File({
    props: file_props
  });
  file.$on("expand",
  /*expand_handler*/
  ctx[14]);
  file.$on("selection",
  /*selection*/
  ctx[8]);
  return {
    c: function c() {
      create_component(file.$$.fragment);
    },
    m: function m(target, anchor) {
      mount_component(file, target, anchor);
      current = true;
    },
    p: function p(ctx, dirty) {
      var file_changes = dirty &
      /*files*/
      1 ? get_spread_update(file_spread_levels, [get_spread_object(
      /*file*/
      ctx[16])]) : {};
      file.$set(file_changes);
    },
    i: function i(local) {
      if (current) return;
      transition_in(file.$$.fragment, local);
      current = true;
    },
    o: function o(local) {
      transition_out(file.$$.fragment, local);
      current = false;
    },
    d: function d(detaching) {
      destroy_component(file, detaching);
    }
  };
}

function create_fragment$1(ctx) {
  var div4;
  var div1;
  var div0;
  var t1;
  var t2;
  var i;
  var t3;
  var div2;
  var t4;
  var div3;
  var button;
  var current;
  var dispose;
  add_render_callback(
  /*onwindowresize*/
  ctx[12]);

  function select_block_type(ctx, dirty) {
    if (
    /*mBytes*/
    ctx[6] >= 1) return create_if_block$1;
    if (
    /*kBytes*/
    ctx[5] >= 1) return create_if_block_1;
    return create_else_block$1;
  }

  var current_block_type = select_block_type(ctx);
  var if_block = current_block_type(ctx);
  var each_value =
  /*files*/
  ctx[0];
  var each_blocks = [];

  for (var _i = 0; _i < each_value.length; _i += 1) {
    each_blocks[_i] = create_each_block$1(get_each_context$1(ctx, each_value, _i));
  }

  var out = function out(i) {
    return transition_out(each_blocks[i], 1, 1, function () {
      each_blocks[i] = null;
    });
  };

  return {
    c: function c() {
      div4 = element("div");
      div1 = element("div");
      div0 = element("div");
      div0.textContent = "".concat(T.getText("filebrowser.title"));
      t1 = space();
      if_block.c();
      t2 = space();
      i = element("i");
      t3 = space();
      div2 = element("div");

      for (var _i2 = 0; _i2 < each_blocks.length; _i2 += 1) {
        each_blocks[_i2].c();
      }

      t4 = space();
      div3 = element("div");
      button = element("button");
      button.textContent = "".concat(T.getText("filebrowser.download"));
      attr(i, "class", "icon close");
      attr(div1, "class", "header");
      attr(div2, "class", "content");
      attr(div3, "class", "footer");
      attr(div4, "class", "files");
    },
    m: function m(target, anchor, remount) {
      insert(target, div4, anchor);
      append(div4, div1);
      append(div1, div0);
      append(div1, t1);
      if_block.m(div1, null);
      append(div1, t2);
      append(div1, i);
      append(div4, t3);
      append(div4, div2);

      for (var _i3 = 0; _i3 < each_blocks.length; _i3 += 1) {
        each_blocks[_i3].m(div2, null);
      }

      append(div4, t4);
      append(div4, div3);
      append(div3, button);
      /*div4_binding*/

      ctx[15](div4);
      current = true;
      if (remount) run_all(dispose);
      dispose = [listen(window, "resize",
      /*onwindowresize*/
      ctx[12]), listen(i, "click",
      /*click_handler*/
      ctx[13]), listen(button, "click",
      /*download*/
      ctx[9])];
    },
    p: function p(ctx, _ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          dirty = _ref2[0];

      if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
        if_block.p(ctx, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx);

        if (if_block) {
          if_block.c();
          if_block.m(div1, t2);
        }
      }

      if (dirty &
      /*files, dispatch, selection*/
      385) {
        each_value =
        /*files*/
        ctx[0];

        var _i4;

        for (_i4 = 0; _i4 < each_value.length; _i4 += 1) {
          var child_ctx = get_each_context$1(ctx, each_value, _i4);

          if (each_blocks[_i4]) {
            each_blocks[_i4].p(child_ctx, dirty);

            transition_in(each_blocks[_i4], 1);
          } else {
            each_blocks[_i4] = create_each_block$1(child_ctx);

            each_blocks[_i4].c();

            transition_in(each_blocks[_i4], 1);

            each_blocks[_i4].m(div2, null);
          }
        }

        group_outros();

        for (_i4 = each_value.length; _i4 < each_blocks.length; _i4 += 1) {
          out(_i4);
        }

        check_outros();
      }
    },
    i: function i(local) {
      if (current) return;

      for (var _i5 = 0; _i5 < each_value.length; _i5 += 1) {
        transition_in(each_blocks[_i5]);
      }

      current = true;
    },
    o: function o(local) {
      each_blocks = each_blocks.filter(Boolean);

      for (var _i6 = 0; _i6 < each_blocks.length; _i6 += 1) {
        transition_out(each_blocks[_i6]);
      }

      current = false;
    },
    d: function d(detaching) {
      if (detaching) detach(div4);
      if_block.d();
      destroy_each(each_blocks, detaching);
      /*div4_binding*/

      ctx[15](null);
      run_all(dispose);
    }
  };
}

function instance$1($$self, $$props, $$invalidate) {
  var _$$props$files = $$props.files,
      files = _$$props$files === void 0 ? [] : _$$props$files;
  var container;
  var outerHeight;
  var outerWidth;
  var size = 0;
  T.addText("rus", {
    filebrowser: {
      title: "Выбранные файлы",
      download: "Скачать"
    },
    size: "Размер",
    b: "б",
    kb: "Кб",
    mb: "Мб"
  });
  T.addText("eng", {
    filebrowser: {
      title: "Selected files",
      download: "Download"
    },
    size: "Size",
    b: "b",
    kb: "Kb",
    mb: "Mb"
  });

  var adjustPosition = function adjustPosition(_ref3) {
    var top = _ref3.top,
        left = _ref3.left;
    $$invalidate(1, container.style.top = "".concat(top, "px"), container);
    $$invalidate(1, container.style.left = "".concat(left, "px"), container);
  };

  var dispatch = createEventDispatcher();
  onMount(function () {
    return adjustPosition({
      top: 100,
      left: 300
    });
  });
  var selected = {};

  function selection(_ref4) {
    var detail = _ref4.detail;
    var path = detail.path,
        state = detail.state;

    if (state === 1) {
      selected[path] = detail.size;
    } else {
      delete selected[path];
    }

    $$invalidate(4, size = Object.keys(selected).reduce(function (a, s) {
      return a + selected[s];
    }, 0));
    dispatch("selection", detail);
  }

  function download() {
    if (Object.keys(selected).length > 0) {
      dispatch("download");
    }
  }

  function onwindowresize() {
    $$invalidate(2, outerHeight = window.outerHeight);
    $$invalidate(3, outerWidth = window.outerWidth);
  }

  var click_handler = function click_handler() {
    return dispatch("close");
  };

  var expand_handler = function expand_handler(_ref5) {
    var detail = _ref5.detail;
    return dispatch("expand", detail);
  };

  function div4_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](function () {
      $$invalidate(1, container = $$value);
    });
  }

  $$self.$set = function ($$props) {
    if ("files" in $$props) $$invalidate(0, files = $$props.files);
  };

  var kBytes;
  var mBytes;

  $$self.$$.update = function () {
    if ($$self.$$.dirty &
    /*size*/
    16) {
       $$invalidate(5, kBytes = size / 1024);
    }

    if ($$self.$$.dirty &
    /*kBytes*/
    32) {
       $$invalidate(6, mBytes = kBytes / 1024);
    }
  };

  return [files, container, outerHeight, outerWidth, size, kBytes, mBytes, dispatch, selection, download, adjustPosition, selected, onwindowresize, click_handler, expand_handler, div4_binding];
}

var FileBrowser = /*#__PURE__*/function (_SvelteComponent) {
  _inherits(FileBrowser, _SvelteComponent);

  var _super = _createSuper(FileBrowser);

  function FileBrowser(options) {
    var _this;

    _classCallCheck(this, FileBrowser);

    _this = _super.call(this);
    init(_assertThisInitialized(_this), options, instance$1, create_fragment$1, safe_not_equal, {
      files: 0,
      adjustPosition: 10
    });
    return _this;
  }

  _createClass(FileBrowser, [{
    key: "adjustPosition",
    get: function get() {
      return this.$$.ctx[10];
    }
  }]);

  return FileBrowser;
}(SvelteComponent);

function get_each_context$2(ctx, list, i) {
  var child_ctx = ctx.slice();
  child_ctx[22] = list[i];
  child_ctx[24] = i;
  return child_ctx;
} // (126:8) {#each granules.filter(({granule: {productType}}) => productType !== 100000) as g, i}


function create_each_block$2(ctx) {
  var tr;
  var td0;
  var t0_value =
  /*g*/
  ctx[22].granule.sceneId + "";
  var t0;
  var t1;
  var td1;
  var t2;
  var dispose;

  function click_handler_2() {
    var _ctx;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return (
      /*click_handler_2*/
      (_ctx = ctx)[21].apply(_ctx, [
      /*i*/
      ctx[24]].concat(args))
    );
  }

  return {
    c: function c() {
      tr = element("tr");
      td0 = element("td");
      t0 = text(t0_value);
      t1 = space();
      td1 = element("td");
      td1.innerHTML = "<i class=\"icon info-circle\"></i>";
      t2 = space();
      toggle_class(tr, "selected",
      /*i*/
      ctx[24] ===
      /*selected*/
      ctx[4]);
    },
    m: function m(target, anchor, remount) {
      insert(target, tr, anchor);
      append(tr, td0);
      append(td0, t0);
      append(tr, t1);
      append(tr, td1);
      append(tr, t2);
      if (remount) dispose();
      dispose = listen(tr, "click", click_handler_2);
    },
    p: function p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty &
      /*granules*/
      1 && t0_value !== (t0_value =
      /*g*/
      ctx[22].granule.sceneId + "")) set_data(t0, t0_value);

      if (dirty &
      /*selected*/
      16) {
        toggle_class(tr, "selected",
        /*i*/
        ctx[24] ===
        /*selected*/
        ctx[4]);
      }
    },
    d: function d(detaching) {
      if (detaching) detach(tr);
      dispose();
    }
  };
}

function create_fragment$2(ctx) {
  var div;
  var table0;
  var tr0;
  var td0;
  var i0;
  var t0;
  var td1;
  var i1;
  var t1;
  var td2;
  var t2;
  var t3;
  var td3;
  var i2;
  var t4;
  var table1;
  var tr1;
  var th0;
  var t6;
  var th1;
  var t7;
  var dispose;
  var each_value =
  /*granules*/
  ctx[0].filter(func);
  var each_blocks = [];

  for (var i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
  }

  return {
    c: function c() {
      div = element("div");
      table0 = element("table");
      tr0 = element("tr");
      td0 = element("td");
      i0 = element("i");
      t0 = space();
      td1 = element("td");
      i1 = element("i");
      t1 = space();
      td2 = element("td");
      t2 = text(
      /*name*/
      ctx[2]);
      t3 = space();
      td3 = element("td");
      i2 = element("i");
      t4 = space();
      table1 = element("table");
      tr1 = element("tr");
      th0 = element("th");
      th0.textContent = "".concat(
      /*translate*/
      ctx[6]("product"));
      t6 = space();
      th1 = element("th");
      t7 = space();

      for (var _i = 0; _i < each_blocks.length; _i += 1) {
        each_blocks[_i].c();
      }

      attr(i0, "class", "toggle icon");
      toggle_class(i0, "caret-right", !
      /*expanded*/
      ctx[3]);
      toggle_class(i0, "caret-down",
      /*expanded*/
      ctx[3]);
      attr(i1, "class", "preview icon");
      toggle_class(i1, "eye",
      /*visible*/
      ctx[1]);
      toggle_class(i1, "eye-invisible", !
      /*visible*/
      ctx[1]);
      attr(td2, "class", "name");
      attr(i2, "class", "icon download");
      toggle_class(i2, "caret-down",
      /*expanded*/
      ctx[3]);
      toggle_class(i2, "caret-right", !
      /*expanded*/
      ctx[3]);
      attr(table0, "class", "header");
      toggle_class(table0, "collapsed", !
      /*expanded*/
      ctx[3]);
      attr(table1, "class", "content");
      attr(table1, "cellpadding", "0");
      attr(table1, "cellspacing", "0");
      toggle_class(table1, "hidden", !
      /*expanded*/
      ctx[3]);
      attr(div, "class", "roi");
    },
    m: function m(target, anchor, remount) {
      insert(target, div, anchor);
      append(div, table0);
      append(table0, tr0);
      append(tr0, td0);
      append(td0, i0);
      append(tr0, t0);
      append(tr0, td1);
      append(td1, i1);
      append(tr0, t1);
      append(tr0, td2);
      append(td2, t2);
      append(tr0, t3);
      append(tr0, td3);
      append(td3, i2);
      append(div, t4);
      append(div, table1);
      append(table1, tr1);
      append(tr1, th0);
      append(tr1, t6);
      append(tr1, th1);
      append(table1, t7);

      for (var _i2 = 0; _i2 < each_blocks.length; _i2 += 1) {
        each_blocks[_i2].m(table1, null);
      }

      if (remount) run_all(dispose);
      dispose = [listen(td0, "click", stop_propagation(
      /*click_handler*/
      ctx[19])), listen(td1, "click", stop_propagation(
      /*preview*/
      ctx[8])), listen(td2, "click", stop_propagation(
      /*click_handler_1*/
      ctx[20])), listen(td3, "click", stop_propagation(
      /*download*/
      ctx[7]))];
    },
    p: function p(ctx, _ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          dirty = _ref2[0];

      if (dirty &
      /*expanded*/
      8) {
        toggle_class(i0, "caret-right", !
        /*expanded*/
        ctx[3]);
      }

      if (dirty &
      /*expanded*/
      8) {
        toggle_class(i0, "caret-down",
        /*expanded*/
        ctx[3]);
      }

      if (dirty &
      /*visible*/
      2) {
        toggle_class(i1, "eye",
        /*visible*/
        ctx[1]);
      }

      if (dirty &
      /*visible*/
      2) {
        toggle_class(i1, "eye-invisible", !
        /*visible*/
        ctx[1]);
      }

      if (dirty &
      /*name*/
      4) set_data(t2,
      /*name*/
      ctx[2]);

      if (dirty &
      /*expanded*/
      8) {
        toggle_class(i2, "caret-down",
        /*expanded*/
        ctx[3]);
      }

      if (dirty &
      /*expanded*/
      8) {
        toggle_class(i2, "caret-right", !
        /*expanded*/
        ctx[3]);
      }

      if (dirty &
      /*expanded*/
      8) {
        toggle_class(table0, "collapsed", !
        /*expanded*/
        ctx[3]);
      }

      if (dirty &
      /*selected, select, granules*/
      49) {
        each_value =
        /*granules*/
        ctx[0].filter(func);

        var _i3;

        for (_i3 = 0; _i3 < each_value.length; _i3 += 1) {
          var child_ctx = get_each_context$2(ctx, each_value, _i3);

          if (each_blocks[_i3]) {
            each_blocks[_i3].p(child_ctx, dirty);
          } else {
            each_blocks[_i3] = create_each_block$2(child_ctx);

            each_blocks[_i3].c();

            each_blocks[_i3].m(table1, null);
          }
        }

        for (; _i3 < each_blocks.length; _i3 += 1) {
          each_blocks[_i3].d(1);
        }

        each_blocks.length = each_value.length;
      }

      if (dirty &
      /*expanded*/
      8) {
        toggle_class(table1, "hidden", !
        /*expanded*/
        ctx[3]);
      }
    },
    i: noop,
    o: noop,
    d: function d(detaching) {
      if (detaching) detach(div);
      destroy_each(each_blocks, detaching);
      run_all(dispose);
    }
  };
}

var func = function func(_ref3) {
  var productType = _ref3.granule.productType;
  return productType !== 100000;
};

function instance$2($$self, $$props, $$invalidate) {
  var _$$props$id = $$props.id,
      id = _$$props$id === void 0 ? "" : _$$props$id;
  var _$$props$geoJSON = $$props.geoJSON,
      geoJSON = _$$props$geoJSON === void 0 ? null : _$$props$geoJSON;
  var _$$props$name = $$props.name,
      name = _$$props$name === void 0 ? "" : _$$props$name;
  var _$$props$granules = $$props.granules,
      granules = _$$props$granules === void 0 ? [] : _$$props$granules;
  var _$$props$visible = $$props.visible,
      visible = _$$props$visible === void 0 ? false : _$$props$visible;
  var _$$props$filePath = $$props.filePath,
      filePath = _$$props$filePath === void 0 ? "" : _$$props$filePath;
  var expanded = false;
  var selected = -1;
  T.addText("eng", {
    product: "Product"
  });
  T.addText("rus", {
    product: "Продукт"
  });
  var checked = false;
  var unchecked = true;
  var undetermined = false;

  var toggle = function toggle() {
    var items = granules.slice();
    items.forEach(function (_ref4) {
      var product = _ref4.granule.product;
      product.checked = unchecked;
    });
    $$invalidate(0, granules = items);
  };

  var dispatch = createEventDispatcher();

  var reset = function reset() {
    $$invalidate(4, selected = -1);
  };

  var select = function select(i) {
    $$invalidate(4, selected = i);
    var granule = granules[i].granule;
    dispatch("select", _objectSpread2(_objectSpread2({}, granule), {}, {
      reset: reset
    }));
  };

  var translate = T.getText.bind(T);

  var download = function download() {
    var fileBrowser = new FileBrowser({
      target: document.body
    });
    var p = filePath.replace("\\", "/");
    var i = p.lastIndexOf("/");
    var path = i < 0 ? p : p.substr(0, i);
    dispatch("expand", {
      expand: function expand(files) {
        return fileBrowser.$set({
          files: files
        });
      },
      filePath: path
    });
    fileBrowser.$on("expand", function (_ref5) {
      var detail = _ref5.detail;
      return dispatch("expand", detail);
    });
    fileBrowser.$on("close", function () {
      fileBrowser.$destroy();
    });
    fileBrowser.$on("download", function () {
      fileBrowser.$destroy();
      dispatch("download");
    });
    fileBrowser.$on("selection", function (_ref6) {
      var detail = _ref6.detail;
      dispatch("selection", detail);
    });
  };

  var preview = function preview() {
    $$invalidate(1, visible = !visible);

    if (visible) {
      visibility.set(true);
    }

    var gs = granules.reduce(function (a, _ref7) {
      var granuleId = _ref7.granuleId;
      a[granuleId] = true;
      return a;
    }, {});
    dispatch("preview", {
      id: id,
      visible: visible,
      granules: gs,
      geoJSON: geoJSON
    });
  };

  var unsubscribe = visibility.subscribe(function (value) {
    if (!value) {
      $$invalidate(1, visible = false);
    }
  });
  onDestroy(function () {
    unsubscribe();
  });

  var click_handler = function click_handler() {
    return $$invalidate(3, expanded = !expanded);
  };

  var click_handler_1 = function click_handler_1() {
    return $$invalidate(3, expanded = !expanded);
  };

  var click_handler_2 = function click_handler_2(i) {
    return select(i);
  };

  $$self.$set = function ($$props) {
    if ("id" in $$props) $$invalidate(9, id = $$props.id);
    if ("geoJSON" in $$props) $$invalidate(10, geoJSON = $$props.geoJSON);
    if ("name" in $$props) $$invalidate(2, name = $$props.name);
    if ("granules" in $$props) $$invalidate(0, granules = $$props.granules);
    if ("visible" in $$props) $$invalidate(1, visible = $$props.visible);
    if ("filePath" in $$props) $$invalidate(11, filePath = $$props.filePath);
  };

  $$self.$$.update = function () {
    if ($$self.$$.dirty &
    /*granules, checked, undetermined*/
    20481) {
       {
        $$invalidate(12, checked = granules.every(function (_ref8) {
          var product = _ref8.granule.product;
          return product.checked;
        }));
        $$invalidate(14, undetermined = !checked && granules.some(function (_ref9) {
          var product = _ref9.granule.product;
          return product.checked;
        }));
        unchecked = !checked && !undetermined;
      }
    }
  };

  return [granules, visible, name, expanded, selected, select, translate, download, preview, id, geoJSON, filePath, checked, unchecked, undetermined, toggle, dispatch, reset, unsubscribe, click_handler, click_handler_1, click_handler_2];
}

var Region = /*#__PURE__*/function (_SvelteComponent) {
  _inherits(Region, _SvelteComponent);

  var _super = _createSuper(Region);

  function Region(options) {
    var _this;

    _classCallCheck(this, Region);

    _this = _super.call(this);
    init(_assertThisInitialized(_this), options, instance$2, create_fragment$2, safe_not_equal, {
      id: 9,
      geoJSON: 10,
      name: 2,
      granules: 0,
      visible: 1,
      filePath: 11
    });
    return _this;
  }

  return Region;
}(SvelteComponent);

function create_fragment$3(ctx) {
  var div;
  var table0;
  var tr0;
  var td0;
  var t0;
  var t1;
  var td1;
  var t2;
  var t3;
  var td2;
  var t4;
  var table1;
  var tr1;
  var th0;
  var t6;
  var th1;
  var t8;
  var tr2;
  var td3;
  var t10;
  var td4;
  var t11;
  var t12;
  var tr3;
  var td5;
  var t14;
  var td6;
  var t15;
  var t16;
  var tr4;
  var td7;
  var t18;
  var td8;
  var t19;
  var t20;
  var tr5;
  var td9;
  var t22;
  var td10;
  var t23;
  var dispose;
  return {
    c: function c() {
      div = element("div");
      table0 = element("table");
      tr0 = element("tr");
      td0 = element("td");
      t0 = text(
      /*platform*/
      ctx[1]);
      t1 = space();
      td1 = element("td");
      t2 = text(
      /*date*/
      ctx[2]);
      t3 = space();
      td2 = element("td");
      td2.innerHTML = "<i class=\"icon close\"></i>";
      t4 = space();
      table1 = element("table");
      tr1 = element("tr");
      th0 = element("th");
      th0.textContent = "".concat(
      /*translate*/
      ctx[5]("parameter"));
      t6 = space();
      th1 = element("th");
      th1.textContent = "".concat(
      /*translate*/
      ctx[5]("value"));
      t8 = space();
      tr2 = element("tr");
      td3 = element("td");
      td3.textContent = "".concat(
      /*translate*/
      ctx[5]("sceneId"));
      t10 = space();
      td4 = element("td");
      t11 = text(
      /*sceneId*/
      ctx[0]);
      t12 = space();
      tr3 = element("tr");
      td5 = element("td");
      td5.textContent = "".concat(
      /*translate*/
      ctx[5]("platform"));
      t14 = space();
      td6 = element("td");
      t15 = text(
      /*platform*/
      ctx[1]);
      t16 = space();
      tr4 = element("tr");
      td7 = element("td");
      td7.textContent = "".concat(
      /*translate*/
      ctx[5]("date"));
      t18 = space();
      td8 = element("td");
      t19 = text(
      /*date*/
      ctx[2]);
      t20 = space();
      tr5 = element("tr");
      td9 = element("td");
      td9.textContent = "".concat(
      /*translate*/
      ctx[5]("time"));
      t22 = space();
      td10 = element("td");
      t23 = text(
      /*time*/
      ctx[3]);
      attr(table0, "class", "header");
      attr(table0, "cellpadding", "0");
      attr(table0, "cellspacing", "0");
      attr(table1, "class", "content");
      attr(table1, "cellpadding", "0");
      attr(table1, "cellspacing", "0");
      attr(div, "class", "scene-info");
    },
    m: function m(target, anchor, remount) {
      insert(target, div, anchor);
      append(div, table0);
      append(table0, tr0);
      append(tr0, td0);
      append(td0, t0);
      append(tr0, t1);
      append(tr0, td1);
      append(td1, t2);
      append(tr0, t3);
      append(tr0, td2);
      append(div, t4);
      append(div, table1);
      append(table1, tr1);
      append(tr1, th0);
      append(tr1, t6);
      append(tr1, th1);
      append(table1, t8);
      append(table1, tr2);
      append(tr2, td3);
      append(tr2, t10);
      append(tr2, td4);
      append(td4, t11);
      append(table1, t12);
      append(table1, tr3);
      append(tr3, td5);
      append(tr3, t14);
      append(tr3, td6);
      append(td6, t15);
      append(table1, t16);
      append(table1, tr4);
      append(tr4, td7);
      append(tr4, t18);
      append(tr4, td8);
      append(td8, t19);
      append(table1, t20);
      append(table1, tr5);
      append(tr5, td9);
      append(tr5, t22);
      append(tr5, td10);
      append(td10, t23);
      /*div_binding*/

      ctx[9](div);
      if (remount) dispose();
      dispose = listen(td2, "click", stop_propagation(
      /*click_handler*/
      ctx[8]));
    },
    p: function p(ctx, _ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          dirty = _ref2[0];

      if (dirty &
      /*platform*/
      2) set_data(t0,
      /*platform*/
      ctx[1]);
      if (dirty &
      /*date*/
      4) set_data(t2,
      /*date*/
      ctx[2]);
      if (dirty &
      /*sceneId*/
      1) set_data(t11,
      /*sceneId*/
      ctx[0]);
      if (dirty &
      /*platform*/
      2) set_data(t15,
      /*platform*/
      ctx[1]);
      if (dirty &
      /*date*/
      4) set_data(t19,
      /*date*/
      ctx[2]);
      if (dirty &
      /*time*/
      8) set_data(t23,
      /*time*/
      ctx[3]);
    },
    i: noop,
    o: noop,
    d: function d(detaching) {
      if (detaching) detach(div);
      /*div_binding*/

      ctx[9](null);
      dispose();
    }
  };
}

function instance$3($$self, $$props, $$invalidate) {
  var _$$props$sceneId = $$props.sceneId,
      sceneId = _$$props$sceneId === void 0 ? "" : _$$props$sceneId;
  var _$$props$platform = $$props.platform,
      platform = _$$props$platform === void 0 ? "" : _$$props$platform;
  var _$$props$date = $$props.date,
      date = _$$props$date === void 0 ? "" : _$$props$date;
  var _$$props$time = $$props.time,
      time = _$$props$time === void 0 ? "" : _$$props$time;
  T.addText("eng", {
    sceneId: "Scene ID",
    platform: "Platform",
    date: "Acquisition Date",
    time: "Acqusition Time (UTC)",
    parameter: "Parameter",
    value: "Value"
  });
  T.addText("rus", {
    sceneId: "Идентификатор сцены",
    platform: "Платформа",
    date: "Дата съемки",
    time: "Время съемки (UTC)",
    parameter: "Параметр",
    value: "Значение"
  });
  var translate = T.getText.bind(T);
  var dispatch = createEventDispatcher();
  var container;

  function adjustPosition(_ref3) {
    var top = _ref3.top,
        left = _ref3.left;
    $$invalidate(4, container.style.top = "".concat(top, "px"), container);
    $$invalidate(4, container.style.left = "".concat(left, "px"), container);
  }

  var click_handler = function click_handler() {
    return dispatch("close");
  };

  function div_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](function () {
      $$invalidate(4, container = $$value);
    });
  }

  $$self.$set = function ($$props) {
    if ("sceneId" in $$props) $$invalidate(0, sceneId = $$props.sceneId);
    if ("platform" in $$props) $$invalidate(1, platform = $$props.platform);
    if ("date" in $$props) $$invalidate(2, date = $$props.date);
    if ("time" in $$props) $$invalidate(3, time = $$props.time);
  };

  return [sceneId, platform, date, time, container, translate, dispatch, adjustPosition, click_handler, div_binding];
}

var Info = /*#__PURE__*/function (_SvelteComponent) {
  _inherits(Info, _SvelteComponent);

  var _super = _createSuper(Info);

  function Info(options) {
    var _this;

    _classCallCheck(this, Info);

    _this = _super.call(this);
    init(_assertThisInitialized(_this), options, instance$3, create_fragment$3, safe_not_equal, {
      sceneId: 0,
      platform: 1,
      date: 2,
      time: 3,
      adjustPosition: 7
    });
    return _this;
  }

  _createClass(Info, [{
    key: "adjustPosition",
    get: function get() {
      return this.$$.ctx[7];
    }
  }]);

  return Info;
}(SvelteComponent);

function get_each_context$3(ctx, list, i) {
  var child_ctx = ctx.slice();
  child_ctx[16] = list[i];
  return child_ctx;
} // (59:8) {#each regions as r}


function create_each_block$3(ctx) {
  var current;
  var region_spread_levels = [
  /*r*/
  ctx[16]];
  var region_props = {};

  for (var i = 0; i < region_spread_levels.length; i += 1) {
    region_props = assign(region_props, region_spread_levels[i]);
  }

  var region = new Region({
    props: region_props
  });
  region.$on("select",
  /*select*/
  ctx[7]);
  region.$on("selection",
  /*selection_handler*/
  ctx[12]);
  region.$on("download",
  /*download_handler*/
  ctx[13]);
  region.$on("preview",
  /*preview_handler*/
  ctx[14]);
  region.$on("expand",
  /*expand_handler*/
  ctx[15]);
  return {
    c: function c() {
      create_component(region.$$.fragment);
    },
    m: function m(target, anchor) {
      mount_component(region, target, anchor);
      current = true;
    },
    p: function p(ctx, dirty) {
      var region_changes = dirty &
      /*regions*/
      4 ? get_spread_update(region_spread_levels, [get_spread_object(
      /*r*/
      ctx[16])]) : {};
      region.$set(region_changes);
    },
    i: function i(local) {
      if (current) return;
      transition_in(region.$$.fragment, local);
      current = true;
    },
    o: function o(local) {
      transition_out(region.$$.fragment, local);
      current = false;
    },
    d: function d(detaching) {
      destroy_component(region, detaching);
    }
  };
}

function create_fragment$4(ctx) {
  var div2;
  var div0;
  var i;
  var t0;
  var span;
  var t1_value = (
  /*contractId*/
  ctx[0] ||
  /*name*/
  ctx[1]) + "";
  var t1;
  var t2;
  var div1;
  var current;
  var dispose;
  var each_value =
  /*regions*/
  ctx[2];
  var each_blocks = [];

  for (var _i = 0; _i < each_value.length; _i += 1) {
    each_blocks[_i] = create_each_block$3(get_each_context$3(ctx, each_value, _i));
  }

  var out = function out(i) {
    return transition_out(each_blocks[i], 1, 1, function () {
      each_blocks[i] = null;
    });
  };

  return {
    c: function c() {
      div2 = element("div");
      div0 = element("div");
      i = element("i");
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      t2 = space();
      div1 = element("div");

      for (var _i2 = 0; _i2 < each_blocks.length; _i2 += 1) {
        each_blocks[_i2].c();
      }

      attr(i, "class", "icon");
      toggle_class(i, "caret-right", !
      /*expanded*/
      ctx[3]);
      toggle_class(i, "caret-down",
      /*expanded*/
      ctx[3]);
      attr(div0, "class", "header");
      attr(div1, "class", "content");
      toggle_class(div1, "hidden", !
      /*expanded*/
      ctx[3]);
      attr(div2, "class", "order");
    },
    m: function m(target, anchor, remount) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div0, i);
      append(div0, t0);
      append(div0, span);
      append(span, t1);
      /*div0_binding*/

      ctx[11](div0);
      append(div2, t2);
      append(div2, div1);

      for (var _i3 = 0; _i3 < each_blocks.length; _i3 += 1) {
        each_blocks[_i3].m(div1, null);
      }

      current = true;
      if (remount) dispose();
      dispose = listen(div0, "click", stop_propagation(
      /*toggle*/
      ctx[6]));
    },
    p: function p(ctx, _ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          dirty = _ref2[0];

      if (dirty &
      /*expanded*/
      8) {
        toggle_class(i, "caret-right", !
        /*expanded*/
        ctx[3]);
      }

      if (dirty &
      /*expanded*/
      8) {
        toggle_class(i, "caret-down",
        /*expanded*/
        ctx[3]);
      }

      if ((!current || dirty &
      /*contractId, name*/
      3) && t1_value !== (t1_value = (
      /*contractId*/
      ctx[0] ||
      /*name*/
      ctx[1]) + "")) set_data(t1, t1_value);

      if (dirty &
      /*regions, select, dispatch*/
      164) {
        each_value =
        /*regions*/
        ctx[2];

        var _i4;

        for (_i4 = 0; _i4 < each_value.length; _i4 += 1) {
          var child_ctx = get_each_context$3(ctx, each_value, _i4);

          if (each_blocks[_i4]) {
            each_blocks[_i4].p(child_ctx, dirty);

            transition_in(each_blocks[_i4], 1);
          } else {
            each_blocks[_i4] = create_each_block$3(child_ctx);

            each_blocks[_i4].c();

            transition_in(each_blocks[_i4], 1);

            each_blocks[_i4].m(div1, null);
          }
        }

        group_outros();

        for (_i4 = each_value.length; _i4 < each_blocks.length; _i4 += 1) {
          out(_i4);
        }

        check_outros();
      }

      if (dirty &
      /*expanded*/
      8) {
        toggle_class(div1, "hidden", !
        /*expanded*/
        ctx[3]);
      }
    },
    i: function i(local) {
      if (current) return;

      for (var _i5 = 0; _i5 < each_value.length; _i5 += 1) {
        transition_in(each_blocks[_i5]);
      }

      current = true;
    },
    o: function o(local) {
      each_blocks = each_blocks.filter(Boolean);

      for (var _i6 = 0; _i6 < each_blocks.length; _i6 += 1) {
        transition_out(each_blocks[_i6]);
      }

      current = false;
    },
    d: function d(detaching) {
      if (detaching) detach(div2);
      /*div0_binding*/

      ctx[11](null);
      destroy_each(each_blocks, detaching);
      dispose();
    }
  };
}

function instance$4($$self, $$props, $$invalidate) {
  var dispatch = createEventDispatcher();
  var _$$props$contractId = $$props.contractId,
      contractId = _$$props$contractId === void 0 ? "" : _$$props$contractId;
  var _$$props$name = $$props.name,
      name = _$$props$name === void 0 ? "" : _$$props$name;
  var id = $$props.id;
  var regions = [];
  var expanded = false;
  var loaded = false;

  var toggle = function toggle() {
    if (!loaded && !expanded) {
      fetch("api/Regions/ByOrder/".concat(id)).then(function (response) {
        return response.json();
      }).then(function (json) {
        loaded = true;
        $$invalidate(2, regions = json);
      }).catch(function (e) {
        return console.log(e);
      });
    }

    $$invalidate(3, expanded = !expanded);
  };

  var headerContainer;
  var info;

  var select = function select(_ref3) {
    var detail = _ref3.detail;
    var sceneId = detail.sceneId,
        platform = detail.product.platform,
        reset = detail.reset;

    if (!info) {
      info = new Info({
        target: document.body,
        props: {
          sceneId: sceneId,
          platform: platform
        }
      });

      var _headerContainer$getB = headerContainer.getBoundingClientRect(),
          top = _headerContainer$getB.top,
          left = _headerContainer$getB.left,
          width = _headerContainer$getB.width;

      info.adjustPosition({
        top: top,
        left: left + width + 20
      });
      info.$on("close", function () {
        info.$destroy();
        info = null;
        reset();
      });
    } else {
      info.$set({
        sceneId: sceneId,
        platform: platform
      });
    }
  };

  function div0_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](function () {
      $$invalidate(4, headerContainer = $$value);
    });
  }

  var selection_handler = function selection_handler(_ref4) {
    var detail = _ref4.detail;
    return dispatch("selection", detail);
  };

  var download_handler = function download_handler() {
    return dispatch("download");
  };

  var preview_handler = function preview_handler(_ref5) {
    var detail = _ref5.detail;
    return dispatch("preview", detail);
  };

  var expand_handler = function expand_handler(_ref6) {
    var detail = _ref6.detail;
    return dispatch("expand", detail);
  };

  $$self.$set = function ($$props) {
    if ("contractId" in $$props) $$invalidate(0, contractId = $$props.contractId);
    if ("name" in $$props) $$invalidate(1, name = $$props.name);
    if ("id" in $$props) $$invalidate(8, id = $$props.id);
  };

  return [contractId, name, regions, expanded, headerContainer, dispatch, toggle, select, id, loaded, info, div0_binding, selection_handler, download_handler, preview_handler, expand_handler];
}

var Order = /*#__PURE__*/function (_SvelteComponent) {
  _inherits(Order, _SvelteComponent);

  var _super = _createSuper(Order);

  function Order(options) {
    var _this;

    _classCallCheck(this, Order);

    _this = _super.call(this);
    init(_assertThisInitialized(_this), options, instance$4, create_fragment$4, safe_not_equal, {
      contractId: 0,
      name: 1,
      id: 8
    });
    return _this;
  }

  return Order;
}(SvelteComponent);

function get_each_context$4(ctx, list, i) {
  var child_ctx = ctx.slice();
  child_ctx[8] = list[i];
  return child_ctx;
} // (35:4) {#each orders as x}


function create_each_block$4(ctx) {
  var current;
  var order_spread_levels = [
  /*x*/
  ctx[8]];
  var order_props = {};

  for (var i = 0; i < order_spread_levels.length; i += 1) {
    order_props = assign(order_props, order_spread_levels[i]);
  }

  var order = new Order({
    props: order_props
  });
  order.$on("selection",
  /*selection*/
  ctx[3]);
  order.$on("download",
  /*download*/
  ctx[2]);
  order.$on("preview",
  /*preview_handler*/
  ctx[6]);
  order.$on("expand",
  /*expand_handler*/
  ctx[7]);
  return {
    c: function c() {
      create_component(order.$$.fragment);
    },
    m: function m(target, anchor) {
      mount_component(order, target, anchor);
      current = true;
    },
    p: function p(ctx, dirty) {
      var order_changes = dirty &
      /*orders*/
      1 ? get_spread_update(order_spread_levels, [get_spread_object(
      /*x*/
      ctx[8])]) : {};
      order.$set(order_changes);
    },
    i: function i(local) {
      if (current) return;
      transition_in(order.$$.fragment, local);
      current = true;
    },
    o: function o(local) {
      transition_out(order.$$.fragment, local);
      current = false;
    },
    d: function d(detaching) {
      destroy_component(order, detaching);
    }
  };
}

function create_fragment$5(ctx) {
  var div;
  var current;
  var each_value =
  /*orders*/
  ctx[0];
  var each_blocks = [];

  for (var i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
  }

  var out = function out(i) {
    return transition_out(each_blocks[i], 1, 1, function () {
      each_blocks[i] = null;
    });
  };

  return {
    c: function c() {
      div = element("div");

      for (var _i = 0; _i < each_blocks.length; _i += 1) {
        each_blocks[_i].c();
      }

      attr(div, "class", "catalog-order-viewer");
    },
    m: function m(target, anchor) {
      insert(target, div, anchor);

      for (var _i2 = 0; _i2 < each_blocks.length; _i2 += 1) {
        each_blocks[_i2].m(div, null);
      }

      current = true;
    },
    p: function p(ctx, _ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          dirty = _ref2[0];

      if (dirty &
      /*orders, selection, download, dispatch*/
      15) {
        each_value =
        /*orders*/
        ctx[0];

        var _i3;

        for (_i3 = 0; _i3 < each_value.length; _i3 += 1) {
          var child_ctx = get_each_context$4(ctx, each_value, _i3);

          if (each_blocks[_i3]) {
            each_blocks[_i3].p(child_ctx, dirty);

            transition_in(each_blocks[_i3], 1);
          } else {
            each_blocks[_i3] = create_each_block$4(child_ctx);

            each_blocks[_i3].c();

            transition_in(each_blocks[_i3], 1);

            each_blocks[_i3].m(div, null);
          }
        }

        group_outros();

        for (_i3 = each_value.length; _i3 < each_blocks.length; _i3 += 1) {
          out(_i3);
        }

        check_outros();
      }
    },
    i: function i(local) {
      if (current) return;

      for (var _i4 = 0; _i4 < each_value.length; _i4 += 1) {
        transition_in(each_blocks[_i4]);
      }

      current = true;
    },
    o: function o(local) {
      each_blocks = each_blocks.filter(Boolean);

      for (var _i5 = 0; _i5 < each_blocks.length; _i5 += 1) {
        transition_out(each_blocks[_i5]);
      }

      current = false;
    },
    d: function d(detaching) {
      if (detaching) detach(div);
      destroy_each(each_blocks, detaching);
    }
  };
}

function instance$5($$self, $$props, $$invalidate) {
  var dispatch = createEventDispatcher();

  var download = function download() {
    dispatch("download", Object.keys(files));
  };

  var _$$props$orders = $$props.orders,
      orders = _$$props$orders === void 0 ? [] : _$$props$orders;

  function resetVisibility() {
    visibility.set(false);
  }

  var files = {};

  function selection(_ref3) {
    var detail = _ref3.detail;
    var path = detail.path,
        state = detail.state;

    if (state === 1) {
      files[path] = 1;
    } else {
      delete files[path];
    }
  }

  var preview_handler = function preview_handler(_ref4) {
    var detail = _ref4.detail;
    return dispatch("preview", detail);
  };

  var expand_handler = function expand_handler(_ref5) {
    var detail = _ref5.detail;
    return dispatch("expand", detail);
  };

  $$self.$set = function ($$props) {
    if ("orders" in $$props) $$invalidate(0, orders = $$props.orders);
  };

  return [orders, dispatch, download, selection, resetVisibility, files, preview_handler, expand_handler];
}

var App = /*#__PURE__*/function (_SvelteComponent) {
  _inherits(App, _SvelteComponent);

  var _super = _createSuper(App);

  function App(options) {
    var _this;

    _classCallCheck(this, App);

    _this = _super.call(this);
    init(_assertThisInitialized(_this), options, instance$5, create_fragment$5, safe_not_equal, {
      orders: 0,
      resetVisibility: 4
    });
    return _this;
  }

  _createClass(App, [{
    key: "resetVisibility",
    get: function get() {
      return this.$$.ctx[4];
    }
  }]);

  return App;
}(SvelteComponent);

module.exports = App;
//# sourceMappingURL=catalog-order-viewer.cjs.js.map
