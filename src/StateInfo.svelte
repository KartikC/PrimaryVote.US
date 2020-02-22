<script>
    import {
        selectedState
    } from './stores.js';
    import ReminderModule from './ReminderModule.svelte'

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

</script>

<h1>{state.name}</h1>
Last day to register:
<ul>
    <li>in person: {personDate.toDateString()}</li>
    {#if onlineDate}
         <li>online: {onlineDate.toDateString()}</li>
    {:else}
         <li>online: not available in your state</li>
    {/if}
    <li>by mail: {mailDate.toDateString()}</li>
</ul>
<a href="{baseURL+state.code}">Register Now!</a>
-or-
<ReminderModule/>