<script>
    import Order from './Order.svelte';
    import {createEventDispatcher, onDestroy} from 'svelte';
    import {visibility, selection} from './store.js';
    import './App.css';
    import './icons.css';

    const dispatch = createEventDispatcher();

    const download = ({detail}) => {
        dispatch('download', detail);
    };    

    export let orders = [];

    export function resetVisibility () {
        visibility.set(false);
    }
    
    // const unsubscribe = selection.subscribe(value => {
    //     console.log('selection=',value);
    //     // dispatch('change', Object.keys(value));
    // });

    // onDestroy(unsubscribe);

</script>

<div class="app">    
    {#each orders as x}
    <Order
        {...x}
        on:download="{({detail}) => dispatch('download', detail)}"
        on:preview="{({detail}) => dispatch('preview', detail)}"
        on:expand="{({detail}) => dispatch('expand', detail)}" />
    {/each}    
</div>