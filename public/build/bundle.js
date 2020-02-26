
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
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

    const selectedState = writable(null);
    const stateData = writable(null);

    /* src/StateBox.svelte generated by Svelte v3.18.2 */
    const file = "src/StateBox.svelte";

    function create_fragment(ctx) {
    	let div;
    	let t_value = /*data*/ ctx[0].name + "";
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "box svelte-1jbbdcq");
    			add_location(div, file, 27, 0, 512);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			dispose = listen_dev(
    				div,
    				"click",
    				function () {
    					if (is_function(handleClick(/*data*/ ctx[0]))) handleClick(/*data*/ ctx[0]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*data*/ ctx[0].name + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleClick(data) {
    	selectedState.set(data);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StateBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { data };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	return [data];
    }

    class StateBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StateBox",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<StateBox> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<StateBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<StateBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/StateList.svelte generated by Svelte v3.18.2 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (22:0) {#each Object.entries(tempData) as state}
    function create_each_block(ctx) {
    	let current;

    	const statebox = new StateBox({
    			props: { data: /*state*/ ctx[1][1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(statebox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(statebox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const statebox_changes = {};
    			if (dirty & /*tempData*/ 1) statebox_changes.data = /*state*/ ctx[1][1];
    			statebox.$set(statebox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statebox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statebox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(statebox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(22:0) {#each Object.entries(tempData) as state}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.entries(/*tempData*/ ctx[0]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, tempData*/ 1) {
    				each_value = Object.entries(/*tempData*/ ctx[0]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let tempData = [];

    	onMount(async () => {
    		const res = await fetch(`state-data.json`);
    		$$invalidate(0, tempData = await res.json());
    		stateData.set(tempData);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("tempData" in $$props) $$invalidate(0, tempData = $$props.tempData);
    	};

    	return [tempData];
    }

    class StateList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StateList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/ReminderModule.svelte generated by Svelte v3.18.2 */

    const file$1 = "src/ReminderModule.svelte";

    function create_fragment$2(ctx) {
    	let a;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Remind me later");
    			attr_dev(a, "href", /*remindURL*/ ctx[0]);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$1, 4, 0, 84);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self) {
    	let remindURL = "https://www.vote.org/election-reminders/";

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("remindURL" in $$props) $$invalidate(0, remindURL = $$props.remindURL);
    	};

    	return [remindURL];
    }

    class ReminderModule extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReminderModule",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Countdown.svelte generated by Svelte v3.18.2 */

    const file$2 = "src/Countdown.svelte";

    function create_fragment$3(ctx) {
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let b;

    	const block = {
    		c: function create() {
    			t0 = text("You have\n");
    			span = element("span");
    			t1 = text(/*days*/ ctx[0]);
    			t2 = text("\ndays to register ");
    			b = element("b");
    			b.textContent = `${/*type*/ ctx[1]}`;
    			set_style(span, "color", "rgb(" + GreenYellowRed(/*days*/ ctx[0]) + ")");
    			attr_dev(span, "class", "day svelte-1xxde37");
    			add_location(span, file$2, 33, 0, 607);
    			add_location(b, file$2, 34, 17, 698);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, b, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function GreenYellowRed(input) {
    	var number = 100 - input;
    	var r, g, b = null;

    	if (number < 50) {
    		// green to yellow
    		r = Math.floor(255 * (number / 50));

    		g = 255;
    	} else {
    		// yellow to red
    		r = 255;

    		g = Math.floor(255 * ((50 - number % 50) / 50));
    	}

    	b = 0;
    	return `${r},${g},${b}`;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { data } = $$props;
    	let days = data[0];
    	let type = data[1];
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Countdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { data, days, type };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("days" in $$props) $$invalidate(0, days = $$props.days);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    	};

    	return [days, type, data];
    }

    class Countdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Countdown",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[2] === undefined && !("data" in props)) {
    			console.warn("<Countdown> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Countdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Countdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/StateInfo.svelte generated by Svelte v3.18.2 */
    const file$3 = "src/StateInfo.svelte";

    // (64:0) {:else}
    function create_else_block(ctx) {
    	let t0;
    	let a;
    	let t1;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			t0 = text("it may be too late to register but you can double check ");
    			a = element("a");
    			t1 = text("here.");
    			attr_dev(a, "href", a_href_value = /*baseURL*/ ctx[1] + /*state*/ ctx[0].code);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$3, 64, 60, 1815);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*state*/ 1 && a_href_value !== (a_href_value = /*baseURL*/ ctx[1] + /*state*/ ctx[0].code)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(64:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (57:0) {#if bestOptionResult}
    function create_if_block(ctx) {
    	let t0;
    	let a;
    	let t1;
    	let a_href_value;
    	let t2;
    	let if_block_anchor;
    	let current;

    	const countdown = new Countdown({
    			props: { data: /*bestOptionResult*/ ctx[2] },
    			$$inline: true
    		});

    	let if_block = /*bestOptionResult*/ ctx[2][0] > 7 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			create_component(countdown.$$.fragment);
    			t0 = space();
    			a = element("a");
    			t1 = text("Register Now!");
    			t2 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(a, "href", a_href_value = /*baseURL*/ ctx[1] + /*state*/ ctx[0].code);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$3, 58, 4, 1597);
    		},
    		m: function mount(target, anchor) {
    			mount_component(countdown, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t1);
    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*state*/ 1 && a_href_value !== (a_href_value = /*baseURL*/ ctx[1] + /*state*/ ctx[0].code)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(countdown.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(countdown.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(countdown, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(57:0) {#if bestOptionResult}",
    		ctx
    	});

    	return block;
    }

    // (60:4) {#if bestOptionResult[0] > 7}
    function create_if_block_1(ctx) {
    	let br0;
    	let t0;
    	let br1;
    	let t1;
    	let current;
    	const remindermodule = new ReminderModule({ $$inline: true });

    	const block = {
    		c: function create() {
    			br0 = element("br");
    			t0 = text("-or-");
    			br1 = element("br");
    			t1 = space();
    			create_component(remindermodule.$$.fragment);
    			add_location(br0, file$3, 60, 4, 1700);
    			add_location(br1, file$3, 60, 13, 1709);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(remindermodule, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(remindermodule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(remindermodule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t1);
    			destroy_component(remindermodule, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(60:4) {#if bestOptionResult[0] > 7}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let h1;
    	let t0_value = /*state*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*bestOptionResult*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			add_location(h1, file$3, 55, 0, 1506);
    			attr_dev(div, "class", "flex-container svelte-1vonjon");
    			add_location(div, file$3, 54, 0, 1477);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*state*/ 1) && t0_value !== (t0_value = /*state*/ ctx[0].name + "")) set_data_dev(t0, t0_value);
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getDaysUntil(date) {
    	let daysUntil = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));

    	if (daysUntil >= 0) {
    		return daysUntil;
    	} else {
    		return null;
    	}
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let baseURL = "https://iwillvote.com/register/?lang=en&state=";
    	let selectedState_value;

    	const unsubscribe = selectedState.subscribe(value => {
    		$$invalidate(3, selectedState_value = value);
    	});

    	let personDate = new Date(selectedState_value.dates.person);
    	let onlineDate = null;

    	if (selectedState_value.dates.online) {
    		onlineDate = new Date(selectedState_value.dates.online);
    	}

    	let mailDate = new Date(selectedState_value.dates.mail);

    	function bestOption() {
    		if (getDaysUntil(onlineDate)) {
    			return [getDaysUntil(onlineDate), "online"];
    		} else if (getDaysUntil(mailDate)) {
    			return [getDaysUntil(mailDate), "by mail"];
    		} else if (getDaysUntil(personDate)) {
    			return [getDaysUntil(personDate), "in person"];
    		} else return null;
    	}

    	let bestOptionResult = bestOption();

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("baseURL" in $$props) $$invalidate(1, baseURL = $$props.baseURL);
    		if ("selectedState_value" in $$props) $$invalidate(3, selectedState_value = $$props.selectedState_value);
    		if ("personDate" in $$props) personDate = $$props.personDate;
    		if ("onlineDate" in $$props) onlineDate = $$props.onlineDate;
    		if ("mailDate" in $$props) mailDate = $$props.mailDate;
    		if ("bestOptionResult" in $$props) $$invalidate(2, bestOptionResult = $$props.bestOptionResult);
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    	};

    	let state;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedState_value*/ 8) {
    			 $$invalidate(0, state = selectedState_value);
    		}
    	};

    	return [state, baseURL, bestOptionResult];
    }

    class StateInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StateInfo",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/StateLocator.svelte generated by Svelte v3.18.2 */
    const file$4 = "src/StateLocator.svelte";

    // (80:0) {#if !loadingDenied}
    function create_if_block$1(ctx) {
    	let button;
    	let t1;
    	let t2;
    	let div;
    	let dispose;
    	let if_block = /*loadingLocation*/ ctx[0] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Locate Me!";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div = element("div");
    			div.textContent = "-or-";
    			add_location(button, file$4, 80, 4, 2305);
    			add_location(div, file$4, 84, 4, 2435);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			dispose = listen_dev(button, "click", /*locatePressed*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (/*loadingLocation*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(80:0) {#if !loadingDenied}",
    		ctx
    	});

    	return block;
    }

    // (82:4) {#if loadingLocation}
    function create_if_block_1$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "loading...");
    			add_location(img, file$4, 82, 8, 2392);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(82:4) {#if loadingLocation}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let if_block = !/*loadingDenied*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*loadingDenied*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function distance(loc1, loc2) {
    	var lat1 = loc1["lat"];
    	var lon1 = loc1["lon"];
    	var lat2 = loc2["lat"];
    	var lon2 = loc2["lon"];

    	if (lat1 == lat2 && lon1 == lon2) {
    		return 0;
    	} else {
    		var radlat1 = Math.PI * lat1 / 180;
    		var radlat2 = Math.PI * lat2 / 180;
    		var theta = lon1 - lon2;
    		var radtheta = Math.PI * theta / 180;
    		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

    		if (dist > 1) {
    			dist = 1;
    		}

    		dist = Math.acos(dist);
    		dist = dist * 180 / Math.PI;
    		dist = dist * 60 * 1.1515;
    		return dist;
    	}
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $stateData;
    	validate_store(stateData, "stateData");
    	component_subscribe($$self, stateData, $$value => $$invalidate(6, $stateData = $$value));
    	let stateLocs = [];
    	let currentLocation = null;
    	let loadingLocation = false;
    	let loadingDenied = false;
    	let src = "temp-loader.gif";

    	onMount(async () => {
    		const res = await fetch(`us-states-loc.json`);
    		stateLocs = await res.json();
    	});

    	function getState() {
    		var closest = stateLocs[0];
    		var closest_distance = distance(closest, currentLocation);

    		for (var i = 1; i < stateLocs.length; i++) {
    			if (distance(stateLocs[i], currentLocation) < closest_distance) {
    				closest_distance = distance(stateLocs[i], currentLocation);
    				closest = stateLocs[i];
    			}
    		}

    		return closest;
    	}

    	function success(pos) {
    		currentLocation = pos.coords;
    		currentLocation["lat"] = pos.coords.latitude;
    		currentLocation["lon"] = pos.coords.longitude;
    		$$invalidate(0, loadingLocation = false);
    		selectedState.set($stateData[getState()["code"]]);
    	}

    	function error(err) {
    		$$invalidate(0, loadingLocation = false);
    		$$invalidate(1, loadingDenied = true);
    		console.warn(`ERROR(${err.code}): ${err.message}`);
    	}

    	function getLocation() {
    		navigator.geolocation.getCurrentPosition(success, error);
    	}

    	function locatePressed() {
    		$$invalidate(0, loadingLocation = true);
    		getLocation();
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("stateLocs" in $$props) stateLocs = $$props.stateLocs;
    		if ("currentLocation" in $$props) currentLocation = $$props.currentLocation;
    		if ("loadingLocation" in $$props) $$invalidate(0, loadingLocation = $$props.loadingLocation);
    		if ("loadingDenied" in $$props) $$invalidate(1, loadingDenied = $$props.loadingDenied);
    		if ("src" in $$props) $$invalidate(2, src = $$props.src);
    		if ("$stateData" in $$props) stateData.set($stateData = $$props.$stateData);
    	};

    	return [loadingLocation, loadingDenied, src, locatePressed];
    }

    class StateLocator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StateLocator",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.2 */
    const file$5 = "src/App.svelte";

    // (49:0) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let show_if = supportsGeolocation();
    	let t;
    	let current;
    	let if_block = show_if && create_if_block_1$2(ctx);
    	const statelist = new StateList({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			create_component(statelist.$$.fragment);
    			attr_dev(div, "class", "flex-container svelte-yh8qip");
    			add_location(div, file$5, 49, 1, 987);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);
    			mount_component(statelist, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(statelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(statelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_component(statelist);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(49:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:0) {#if $selectedState}
    function create_if_block$2(ctx) {
    	let button;
    	let current;
    	let dispose;
    	const stateinfo = new StateInfo({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(stateinfo.$$.fragment);
    			button = element("button");
    			button.textContent = "back";
    			add_location(button, file$5, 47, 14, 934);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stateinfo, target, anchor);
    			insert_dev(target, button, anchor);
    			current = true;
    			dispose = listen_dev(button, "click", resetState, false, false, false);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stateinfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stateinfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(stateinfo, detaching);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(47:0) {#if $selectedState}",
    		ctx
    	});

    	return block;
    }

    // (51:2) {#if supportsGeolocation()}
    function create_if_block_1$2(ctx) {
    	let current;
    	const statelocator = new StateLocator({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(statelocator.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(statelocator, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statelocator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statelocator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(statelocator, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(51:2) {#if supportsGeolocation()}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let html;
    	let meta;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$selectedState*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			html = element("html");
    			meta = element("meta");
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    			document.title = "Can I Still Vote? - PrimaryVote.US";
    			attr_dev(html, "lang", "en");
    			add_location(html, file$5, 41, 1, 791);
    			attr_dev(meta, "name", "viewport");
    			attr_dev(meta, "content", "width=device-width, initial-scale=1.0");
    			add_location(meta, file$5, 42, 1, 811);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, html);
    			append_dev(document.head, meta);
    			insert_dev(target, t, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(html);
    			detach_dev(meta);
    			if (detaching) detach_dev(t);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function resetState() {
    	selectedState.set(null);
    }

    function supportsGeolocation() {
    	return navigator.geolocation !== null && navigator.geolocation !== undefined;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $selectedState;
    	validate_store(selectedState, "selectedState");
    	component_subscribe($$self, selectedState, $$value => $$invalidate(0, $selectedState = $$value));

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$selectedState" in $$props) selectedState.set($selectedState = $$props.$selectedState);
    	};

    	return [$selectedState];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
