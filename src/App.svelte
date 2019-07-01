<script>
    import Order from './Order.svelte';
    import T from 'scanex-translations';

    T.addText('eng', {
        order: {
            message: 'Getting orders'
        }        
    });

    T.addText('rus', {        
        order: {
            message: 'Получение заказов'
        }        
    });

    const translate = T.getText.bind(T);

    export let clientId = 0;

    let get_orders =
        fetch(`api/Customers/${clientId}`)
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
    .app .msg {
        text-overflow: ellipsis;
    }
</style>

<div class="app">
    {#await get_orders}
    <div class="msg">{translate('order.message')}</div>
    {:then orders}
        {#each orders as x}
        <Order {...x} />
        {/each}
    {:catch error}
    <div>Error: {error}</div>
    {/await}
</div>