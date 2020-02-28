
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.setAttribute('aria-hidden', 'true');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
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

    // (126:8) {#if loadingLocation}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "loading...");
    			attr_dev(img, "class", "svelte-1cutgw8");
    			add_location(img, file, 126, 12, 3291);
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
    		source: "(126:8) {#if loadingLocation}",
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
    			add_location(span, file, 124, 8, 3226);
    			attr_dev(div0, "class", "name svelte-1cutgw8");
    			add_location(div0, file, 123, 4, 3197);
    			if (img.src !== (img_src_value = "nav-icon.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "nav-icon");
    			attr_dev(img, "class", "svelte-1cutgw8");
    			add_location(img, file, 129, 26, 3371);
    			attr_dev(div1, "class", "number svelte-1cutgw8");
    			add_location(div1, file, 129, 4, 3349);
    			attr_dev(div2, "class", "box svelte-1cutgw8");
    			add_location(div2, file, 122, 0, 3150);
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

    // (65:4) {:else}
    function create_else_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "done-icon.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "done-icon");
    			attr_dev(img, "class", "svelte-jy7tdf");
    			add_location(img, file$2, 65, 34, 1344);
    			attr_dev(div, "class", "number check svelte-jy7tdf");
    			add_location(div, file$2, 65, 8, 1318);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
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
    		source: "(65:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:4) {#if data.bestOption}
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
    			attr_dev(div, "class", "number svelte-jy7tdf");
    			add_location(div, file$2, 63, 8, 1236);
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
    		source: "(63:4) {#if data.bestOption}",
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
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].bestOption) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			attr_dev(div0, "class", "name svelte-jy7tdf");
    			add_location(div0, file$2, 61, 4, 1152);
    			attr_dev(div1, "class", "box svelte-jy7tdf");
    			add_location(div1, file$2, 60, 0, 1101);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			if_blocks[current_block_type_index].m(div1, null);
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
    				if_block.m(div1, null);
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
    			if_blocks[current_block_type_index].d();
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
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (116:4) {#if supportsGeolocation()}
    function create_if_block_1(ctx) {
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(116:4) {#if supportsGeolocation()}",
    		ctx
    	});

    	return block;
    }

    // (123:4) {#each Object.entries(tempData) as state}
    function create_each_block(ctx) {
    	let current;

    	const statebox = new StateBox({
    			props: { data: /*state*/ ctx[2][1] },
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
    			if (dirty & /*tempData*/ 1) statebox_changes.data = /*state*/ ctx[2][1];
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
    		source: "(123:4) {#each Object.entries(tempData) as state}",
    		ctx
    	});

    	return block;
    }

    // (126:4) {#if listLoaded}
    function create_if_block$2(ctx) {
    	let div;
    	let t0;
    	let br0;
    	let br1;
    	let t1;
    	let br2;
    	let br3;
    	let t2;
    	let a;
    	let br4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("PRIMARYVOTE.US DOES NOT STORE ANY INFO ABOUT YOU");
    			br0 = element("br");
    			br1 = element("br");
    			t1 = text("\n            IT DOESN'T EVEN USE GOOGLE FOR GEOLOCATION");
    			br2 = element("br");
    			br3 = element("br");
    			t2 = text("\n            MADE BY ");
    			a = element("a");
    			a.textContent = "@KARTIKHELPS";
    			br4 = element("br");
    			add_location(br0, file$3, 127, 60, 3179);
    			add_location(br1, file$3, 127, 65, 3184);
    			add_location(br2, file$3, 128, 54, 3244);
    			add_location(br3, file$3, 128, 59, 3249);
    			attr_dev(a, "href", "https://twitter.com/kartikhelps");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "svelte-1beewck");
    			add_location(a, file$3, 129, 20, 3275);
    			add_location(br4, file$3, 129, 94, 3349);
    			attr_dev(div, "class", "about svelte-1beewck");
    			add_location(div, file$3, 126, 8, 3099);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, br0);
    			append_dev(div, br1);
    			append_dev(div, t1);
    			append_dev(div, br2);
    			append_dev(div, br3);
    			append_dev(div, t2);
    			append_dev(div, a);
    			append_dev(div, br4);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(126:4) {#if listLoaded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div3;
    	let show_if = supportsGeolocation();
    	let t0;
    	let div2;
    	let div0;
    	let t2;
    	let div1;
    	let t4;
    	let t5;
    	let current;
    	let if_block0 = show_if && create_if_block_1(ctx);
    	let each_value = Object.entries(/*tempData*/ ctx[0]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block1 = /*listLoaded*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "STATE";
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "DAYS LEFT";
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "left svelte-1beewck");
    			add_location(div0, file$3, 119, 8, 2892);
    			attr_dev(div1, "class", "right svelte-1beewck");
    			add_location(div1, file$3, 120, 8, 2930);
    			attr_dev(div2, "class", "titles svelte-1beewck");
    			add_location(div2, file$3, 118, 4, 2863);
    			attr_dev(div3, "class", "wrapper svelte-1beewck");
    			add_location(div3, file$3, 114, 0, 2780);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div3, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div3, t5);
    			if (if_block1) if_block1.m(div3, null);
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
    						each_blocks[i].m(div3, t5);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*listLoaded*/ ctx[1]) {
    				if (!if_block1) {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
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
    	let listLoaded = false;

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

    		//tempData.sort(compareBestOptions); not sorting by days left
    		stateData.set(tempData);

    		$$invalidate(1, listLoaded = true);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("tempData" in $$props) $$invalidate(0, tempData = $$props.tempData);
    		if ("listLoaded" in $$props) $$invalidate(1, listLoaded = $$props.listLoaded);
    	};

    	return [tempData, listLoaded];
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

    // (163:8) {:else}
    function create_else_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "IT MAY BE TOO LATE TO REGISTER BUT YOU CAN STILL CHECK";
    			attr_dev(div, "class", "info svelte-75x4lx");
    			add_location(div, file$4, 163, 12, 3951);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(163:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (159:8) {#if bestOptionResult}
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
    			attr_dev(div, "class", "info svelte-75x4lx");
    			add_location(div, file$4, 159, 12, 3764);
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
    		source: "(159:8) {#if bestOptionResult}",
    		ctx
    	});

    	return block;
    }

    // (171:8) {#if bestOptionResult}
    function create_if_block$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*bestOptionResult*/ ctx[3][0] > 7 && create_if_block_1$1(ctx);

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
    		source: "(171:8) {#if bestOptionResult}",
    		ctx
    	});

    	return block;
    }

    // (172:12) {#if bestOptionResult[0] > 7}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t;
    	let div_onclick_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("REMIND ME LATER");
    			attr_dev(div, "onclick", div_onclick_value = "window.open('" + /*remindURL*/ ctx[2] + "','_blank');");
    			attr_dev(div, "class", "remind svelte-75x4lx");
    			add_location(div, file$4, 172, 16, 4299);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(172:12) {#if bestOptionResult[0] > 7}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div8;
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
    	let div7;
    	let div5;
    	let t7;
    	let div6;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_2, create_else_block$1];
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
    			div8 = element("div");
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
    			div7 = element("div");
    			div5 = element("div");
    			div5.textContent = "BACK";
    			t7 = space();
    			div6 = element("div");
    			div6.textContent = "SHARE";
    			add_location(span, file$4, 153, 16, 3599);
    			attr_dev(div0, "class", "top svelte-75x4lx");
    			add_location(div0, file$4, 152, 12, 3565);
    			attr_dev(div1, "class", "container svelte-75x4lx");
    			add_location(div1, file$4, 151, 8, 3529);
    			attr_dev(div2, "class", "header svelte-75x4lx");
    			add_location(div2, file$4, 150, 4, 3500);
    			attr_dev(div3, "onclick", div3_onclick_value = "window.open('" + (/*baseURL*/ ctx[1] + /*selectedState_value*/ ctx[0].code) + "','_blank');");
    			attr_dev(div3, "class", "box svelte-75x4lx");
    			add_location(div3, file$4, 167, 8, 4082);
    			attr_dev(div4, "class", "main svelte-75x4lx");
    			add_location(div4, file$4, 157, 4, 3702);
    			attr_dev(div5, "class", "footer-text back svelte-75x4lx");
    			add_location(div5, file$4, 179, 8, 4504);
    			attr_dev(div6, "class", "footer-text share svelte-75x4lx");
    			add_location(div6, file$4, 182, 8, 4597);
    			attr_dev(div7, "class", "footer svelte-75x4lx");
    			add_location(div7, file$4, 178, 4, 4473);
    			attr_dev(div8, "class", "wrapper svelte-75x4lx");
    			add_location(div8, file$4, 149, 0, 3474);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, t0);
    			append_dev(div8, t1);
    			append_dev(div8, div4);
    			if_blocks[current_block_type_index].m(div4, null);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, t3);
    			append_dev(div4, t4);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div8, t5);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div7, t7);
    			append_dev(div7, div6);
    			current = true;

    			dispose = [
    				listen_dev(div5, "click", resetState, false, false, false),
    				listen_dev(div6, "click", /*nativeShare*/ ctx[4], false, false, false)
    			];
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
    			if (detaching) detach_dev(div8);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			run_all(dispose);
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
    	let $selectedState;
    	validate_store(selectedState, "selectedState");
    	component_subscribe($$self, selectedState, $$value => $$invalidate(5, $selectedState = $$value));
    	let baseURL = "https://iwillvote.com/register/?lang=en&state=";
    	let remindURL = "https://www.vote.org/election-reminders/";
    	let selectedState_value;

    	const unsubscribe = selectedState.subscribe(value => {
    		$$invalidate(0, selectedState_value = value);
    	});

    	let bestOptionResult = selectedState_value["bestOption"];

    	function makeShareData() {
    		const shareData = {
    			title: "Do you plan on voting in your primary?",
    			text: "",
    			url: "https://PrimaryVote.US"
    		};

    		if (bestOptionResult) {
    			shareData.text = `Registration to vote in ${$selectedState.name} ends in ${bestOptionResult[0]} days!`;
    		} else {
    			shareData.text = `Registration to vote in ${$selectedState.name} may be over, but you can still check online.`;
    		}

    		return shareData;
    	}

    	async function nativeShare() {
    		const shareData = makeShareData();

    		try {
    			await navigator.share(shareData);
    		} catch(err) {
    			console.warn(err);
    			var share_uri = "https://www.addtoany.com/share#url=&title=";
    			var share_uri = `https://www.addtoany.com/share#url=${shareData.url}&title=${shareData.text}`;
    			var wo = window.open("about:blank", null, "height=500,width=500");
    			wo.opener = null;
    			wo.location = share_uri;
    		}
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("baseURL" in $$props) $$invalidate(1, baseURL = $$props.baseURL);
    		if ("remindURL" in $$props) $$invalidate(2, remindURL = $$props.remindURL);
    		if ("selectedState_value" in $$props) $$invalidate(0, selectedState_value = $$props.selectedState_value);
    		if ("bestOptionResult" in $$props) $$invalidate(3, bestOptionResult = $$props.bestOptionResult);
    		if ("$selectedState" in $$props) selectedState.set($selectedState = $$props.$selectedState);
    	};

    	return [selectedState_value, baseURL, remindURL, bestOptionResult, nativeShare];
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/TooWide.svelte generated by Svelte v3.18.2 */
    const file$5 = "src/TooWide.svelte";

    function create_fragment$5(ctx) {
    	let span;
    	let t0;
    	let br;
    	let t1;
    	let span_intro;
    	let span_outro;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("YOUR BROWSER WINDOW IS TOO WIDE");
    			br = element("br");
    			t1 = text("MAKE IT SMALLER TO CONTINUE 😅");
    			add_location(br, file$5, 22, 35, 493);
    			attr_dev(span, "class", "text svelte-18p3gnb");
    			add_location(span, file$5, 21, 0, 360);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, br);
    			append_dev(span, t1);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (span_outro) span_outro.end(1);
    				if (!span_intro) span_intro = create_in_transition(span, fly, { y: 200, duration: 1000 });
    				span_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (span_intro) span_intro.invalidate();
    			span_outro = create_out_transition(span, fly, { y: -200, duration: 1000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching && span_outro) span_outro.end();
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

    class TooWide extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TooWide",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.2 */
    const file$6 = "src/App.svelte";

    // (89:0) {:else}
    function create_else_block_1(ctx) {
    	let current;
    	const toowide = new TooWide({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(toowide.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(toowide, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toowide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toowide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(toowide, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(89:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:0) {#if w < 1100}
    function create_if_block$4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*$selectedState*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(74:0) {#if w < 1100}",
    		ctx
    	});

    	return block;
    }

    // (77:1) {:else}
    function create_else_block$2(ctx) {
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
    			span.textContent = "HOW MANY DAYS ARE LEFT TO REGISTER TO VOTE IN MY PRIMARY?";
    			t1 = space();
    			div2 = element("div");
    			create_component(statelist.$$.fragment);
    			add_location(span, file$6, 80, 5, 1385);
    			attr_dev(div0, "class", "top svelte-zdzjxj");
    			add_location(div0, file$6, 79, 4, 1362);
    			attr_dev(div1, "class", "header svelte-zdzjxj");
    			add_location(div1, file$6, 78, 3, 1337);
    			attr_dev(div2, "class", "main svelte-zdzjxj");
    			add_location(div2, file$6, 83, 3, 1480);
    			attr_dev(div3, "class", "wrapper svelte-zdzjxj");
    			add_location(div3, file$6, 77, 2, 1311);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(77:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (75:1) {#if $selectedState}
    function create_if_block_1$2(ctx) {
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(75:1) {#if $selectedState}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let html;
    	let t0;
    	let div;
    	let div_resize_listener;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*w*/ ctx[0] < 1100) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			html = element("html");
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			document.title = "Can I Still Vote? - PrimaryVote.US";
    			attr_dev(html, "lang", "en");
    			add_location(html, file$6, 69, 1, 1180);
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[2].call(div));
    			add_location(div, file$6, 72, 0, 1215);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, html);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[2].bind(div));
    			insert_dev(target, t1, anchor);
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
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			div_resize_listener.cancel();
    			if (detaching) detach_dev(t1);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let $selectedState;
    	validate_store(selectedState, "selectedState");
    	component_subscribe($$self, selectedState, $$value => $$invalidate(1, $selectedState = $$value));
    	let w = 50;

    	function div_elementresize_handler() {
    		w = this.clientWidth;
    		$$invalidate(0, w);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("w" in $$props) $$invalidate(0, w = $$props.w);
    		if ("$selectedState" in $$props) selectedState.set($selectedState = $$props.$selectedState);
    	};

    	return [w, $selectedState, div_elementresize_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {});

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
