'use strict';

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
function empty() {
    return text('');
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
    else
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
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = current_component;
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
const resolved_promise = Promise.resolve();
let update_scheduled = false;
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_binding_callback(fn) {
    binding_callbacks.push(fn);
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.shift()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        while (render_callbacks.length) {
            const callback = render_callbacks.pop();
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_render);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_render.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        remaining: 0,
        callbacks: []
    };
}
function check_outros() {
    if (!outros.remaining) {
        run_all(outros.callbacks);
    }
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.callbacks.push(() => {
            outroing.delete(block);
            if (callback) {
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
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_render } = component.$$;
    fragment.m(target, anchor);
    // onMount happens after the initial afterUpdate. Because
    // afterUpdate callbacks happen in reverse order (inner first)
    // we schedule onMount callbacks before afterUpdate callbacks
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
    after_render.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        if (detaching)
            component.$$.fragment.d(1);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal: not_equal$$1,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_render: [],
        after_render: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, value) => {
            if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_render);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
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

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var copy = function copy(source) {
    switch (typeof source === 'undefined' ? 'undefined' : _typeof(source)) {
        case 'number':
        case 'string':
        case 'function':
        default:
            return source;
        case 'object':
            if (source === null) {
                return null;
            } else if (Array.isArray(source)) {
                return source.map(function (item) {
                    return copy(item);
                });
            } else if (source instanceof Date) {
                return source;
            } else {
                return Object.keys(source).reduce(function (a, k) {
                    a[k] = copy(source[k]);
                    return a;
                }, {});
            }
    }
};

var extend = function extend(target, source) {
    if (target === source) {
        return target;
    } else {
        return Object.keys(source).reduce(function (a, k) {
            var value = source[k];
            if (_typeof(a[k]) === 'object' && k in a) {
                a[k] = extend(a[k], value);
            } else {
                a[k] = copy(value);
            }
            return a;
        }, copy(target));
    }
};

var DEFAULT_LANGUAGE = 'rus';

var Translations = function () {
    function Translations() {
        classCallCheck(this, Translations);

        this._hash = {};
    }

    createClass(Translations, [{
        key: 'setLanguage',
        value: function setLanguage(lang) {
            this._language = lang;
        }
    }, {
        key: 'getLanguage',
        value: function getLanguage() {
            return window.language || this._language || DEFAULT_LANGUAGE;
        }
    }, {
        key: 'addText',
        value: function addText(lang, tran) {
            this._hash[lang] = extend(this._hash[lang] || {}, tran);
            return this;
        }
    }, {
        key: 'getText',
        value: function getText(key) {
            if (key && typeof key === 'string') {
                var locale = this._hash[this.getLanguage()];
                if (locale) {
                    return key.split('.').reduce(function (a, k) {
                        return a[k];
                    }, locale);
                }
            }
            return null;
        }
    }]);
    return Translations;
}();

window.Scanex = window.Scanex || {};
window.Scanex.Translations = window.Scanex.Translations || {};
window.Scanex.translations = window.Scanex.translations || new Translations();

var index = window.Scanex.translations;

var scanexTranslations_cjs = index;

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
            if (!stop) {
                return; // not ready
            }
            subscribers.forEach((s) => s[1]());
            subscribers.forEach((s) => s[0](value));
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
            }
        };
    }
    return { set, update, subscribe };
}

const visibility = writable(false);

/* src\Region.svelte generated by Svelte v3.5.2 */

