<script>
    import {
        onMount
    } from "svelte";

    import {
        selectedState,
        stateData
    } from './stores.js';

    let stateLocs = [];
    let currentLocation = null;
    let loadingLocation = false;
    let loadingDenied = false;
    let src = 'temp-loader.gif';

    onMount(async () => {
        const res = await fetch(`us-states-loc.json`);
        stateLocs = await res.json();
    });

    function distance(loc1, loc2) {
        var lat1 = loc1["lat"];
        var lon1 = loc1["lon"];
        var lat2 = loc2["lat"];
        var lon2 = loc2["lon"];
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        } else {
            var radlat1 = Math.PI * lat1 / 180;
            var radlat2 = Math.PI * lat2 / 180;
            var theta = lon1 - lon2;
            var radtheta = Math.PI * theta / 180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(
                radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            return dist;
        }
    }

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
        loadingLocation = false;
        selectedState.set($stateData.find( element => element.code ==  getState()["code"]));
    }

    function error(err) {
        loadingLocation = false;
        loadingDenied = true;
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    function getLocation() {
        navigator.geolocation.getCurrentPosition(success, error);
    }

    function locatePressed() {
        loadingLocation = true;
        getLocation();
    }
</script>

<style>
    .wrapper {
        padding: 5px;
        height: 100%;
        position: relative;
    }

    .text {
        font-weight: bold;
        font-size: 2em;
    }

    .top {
        color: #1835A5;
        left: 10px;
        top: 10px;
        height: 60%;
    }

    .locate {
        font-size: 1em;
        height: 40%;
        right: 10px;
        bottom: 10px;
        text-align: right;
    }

    img {
        height: 30px;
    }

    .icon {
        width: 100%;
    }

    .locate-text {
        width: 100%;
        font-weight: bold;
        color: #1B98E0;
        font-size: 1.5em;
    }
</style>

<div class="wrapper">
    <div class="top">
        <span class="text">HOW MANY DAYS DO I HAVE LEFT TO REGISTER?</span>
    </div>
    <div class="locate" on:click={locatePressed}>
    {#if !loadingDenied}
        <div class = "icon"><img src={'nav-icon.svg'} alt="nav-icon"/></div>
        <div class = "locate-text"><span>LOCATE ME</span></div>
        {#if loadingLocation}
            <img {src} alt="loading...">
        {/if}
    {/if}
    </div>
</div>