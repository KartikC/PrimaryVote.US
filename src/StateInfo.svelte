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

    let bestOptionResult = selectedState_value['bestOption'];

    function makeShareData() {
        const shareData = {
            title: 'Do you plan on voting in your primary?',
            text: '',
            url: 'https://PrimaryVote.US'
        };
        if (bestOptionResult) {
            shareData.text = `Registration to vote in ${$selectedState.name} ends in ${bestOptionResult[0]} days!`;
        } else {
            shareData.text =
                `Registration to vote in ${$selectedState.name} may be over, but you can still check online.`;
        }
        return shareData;
    }

    async function nativeShare() {
        const shareData = makeShareData();
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.warn(err);
            var share_uri = 'https://www.addtoany.com/share#url=&title=';
            var share_uri = `https://www.addtoany.com/share#url=${shareData.url}&title=${shareData.text}`;
            var wo = window.open(
                'about:blank',
                null,
                'height=500,width=500'
            );
            wo.opener = null;
            wo.location = share_uri;
        }
    }

    function resetState() {
        selectedState.set(null);
    }
</script>

<style>
    .wrapper {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .wrapper>.header {
        height: 25%;
        background: #E8F1F2;
    }

    .wrapper>.main {
        height: 65%;
        background: #1835A5;
        text-align: center;
        width: 100%;
        overflow: scroll;
    }

    .wrapper>.footer {
        height: 10%;
        width: 100%;
        background: #1835A5;
        display: inline-block;
        box-sizing: border-box;
        padding: 0 5em 0 5em;
    }

    .container {
        padding: 5px;
        text-align: center;
        height: 100%;
    }

    .top {
        display: inline-block;
        font-weight: bold;
        font-size: 5vh;
        color: #1835A5;
        padding-top: 2em;
    }

    .info {
        position: relative;
        margin: 1em;
        width: 80%;
        display: inline-block;
        font-weight: bold;
        color: #E8F1F2;
        text-align: left;
        font-size: 3em;
        box-sizing: border-box;
        margin-bottom: 3em;
    }

    .box {
        font-weight: bold;
        position: relative;
        background-color: #1835A5;
        margin-bottom: 0.5em;
        display: inline-block;
        width: 80%;
        height: 3em;
        border: 0.25em solid #E8F1F2;
        box-sizing: border-box;
        box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.25);
        font-size: 3em;
        color: #E8F1F2;
        text-align: center;
        line-height: 2.5em;
    }

    .remind {
        font-weight: bold;
        color: #1B98E0;
        text-align: center;
        font-size: 3em;
    }

    .footer-text {
        font-weight: bold;
        color: #BCABAE;
        font-size: 3em;
    }

    .back {
        float: left;
    }

    .share {
        float: right;
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
        {:else}
            <div class="info">
                IT MAY BE TOO LATE TO REGISTER BUT YOU CAN STILL CHECK
            </div>
        {/if}
        <div onclick="window.open('{baseURL+selectedState_value.code}','_blank');" class="box">
            REGISTER NOW
        </div>
        {#if bestOptionResult}
            {#if bestOptionResult[0] > 7}
                <div onclick="window.open('{remindURL}','_blank');" class="remind">
                    REMIND ME LATER
                </div>
            {/if}
        {/if}
    </div>
    <div class = "footer">
        <div on:click={resetState} class="footer-text back">
            BACK
        </div>
        <div on:click={nativeShare} class="footer-text share">
            SHARE
        </div>
    </div>
</div>