function add_css() {
	var style = element("style");
	style.id = 'svelte-15ejp9x-style';
	style.textContent = ".roi.svelte-15ejp9x{margin-top:8px;font-family:'IBM Plex Sans'}.roi.svelte-15ejp9x:last-child{margin-bottom:8px}.roi.svelte-15ejp9x .header.svelte-15ejp9x{padding:17px 7px 17px 9px;cursor:pointer;background-color:#F3F7FA;border:1px solid #D8E1E8;border-top-left-radius:5px;border-top-right-radius:5px;width:100%}.roi.svelte-15ejp9x .header td.svelte-15ejp9x,.roi.svelte-15ejp9x .content th.svelte-15ejp9x,.roi.svelte-15ejp9x .content td.svelte-15ejp9x{white-space:nowrap}.roi.svelte-15ejp9x .header.collapsed.svelte-15ejp9x{border-bottom-left-radius:5px;border-bottom-right-radius:5px}.roi.svelte-15ejp9x .header .toggle.svelte-15ejp9x{cursor:pointer;display:inline-block;background-position:center;background-repeat:no-repeat;width:12px;height:12px}.roi.svelte-15ejp9x .header .toggle.expanded.svelte-15ejp9x{background-image:url('arrow-down.png')}.roi.svelte-15ejp9x .header .toggle.collapsed.svelte-15ejp9x{background-image:url('arrow-right.png')}.roi.svelte-15ejp9x .header .down.svelte-15ejp9x,.roi.svelte-15ejp9x .header .preview.svelte-15ejp9x,.roi.svelte-15ejp9x .content .info.svelte-15ejp9x{cursor:pointer;display:inline-block;background-position:center;background-repeat:no-repeat}.roi.svelte-15ejp9x .header .down.svelte-15ejp9x{width:20px;height:20px;margin-left:5px}.roi.svelte-15ejp9x .header .down.active.svelte-15ejp9x{background-image:url('down-active.png')}.roi.svelte-15ejp9x .header .down.inactive.svelte-15ejp9x{background-image:url('down-inactive.png')}.roi.svelte-15ejp9x .header .preview.svelte-15ejp9x{width:16px;height:16px}.roi.svelte-15ejp9x .header .preview.active.svelte-15ejp9x{background-image:url('preview-active.png')}.roi.svelte-15ejp9x .header .preview.inactive.svelte-15ejp9x{background-image:url('preview-inactive.png')}.roi.svelte-15ejp9x .header .preview.svelte-15ejp9x,.roi.svelte-15ejp9x .header .name.svelte-15ejp9x{margin-left:10px}.roi.svelte-15ejp9x .content.svelte-15ejp9x{border-left:1px solid #D8E1E8;border-bottom:1px solid #D8E1E8;border-right:1px solid #D8E1E8;border-bottom-left-radius:5px;border-bottom-right-radius:5px}.roi.svelte-15ejp9x .content.hidden.svelte-15ejp9x{display:none}.roi.svelte-15ejp9x .content th.svelte-15ejp9x,.roi.svelte-15ejp9x .content td.svelte-15ejp9x{text-align:left;border-left:1px solid #D8E1E8;padding-top:6px;padding-bottom:6px;padding-left:12px;padding-right:12px}.roi.svelte-15ejp9x .header .name.svelte-15ejp9x,.roi.svelte-15ejp9x .content th.svelte-15ejp9x:first-child{width:100%}.roi.svelte-15ejp9x .content th.svelte-15ejp9x:first-child,.roi.svelte-15ejp9x .content td.svelte-15ejp9x:first-child,.roi.svelte-15ejp9x .content th.svelte-15ejp9x:last-child,.roi.svelte-15ejp9x .content td.svelte-15ejp9x:last-child{border-left:none}.roi.svelte-15ejp9x .content th.svelte-15ejp9x:first-child,.roi.svelte-15ejp9x .content td.svelte-15ejp9x:first-child{padding-left:32px}.roi.svelte-15ejp9x .content th.svelte-15ejp9x{color:#92A0AC;border-bottom:1px solid #D8E1E8}.roi.svelte-15ejp9x .content td.svelte-15ejp9x{color:#455467;cursor:pointer;border-top:1px solid transparent;border-bottom:1px solid transparent}.roi.svelte-15ejp9x .content .info.svelte-15ejp9x{background-image:url('info.png');width:16px;height:16px}.roi.svelte-15ejp9x .content .selected td.svelte-15ejp9x{border-top:1px solid #00A2D3;border-bottom:1px solid #00A2D3}.roi.svelte-15ejp9x .content .selected td.svelte-15ejp9x:first-child{border-left:1px solid #00A2D3;border-top-left-radius:3px;border-bottom-left-radius:3px}.roi.svelte-15ejp9x .content .selected td.svelte-15ejp9x:last-child{border-right:1px solid #00A2D3;border-top-right-radius:3px;border-bottom-right-radius:3px}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.g = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (256:12) {#if expanded}
function create_if_block(ctx) {
	var if_block_anchor;

	function select_block_type(ctx) {
		if (ctx.mBytes >= 1.0) return create_if_block_1;
		if (ctx.kBytes >= 1.0) return create_if_block_2;
		return create_else_block;
	}

	var current_block_type = select_block_type(ctx);
	var if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},

		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},

		p(changed, ctx) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},

		d(detaching) {
			if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

// (261:16) {:else}
function create_else_block(ctx) {
	var td, t0_value = ctx.size.toFixed(1), t0, t1, t2_value = ctx.translate('b'), t2;

	return {
		c() {
			td = element("td");
			t0 = text(t0_value);
			t1 = space();
			t2 = text(t2_value);
			attr(td, "class", "svelte-15ejp9x");
		},

		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t0);
			append(td, t1);
			append(td, t2);
		},

		p(changed, ctx) {
			if ((changed.size) && t0_value !== (t0_value = ctx.size.toFixed(1))) {
				set_data(t0, t0_value);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(td);
			}
		}
	};
}

