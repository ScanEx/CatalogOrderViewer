<script>
    import './File.css';
    import {createEventDispatcher, afterUpdate} from 'svelte';

    export let isDir = false;    
    export let path = '';
    export let expanded = false;
    export let state = 0;
    export let size = 0;

    let initialized = false;
    let selected = [];
    let checked = 0;

    const dispatch = createEventDispatcher();

    $: name = path.substr(path.lastIndexOf('\\') + 1);
    $: children = [];
    $: if (state != -1) {
        checked = state;
    }    
    
    function expand (items) {
        if (children.length === 0) {
            children = items;
            selected = children.map(() => 0);
            expanded = true;
        }              
    }

    function toggle () {
        if(!initialized) {
            dispatch('expand', {expand, filePath: path});
            initialized = true;
        }        
        expanded = !expanded;
    }

    function check () {
        switch (state) {
            case -1:                
            case 0:
                state = 1;                
                break;
            case 1:
                state = 0;                
                break;
            default:
                break;
        }           
    }

    function select (i, s) {
        selected[i] = s;
        if (selected.every(k => k === 1)) {
            state = 1;
        }
        else if (selected.every(k => k === 0)) {
            state = 0;            
        }
        else {
            state = -1;
        }        
    }

    afterUpdate(() => {                
        dispatch('check', state);
        dispatch('selection', {path, state, size});
    });     

</script>

<div class="entry">
    <div class="header">        
        {#if isDir}
        <i  class="icon"
            class:check-square="{state === 1}"
            class:square="{state === 0}"
            class:minus-square="{state === -1}"
            on:click|stopPropagation="{check}"></i>
        <i  class="icon"
            class:folder="{!expanded}"
            class:folder-open="{expanded}"
            on:click|stopPropagation="{toggle}"></i>
        {:else}
        <i  class="icon"
            class:check-square="{state === 1}"
            class:square="{state === 0}"
            on:click|stopPropagation="{check}"></i>
        <i class="icon file"></i>
        {/if}
        <div>{name}</div> 
    </div>                   
    <div class="children" class:hidden="{!expanded}">        
        {#each children as child, i}
        <svelte:self {...child}
            state="{checked}"            
            on:check="{({detail}) => select(i, detail)}"
            on:expand="{({detail}) => dispatch('expand', detail)}"
            on:selection="{({detail}) => dispatch('selection', detail)}" />
        {/each}        
    </div>    
</div>    
