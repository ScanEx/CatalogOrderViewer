<script>
    import T from 'scanex-translations';
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { visibility } from './store.js';
    import FileBrowser from './FileBrowser.svelte';
    import './Region.css';

    export let id = '';
    export let geoJSON = null;
    export let name = '';
    export let granules = [];
    export let visible = false;    
    export let filePath = '';

    let expanded = false;    
    let selected = -1;    

    T.addText('eng', {
        product: 'Product',        
    });

    T.addText('rus', {
        product: 'Продукт',        
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
        let fileBrowser = new FileBrowser({target: document.body});
        let p = filePath.replace('\\', '/');    
        const i = p.lastIndexOf('/');    
        const path = i < 0 ? p : p.substr(0, i);
        dispatch('expand', {
            expand: files => fileBrowser.$set({files}),
            filePath: path,
        });
        fileBrowser.$on('expand', ({detail}) => dispatch('expand', detail));
        fileBrowser.$on('close', () => {            
            fileBrowser.$destroy();
        });
        fileBrowser.$on('download', () => {            
            fileBrowser.$destroy();
            dispatch('download');
        });
        fileBrowser.$on('selection', ({detail}) => {
            dispatch('selection', detail);
        });
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
        dispatch('preview', {id, visible, granules: gs, geoJSON});
    };

    let unsubscribe = visibility.subscribe(value => {
        if (!value) {
            visible = false;
        }
    });

    onDestroy(() => unsubscribe());
    
</script>


<div class="roi">
    <table class="header" class:collapsed="{!expanded}">
        <tr>
            <td on:click|stopPropagation="{() => expanded = !expanded}">
                <i class="toggle icon" class:caret-right="{!expanded}" class:caret-down="{expanded}"></i>
            </td>
            <td on:click|stopPropagation="{preview}">
                <i class="preview icon" class:eye="{visible}" class:eye-invisible="{!visible}"></i>
            </td>
            <td class="name" on:click|stopPropagation="{() => expanded = !expanded}">{name}</td>
            <td on:click|stopPropagation="{download}">
                <i class="icon download" class:caret-down="{expanded}" class:caret-right="{!expanded}"></i>
            </td>
        </tr>                                
    </table>
    <table class="content" class:hidden="{!expanded}" cellpadding="0" cellspacing="0">
        <tr>
            <th>{translate('product')}</th>            
            <th></th>            
        </tr>
        {#each granules.filter(({granule: {productType}}) => productType !== 100000) as g, i}
        <tr class:selected="{i === selected}" on:click="{() => select(i)}">
            <td>{g.granule.sceneId}</td>            
            <td>
                <i class="icon info-circle"></i>
            </td>            
        </tr>
        {/each}
    </table>    
</div>