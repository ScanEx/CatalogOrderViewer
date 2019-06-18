<script>
    import Orders from './Orders.svelte';

    let orders = [];

    fetch('api/Clients/7965')
    .then(response => response.json())
    .then(json => orders = json.orders)
    .catch(e => console.log(e));

</script>

<style>
    .app > * {
        display: inline-block;
        vertical-align: top;
    }
</style>

<div class="app">
    <div class="sidebar">
        <Orders bind:items="{orders}"/>
    </div>    
    <div class="map">MAP</div>
</div>