<script>
    export let data;
    let days = data[0];
    let type = data[1];

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
</script>

<span style="color:rgb({GreenYellowRed(days)})">{days}</span>