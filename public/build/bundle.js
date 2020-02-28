
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

    /* src/StateLocator.svelte generated by Svelte v3.18.2 */
    const file = "src/StateLocator.svelte";

    // (125:8) {#if loadingLocation}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "loading...");
    			attr_dev(img, "class", "svelte-1yrpg2r");
    			add_location(img, file, 125, 12, 3264);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(125:8) {#if loadingLocation}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div2;
    	let div0;
    	let span;
    	let t1;
    	let t2;
    	let div1;
    	let img;
    	let img_src_value;
    	let dispose;
    	let if_block = /*loadingLocation*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "LOCATE ME";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");
    			img = element("img");
    			add_location(span, file, 123, 8, 3199);
    			attr_dev(div0, "class", "name svelte-1yrpg2r");
    			add_location(div0, file, 122, 4, 3170);
    			if (img.src !== (img_src_value = "nav-icon.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "nav-icon");
    			attr_dev(img, "class", "svelte-1yrpg2r");
    			add_location(img, file, 128, 26, 3344);
    			attr_dev(div1, "class", "number svelte-1yrpg2r");
    			add_location(div1, file, 128, 4, 3322);
    			attr_dev(div2, "class", "box svelte-1yrpg2r");
    			add_location(div2, file, 121, 0, 3123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span);
    			append_dev(div0, t1);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			dispose = listen_dev(div2, "click", /*locatePressed*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*loadingLocation*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
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

    function instance($$self, $$props, $$invalidate) {
    	let $stateData;
    	validate_store(stateData, "stateData");
    	component_subscribe($$self, stateData, $$value => $$invalidate(5, $stateData = $$value));
    	let stateLocs = [];
    	let currentLocation = null;
    	let loadingLocation = false;
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
    		selectedState.set($stateData.find(element => element.code == getState()["code"]));
    	}

    	function error(err) {
    		$$invalidate(0, loadingLocation = false);
    		loadingDenied = true;
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
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("$stateData" in $$props) stateData.set($stateData = $$props.$stateData);
    	};

    	return [loadingLocation, src, locatePressed];
    }

    class StateLocator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StateLocator",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/Countdown.svelte generated by Svelte v3.18.2 */

    const file$1 = "src/Countdown.svelte";

    function create_fragment$1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*days*/ ctx[0]);
    			set_style(span, "color", "rgb(" + GreenYellowRed(/*days*/ ctx[0]) + ")");
    			add_location(span, file$1, 25, 0, 514);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
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

    	b = 100;
    	return `${r},${g},${b}`;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { data } = $$props;
    	let days = data[0];
    	let type = data[1];
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Countdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { data, days, type };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("days" in $$props) $$invalidate(0, days = $$props.days);
    		if ("type" in $$props) type = $$props.type;
    	};

    	return [days, data];
    }

    class Countdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Countdown",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[1] === undefined && !("data" in props)) {
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

    /* src/StateBox.svelte generated by Svelte v3.18.2 */
    const file$2 = "src/StateBox.svelte";

    // (53:4) {#if data.bestOption}
    function create_if_block$1(ctx) {
    	let div;
    	let current;

    	const countdown = new Countdown({
    			props: { data: /*data*/ ctx[0].bestOption },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(countdown.$$.fragment);
    			attr_dev(div, "class", "number svelte-o8axwg");
    			add_location(div, file$2, 53, 9, 1152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(countdown, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const countdown_changes = {};
    			if (dirty & /*data*/ 1) countdown_changes.data = /*data*/ ctx[0].bestOption;
    			countdown.$set(countdown_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(countdown.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(countdown.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(countdown);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(53:4) {#if data.bestOption}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*data*/ ctx[0].name.toUpperCase() + "";
    	let t0;
    	let t1;
    	let current;
    	let dispose;
    	let if_block = /*data*/ ctx[0].bestOption && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "name svelte-o8axwg");
    			add_location(div0, file$2, 51, 4, 1067);
    			attr_dev(div1, "class", "box svelte-o8axwg");
    			add_location(div1, file$2, 50, 0, 1016);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			if (if_block) if_block.m(div1, null);
    			current = true;

    			dispose = listen_dev(
    				div1,
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
    			if ((!current || dirty & /*data*/ 1) && t0_value !== (t0_value = /*data*/ ctx[0].name.toUpperCase() + "")) set_data_dev(t0, t0_value);

    			if (/*data*/ ctx[0].bestOption) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			dispose();
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

    function handleClick(data) {
    	selectedState.set(data);
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StateBox",
    			options,
    			id: create_fragment$2.name
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
    const file$3 = "src/StateList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (118:4) {#if supportsGeolocation()}
    function create_if_block$2(ctx) {
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(118:4) {#if supportsGeolocation()}",
    		ctx
    	});

    	return block;
    }

    // (121:4) {#each Object.entries(tempData) as state}
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
    		source: "(121:4) {#each Object.entries(tempData) as state}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div4;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let show_if = supportsGeolocation();
    	let t4;
    	let t5;
    	let div3;
    	let t6;
    	let br0;
    	let br1;
    	let t7;
    	let br2;
    	let br3;
    	let t8;
    	let a;
    	let br4;
    	let current;
    	let if_block = show_if && create_if_block$2(ctx);
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
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "STATE";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "DAYS LEFT";
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div3 = element("div");
    			t6 = text("PRIMARYVOTE.US DOES NOT STORE ANY INFO ABOUT YOU");
    			br0 = element("br");
    			br1 = element("br");
    			t7 = text("\n        IT DOESN'T EVEN USE GOOGLE FOR GEOLOCATION");
    			br2 = element("br");
    			br3 = element("br");
    			t8 = text("\n        MADE BY ");
    			a = element("a");
    			a.textContent = "@KARTIKHELPS";
    			br4 = element("br");
    			attr_dev(div0, "class", "left svelte-jy7fkl");
    			add_location(div0, file$3, 114, 8, 2734);
    			attr_dev(div1, "class", "right svelte-jy7fkl");
    			add_location(div1, file$3, 115, 8, 2772);
    			attr_dev(div2, "class", "titles svelte-jy7fkl");
    			add_location(div2, file$3, 113, 4, 2705);
    			add_location(br0, file$3, 124, 56, 3049);
    			add_location(br1, file$3, 124, 61, 3054);
    			add_location(br2, file$3, 125, 50, 3110);
    			add_location(br3, file$3, 125, 55, 3115);
    			attr_dev(a, "href", "https://twitter.com/kartikhelps");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "svelte-jy7fkl");
    			add_location(a, file$3, 126, 16, 3137);
    			add_location(br4, file$3, 126, 90, 3211);
    			attr_dev(div3, "class", "about svelte-jy7fkl");
    			add_location(div3, file$3, 123, 4, 2973);
    			attr_dev(div4, "class", "wrapper svelte-jy7fkl");
    			add_location(div4, file$3, 112, 0, 2679);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div4, t3);
    			if (if_block) if_block.m(div4, null);
    			append_dev(div4, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, t6);
    			append_dev(div3, br0);
    			append_dev(div3, br1);
    			append_dev(div3, t7);
    			append_dev(div3, br2);
    			append_dev(div3, br3);
    			append_dev(div3, t8);
    			append_dev(div3, a);
    			append_dev(div3, br4);
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
    						each_blocks[i].m(div4, t5);
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
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
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

    function supportsGeolocation() {
    	return navigator.geolocation !== null && navigator.geolocation !== undefined;
    }

    function getDaysUntil(date) {
    	let daysUntil = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));

    	if (daysUntil >= 0) {
    		return daysUntil;
    	} else {
    		return null;
    	}
    }

    function bestOption(onlineDate, mailDate, personDate) {
    	if (getDaysUntil(onlineDate)) {
    		return [getDaysUntil(onlineDate), "online"];
    	} else if (getDaysUntil(mailDate)) {
    		return [getDaysUntil(mailDate), "by mail"];
    	} else if (getDaysUntil(personDate)) {
    		return [getDaysUntil(personDate), "in person"];
    	} else return null;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let tempData = [];

    	onMount(async () => {
    		const res = await fetch(`state-data.json`);
    		$$invalidate(0, tempData = await res.json());

    		tempData.forEach(element => {
    			var personDate = new Date(element.dates.person);
    			var onlineDate = null;

    			if (element.dates.online) {
    				onlineDate = new Date(element.dates.online);
    			}

    			var mailDate = new Date(element.dates.mail);
    			element["bestOption"] = bestOption(onlineDate, mailDate, personDate);
    		});

    		//tempData.sort(compareBestOptions);
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StateList",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/StateInfo.svelte generated by Svelte v3.18.2 */
    const file$4 = "src/StateInfo.svelte";

    // (118:8) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "IT MAY BE TOO LATE TO REGISTER BUT YOU CAN STILL CHECK";
    			attr_dev(div, "class", "info svelte-1s82cgy");
    			add_location(div, file$4, 118, 12, 2607);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(118:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (114:8) {#if bestOptionResult}
    function create_if_block_2(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2_value = /*bestOptionResult*/ ctx[3][1].toUpperCase() + "";
    	let t2;
    	let current;

    	const countdown = new Countdown({
    			props: { data: /*bestOptionResult*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("YOU HAVE ");
    			create_component(countdown.$$.fragment);
    			t1 = text(" DAYS LEFT TO REGISTER ");
    			t2 = text(t2_value);
    			attr_dev(div, "class", "info svelte-1s82cgy");
    			add_location(div, file$4, 114, 12, 2420);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			mount_component(countdown, div, null);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(countdown.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(countdown.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(countdown);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(114:8) {#if bestOptionResult}",
    		ctx
    	});

    	return block;
    }

    // (126:8) {#if bestOptionResult}
    function create_if_block$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*bestOptionResult*/ ctx[3][0] > 7 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*bestOptionResult*/ ctx[3][0] > 7) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(126:8) {#if bestOptionResult}",
    		ctx
    	});

    	return block;
    }

    // (127:12) {#if bestOptionResult[0] > 7}
    function create_if_block_1(ctx) {
    	let div;
    	let t;
    	let div_onclick_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("REMIND ME LATER");
    			attr_dev(div, "onclick", div_onclick_value = "window.open('" + /*remindURL*/ ctx[2] + "','_blank');");
    			attr_dev(div, "class", "remind svelte-1s82cgy");
    			add_location(div, file$4, 127, 16, 2955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(127:12) {#if bestOptionResult[0] > 7}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div7;
    	let div2;
    	let div1;
    	let div0;
    	let span;
    	let t0_value = /*selectedState_value*/ ctx[0].name.toUpperCase() + "";
    	let t0;
    	let t1;
    	let div4;
    	let current_block_type_index;
    	let if_block0;
    	let t2;
    	let div3;
    	let t3;
    	let div3_onclick_value;
    	let t4;
    	let t5;
    	let div6;
    	let div5;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*bestOptionResult*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*bestOptionResult*/ ctx[3] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			div4 = element("div");
    			if_block0.c();
    			t2 = space();
    			div3 = element("div");
    			t3 = text("REGISTER NOW");
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div5.textContent = "BACK";
    			add_location(span, file$4, 108, 16, 2255);
    			attr_dev(div0, "class", "top svelte-1s82cgy");
    			add_location(div0, file$4, 107, 12, 2221);
    			attr_dev(div1, "class", "container svelte-1s82cgy");
    			add_location(div1, file$4, 106, 8, 2185);
    			attr_dev(div2, "class", "header svelte-1s82cgy");
    			add_location(div2, file$4, 105, 4, 2156);
    			attr_dev(div3, "onclick", div3_onclick_value = "window.open('" + (/*baseURL*/ ctx[1] + /*selectedState_value*/ ctx[0].code) + "','_blank');");
    			attr_dev(div3, "class", "box svelte-1s82cgy");
    			add_location(div3, file$4, 122, 8, 2738);
    			attr_dev(div4, "class", "main svelte-1s82cgy");
    			add_location(div4, file$4, 112, 4, 2358);
    			attr_dev(div5, "class", "back svelte-1s82cgy");
    			add_location(div5, file$4, 134, 8, 3160);
    			attr_dev(div6, "class", "footer svelte-1s82cgy");
    			add_location(div6, file$4, 133, 4, 3129);
    			attr_dev(div7, "class", "wrapper svelte-1s82cgy");
    			add_location(div7, file$4, 104, 0, 2130);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, t0);
    			append_dev(div7, t1);
    			append_dev(div7, div4);
    			if_blocks[current_block_type_index].m(div4, null);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, t3);
    			append_dev(div4, t4);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			current = true;
    			dispose = listen_dev(div5, "click", resetState, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*selectedState_value*/ 1) && t0_value !== (t0_value = /*selectedState_value*/ ctx[0].name.toUpperCase() + "")) set_data_dev(t0, t0_value);
    			if_block0.p(ctx, dirty);

    			if (!current || dirty & /*selectedState_value*/ 1 && div3_onclick_value !== (div3_onclick_value = "window.open('" + (/*baseURL*/ ctx[1] + /*selectedState_value*/ ctx[0].code) + "','_blank');")) {
    				attr_dev(div3, "onclick", div3_onclick_value);
    			}

    			if (/*bestOptionResult*/ ctx[3]) if_block1.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			dispose();
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

    function resetState() {
    	selectedState.set(null);
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let baseURL = "https://iwillvote.com/register/?lang=en&state=";
    	let remindURL = "https://www.vote.org/election-reminders/";
    	let selectedState_value;

    	const unsubscribe = selectedState.subscribe(value => {
    		$$invalidate(0, selectedState_value = value);
    	});

    	let bestOptionResult = selectedState_value["bestOption"];

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("baseURL" in $$props) $$invalidate(1, baseURL = $$props.baseURL);
    		if ("remindURL" in $$props) $$invalidate(2, remindURL = $$props.remindURL);
    		if ("selectedState_value" in $$props) $$invalidate(0, selectedState_value = $$props.selectedState_value);
    		if ("bestOptionResult" in $$props) $$invalidate(3, bestOptionResult = $$props.bestOptionResult);
    	};

    	return [selectedState_value, baseURL, remindURL, bestOptionResult];
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

    /* src/App.svelte generated by Svelte v3.18.2 */
    const file$5 = "src/App.svelte";

    // (76:0) {:else}
    function create_else_block$1(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let div2;
    	let current;
    	const statelist = new StateList({ $$inline: true });

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "HOW MANY DAYS LEFT TO REGISTER TO VOTE IN MY PRIMARY?";
    			t1 = space();
    			div2 = element("div");
    			create_component(statelist.$$.fragment);
    			add_location(span, file$5, 79, 10, 1355);
    			attr_dev(div0, "class", "top svelte-g4ai3d");
    			add_location(div0, file$5, 78, 3, 1327);
    			attr_dev(div1, "class", "header svelte-g4ai3d");
    			add_location(div1, file$5, 77, 2, 1303);
    			attr_dev(div2, "class", "main svelte-g4ai3d");
    			add_location(div2, file$5, 82, 2, 1446);
    			attr_dev(div3, "class", "wrapper svelte-g4ai3d");
    			add_location(div3, file$5, 76, 1, 1279);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			mount_component(statelist, div2, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(statelist);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(76:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:0) {#if $selectedState}
    function create_if_block$4(ctx) {
    	let current;
    	const stateinfo = new StateInfo({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(stateinfo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stateinfo, target, anchor);
    			current = true;
    		},
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(74:0) {#if $selectedState}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let html;
    	let meta;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$1];
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
    			add_location(html, file$5, 68, 1, 1128);
    			attr_dev(meta, "name", "viewport");
    			attr_dev(meta, "content", "width=device-width, initial-scale=1");
    			add_location(meta, file$5, 69, 1, 1148);
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

    			if (current_block_type_index !== previous_block_index) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
