var App = (function () {
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
    function add_binding_callback(fn) {
        binding_callbacks.push(fn);
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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
    function on_outro(callback) {
        outros.callbacks.push(callback);
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

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
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
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
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
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
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

    /* Client\Granule.svelte generated by Svelte v3.5.1 */

    function add_css() {
    	var style = element("style");
    	style.id = 'svelte-1xr2b64-style';
    	style.textContent = ".granule.svelte-1xr2b64{margin-top:8px}.granule.svelte-1xr2b64:last-child{margin-bottom:8px}.granule.svelte-1xr2b64 .header.svelte-1xr2b64{cursor:pointer;height:44px;padding:17px 10px 17px 10px;background-color:#F3F7FA;border:1px solid #D8E1E8;border-top-left-radius:5px;border-top-right-radius:5px}.granule.svelte-1xr2b64 .header .icon.svelte-1xr2b64{display:inline-block;font:normal normal normal 14px/1 FontAwesome;font-size:inherit;text-rendering:auto;-webkit-font-smoothing:antialiased}.granule.svelte-1xr2b64 .header>.icon.expanded.svelte-1xr2b64::before{content:\"\\f0d7\"}.granule.svelte-1xr2b64 .header>.icon.collapsed.svelte-1xr2b64::before{content:\"\\f0da\"}";
    	append(document.head, style);
    }

    function create_fragment(ctx) {
    	var div2, div0, i, t0, span, t1, t2, div1, dispose;

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			span = element("span");
    			t1 = text(ctx.sceneId);
    			t2 = space();
    			div1 = element("div");
    			i.className = "icon svelte-1xr2b64";
    			toggle_class(i, "expanded", expanded);
    			toggle_class(i, "collapsed", !expanded);
    			div0.className = "header svelte-1xr2b64";
    			div1.className = "content";
    			div2.className = "granule svelte-1xr2b64";
    			dispose = listen(div0, "click", stop_propagation(ctx.click_handler));
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
    		},

    		p(changed, ctx) {
    			if (changed.expanded) {
    				toggle_class(i, "expanded", expanded);
    				toggle_class(i, "collapsed", !expanded);
    			}

    			if (changed.sceneId) {
    				set_data(t1, ctx.sceneId);
    			}
    		},

    		i: noop,
    		o: noop,

    		d(detaching) {
    			if (detaching) {
    				detach(div2);
    			}

    			dispose();
    		}
    	};
    }

    let expanded = false;

    function instance($$self, $$props, $$invalidate) {
    	let { sceneId = '' } = $$props;

    	function click_handler() {
    		return expanded != expanded;
    	}

    	$$self.$set = $$props => {
    		if ('sceneId' in $$props) $$invalidate('sceneId', sceneId = $$props.sceneId);
    	};

    	return { sceneId, click_handler };
    }

    class Granule extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-1xr2b64-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, ["sceneId"]);
    	}
    }

    /* Client\Order.svelte generated by Svelte v3.5.1 */

    function add_css$1() {
    	var style = element("style");
    	style.id = 'svelte-wogyxl-style';
    	style.textContent = ".order.svelte-wogyxl .header>.svelte-wogyxl{display:inline-block}.order.svelte-wogyxl .header.svelte-wogyxl{cursor:pointer}.order.svelte-wogyxl .header .icon.svelte-wogyxl{display:inline-block;font:normal normal normal 14px/1 FontAwesome;font-size:inherit;text-rendering:auto;-webkit-font-smoothing:antialiased}.order.svelte-wogyxl .header>.icon.expanded.svelte-wogyxl::before{content:\"\\f0d7\"}.order.svelte-wogyxl .header>.icon.collapsed.svelte-wogyxl::before{content:\"\\f0da\"}.order.svelte-wogyxl .content.svelte-wogyxl{padding-left:15px}.order.svelte-wogyxl .content.hidden.svelte-wogyxl{display:none}";
    	append(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.g = list[i];
    	return child_ctx;
    }

    // (43:8) {#each granules as g}
    function create_each_block(ctx) {
    	var current;

    	var granule_spread_levels = [
    		ctx.g
    	];

    	let granule_props = {};
    	for (var i = 0; i < granule_spread_levels.length; i += 1) {
    		granule_props = assign(granule_props, granule_spread_levels[i]);
    	}
    	var granule = new Granule({ props: granule_props });

    	return {
    		c() {
    			granule.$$.fragment.c();
    		},

    		m(target, anchor) {
    			mount_component(granule, target, anchor);
    			current = true;
    		},

    		p(changed, ctx) {
    			var granule_changes = changed.granules ? get_spread_update(granule_spread_levels, [
    				ctx.g
    			]) : {};
    			granule.$set(granule_changes);
    		},

    		i(local) {
    			if (current) return;
    			granule.$$.fragment.i(local);

    			current = true;
    		},

    		o(local) {
    			granule.$$.fragment.o(local);
    			current = false;
    		},

    		d(detaching) {
    			granule.$destroy(detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var div2, div0, i, t0, span, t1, t2, div1, current, dispose;

    	var each_value = ctx.granules;

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block(get_each_context(ctx, each_value, i_1));
    	}

    	function outro_block(i, detaching, local) {
    		if (each_blocks[i]) {
    			if (detaching) {
    				on_outro(() => {
    					each_blocks[i].d(detaching);
    					each_blocks[i] = null;
    				});
    			}

    			each_blocks[i].o(local);
    		}
    	}

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			span = element("span");
    			t1 = text(ctx.number);
    			t2 = space();
    			div1 = element("div");

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}
    			i.className = "icon svelte-wogyxl";
    			toggle_class(i, "collapsed", !ctx.expanded);
    			toggle_class(i, "expanded", ctx.expanded);
    			span.className = "svelte-wogyxl";
    			div0.className = "header svelte-wogyxl";
    			div1.className = "content svelte-wogyxl";
    			toggle_class(div1, "hidden", !ctx.expanded);
    			div2.className = "order svelte-wogyxl";
    			dispose = listen(div0, "click", stop_propagation(ctx.click_handler));
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

    			if (!current || changed.number) {
    				set_data(t1, ctx.number);
    			}

    			if (changed.granules) {
    				each_value = ctx.granules;

    				for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    						each_blocks[i_1].i(1);
    					} else {
    						each_blocks[i_1] = create_each_block(child_ctx);
    						each_blocks[i_1].c();
    						each_blocks[i_1].i(1);
    						each_blocks[i_1].m(div1, null);
    					}
    				}

    				group_outros();
    				for (; i_1 < each_blocks.length; i_1 += 1) outro_block(i_1, 1, 1);
    				check_outros();
    			}

    			if (changed.expanded) {
    				toggle_class(div1, "hidden", !ctx.expanded);
    			}
    		},

    		i(local) {
    			if (current) return;
    			for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) each_blocks[i_1].i();

    			current = true;
    		},

    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i_1 = 0; i_1 < each_blocks.length; i_1 += 1) outro_block(i_1, 0, 0);

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
    	let { granules = [], createDate = '', number = '' } = $$props;
        let expanded = false;

    	function click_handler() {
    		const $$result = expanded = !expanded;
    		$$invalidate('expanded', expanded);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('granules' in $$props) $$invalidate('granules', granules = $$props.granules);
    		if ('createDate' in $$props) $$invalidate('createDate', createDate = $$props.createDate);
    		if ('number' in $$props) $$invalidate('number', number = $$props.number);
    	};

    	return {
    		granules,
    		createDate,
    		number,
    		expanded,
    		click_handler
    	};
    }

    class Order extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-wogyxl-style")) add_css$1();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["granules", "createDate", "number"]);
    	}
    }

    /* Client\Orders.svelte generated by Svelte v3.5.1 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (7:4) {#each items as item}
    function create_each_block$1(ctx) {
    	var current;

    	var order_spread_levels = [
    		ctx.item
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
    			var order_changes = changed.items ? get_spread_update(order_spread_levels, [
    				ctx.item
    			]) : {};
    			order.$set(order_changes);
    		},

    		i(local) {
    			if (current) return;
    			order.$$.fragment.i(local);

    			current = true;
    		},

    		o(local) {
    			order.$$.fragment.o(local);
    			current = false;
    		},

    		d(detaching) {
    			order.$destroy(detaching);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var div, current;

    	var each_value = ctx.items;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	function outro_block(i, detaching, local) {
    		if (each_blocks[i]) {
    			if (detaching) {
    				on_outro(() => {
    					each_blocks[i].d(detaching);
    					each_blocks[i] = null;
    				});
    			}

    			each_blocks[i].o(local);
    		}
    	}

    	return {
    		c() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    		},

    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},

    		p(changed, ctx) {
    			if (changed.items) {
    				each_value = ctx.items;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						each_blocks[i].i(1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].i(1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();
    				for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
    				check_outros();
    			}
    		},

    		i(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

    			current = true;
    		},

    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0, 0);

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

    function instance$2($$self, $$props, $$invalidate) {
    	let { items = [] } = $$props;

    	$$self.$set = $$props => {
    		if ('items' in $$props) $$invalidate('items', items = $$props.items);
    	};

    	return { items };
    }

    class Orders extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["items"]);
    	}
    }

    /* Client\App.svelte generated by Svelte v3.5.1 */

    function add_css$2() {
    	var style = element("style");
    	style.id = 'svelte-2pglop-style';
    	style.textContent = ".app.svelte-2pglop>.svelte-2pglop{display:inline-block;vertical-align:top}";
    	append(document.head, style);
    }

    function create_fragment$3(ctx) {
    	var div2, div0, updating_items, t, div1, current;

    	function orders_1_items_binding(value) {
    		ctx.orders_1_items_binding.call(null, value);
    		updating_items = true;
    		add_flush_callback(() => updating_items = false);
    	}

    	let orders_1_props = {};
    	if (ctx.orders !== void 0) {
    		orders_1_props.items = ctx.orders;
    	}
    	var orders_1 = new Orders({ props: orders_1_props });

    	add_binding_callback(() => bind(orders_1, 'items', orders_1_items_binding));

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			orders_1.$$.fragment.c();
    			t = space();
    			div1 = element("div");
    			div1.textContent = "MAP";
    			div0.className = "sidebar svelte-2pglop";
    			div1.className = "map svelte-2pglop";
    			div2.className = "app svelte-2pglop";
    		},

    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			mount_component(orders_1, div0, null);
    			append(div2, t);
    			append(div2, div1);
    			current = true;
    		},

    		p(changed, ctx) {
    			var orders_1_changes = {};
    			if (!updating_items && changed.orders) {
    				orders_1_changes.items = ctx.orders;
    			}
    			orders_1.$set(orders_1_changes);
    		},

    		i(local) {
    			if (current) return;
    			orders_1.$$.fragment.i(local);

    			current = true;
    		},

    		o(local) {
    			orders_1.$$.fragment.o(local);
    			current = false;
    		},

    		d(detaching) {
    			if (detaching) {
    				detach(div2);
    			}

    			orders_1.$destroy();
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let orders = [];

        fetch('api/Clients/7965')
        .then(response => response.json())
        .then(json => { const $$result = orders = json.orders; $$invalidate('orders', orders); return $$result; })
        .catch(e => console.log(e));

    	function orders_1_items_binding(value) {
    		orders = value;
    		$$invalidate('orders', orders);
    	}

    	return { orders, orders_1_items_binding };
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-2pglop-style")) add_css$2();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    	}
    }

    const app = new App ({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=main.js.map
