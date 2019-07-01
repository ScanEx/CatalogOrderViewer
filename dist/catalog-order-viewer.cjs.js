'use strict';

function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function is_promise(value) {
    return value && typeof value === 'object' && typeof value.then === 'function';
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

function handle_promise(promise, info) {
    const token = info.token = {};
    function update(type, index, key, value) {
        if (info.token !== token)
            return;
        info.resolved = key && { [key]: value };
        const child_ctx = assign(assign({}, info.ctx), info.resolved);
        const block = type && (info.current = type)(child_ctx);
        if (info.block) {
            if (info.blocks) {
                info.blocks.forEach((block, i) => {
                    if (i !== index && block) {
                        group_outros();
                        transition_out(block, 1, () => {
                            info.blocks[i] = null;
                        });
                        check_outros();
                    }
                });
            }
            else {
                info.block.d(1);
            }
            block.c();
            transition_in(block, 1);
            block.m(info.mount(), info.anchor);
            flush();
        }
        info.block = block;
        if (info.blocks)
            info.blocks[index] = block;
    }
    if (is_promise(promise)) {
        promise.then(value => {
            update(info.then, 1, info.value, value);
        }, error => {
            update(info.catch, 2, info.error, error);
        });
        // if we previously had a then/catch block, destroy it
        if (info.current !== info.pending) {
            update(info.pending, 0);
            return true;
        }
    }
    else {
        if (info.current !== info.then) {
            update(info.then, 1, info.value, promise);
            return true;
        }
        info.resolved = { [info.value]: promise };
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

/* src\Region.svelte generated by Svelte v3.5.2 */

function add_css() {
	var style = element("style");
	style.id = 'svelte-1qhs55s-style';
	style.textContent = ".roi.svelte-1qhs55s{margin-top:8px;font-family:'IBM Plex Sans'}.roi.svelte-1qhs55s:last-child{margin-bottom:8px}.roi.svelte-1qhs55s .header.svelte-1qhs55s{padding:17px 7px 17px 9px;cursor:pointer;background-color:#F3F7FA;border:1px solid #D8E1E8;border-top-left-radius:5px;border-top-right-radius:5px;width:100%}.roi.svelte-1qhs55s .header td.svelte-1qhs55s,.roi.svelte-1qhs55s .content th.svelte-1qhs55s,.roi.svelte-1qhs55s .content td.svelte-1qhs55s{white-space:nowrap}.roi.svelte-1qhs55s .header.collapsed.svelte-1qhs55s{border-bottom-left-radius:5px;border-bottom-right-radius:5px}.roi.svelte-1qhs55s .header .toggle.svelte-1qhs55s{cursor:pointer;display:inline-block;background-position:center;background-repeat:no-repeat;width:12px;height:12px}.roi.svelte-1qhs55s .header .toggle.expanded.svelte-1qhs55s{background-image:url('arrow-down.png')}.roi.svelte-1qhs55s .header .toggle.collapsed.svelte-1qhs55s{background-image:url('arrow-right.png')}.roi.svelte-1qhs55s .header .down.svelte-1qhs55s,.roi.svelte-1qhs55s .header .preview.svelte-1qhs55s,.roi.svelte-1qhs55s .content .info.svelte-1qhs55s,.roi.svelte-1qhs55s .content .check.svelte-1qhs55s{cursor:pointer;display:inline-block;background-position:center;background-repeat:no-repeat}.roi.svelte-1qhs55s .header .down.svelte-1qhs55s{width:20px;height:20px;margin-left:5px}.roi.svelte-1qhs55s .header .down.active.svelte-1qhs55s{background-image:url('down-active.png')}.roi.svelte-1qhs55s .header .down.inactive.svelte-1qhs55s{background-image:url('down-inactive.png')}.roi.svelte-1qhs55s .header .preview.svelte-1qhs55s{background-image:url('preview.png');width:16px;height:16px}.roi.svelte-1qhs55s .header .preview.svelte-1qhs55s,.roi.svelte-1qhs55s .header .name.svelte-1qhs55s{margin-left:10px}.roi.svelte-1qhs55s .content.svelte-1qhs55s{border-left:1px solid #D8E1E8;border-bottom:1px solid #D8E1E8;border-right:1px solid #D8E1E8;border-bottom-left-radius:5px;border-bottom-right-radius:5px}.roi.svelte-1qhs55s .content.hidden.svelte-1qhs55s{display:none}.roi.svelte-1qhs55s .content th.svelte-1qhs55s,.roi.svelte-1qhs55s .content td.svelte-1qhs55s{text-align:left;border-left:1px solid #D8E1E8;padding-top:6px;padding-bottom:6px;padding-left:12px;padding-right:12px}.roi.svelte-1qhs55s .header .name.svelte-1qhs55s,.roi.svelte-1qhs55s .content th.svelte-1qhs55s:first-child{width:100%}.roi.svelte-1qhs55s .content th.svelte-1qhs55s:first-child,.roi.svelte-1qhs55s .content td.svelte-1qhs55s:first-child,.roi.svelte-1qhs55s .content th.svelte-1qhs55s:last-child,.roi.svelte-1qhs55s .content td.svelte-1qhs55s:last-child{border-left:none}.roi.svelte-1qhs55s .content th.svelte-1qhs55s:first-child,.roi.svelte-1qhs55s .content td.svelte-1qhs55s:first-child{padding-left:32px}.roi.svelte-1qhs55s .content th.svelte-1qhs55s{color:#92A0AC;border-bottom:1px solid #D8E1E8}.roi.svelte-1qhs55s .content td.svelte-1qhs55s{color:#455467;cursor:pointer;border-top:1px solid transparent;border-bottom:1px solid transparent}.roi.svelte-1qhs55s .content .info.svelte-1qhs55s{background-image:url('info.png');width:16px;height:16px}.roi.svelte-1qhs55s .content .check.svelte-1qhs55s{width:14px;height:14px}.roi.svelte-1qhs55s .content .check.checked.svelte-1qhs55s{background-image:url('check_on.png')}.roi.svelte-1qhs55s .content .check.unchecked.svelte-1qhs55s{background-image:url('check_off.png')}.roi.svelte-1qhs55s .content .check.undetermined.svelte-1qhs55s{background-image:url('check_un.png')}.roi.svelte-1qhs55s .content .selected td.svelte-1qhs55s{border-top:1px solid #00A2D3;border-bottom:1px solid #00A2D3}.roi.svelte-1qhs55s .content .selected td.svelte-1qhs55s:first-child{border-left:1px solid #00A2D3;border-top-left-radius:3px;border-bottom-left-radius:3px}.roi.svelte-1qhs55s .content .selected td.svelte-1qhs55s:last-child{border-right:1px solid #00A2D3;border-top-right-radius:3px;border-bottom-right-radius:3px}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.g = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (212:12) {#if expanded}
function create_if_block(ctx) {
	var td, t0, t1_value = ctx.translate('mb'), t1;

	return {
		c() {
			td = element("td");
			t0 = text("550 ");
			t1 = text(t1_value);
			attr(td, "class", "svelte-1qhs55s");
		},

		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t0);
			append(td, t1);
		},

		p: noop,

		d(detaching) {
			if (detaching) {
				detach(td);
			}
		}
	};
}

// (229:8) {#each granules as g, i}
function create_each_block(ctx) {
	var tr, td0, t0_value = ctx.g.granule.product.name, t0, t1, td1, t2, t3_value = ctx.translate('mb'), t3, t4, td2, t5, td3, i_2, t6, dispose;

	function click_handler_2() {
		return ctx.click_handler_2(ctx);
	}

	function click_handler_3() {
		return ctx.click_handler_3(ctx);
	}

	return {
		c() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			t2 = text("100 ");
			t3 = text(t3_value);
			t4 = space();
			td2 = element("td");
			td2.innerHTML = `<i class="info svelte-1qhs55s"></i>`;
			t5 = space();
			td3 = element("td");
			i_2 = element("i");
			t6 = space();
			attr(td0, "class", "svelte-1qhs55s");
			attr(td1, "class", "svelte-1qhs55s");
			attr(td2, "class", "svelte-1qhs55s");
			attr(i_2, "class", "check svelte-1qhs55s");
			toggle_class(i_2, "checked", ctx.g.granule.product.checked);
			toggle_class(i_2, "unchecked", !ctx.g.granule.product.checked);
			attr(td3, "class", "svelte-1qhs55s");
			toggle_class(tr, "selected", ctx.i === ctx.selected);

			dispose = [
				listen(td3, "click", stop_propagation(click_handler_2)),
				listen(tr, "click", click_handler_3)
			];
		},

		m(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
			append(td1, t3);
			append(tr, t4);
			append(tr, td2);
			append(tr, t5);
			append(tr, td3);
			append(td3, i_2);
			append(tr, t6);
		},

		p(changed, new_ctx) {
			ctx = new_ctx;
			if ((changed.granules) && t0_value !== (t0_value = ctx.g.granule.product.name)) {
				set_data(t0, t0_value);
			}

			if (changed.granules) {
				toggle_class(i_2, "checked", ctx.g.granule.product.checked);
				toggle_class(i_2, "unchecked", !ctx.g.granule.product.checked);
			}

			if (changed.selected) {
				toggle_class(tr, "selected", ctx.i === ctx.selected);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(tr);
			}

			run_all(dispose);
		}
	};
}

function create_fragment(ctx) {
	var div, table0, tr0, td0, i0, t0, td1, t1, td2, t2, t3, t4, td3, i2, t5, table1, tr1, th0, t6_value = ctx.translate('product'), t6, t7, th1, t8_value = ctx.translate('size'), t8, t9, th2, t10, th3, i3, t11, dispose;

	var if_block = (ctx.expanded) && create_if_block(ctx);

	var each_value = ctx.granules;

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
			td1.innerHTML = `<i class="preview svelte-1qhs55s"></i>`;
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
			t8 = text(t8_value);
			t9 = space();
			th2 = element("th");
			t10 = space();
			th3 = element("th");
			i3 = element("i");
			t11 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(i0, "class", "toggle svelte-1qhs55s");
			toggle_class(i0, "collapsed", !ctx.expanded);
			toggle_class(i0, "expanded", ctx.expanded);
			attr(td0, "class", "svelte-1qhs55s");
			attr(td1, "class", "svelte-1qhs55s");
			attr(td2, "class", "name svelte-1qhs55s");
			attr(i2, "class", "down svelte-1qhs55s");
			toggle_class(i2, "active", ctx.expanded && !ctx.unchecked);
			toggle_class(i2, "inactive", !ctx.expanded || ctx.unchecked);
			attr(td3, "class", "svelte-1qhs55s");
			attr(table0, "class", "header svelte-1qhs55s");
			toggle_class(table0, "collapsed", !ctx.expanded);
			attr(th0, "class", "svelte-1qhs55s");
			attr(th1, "class", "svelte-1qhs55s");
			attr(th2, "class", "svelte-1qhs55s");
			attr(i3, "class", "check svelte-1qhs55s");
			toggle_class(i3, "checked", ctx.checked);
			toggle_class(i3, "unchecked", ctx.unchecked);
			toggle_class(i3, "undetermined", ctx.undetermined);
			attr(th3, "class", "svelte-1qhs55s");
			attr(table1, "class", "content svelte-1qhs55s");
			attr(table1, "cellpadding", "0");
			attr(table1, "cellspacing", "0");
			toggle_class(table1, "hidden", !ctx.expanded);
			attr(div, "class", "roi svelte-1qhs55s");

			dispose = [
				listen(i0, "click", stop_propagation(ctx.click_handler)),
				listen(td2, "click", stop_propagation(ctx.click_handler_1)),
				listen(th3, "click", ctx.toggle)
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
			append(th1, t8);
			append(tr1, t9);
			append(tr1, th2);
			append(tr1, t10);
			append(tr1, th3);
			append(th3, i3);
			append(table1, t11);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table1, null);
			}
		},

		p(changed, ctx) {
			if (changed.expanded) {
				toggle_class(i0, "collapsed", !ctx.expanded);
				toggle_class(i0, "expanded", ctx.expanded);
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

			if ((changed.expanded || changed.unchecked)) {
				toggle_class(i2, "active", ctx.expanded && !ctx.unchecked);
				toggle_class(i2, "inactive", !ctx.expanded || ctx.unchecked);
			}

			if (changed.expanded) {
				toggle_class(table0, "collapsed", !ctx.expanded);
			}

			if (changed.checked) {
				toggle_class(i3, "checked", ctx.checked);
			}

			if (changed.unchecked) {
				toggle_class(i3, "unchecked", ctx.unchecked);
			}

			if (changed.undetermined) {
				toggle_class(i3, "undetermined", ctx.undetermined);
			}

			if (changed.selected || changed.granules || changed.translate) {
				each_value = ctx.granules;

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

function instance($$self, $$props, $$invalidate) {
	

    let { name = '', granules = [] } = $$props;
    let expanded = false;
    let selected = -1;

    scanexTranslations_cjs.addText('eng', {
        product: 'Product',
        size: 'Size',
        mb: 'Mb'
    });

    scanexTranslations_cjs.addText('rus', {
        product: 'Продукт',
        size: 'Размер',
        mb: 'Мб'
    });

    let checked = false;
    let unchecked = true;
    let undetermined = false;

    const toggle = () => {
        let items = granules.slice();
        items.forEach(({granule: {product}}) => {
            product.checked = unchecked;
        });
        $$invalidate('granules', granules = items);
    };

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
		const $$result = granules[i].granule.product.checked = !granules[i].granule.product.checked;
		$$invalidate('granules', granules);
		return $$result;
	}

	function click_handler_3({ i }) {
		return select(i);
	}

	$$self.$set = $$props => {
		if ('name' in $$props) $$invalidate('name', name = $$props.name);
		if ('granules' in $$props) $$invalidate('granules', granules = $$props.granules);
	};

	$$self.$$.update = ($$dirty = { granules: 1, checked: 1, undetermined: 1 }) => {
		if ($$dirty.granules || $$dirty.checked || $$dirty.undetermined) { {
                $$invalidate('checked', checked = granules.every(({granule: {product}}) => product.checked));
                $$invalidate('undetermined', undetermined = !checked && granules.some(({granule: {product}}) => product.checked));
                $$invalidate('unchecked', unchecked = !checked && !undetermined);
            } }
	};

	return {
		name,
		granules,
		expanded,
		selected,
		checked,
		unchecked,
		undetermined,
		toggle,
		select,
		translate,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3
	};
}

class Region extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1qhs55s-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, ["name", "granules"]);
	}
}

