<script>
    import Order from './Order.svelte';
    import {createEventDispatcher, onDestroy} from 'svelte';
    import {visibility} from './store.js';
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
    
    let files = {};

    function selection ({detail}) {
        const {path, state} = detail;
        if(state) {
            files[path] = 1;
        }
        else {
            delete files[path];
        }
        console.log(files);
    }

</script>

<div class="app">    
    {#each orders as x}
    <Order
        {...x}
        on:selection="{selection}"
        on:download="{({detail}) => dispatch('download', detail)}"
        on:preview="{({detail}) => dispatch('preview', detail)}"
        on:expand="{({detail}) => dispatch('expand', detail)}" />
    {/each}    
</div>