// (259:40) 
function create_if_block_2(ctx) {
	var td, t0_value = ctx.kBytes.toFixed(1), t0, t1, t2_value = ctx.translate('kb'), t2;

	return {
		c() {
			td = element("td");
			t0 = text(t0_value);
			t1 = space();
			t2 = text(t2_value);
			attr(td, "class", "svelte-15ejp9x");
		},

		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t0);
			append(td, t1);
			append(td, t2);
		},

		p(changed, ctx) {
			if ((changed.kBytes) && t0_value !== (t0_value = ctx.kBytes.toFixed(1))) {
				set_data(t0, t0_value);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(td);
			}
		}
	};
}

// (257:16) {#if mBytes >= 1.0}
function create_if_block_1(ctx) {
	var td, t0_value = ctx.mBytes.toFixed(1), t0, t1, t2_value = ctx.translate('mb'), t2;

	return {
		c() {
			td = element("td");
			t0 = text(t0_value);
			t1 = space();
			t2 = text(t2_value);
			attr(td, "class", "svelte-15ejp9x");
		},

		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t0);
			append(td, t1);
			append(td, t2);
		},

		p(changed, ctx) {
			if ((changed.mBytes) && t0_value !== (t0_value = ctx.mBytes.toFixed(1))) {
				set_data(t0, t0_value);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(td);
			}
		}
	};
}

// (279:8) {#each granules.filter(({granule: {productType}}) => productType !== 100000) as g, i}
function create_each_block(ctx) {
	var tr, td0, t0_value = ctx.g.granule.sceneId, t0, t1, td1, t2, dispose;

	function click_handler_2() {
		return ctx.click_handler_2(ctx);
	}

	return {
		c() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			td1.innerHTML = `<i class="info svelte-15ejp9x"></i>`;
			t2 = space();
			attr(td0, "class", "svelte-15ejp9x");
			attr(td1, "class", "svelte-15ejp9x");
			toggle_class(tr, "selected", ctx.i === ctx.selected);
			dispose = listen(tr, "click", click_handler_2);
		},

		m(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(tr, t1);
			append(tr, td1);
			append(tr, t2);
		},

		p(changed, new_ctx) {
			ctx = new_ctx;
			if ((changed.granules) && t0_value !== (t0_value = ctx.g.granule.sceneId)) {
				set_data(t0, t0_value);
			}

			if (changed.selected) {
				toggle_class(tr, "selected", ctx.i === ctx.selected);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(tr);
			}

			dispose();
		}
	};
}

function create_fragment(ctx) {
	var div, table0, tr0, td0, i0, t0, td1, i1, t1, td2, t2, t3, t4, td3, i2, t5, table1, tr1, th0, t6_value = ctx.translate('product'), t6, t7, th1, t8, dispose;

	var if_block = (ctx.expanded) && create_if_block(ctx);

	var each_value = ctx.granules.filter(func);

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
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
			t2 = text(ctx.name);
			t3 = space();
			if (if_block) if_block.c();
			t4 = space();
			td3 = element("td");
			i2 = element("i");
			t5 = space();
			table1 = element("table");
			tr1 = element("tr");
			th0 = element("th");
			t6 = text(t6_value);
			t7 = space();
			th1 = element("th");
			t8 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(i0, "class", "toggle svelte-15ejp9x");
			toggle_class(i0, "collapsed", !ctx.expanded);
			toggle_class(i0, "expanded", ctx.expanded);
			attr(td0, "class", "svelte-15ejp9x");
			attr(i1, "class", "preview svelte-15ejp9x");
			toggle_class(i1, "active", ctx.visible);
			toggle_class(i1, "inactive", !ctx.visible);
			attr(td1, "class", "svelte-15ejp9x");
			attr(td2, "class", "name svelte-15ejp9x");
			attr(i2, "class", "down svelte-15ejp9x");
			toggle_class(i2, "active", ctx.expanded);
			toggle_class(i2, "inactive", !ctx.expanded);
			attr(td3, "class", "svelte-15ejp9x");
			attr(table0, "class", "header svelte-15ejp9x");
			toggle_class(table0, "collapsed", !ctx.expanded);
			attr(th0, "class", "svelte-15ejp9x");
			attr(th1, "class", "svelte-15ejp9x");
			attr(table1, "class", "content svelte-15ejp9x");
			attr(table1, "cellpadding", "0");
			attr(table1, "cellspacing", "0");
			toggle_class(table1, "hidden", !ctx.expanded);
			attr(div, "class", "roi svelte-15ejp9x");

			dispose = [
				listen(i0, "click", stop_propagation(ctx.click_handler)),
				listen(i1, "click", stop_propagation(ctx.preview)),
				listen(td2, "click", stop_propagation(ctx.click_handler_1)),
				listen(i2, "click", stop_propagation(ctx.download))
			];
		},

		m(target, anchor) {
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
			if (if_block) if_block.m(tr0, null);
			append(tr0, t4);
			append(tr0, td3);
			append(td3, i2);
			append(div, t5);
			append(div, table1);
			append(table1, tr1);
			append(tr1, th0);
			append(th0, t6);
			append(tr1, t7);
			append(tr1, th1);
			append(table1, t8);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table1, null);
			}
		},

		p(changed, ctx) {
			if (changed.expanded) {
				toggle_class(i0, "collapsed", !ctx.expanded);
				toggle_class(i0, "expanded", ctx.expanded);
			}

			if (changed.visible) {
				toggle_class(i1, "active", ctx.visible);
				toggle_class(i1, "inactive", !ctx.visible);
			}

			if (changed.name) {
				set_data(t2, ctx.name);
			}

			if (ctx.expanded) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(tr0, t4);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (changed.expanded) {
				toggle_class(i2, "active", ctx.expanded);
				toggle_class(i2, "inactive", !ctx.expanded);
				toggle_class(table0, "collapsed", !ctx.expanded);
			}

			if (changed.selected || changed.granules) {
				each_value = ctx.granules.filter(func);

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if (changed.expanded) {
				toggle_class(table1, "hidden", !ctx.expanded);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block) if_block.d();

			destroy_each(each_blocks, detaching);

			run_all(dispose);
		}
	};
}

