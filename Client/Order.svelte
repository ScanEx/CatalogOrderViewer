<script>
    import Region from './Region.svelte';
    import Info from './Info.svelte';

    export let contractId = '';
    export let name = '';
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
        const {sceneId, product: {platform}, reset} = detail;
        if (!info) {
            info = new Info({
                target: document.body,
                props: {sceneId, platform}
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
            info.$set({sceneId, platform});
        }        
    };
</script>

<style>
    .order .header > * {
        display: inline-block;
    }
    .order .header {
        cursor: pointer;
    }
    .order .header .icon {
        cursor: pointer;
        display: inline-block;
        background-position: center;
        background-repeat: no-repeat;
        width: 12px;
        height: 12px;
    }
    .order .header .icon.expanded {
        background-image: url('arrow-down.png');
    }
    .order .header .icon.collapsed{
        background-image: url('arrow-right.png');
    }
    .order .content {
        padding-left: 15px;
    }
    .order .content.hidden {
        display: none;
    }
</style>

<div class="order">
    <div class="header" on:click|stopPropagation="{toggle}" bind:this="{headerContainer}">
        <i class="icon" class:collapsed="{!expanded}" class:expanded="{expanded}"></i>
        <span>{contractId}</span>        
    </div>
    <div class="content" class:hidden="{!expanded}">
        {#each regions as r}
        <Region {...r} on:select="{select}" />
        {/each}
    </div>
</div>