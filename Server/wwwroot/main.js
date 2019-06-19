var App = (function () {
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
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

    /* Client\Region.svelte generated by Svelte v3.5.2 */

    function add_css() {
    	var style = element("style");
    	style.id = 'svelte-120ipp6-style';
    	style.textContent = ".roi.svelte-120ipp6{margin-top:8px;font-family:'IBM Plex Sans'}.roi.svelte-120ipp6:last-child{margin-bottom:8px}.roi.svelte-120ipp6 .header.svelte-120ipp6{padding:17px 10px 17px 10px;cursor:pointer;background-color:#F3F7FA;border:1px solid #D8E1E8;border-top-left-radius:5px;border-top-right-radius:5px}.roi.svelte-120ipp6 .header.collapsed.svelte-120ipp6{border-bottom-left-radius:5px;border-bottom-right-radius:5px}.roi.svelte-120ipp6 .header .toggle.svelte-120ipp6{display:inline-block;font:normal normal normal 14px/1 FontAwesome;font-size:inherit;text-rendering:auto;-webkit-font-smoothing:antialiased}.roi.svelte-120ipp6 .header>.svelte-120ipp6,.roi.svelte-120ipp6 .header>.size>.svelte-120ipp6{vertical-align:middle}.roi.svelte-120ipp6 .header>.toggle.expanded.svelte-120ipp6::before{content:\"\\f0d7\"}.roi.svelte-120ipp6 .header>.toggle.collapsed.svelte-120ipp6::before{content:\"\\f0da\"}.roi.svelte-120ipp6 .header .size.svelte-120ipp6{float:right}.roi.svelte-120ipp6 .header>.size>.download.svelte-120ipp6{display:inline-block;background-image:url('download.png');background-position:center;background-repeat:no-repeat;width:20px;height:20px}.roi.svelte-120ipp6 .header>.preview.svelte-120ipp6{display:inline-block;background-image:url('preview.png');background-position:center;background-repeat:no-repeat;width:16px;height:16px}.roi.svelte-120ipp6 .header>.preview.svelte-120ipp6,.roi.svelte-120ipp6 .header>.name.svelte-120ipp6{margin-left:10px}.roi.svelte-120ipp6 .content.svelte-120ipp6{border-left:1px solid #D8E1E8;border-bottom:1px solid #D8E1E8;border-right:1px solid #D8E1E8;border-bottom-left-radius:5px;border-bottom-right-radius:5px}.roi.svelte-120ipp6 .content.hidden.svelte-120ipp6{display:none}.roi.svelte-120ipp6 .content table th.svelte-120ipp6,.roi.svelte-120ipp6 .content table td.svelte-120ipp6{text-align:left;border-right:1px solid #D8E1E8;padding-top:6px;padding-bottom:6px}.roi.svelte-120ipp6 .content table th.svelte-120ipp6:last-child,.roi.svelte-120ipp6 .content table td.svelte-120ipp6:last-child{border-right:none}.roi.svelte-120ipp6 .content table th.svelte-120ipp6:first-child,.roi.svelte-120ipp6 .content table td.svelte-120ipp6:first-child{padding-left:32px;padding-right:9px}.roi.svelte-120ipp6 .content table th.svelte-120ipp6:nth-child(2),.roi.svelte-120ipp6 .content table td.svelte-120ipp6:nth-child(2){padding-left:9px}.roi.svelte-120ipp6 .content table th.svelte-120ipp6{color:#92A0AC;border-bottom:1px solid #D8E1E8}.roi.svelte-120ipp6 .content table td.svelte-120ipp6{color:#455467}";
    	append(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.g = list[i];
    	return child_ctx;
    }

    // (139:12) {#each granules as g}
    function create_each_block(ctx) {
    	var tr, td0, t0_value = ctx.g.product.name, t0, t1, td1, t2, t3_value = ctx.translate('mb'), t3, t4, td2, t5;

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
    			t5 = space();
    			attr(td0, "class", "svelte-120ipp6");
    			attr(td1, "class", "svelte-120ipp6");
    			attr(td2, "class", "svelte-120ipp6");
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
    		},

    		p(changed, ctx) {
    			if ((changed.granules) && t0_value !== (t0_value = ctx.g.product.name)) {
    				set_data(t0, t0_value);
    			}
    		},

    		d(detaching) {
    			if (detaching) {
    				detach(tr);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div3, div1, i0, t0, i1, t1, span0, t2, t3, div0, span1, t4, t5_value = ctx.translate('mb'), t5, t6, i2, t7, div2, table, tr, th0, t8_value = ctx.translate('product'), t8, t9, th1, t10_value = ctx.translate('size'), t10, t11, th2, t12, dispose;

    	var each_value = ctx.granules;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div3 = element("div");
    			div1 = element("div");
    			i0 = element("i");
    			t0 = space();
    			i1 = element("i");
    			t1 = space();
    			span0 = element("span");
    			t2 = text(ctx.name);
    			t3 = space();
    			div0 = element("div");
    			span1 = element("span");
    			t4 = text("550 ");
    			t5 = text(t5_value);
    			t6 = space();
    			i2 = element("i");
    			t7 = space();
    			div2 = element("div");
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			t8 = text(t8_value);
    			t9 = space();
    			th1 = element("th");
    			t10 = text(t10_value);
    			t11 = space();
    			th2 = element("th");
    			t12 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(i0, "class", "toggle svelte-120ipp6");
    			toggle_class(i0, "collapsed", !ctx.expanded);
    			toggle_class(i0, "expanded", ctx.expanded);
    			attr(i1, "class", "preview svelte-120ipp6");
    			attr(span0, "class", "name svelte-120ipp6");
    			attr(span1, "class", "svelte-120ipp6");
    			attr(i2, "class", "download svelte-120ipp6");
    			attr(div0, "class", "size svelte-120ipp6");
    			attr(div1, "class", "header svelte-120ipp6");
    			toggle_class(div1, "collapsed", !ctx.expanded);
    			attr(th0, "class", "svelte-120ipp6");
    			attr(th1, "class", "svelte-120ipp6");
    			attr(th2, "class", "svelte-120ipp6");
    			attr(table, "cellpadding", "0");
    			attr(table, "cellspacing", "0");
    			attr(div2, "class", "content svelte-120ipp6");
    			toggle_class(div2, "hidden", !ctx.expanded);
    			attr(div3, "class", "roi svelte-120ipp6");
    			dispose = listen(i0, "click", stop_propagation(ctx.click_handler));
    		},

    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div1);
    			append(div1, i0);
    			append(div1, t0);
    			append(div1, i1);
    			append(div1, t1);
    			append(div1, span0);
    			append(span0, t2);
    			append(div1, t3);
    			append(div1, div0);
    			append(div0, span1);
    			append(span1, t4);
    			append(span1, t5);
    			append(div0, t6);
    			append(div0, i2);
    			append(div3, t7);
    			append(div3, div2);
    			append(div2, table);
    			append(table, tr);
    			append(tr, th0);
    			append(th0, t8);
    			append(tr, t9);
    			append(tr, th1);
    			append(th1, t10);
    			append(tr, t11);
    			append(tr, th2);
    			append(table, t12);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
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

    			if (changed.expanded) {
    				toggle_class(div1, "collapsed", !ctx.expanded);
    			}

    			if (changed.translate || changed.granules) {
    				each_value = ctx.granules;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.expanded) {
    				toggle_class(div2, "hidden", !ctx.expanded);
    			}
    		},

    		i: noop,
    		o: noop,

    		d(detaching) {
    			if (detaching) {
    				detach(div3);
    			}

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { name = '', granules = [] } = $$props;
        let expanded = false;    

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

        const translate = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

    	function click_handler() {
    		const $$result = expanded = !expanded;
    		$$invalidate('expanded', expanded);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('granules' in $$props) $$invalidate('granules', granules = $$props.granules);
    	};

    	return {
    		name,
    		granules,
    		expanded,
    		translate,
    		click_handler
    	};
    }

    class Region extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-120ipp6-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, ["name", "granules"]);
    	}
    }

    /* Client\Order.svelte generated by Svelte v3.5.2 */

    function add_css$1() {
    	var style = element("style");
    	style.id = 'svelte-wogyxl-style';
    	style.textContent = ".order.svelte-wogyxl .header>.svelte-wogyxl{display:inline-block}.order.svelte-wogyxl .header.svelte-wogyxl{cursor:pointer}.order.svelte-wogyxl .header .icon.svelte-wogyxl{display:inline-block;font:normal normal normal 14px/1 FontAwesome;font-size:inherit;text-rendering:auto;-webkit-font-smoothing:antialiased}.order.svelte-wogyxl .header>.icon.expanded.svelte-wogyxl::before{content:\"\\f0d7\"}.order.svelte-wogyxl .header>.icon.collapsed.svelte-wogyxl::before{content:\"\\f0da\"}.order.svelte-wogyxl .content.svelte-wogyxl{padding-left:15px}.order.svelte-wogyxl .content.hidden.svelte-wogyxl{display:none}";
    	append(document.head, style);
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.r = list[i];
    	return child_ctx;
    }

    // (57:8) {#each regions as r}
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

    function create_fragment$1(ctx) {
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
    			t1 = text(ctx.contractId);
    			t2 = space();
    			div1 = element("div");

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}
    			attr(i, "class", "icon svelte-wogyxl");
    			toggle_class(i, "collapsed", !ctx.expanded);
    			toggle_class(i, "expanded", ctx.expanded);
    			attr(span, "class", "svelte-wogyxl");
    			attr(div0, "class", "header svelte-wogyxl");
    			attr(div1, "class", "content svelte-wogyxl");
    			toggle_class(div1, "hidden", !ctx.expanded);
    			attr(div2, "class", "order svelte-wogyxl");
    			dispose = listen(div0, "click", stop_propagation(ctx.toggle));
    		},

    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div0, i);
    			append(div0, t0);
    			append(div0, span);
    			append(span, t1);
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

    			if (!current || changed.contractId) {
    				set_data(t1, ctx.contractId);
    			}

    			if (changed.regions) {
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

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
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
    		toggle
    	};
    }

    class Order extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-wogyxl-style")) add_css$1();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["contractId", "name", "id"]);
    	}
    }

    /* Client\App.svelte generated by Svelte v3.5.2 */

    function add_css$2() {
    	var style = element("style");
    	style.id = 'svelte-yedfog-style';
    	style.textContent = ".app.svelte-yedfog .svelte-yedfog{font-family:sans-serif}";
    	append(document.head, style);
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.x = list[i];
    	return child_ctx;
    }

    // (24:4) {:catch error}
    function create_catch_block(ctx) {
    	var div, t0, t1_value = ctx.error, t1;

    	return {
    		c() {
    			div = element("div");
    			t0 = text("Error: ");
    			t1 = text(t1_value);
    			attr(div, "class", "svelte-yedfog");
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

    // (20:4) {:then orders}
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

    // (21:8) {#each orders as x}
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

    // (18:23)       <div>Getting orders...</div>      {:then orders}
    function create_pending_block(ctx) {
    	var div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "Getting orders...";
    			attr(div, "class", "svelte-yedfog");
    		},

    		m(target, anchor) {
    			insert(target, div, anchor);
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

    function create_fragment$2(ctx) {
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
    			attr(div, "class", "app svelte-yedfog");
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

    function instance$2($$self) {
    	let get_orders =
            fetch('api/Customers/7884')
            .then(response => response.json())
            .then(json => json.orders);

    	return { get_orders };
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-yedfog-style")) add_css$2();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    const app = new App ({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=main.js.map
