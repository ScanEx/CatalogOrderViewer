<script>
    import Region from './Region.svelte';
    import Info from './Info.svelte';
    import {createEventDispatcher} from 'svelte';
    import './Order.css';

    const dispatch = createEventDispatcher();

    export let contractId = '';
    export let name = '';
    //export let openDate = ''; //
    export let date = '';
    export let time = '';
    export let id;
    let regions = [];
    let expanded = false;
    let loaded = false;
    const toggle = () => {
        if (!loaded && !expanded) {
            fetch(`api/Regions/ByOrder/${id}`)
            .then(response => response.json())
            .then(json => {
                loaded = true;
                regions = json;
            })
            .catch(e => console.log(e));
        }
        expanded = !expanded;
    };

    let headerContainer;
    let info;    

    const select = ({detail}) => {
        const {sceneId, productType,  date, time, product: {platform, name, }, reset} = detail;
        if (!info) {
            info = new Info({
                target: document.body,
                props: {sceneId, productType, date, time, platform, name}
            });
            const {top, left, width} = headerContainer.getBoundingClientRect();
            info.adjustPosition({top, left: left + width + 20});
            info.$on('close', () => {
                info.$destroy();
                info = null;
                reset();
            });
        }
        else {
            info.$set({sceneId, productType, date, time, platform, name});
        }        
    };       

</script>

<div class="order">
    <div class="header" on:click|stopPropagation="{toggle}" bind:this="{headerContainer}">
        <i class="icon" class:caret-right="{!expanded}" class:caret-down="{expanded}"></i>
        <span>{contractId || name || date }</span>
    </div>
    <div class="content" class:hidden="{!expanded}">
        {#each regions as r}
        <Region {...r}
            on:select="{select}"
            on:selection="{({detail}) => dispatch('selection', detail)}"
            on:download="{() => dispatch('download')}"
            on:preview="{({detail}) => dispatch('preview', detail)}"
            on:expand="{({detail}) => dispatch('expand', detail)}" />
        {/each}
    </div>
</div>