/* src\Info.svelte generated by Svelte v3.5.2 */

function add_css$1() {
	var style = element("style");
	style.id = 'svelte-6av53v-style';
	style.textContent = ".info.svelte-6av53v{position:absolute;background-color:#FFFFFF;width:580px}.info.svelte-6av53v .header.svelte-6av53v{border-top:1px solid #D8E1E8;border-left:1px solid #D8E1E8;border-right:1px solid #D8E1E8;border-top-left-radius:5px;border-top-right-radius:5px;background-color:#F3F7FA}.info.svelte-6av53v .content.svelte-6av53v{border:1px solid #D8E1E8;border-bottom-left-radius:5px;border-bottom-right-radius:5px}.info.svelte-6av53v .content th.svelte-6av53v,.info.svelte-6av53v .content td.svelte-6av53v{border-left:1px solid #D8E1E8}.info.svelte-6av53v .header td.svelte-6av53v:first-child,.info.svelte-6av53v .content th.svelte-6av53v:first-child,.info.svelte-6av53v .content td.svelte-6av53v:first-child{border-left:none}.info.svelte-6av53v .content th.svelte-6av53v{padding:5px 10px 5px 10px;color:#92A0AC;text-align:left}.info.svelte-6av53v .header td.svelte-6av53v,.info.svelte-6av53v .content td.svelte-6av53v{padding:8px 10px 8px 10px}.info.svelte-6av53v .content td.svelte-6av53v{border-top:1px solid #D8E1E8;color:#455467}.info.svelte-6av53v .header td.svelte-6av53v:first-child,.info.svelte-6av53v .content th.svelte-6av53v:last-child,.info.svelte-6av53v .content td.svelte-6av53v:last-child{width:100%}.info.svelte-6av53v .close.svelte-6av53v{padding:10px}.info.svelte-6av53v .close i.svelte-6av53v{cursor:pointer;display:inline-block;background-position:center;background-repeat:no-repeat;background-image:url('close.png');width:10px;height:10px}";
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
			td2.innerHTML = `<i class="svelte-6av53v"></i>`;
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
			attr(td0, "class", "svelte-6av53v");
			attr(td1, "class", "svelte-6av53v");
			attr(td2, "class", "close svelte-6av53v");
			attr(table0, "class", "header svelte-6av53v");
			attr(table0, "cellpadding", "0");
			attr(table0, "cellspacing", "0");
			attr(th0, "class", "svelte-6av53v");
			attr(th1, "class", "svelte-6av53v");
			attr(td3, "class", "svelte-6av53v");
			attr(td4, "class", "svelte-6av53v");
			attr(td5, "class", "svelte-6av53v");
			attr(td6, "class", "svelte-6av53v");
			attr(td7, "class", "svelte-6av53v");
			attr(td8, "class", "svelte-6av53v");
			attr(td9, "class", "svelte-6av53v");
			attr(td10, "class", "svelte-6av53v");
			attr(table1, "class", "content svelte-6av53v");
			attr(table1, "cellpadding", "0");
			attr(table1, "cellspacing", "0");
			attr(div, "class", "info svelte-6av53v");
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
		if (!document.getElementById("svelte-6av53v-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["sceneId", "platform", "date", "time", "adjustPosition"]);
	}

	get adjustPosition() {
		return this.$$.ctx.adjustPosition;
	}
}

/* src\Order.svelte generated by Svelte v3.5.2 */

function add_css$2() {
	var style = element("style");
	style.id = 'svelte-21p7i4-style';
	style.textContent = ".order.svelte-21p7i4 .header>.svelte-21p7i4{display:inline-block}.order.svelte-21p7i4 .header.svelte-21p7i4{cursor:pointer}.order.svelte-21p7i4 .header .icon.svelte-21p7i4{cursor:pointer;display:inline-block;background-position:center;background-repeat:no-repeat;width:12px;height:12px}.order.svelte-21p7i4 .header .icon.expanded.svelte-21p7i4{background-image:url('arrow-down.png')}.order.svelte-21p7i4 .header .icon.collapsed.svelte-21p7i4{background-image:url('arrow-right.png')}.order.svelte-21p7i4 .content.svelte-21p7i4{padding-left:15px}.order.svelte-21p7i4 .content.hidden.svelte-21p7i4{display:none}";
	append(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.r = list[i];
	return child_ctx;
}

// (83:8) {#each regions as r}
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
	var div2, div0, i, t0, span, t1, t2, div1, current, dispose;

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
			t1 = text(ctx.name);
			t2 = space();
			div1 = element("div");

			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
				each_blocks[i_1].c();
			}
			attr(i, "class", "icon svelte-21p7i4");
			toggle_class(i, "collapsed", !ctx.expanded);
			toggle_class(i, "expanded", ctx.expanded);
			attr(span, "class", "svelte-21p7i4");
			attr(div0, "class", "header svelte-21p7i4");
			attr(div1, "class", "content svelte-21p7i4");
			toggle_class(div1, "hidden", !ctx.expanded);
			attr(div2, "class", "order svelte-21p7i4");
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

			if (!current || changed.name) {
				set_data(t1, ctx.name);
			}

			if (changed.items) {
				ctx.div0_binding(null, div0);
				ctx.div0_binding(div0, null);
			}

			if (changed.regions || changed.select) {
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
		div0_binding
	};
}