function func({granule: {productType}}) {
	return productType !== 100000;
}

function instance($$self, $$props, $$invalidate) {
	    

    let { id = '', geoJSON = null, name = '', granules = [], visible = false, size = 0 } = $$props;


    let expanded = false;    
    let selected = -1;

    scanexTranslations_cjs.addText('eng', {
        product: 'Product',
        size: 'Size',
        b: 'b',
        kb: 'Kb',
        mb: 'Mb'
    });

    scanexTranslations_cjs.addText('rus', {
        product: 'Продукт',
        size: 'Размер',
        b: 'б',
        kb: 'Кб',
        mb: 'Мб'
    });

    let checked = false;
    let undetermined = false;

    const dispatch = createEventDispatcher();

    const reset = () => {
        $$invalidate('selected', selected = -1);
    };

    const select = i => {
        $$invalidate('selected', selected = i);
        const {granule} = granules[i];
        dispatch('select', {...granule, reset});
    };

    const translate = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

    const download = () => {
        dispatch('download', id);
    };

    const preview = () => {        
        $$invalidate('visible', visible = !visible);     
        if (visible) {
            visibility.set(true);
        }
                        
        const gs = granules.reduce((a, {granuleId}) => {
            a[granuleId] = true;
            return a;
        }, {});
        dispatch('preview', {id, visible, granules: gs, geoJSON});
    };

    let unsubscribe = visibility.subscribe(value => {
        if (!value) {
            $$invalidate('visible', visible = false);
        }
    });

    onDestroy(() => unsubscribe());

	function click_handler() {
		const $$result = expanded = !expanded;
		$$invalidate('expanded', expanded);
		return $$result;
	}

	function click_handler_1() {
		const $$result = expanded = !expanded;
		$$invalidate('expanded', expanded);
		return $$result;
	}

	function click_handler_2({ i }) {
		return select(i);
	}

	$$self.$set = $$props => {
		if ('id' in $$props) $$invalidate('id', id = $$props.id);
		if ('geoJSON' in $$props) $$invalidate('geoJSON', geoJSON = $$props.geoJSON);
		if ('name' in $$props) $$invalidate('name', name = $$props.name);
		if ('granules' in $$props) $$invalidate('granules', granules = $$props.granules);
		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
		if ('size' in $$props) $$invalidate('size', size = $$props.size);
	};

	let kBytes, mBytes;

	$$self.$$.update = ($$dirty = { size: 1, kBytes: 1, granules: 1, checked: 1, undetermined: 1 }) => {
		if ($$dirty.size) { $$invalidate('kBytes', kBytes = size / 1024); }
		if ($$dirty.kBytes) { $$invalidate('mBytes', mBytes = kBytes / 1024); }
		if ($$dirty.granules || $$dirty.checked || $$dirty.undetermined) { {
                $$invalidate('checked', checked = granules.every(({granule: {product}}) => product.checked));
                $$invalidate('undetermined', undetermined = !checked && granules.some(({granule: {product}}) => product.checked));
            } }
	};

	return {
		id,
		geoJSON,
		name,
		granules,
		visible,
		size,
		expanded,
		selected,
		select,
		translate,
		download,
		preview,
		kBytes,
		mBytes,
		click_handler,
		click_handler_1,
		click_handler_2
	};
}

