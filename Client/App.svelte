<script>
    import Order from './Order.svelte';

    let get_orders =
        fetch('api/Customers/7884')
        .then(response => response.json())
        .then(json => json.orders);

</script>

<style>
    .app {
        width: 390px;
    }
    .app * {
        font-family: sans-serif;
    }
</style>

<div class="app">
    {#await get_orders}
    <div>Getting orders...</div>
    {:then orders}
        {#each orders as x}
        <Order {...x} />
        {/each}
    {:catch error}
    <div>Error: {error}</div>
    {/await}
</div>