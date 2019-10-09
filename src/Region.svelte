<script>
    import T from 'scanex-translations';
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { visibility } from './store.js';    

    export let id = '';
    export let geoJSON = null;
    export let name = '';
    export let granules = [];
    export let visible = false;
    let expanded = false;    
    let selected = -1;

    T.addText('eng', {
        product: 'Product',
        size: 'Size',
        mb: 'Mb'
    });

    T.addText('rus', {
        product: 'Продукт',
        size: 'Размер',
        mb: 'Мб'
    });

    let checked = false;
    let unchecked = true;
    let undetermined = false;

    $: {
        checked = granules.every(({granule: {product}}) => product.checked);
        undetermined = !checked && granules.some(({granule: {product}}) => product.checked);
        unchecked = !checked && !undetermined;
    }

    const toggle = () => {
        let items = granules.slice();
        items.forEach(({granule: {product}}) => {
            product.checked = unchecked;
        });
        granules = items;
    };

    const dispatch = createEventDispatcher();

    const reset = () => {
        selected = -1;
    };

    const select = i => {
        selected = i;
        const {granule} = granules[i];
        dispatch('select', {...granule, reset});
    };

    const translate = T.getText.bind(T);

    const download = () => {
        dispatch('download', id);
    };

    const preview = () => {        
        visible = !visible;     
        if (visible) {
            visibility.set(true);
        }
                        
        const gs = granules.reduce((a, {granuleId}) => {
            a[granuleId] = true;
            return a;
        }, {});
        dispatch('preview', {id, visible, granules: gs, geoJson});
    };

    let unsubscribe = visibility.subscribe(value => {
        if (!value) {
            visible = false;
        }
    });

    onDestroy(() => unsubscribe());
    
</script>

<style>    
    .roi {
        margin-top: 8px;
        font-family: 'IBM Plex Sans';
    }
    .roi:last-child {
        margin-bottom: 8px;
    }
    .roi .header {
        padding: 17px 7px 17px 9px;
        cursor: pointer;        
        background-color: #F3F7FA;
        border: 1px solid #D8E1E8;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        width: 100%;
    }     
    .roi .header td,
    .roi .content th,
    .roi .content td {
        white-space: nowrap;
    }
    .roi .header.collapsed {
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;
    }      
    .roi .header .toggle {
        cursor: pointer;
        display: inline-block;
        background-position: center;
        background-repeat: no-repeat;
        width: 12px;
        height: 12px;
    }
    .roi .header .toggle.expanded {
        background-image: url('arrow-down.png');
    }
    .roi .header .toggle.collapsed{
        background-image: url('arrow-right.png');
    }
    /* .roi .content .check, */
    .roi .header .down,
    .roi .header .preview,
    .roi .content .info {
        cursor: pointer;
        display: inline-block;
        background-position: center;
        background-repeat: no-repeat;        
    }
    .roi .header .down {                
        width: 20px;
        height: 20px;
        margin-left: 5px;
    }
    .roi .header .down.active {
        background-image: url('down-active.png');
    }
    .roi .header .down.inactive {
        background-image: url('down-inactive.png');
    }
    .roi .header .preview {                
        width: 16px;
        height: 16px;
    }
    .roi .header .preview.active {
        background-image: url('preview-active.png');
    }
    .roi .header .preview.inactive {
        background-image: url('preview-inactive.png');
    }
    .roi .header .preview,
    .roi .header .name {
        margin-left: 10px;
    }
    .roi .content {        
        border-left: 1px solid #D8E1E8;
        border-bottom: 1px solid #D8E1E8;
        border-right: 1px solid #D8E1E8;
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;        
    }
    .roi .content.hidden {
        display: none;
    }
    .roi .content th,
    .roi .content td {
        text-align: left;
        border-left: 1px solid #D8E1E8;
        padding-top: 6px;
        padding-bottom: 6px;
        padding-left: 12px;
        padding-right: 12px;        
    }
    .roi .header .name,
    .roi .content th:first-child {
        width: 100%;
    }
    .roi .content th:first-child,
    .roi .content td:first-child,
    .roi .content th:last-child,
    .roi .content td:last-child {        
        border-left: none;
    }         
    .roi .content th:first-child,
    .roi .content td:first-child {
        padding-left: 32px;            
    }    
    .roi .content th {        
        color: #92A0AC;
        border-bottom: 1px solid #D8E1E8;
    }
    .roi .content td {
        color: #455467;
        cursor: pointer;
        border-top: 1px solid transparent;
        border-bottom: 1px solid transparent;
    }
    .roi .content .info {        
        background-image: url('info.png');        
        width: 16px;
        height: 16px;
    }
    /* .roi .content .check {        
        width: 14px;
        height: 14px;        
    }
    .roi .content .check.checked {
        background-image: url('check_on.png');
    }
    .roi .content .check.unchecked {
        background-image: url('check_off.png');
    }
    .roi .content .check.undetermined {
        background-image: url('check_un.png');
    } */
    .roi .content .selected td {
        border-top: 1px solid #00A2D3;
        border-bottom: 1px solid #00A2D3;
    }
    .roi .content .selected td:first-child {
        border-left: 1px solid #00A2D3;
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
    }
    .roi .content .selected td:last-child {
        border-right: 1px solid #00A2D3;
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;
    }
</style>

<div class="roi">
    <table class="header" class:collapsed="{!expanded}">
        <tr>
            <td>
                <i class="toggle" on:click|stopPropagation="{() => expanded = !expanded}" class:collapsed="{!expanded}" class:expanded="{expanded}"></i>
            </td>
            <td>
                <i class="preview" class:active="{visible}" class:inactive="{!visible}" on:click|stopPropagation="{preview}"></i>
            </td>
            <td class="name" on:click|stopPropagation="{() => expanded = !expanded}">{name}</td>
            <!-- {#if expanded}
            <td>550 {translate('mb')}</td>
            {/if} -->
            <td>
                <i class="down" on:click|stopPropagation="{download}" class:active="{expanded}" class:inactive="{!expanded}"></i>
            </td>
        </tr>                                
    </table>
    <table class="content" class:hidden="{!expanded}" cellpadding="0" cellspacing="0">
        <tr>
            <th>{translate('product')}</th>
            <!-- <th>{translate('size')}</th> -->
            <th></th>
            <!-- <th on:click="{toggle}">
                <i class="check" class:checked="{checked}" class:unchecked="{unchecked}" class:undetermined="{undetermined}"></i>
            </th> -->
        </tr>
        {#each granules as g, i}
        <tr class:selected="{i === selected}" on:click="{() => select(i)}">
            <td>{g.granule.product.name}</td>
            <!-- <td>100 {translate('mb')}</td> -->
            <td>
                <i class="info"></i>
            </td>
            <!-- <td on:click|stopPropagation="{() => granules[i].granule.product.checked = !granules[i].granule.product.checked}">
                <i class="check" class:checked="{g.granule.product.checked}" class:unchecked="{!g.granule.product.checked}"></i>
            </td> -->
        </tr>
        {/each}
    </table>    
</div>