class Region extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-15ejp9x-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, ["id", "geoJSON", "name", "granules", "visible", "size"]);
	}
}

/* src\Info.svelte generated by Svelte v3.5.2 */

function add_css$1() {
	var style = element("style");
	style.id = 'svelte-yxcc5c-style';
	style.textContent = ".scene-info.svelte-yxcc5c{position:absolute;background-color:#FFFFFF;width:420px}.scene-info.svelte-yxcc5c .header.svelte-yxcc5c{border-top:1px solid #D8E1E8;border-left:1px solid #D8E1E8;border-right:1px solid #D8E1E8;border-top-left-radius:5px;border-top-right-radius:5px;background-color:#F3F7FA}.scene-info.svelte-yxcc5c .content.svelte-yxcc5c{border:1px solid #D8E1E8;border-bottom-left-radius:5px;border-bottom-right-radius:5px}.scene-info.svelte-yxcc5c .content th.svelte-yxcc5c,.scene-info.svelte-yxcc5c .content td.svelte-yxcc5c{border-left:1px solid #D8E1E8}.scene-info.svelte-yxcc5c .header td.svelte-yxcc5c:first-child,.scene-info.svelte-yxcc5c .content th.svelte-yxcc5c:first-child,.scene-info.svelte-yxcc5c .content td.svelte-yxcc5c:first-child{border-left:none}.scene-info.svelte-yxcc5c .content th.svelte-yxcc5c{padding:5px 10px 5px 10px;color:#92A0AC;text-align:left}.scene-info.svelte-yxcc5c .header td.svelte-yxcc5c,.scene-info.svelte-yxcc5c .content td.svelte-yxcc5c{padding:8px 10px 8px 10px}.scene-info.svelte-yxcc5c .content td.svelte-yxcc5c{border-top:1px solid #D8E1E8;color:#455467}.scene-info.svelte-yxcc5c .header td.svelte-yxcc5c:first-child,.scene-info.svelte-yxcc5c .content th.svelte-yxcc5c:last-child,.scene-info.svelte-yxcc5c .content td.svelte-yxcc5c:last-child{width:100%;word-break:break-all}.scene-info.svelte-yxcc5c .close.svelte-yxcc5c{padding:10px}.scene-info.svelte-yxcc5c .close i.svelte-yxcc5c{cursor:pointer;display:inline-block;background-position:center;background-repeat:no-repeat;background-image:url('close.png');width:10px;height:10px}";
	append(document.head, style);
}

