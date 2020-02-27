<script>
    import {
        onMount
    } from "svelte";

    import {
        stateData
    } from './stores.js';

    let tempData = []

    import StateBox from './StateBox.svelte';

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

    onMount(async () => {
        const res = await fetch(`state-data.json`);
        tempData = await res.json();

        for (const property in tempData) {
            var curState = tempData[property];
            var personDate = new Date(curState.dates.person);
            var onlineDate = null;
            if (curState.dates.online) {
                onlineDate = new Date(curState.dates.online);
            }
            var mailDate = new Date(curState.dates.mail);

            curState['bestOption'] = bestOption(onlineDate, mailDate, personDate);
        }
        stateData.set(tempData);
    });
</script>

<style>
    .wrapper {
        text-align: center;
    }
</style>
<div class="wrapper">
    {#each Object.entries(tempData) as state}
    <StateBox data={state[1]}/>
{/each}
</div>