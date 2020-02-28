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
    .box {
        position: relative;
        background-color: #1835A5;
        margin-bottom: 1.5em;
        display:inline-block;
        width: 80%;
        height: 8em;
        margin-top: 1.5em;
        border: 0.5em solid #1B98E0;
        box-sizing: border-box;
        box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.50);
    }
    .name {
        font-weight: bold;
        color: #1B98E0;
        width: 80%;
        height: 100%;
        font-size: 3em;
        text-align: left;
        padding-left: 1em;
        line-height: 230%;
        float: left;
    }
    .number {
        font-weight: bold;
        width: 20%;
        top: 30%;
        height: 100%;
        font-size: 3em;
        text-align: right;
        padding-right: 1em;
        line-height: 260%;
        float: right;
    }

    img {
        height: 1em;
    }
</style>


<div class="box" on:click={locatePressed}>
    <div class = "name">
        <span>LOCATE ME</span>
        {#if loadingLocation}
            <img {src} alt="loading...">
        {/if}
    </div>
    <div class = "number"><img src={'nav-icon.svg'} alt="nav-icon"/></div>
</div>