function create_fragment$1(ctx) {
	var div, table0, tr0, td0, t0, t1, td1, t2, t3, td2, t4, table1, tr1, th0, t5_value = ctx.translate('parameter'), t5, t6, th1, t7_value = ctx.translate('value'), t7, t8, tr2, td3, t9_value = ctx.translate('sceneId'), t9, t10, td4, t11, t12, tr3, td5, t13_value = ctx.translate('platform'), t13, t14, td6, t15, t16, tr4, td7, t17_value = ctx.translate('date'), t17, t18, td8, t19, t20, tr5, td9, t21_value = ctx.translate('time'), t21, t22, td10, t23, dispose;

	return {
		c() {
			div = element("div");
			table0 = element("table");
			tr0 = element("tr");
			td0 = element("td");
			t0 = text(ctx.platform);
			t1 = space();
			td1 = element("td");
			t2 = text(ctx.date);
			t3 = space();
			td2 = element("td");
			td2.innerHTML = `<i class="svelte-yxcc5c"></i>`;
			t4 = space();
			table1 = element("table");
			tr1 = element("tr");
			th0 = element("th");
			t5 = text(t5_value);
			t6 = space();
			th1 = element("th");
			t7 = text(t7_value);
			t8 = space();
			tr2 = element("tr");
			td3 = element("td");
			t9 = text(t9_value);
			t10 = space();
			td4 = element("td");
			t11 = text(ctx.sceneId);
			t12 = space();
			tr3 = element("tr");
			td5 = element("td");
			t13 = text(t13_value);
			t14 = space();
			td6 = element("td");
			t15 = text(ctx.platform);
			t16 = space();
			tr4 = element("tr");
			td7 = element("td");
			t17 = text(t17_value);
			t18 = space();
			td8 = element("td");
			t19 = text(ctx.date);
			t20 = space();
			tr5 = element("tr");
			td9 = element("td");
			t21 = text(t21_value);
			t22 = space();
			td10 = element("td");
			t23 = text(ctx.time);
			attr(td0, "class", "svelte-yxcc5c");
			attr(td1, "class", "svelte-yxcc5c");
			attr(td2, "class", "close svelte-yxcc5c");
			attr(table0, "class", "header svelte-yxcc5c");
			attr(table0, "cellpadding", "0");
			attr(table0, "cellspacing", "0");
			attr(th0, "class", "svelte-yxcc5c");
			attr(th1, "class", "svelte-yxcc5c");
			attr(td3, "class", "svelte-yxcc5c");
			attr(td4, "class", "svelte-yxcc5c");
			attr(td5, "class", "svelte-yxcc5c");
			attr(td6, "class", "svelte-yxcc5c");
			attr(td7, "class", "svelte-yxcc5c");
			attr(td8, "class", "svelte-yxcc5c");
			attr(td9, "class", "svelte-yxcc5c");
			attr(td10, "class", "svelte-yxcc5c");
			attr(table1, "class", "content svelte-yxcc5c");
			attr(table1, "cellpadding", "0");
			attr(table1, "cellspacing", "0");
			attr(div, "class", "scene-info svelte-yxcc5c");
			dispose = listen(td2, "click", stop_propagation(ctx.click_handler));
		},

		m(target, anchor) {
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
			append(th0, t5);
			append(tr1, t6);
			append(tr1, th1);
			append(th1, t7);
			append(table1, t8);
			append(table1, tr2);
			append(tr2, td3);
			append(td3, t9);
			append(tr2, t10);
			append(tr2, td4);
			append(td4, t11);
			append(table1, t12);
			append(table1, tr3);
			append(tr3, td5);
			append(td5, t13);
			append(tr3, t14);
			append(tr3, td6);
			append(td6, t15);
			append(table1, t16);
			append(table1, tr4);
			append(tr4, td7);
			append(td7, t17);
			append(tr4, t18);
			append(tr4, td8);
			append(td8, t19);
			append(table1, t20);
			append(table1, tr5);
			append(tr5, td9);
			append(td9, t21);
			append(tr5, t22);
			append(tr5, td10);
			append(td10, t23);
			add_binding_callback(() => ctx.div_binding(div, null));
		},

		p(changed, ctx) {
			if (changed.platform) {
				set_data(t0, ctx.platform);
			}

			if (changed.date) {
				set_data(t2, ctx.date);
			}

			if (changed.sceneId) {
				set_data(t11, ctx.sceneId);
			}

			if (changed.platform) {
				set_data(t15, ctx.platform);
			}

			if (changed.date) {
				set_data(t19, ctx.date);
			}

			if (changed.time) {
				set_data(t23, ctx.time);
			}

			if (changed.items) {
				ctx.div_binding(null, div);
				ctx.div_binding(div, null);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div);
			}

			ctx.div_binding(null, div);
			dispose();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	

    let { sceneId = '', platform = '', date = '', time = '' } = $$props;

    scanexTranslations_cjs.addText('eng', {
        sceneId: 'Scene ID',
        platform: 'Platform',
        date: 'Acquisition Date',
        time: 'Acqusition Time (UTC)',
        parameter: 'Parameter',
        value: 'Value'
    });

    scanexTranslations_cjs.addText('rus', {
        sceneId: 'Идентификатор сцены',
        platform: 'Платформа',
        date: 'Дата съемки',
        time: 'Время съемки (UTC)',
        parameter: 'Параметр',
        value: 'Значение',
    });

    const translate = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);
    
    const dispatch = createEventDispatcher();

    let container;

    const adjustPosition = ({top, left}) => {
        container.style.top = `${top}px`; $$invalidate('container', container);
        container.style.left = `${left}px`; $$invalidate('container', container);
    };

	function click_handler() {
		return dispatch('close');
	}

	function div_binding($$node, check) {
		container = $$node;
		$$invalidate('container', container);
	}

	$$self.$set = $$props => {
		if ('sceneId' in $$props) $$invalidate('sceneId', sceneId = $$props.sceneId);
		if ('platform' in $$props) $$invalidate('platform', platform = $$props.platform);
		if ('date' in $$props) $$invalidate('date', date = $$props.date);
		if ('time' in $$props) $$invalidate('time', time = $$props.time);
	};

	return {
		sceneId,
		platform,
		date,
		time,
		translate,
		dispatch,
		container,
		adjustPosition,
		click_handler,
		div_binding
	};
}

class Info extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-yxcc5c-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["sceneId", "platform", "date", "time", "adjustPosition"]);
	}

	get adjustPosition() {
		return this.$$.ctx.adjustPosition;
	}
}

/* src\Order.svelte generated by Svelte v3.5.2 */

