<script>
    import Order from './Order.svelte';
    import {createEventDispatcher, onDestroy} from 'svelte';
    import {visibility} from './store.js';
    import './App.css';
    import './icons.css';

    const dispatch = createEventDispatcher();

    const download = () => {
        dispatch('download', Object.keys(files));
    };

    export let orders = [];

    export function resetVisibility () {
        visibility.set(false);
    }
    
    let files = {};

    function selection ({detail}) {
        const {path, state} = detail;
        if(state === 1) {
            files[path] = 1;
        }
        else {
            delete files[path];
        }    
    }

</script>

<div class="app">    
    {#each orders as x}
    <Order
        {...x}
        on:selection="{selection}"
        on:download="{download}"
        on:preview="{({detail}) => dispatch('preview', detail)}"
        on:expand="{({detail}) => dispatch('expand', detail)}" />
    {/each}    
</div>