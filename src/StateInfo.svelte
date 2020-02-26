<script>
    import {
        selectedState
    } from './stores.js';
    import ReminderModule from './ReminderModule.svelte'
    import Countdown from './Countdown.svelte'

    let baseURL = 'https://iwillvote.com/register/?lang=en&state='
    let selectedState_value;

    const unsubscribe = selectedState.subscribe(value => {
        selectedState_value = value;
    });

    $: state = selectedState_value;
    let personDate = new Date(selectedState_value.dates.person);
    let onlineDate = null;
    if (selectedState_value.dates.online) {
        onlineDate = new Date(selectedState_value.dates.online);
    }
    let mailDate = new Date(selectedState_value.dates.mail);

    function getDaysUntil(date) {
        let daysUntil = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24))
        if (daysUntil >= 0) {
            return daysUntil
        } else {
            return null
        }
    }

    function bestOption() {
        if (getDaysUntil(onlineDate)) {
            return [getDaysUntil(onlineDate), "online"]
        } else if (getDaysUntil(mailDate)) {
            return [getDaysUntil(mailDate), "by mail"]
        } else if (getDaysUntil(personDate)) {
            return [getDaysUntil(personDate), "in person"]
        } else
            return null
    }

    let bestOptionResult = bestOption();
</script>

<style>
	.flex-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
    }
</style>

<div class="flex-container">
<h1>{state.name}</h1>
{#if bestOptionResult}
    <Countdown data={bestOptionResult} />
    <a href="{baseURL+state.code}" target="_blank">Register Now!</a>
    {#if bestOptionResult[0] > 7}
    <br/>-or-<br/>
    <ReminderModule/>
    {/if}
{:else}
    it may be too late to register but you can double check <a href="{baseURL+state.code}" target="_blank">here.</a>
{/if}
</div>