function add_css$2() {
	var style = element("style");
	style.id = 'svelte-1p65xks-style';
	style.textContent = ".order.svelte-1p65xks .header>.svelte-1p65xks{display:inline-block}.order.svelte-1p65xks .header.svelte-1p65xks{cursor:pointer}.order.svelte-1p65xks .header .icon.svelte-1p65xks{cursor:pointer;display:inline-block;background-position:center;background-repeat:no-repeat;width:12px;height:12px}.order.svelte-1p65xks .header .icon.expanded.svelte-1p65xks{background-image:url('arrow-down.png')}.order.svelte-1p65xks .header .icon.collapsed.svelte-1p65xks{background-image:url('arrow-right.png')}.order.svelte-1p65xks .content.svelte-1p65xks{padding-left:15px}.order.svelte-1p65xks .content.hidden.svelte-1p65xks{display:none}";
	append(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.r = list[i];
	return child_ctx;
}

// (95:8) {#each regions as r}
function create_each_block$1(ctx) {
	var current;

	var region_spread_levels = [
		ctx.r
	];

	let region_props = {};
	for (var i = 0; i < region_spread_levels.length; i += 1) {
		region_props = assign(region_props, region_spread_levels[i]);
	}
	var region = new Region({ props: region_props });
	region.$on("select", ctx.select);
	region.$on("download", ctx.download);
	region.$on("preview", ctx.preview);

	return {
		c() {
			region.$$.fragment.c();
		},

		m(target, anchor) {
			mount_component(region, target, anchor);
			current = true;
		},

		p(changed, ctx) {
			var region_changes = changed.regions ? get_spread_update(region_spread_levels, [
				ctx.r
			]) : {};
			region.$set(region_changes);
		},

		i(local) {
			if (current) return;
			transition_in(region.$$.fragment, local);

			current = true;
		},

		o(local) {
			transition_out(region.$$.fragment, local);
			current = false;
		},

		d(detaching) {
			destroy_component(region, detaching);
		}
	};
}

function create_fragment$2(ctx) {
	var div2, div0, i, t0, span, t1_value = ctx.contractId || ctx.name, t1, t2, div1, current, dispose;

	var each_value = ctx.regions;

	var each_blocks = [];

	for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
		each_blocks[i_1] = create_each_block$1(get_each_context$1(ctx, each_value, i_1));
	}

	const out = i => transition_out(each_blocks[i], 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			i = element("i");
			t0 = space();
			span = element("span");
			t1 = text(t1_value);
			t2 = space();
			div1 = element("div");

			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
				each_blocks[i_1].c();
			}
			attr(i, "class", "icon svelte-1p65xks");
			toggle_class(i, "collapsed", !ctx.expanded);
			toggle_class(i, "expanded", ctx.expanded);
			attr(span, "class", "svelte-1p65xks");
			attr(div0, "class", "header svelte-1p65xks");
			attr(div1, "class", "content svelte-1p65xks");
			toggle_class(div1, "hidden", !ctx.expanded);
			attr(div2, "class", "order svelte-1p65xks");
			dispose = listen(div0, "click", stop_propagation(ctx.toggle));
		},

		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div0, i);
			append(div0, t0);
			append(div0, span);
			append(span, t1);
			add_binding_callback(() => ctx.div0_binding(div0, null));
			append(div2, t2);
			append(div2, div1);

			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
				each_blocks[i_1].m(div1, null);
			}

			current = true;
		},

		p(changed, ctx) {
			if (changed.expanded) {
				toggle_class(i, "collapsed", !ctx.expanded);
				toggle_class(i, "expanded", ctx.expanded);
			}

			if ((!current || changed.contractId || changed.name) && t1_value !== (t1_value = ctx.contractId || ctx.name)) {
				set_data(t1, t1_value);
			}

			if (changed.items) {
				ctx.div0_binding(null, div0);
				ctx.div0_binding(div0, null);
			}

			if (changed.regions || changed.select || changed.download || changed.preview) {
				each_value = ctx.regions;

				for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i_1);

					if (each_blocks[i_1]) {
						each_blocks[i_1].p(changed, child_ctx);
						transition_in(each_blocks[i_1], 1);
					} else {
						each_blocks[i_1] = create_each_block$1(child_ctx);
						each_blocks[i_1].c();
						transition_in(each_blocks[i_1], 1);
						each_blocks[i_1].m(div1, null);
					}
				}

				group_outros();
				for (; i_1 < each_blocks.length; i_1 += 1) out(i_1);
				check_outros();
			}

			if (changed.expanded) {
				toggle_class(div1, "hidden", !ctx.expanded);
			}
		},

		i(local) {
			if (current) return;
			for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) transition_in(each_blocks[i_1]);

			current = true;
		},

		o(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i_1 = 0; i_1 < each_blocks.length; i_1 += 1) transition_out(each_blocks[i_1]);

			current = false;
		},

		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			ctx.div0_binding(null, div0);

			destroy_each(each_blocks, detaching);

			dispose();
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	

    const dispatch = createEventDispatcher();

    let { contractId = '', name = '', id } = $$props;
    let regions = [];
    let expanded = false;
    let loaded = false;
    const toggle = () => {
        if (!loaded && !expanded) {
            fetch(`api/Regions/ByOrder/${id}`)
            .then(response => response.json())
            .then(json => {
                loaded = true;
                $$invalidate('regions', regions = json);
            })
            .catch(e => console.log(e));
        }
        $$invalidate('expanded', expanded = !expanded);
    };

    let headerContainer;
    let info;    

    const select = ({detail}) => {
        const {sceneId, product: {platform}, reset} = detail;
        if (!info) {
            info = new Info({
                target: document.body,
                props: {sceneId, platform}
            });
            const {top, left, width} = headerContainer.getBoundingClientRect();
            info.adjustPosition({top, left: left + width + 20});
            info.$on('close', () => {
                info.$destroy();
                info = null;
                reset();
            });
        }
        else {
            info.$set({sceneId, platform});
        }        
    };    

    const download = ({detail}) => {
        dispatch('download', detail);
    };

    const preview = ({detail}) => {
        dispatch('preview', detail);
    };

	function div0_binding($$node, check) {
		headerContainer = $$node;
		$$invalidate('headerContainer', headerContainer);
	}

	$$self.$set = $$props => {
		if ('contractId' in $$props) $$invalidate('contractId', contractId = $$props.contractId);
		if ('name' in $$props) $$invalidate('name', name = $$props.name);
		if ('id' in $$props) $$invalidate('id', id = $$props.id);
	};

	return {
		contractId,
		name,
		id,
		regions,
		expanded,
		toggle,
		headerContainer,
		select,
		download,
		preview,
		div0_binding
	};
}

