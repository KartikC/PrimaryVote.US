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
        tempData.sort(compareBestOptions);
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