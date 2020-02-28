<script>
    import {
        selectedState
    } from './stores.js';
    import Countdown from './Countdown.svelte'

    let baseURL = 'https://iwillvote.com/register/?lang=en&state='
    let remindURL = 'https://www.vote.org/election-reminders/';
    let selectedState_value;

    const unsubscribe = selectedState.subscribe(value => {
        selectedState_value = value;
    });

    let bestOptionResult = selectedState_value['bestOption']

    function resetState() {
        selectedState.set(null);
    }
</script>

<style>
    .wrapper {
        width: 100%;
        height: 100%;
        position: relative;
        text-align: center;
    }

    .wrapper>.header {
        height: 25%;
        background: #E8F1F2;
    }

    .wrapper>.main {
        height: 65%;
        background: #1835A5;
        overflow: scroll;
    }

    .wrapper>.footer {
        height: 10%;
        background: #1835A5;
    }

    .container {
        padding: 5px;
        height: 100%;
        position: relative;
    }

    .top {
        font-weight: bold;
        font-size: 2em;
        color: #1835A5;
        left: 10px;
        top: 10px;
        height: 60%;
    }

    .box {
        font-weight: bold;
        position: relative;
        background-color: #1835A5;
        margin: 10px;
        display: inline-block;
        width: 321px;
        height: 71px;
        border: 3px solid #E8F1F2;
        box-sizing: border-box;
        box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.25);
        font-size: 1.5em;
        color: #E8F1F2;
        text-align: center;
        line-height: 71px;
    }

    .info {
        text-align: left;
        color: #E8F1F2;
        font-size: 1.5em;
        font-weight: bold;
    }

    .remind {
        font-weight: bold;
        color: #1B98E0;
        text-align: center;
        font-size: 1em;
    }

    .back {
        font-weight: bold;
        color: #BCABAE;
        text-align: center;
        font-size: 1.5em;
    }
</style>

<div class="wrapper">
    <div class="header">
        <div class="container">
            <div class="top">
                <span>{selectedState_value.name.toUpperCase()}</span>
            </div>
        </div>
    </div>
    <div class="main">
        {#if bestOptionResult}
            <div class="info">
                YOU HAVE <Countdown data={bestOptionResult} /> DAYS LEFT TO REGISTER {bestOptionResult[1].toUpperCase()}
            </div>
            <div onclick="window.open('{baseURL+selectedState_value.code}','_blank');" class="box">
                REGISTER NOW
            </div>
            {#if bestOptionResult[0] > 7}
                <div class="remind">
                    REMIND ME LATER
                </div>
            {/if}
        {:else}
            it may be too late to register but you can double check <a href="{baseURL+selectedState_value.code}" target="_blank">here.</a>
        {/if}
    </div>
    <div class = "footer">
        <div on:click={resetState} class="back">
            BACK
        </div>
    </div>
</div>