class Order extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1p65xks-style")) add_css$2();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["contractId", "name", "id"]);
	}
}

/* src\App.svelte generated by Svelte v3.5.2 */

function add_css$3() {
	var style = element("style");
	style.id = 'svelte-zg9ox9-style';
	style.textContent = ".app.svelte-zg9ox9{width:390px}";
	append(document.head, style);
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.x = list[i];
	return child_ctx;
}

// (30:4) {#each orders as x}
function create_each_block$2(ctx) {
	var current;

	var order_spread_levels = [
		ctx.x
	];

	let order_props = {};
	for (var i = 0; i < order_spread_levels.length; i += 1) {
		order_props = assign(order_props, order_spread_levels[i]);
	}
	var order = new Order({ props: order_props });
	order.$on("download", ctx.download);
	order.$on("preview", ctx.preview);

	return {
		c() {
			order.$$.fragment.c();
		},

		m(target, anchor) {
			mount_component(order, target, anchor);
			current = true;
		},

		p(changed, ctx) {
			var order_changes = changed.orders ? get_spread_update(order_spread_levels, [
				ctx.x
			]) : {};
			order.$set(order_changes);
		},

		i(local) {
			if (current) return;
			transition_in(order.$$.fragment, local);

			current = true;
		},

		o(local) {
			transition_out(order.$$.fragment, local);
			current = false;
		},

		d(detaching) {
			destroy_component(order, detaching);
		}
	};
}

function create_fragment$3(ctx) {
	var div, current;

	var each_value = ctx.orders;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			div = element("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(div, "class", "app svelte-zg9ox9");
		},

		m(target, anchor) {
			insert(target, div, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},

		p(changed, ctx) {
			if (changed.orders || changed.download || changed.preview) {
				each_value = ctx.orders;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, null);
					}
				}

				group_outros();
				for (; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}
		},

		i(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			current = true;
		},

		o(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			current = false;
		},

		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function resetVisibility () {
    visibility.set(false);
}

function instance$3($$self, $$props, $$invalidate) {
	

    const dispatch = createEventDispatcher();

    const download = ({detail}) => {
        dispatch('download', detail);
    };

    const preview = ({detail}) => {
        dispatch('preview', detail);
    };

    let { orders = [] } = $$props;

	$$self.$set = $$props => {
		if ('orders' in $$props) $$invalidate('orders', orders = $$props.orders);
	};

	return { download, preview, orders };
}

class App extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-zg9ox9-style")) add_css$3();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["orders", "resetVisibility"]);
	}

	get resetVisibility() {
		return resetVisibility;
	}
}

module.exports = App;
//# sourceMappingURL=catalog-order-viewer.cjs.js.map
