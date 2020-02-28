<script>
    import {
        onMount
    } from "svelte";

    import {
        stateData
    } from './stores.js';

    let tempData = []

    import StateLocator from './StateLocator.svelte'
    import StateBox from './StateBox.svelte';

    function supportsGeolocation() {
		return ((navigator.geolocation !== null) && (navigator.geolocation !== undefined));
	}

    function getDaysUntil(date) {
        let daysUntil = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24))
        if (daysUntil >= 0) {
            return daysUntil
        } else {
            return null
        }
    }

    function bestOption(onlineDate, mailDate, personDate) {
        if (getDaysUntil(onlineDate)) {
            return [getDaysUntil(onlineDate), "online"]
        } else if (getDaysUntil(mailDate)) {
            return [getDaysUntil(mailDate), "by mail"]
        } else if (getDaysUntil(personDate)) {
            return [getDaysUntil(personDate), "in person"]
        } else
            return null
    }

    function compareBestOptions(a, b) {
        var a_ = a.bestOption;
        var b_ = b.bestOption;
        if (!a_ && !b_) return 1;
        if (!a_ && b_) return 1;
        if (!b_ && a_) return -1;
        if (a_[0] > b_[0]) return 1;
        if (b_[0] > a_[0]) return -1;

        return 0;
    }

    onMount(async () => {
        const res = await fetch(`state-data.json`);
        tempData = await res.json();

        tempData.forEach(element => {
            var personDate = new Date(element.dates.person);
            var onlineDate = null;
            if (element.dates.online) {
                onlineDate = new Date(element.dates.online);
            }
            var mailDate = new Date(element.dates.mail);

            element['bestOption'] = bestOption(onlineDate, mailDate, personDate);
        });
        //tempData.sort(compareBestOptions);
        stateData.set(tempData);
    });
</script>

<style>
    .wrapper {
        text-align: center;
        width: 100%;
    }

    .titles {
        position: relative;
        margin-top: 0.75em;
        margin-bottom: 0.5em;
        width: 80%;
        display:inline-block;
        font-weight: bold;
        color: #9CAFB7;
        text-align: left;
        font-size: 2em;
        box-sizing: border-box;
    }

    .left {
        float: left;
    }

    .right {
        float: right;
    }

    .about {
        position: relative;
        margin: 1em;
        width: 80%;
        display:inline-block;
        font-weight: bold;
        color: #9CAFB7;
        text-align: left;
        font-size: 2em;
        box-sizing: border-box;
    }

    .about>a {
        color: #BCABAE;
    }
</style>
<div class="wrapper">
    {#if supportsGeolocation()}
		<StateLocator/>
	{/if}
    <div class="titles">
        <div class="left">STATE</div>
        <div class="right">DAYS LEFT</div>
    </div>
    {#each Object.entries(tempData) as state}
        <StateBox data={state[1]}/>
    {/each}
    <div class="about">
        PRIMARYVOTE.US DOES NOT STORE ANY INFO ABOUT YOU<br/><br/>
        IT DOESN'T EVEN USE GOOGLE FOR GEOLOCATION<br/><br/>
        MADE BY <a href="https://twitter.com/kartikhelps" target="_blank">@KARTIKHELPS</a><br/>
    </div>
</div>