class Order extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-21p7i4-style")) add_css$2();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["contractId", "name", "id"]);
	}
}

/* src\App.svelte generated by Svelte v3.5.2 */

function add_css$3() {
	var style = element("style");
	style.id = 'svelte-17zr0bs-style';
	style.textContent = ".app.svelte-17zr0bs{width:390px}.app.svelte-17zr0bs .svelte-17zr0bs{font-family:sans-serif}.app.svelte-17zr0bs .msg.svelte-17zr0bs{text-overflow:ellipsis}";
	append(document.head, style);
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.x = list[i];
	return child_ctx;
}

// (47:4) {:catch error}
function create_catch_block(ctx) {
	var div, t0, t1_value = ctx.error, t1;

	return {
		c() {
			div = element("div");
			t0 = text("Error: ");
			t1 = text(t1_value);
			attr(div, "class", "svelte-17zr0bs");
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
		},

		p: noop,
		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (43:4) {:then orders}
function create_then_block(ctx) {
	var each_1_anchor, current;

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
			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},

		m(target, anchor) {
			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},

		p(changed, ctx) {
			if (changed.get_orders) {
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
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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
			destroy_each(each_blocks, detaching);

			if (detaching) {
				detach(each_1_anchor);
			}
		}
	};
}

// (44:8) {#each orders as x}
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

	return {
		c() {
			order.$$.fragment.c();
		},

		m(target, anchor) {
			mount_component(order, target, anchor);
			current = true;
		},

		p(changed, ctx) {
			var order_changes = changed.get_orders ? get_spread_update(order_spread_levels, [
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

// (41:23)       <div class="msg">{translate('order.message')}
function create_pending_block(ctx) {
	var div, t_value = ctx.translate('order.message'), t;

	return {
		c() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", "msg svelte-17zr0bs");
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},

		p: noop,
		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function create_fragment$3(ctx) {
	var div, promise, current;

	let info = {
		ctx,
		current: null,
		pending: create_pending_block,
		then: create_then_block,
		catch: create_catch_block,
		value: 'orders',
		error: 'error',
		blocks: Array(3)
	};

	handle_promise(promise = ctx.get_orders, info);

	return {
		c() {
			div = element("div");

			info.block.c();
			attr(div, "class", "app svelte-17zr0bs");
		},

		m(target, anchor) {
			insert(target, div, anchor);

			info.block.m(div, info.anchor = null);
			info.mount = () => div;
			info.anchor = null;

			current = true;
		},

		p(changed, new_ctx) {
			ctx = new_ctx;
			info.ctx = ctx;

			if (promise !== (promise = ctx.get_orders) && handle_promise(promise, info)) ; else {
				info.block.p(changed, assign(assign({}, ctx), info.resolved));
			}
		},

		i(local) {
			if (current) return;
			transition_in(info.block);
			current = true;
		},

		o(local) {
			for (let i = 0; i < 3; i += 1) {
				const block = info.blocks[i];
				transition_out(block);
			}

			current = false;
		},

		d(detaching) {
			if (detaching) {
				detach(div);
			}

			info.block.d();
			info = null;
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	

    scanexTranslations_cjs.addText('eng', {
        order: {
            message: 'Getting orders'
        }        
    });

    scanexTranslations_cjs.addText('rus', {        
        order: {
            message: 'Получение заказов'
        }        
    });

    const translate = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

    let { clientId = 0 } = $$props;

    let get_orders =
        fetch(`api/Customers/${clientId}`)
        .then(response => response.json())
        .then(json => json.orders);

	$$self.$set = $$props => {
		if ('clientId' in $$props) $$invalidate('clientId', clientId = $$props.clientId);
	};

	return { translate, clientId, get_orders };
}

class App extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-17zr0bs-style")) add_css$3();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["clientId"]);
	}
}

const app = new App ({
    target: document.body
});

module.exports = app;
//# sourceMappingURL=catalog-order-viewer.cjs.js.map
