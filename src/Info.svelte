<script>
    import T from '@scanex/translations';
    import {createEventDispatcher} from 'svelte';
    import './Info.css';

    export let sceneId = '';
    export let platform = '';
	export let productType = ''; //
	//export let granules = [];
    export let date = '';
	//export let openDate = '';
    //export let order = {};
    export let contractId = ''; // Удалил ниже
    export let time = '';
	//export let productType = ''; //
    export let name = '';

    T.addText('eng', {
        sceneId: 'Scene ID',
        platform: 'Platform',
        date: 'Acquisition Date',
        time: 'Acqusition Time (UTC)',
        parameter: 'Parameter',
        value: 'Value'
    });

    T.addText('rus', {
        sceneId: 'Идентификатор сцены',
        platform: 'Платформа',
        date: 'Дата съемки', // * Дата добавления заказа
        time: 'Время съемки (UTC)',
        parameter: 'Параметр',
        value: 'Значение',
    });

    const translate = T.getText.bind(T);
    
    const dispatch = createEventDispatcher();

    let container;

    export function adjustPosition ({top, left}) {
        container.style.top = `${top}px`;
        container.style.left = `${left}px`;
    }

</script>

<div class="scene-info" bind:this="{container}">
    <table class="header" cellpadding="0" cellspacing="0">
        <tr>
            <td>{platform}</td>
            <td>{date}</td>
            <td on:click|stopPropagation="{() => dispatch('close')}">
                <i class="icon close"></i>
            </td>
        </tr>        
    </table>
    <table class="content" cellpadding="0" cellspacing="0">
        <tr>
            <th>{translate('parameter')}</th>
            <th>{translate('value')}</th>
        </tr>
        <tr>
            <td>{translate('sceneId')}</td>
            <td>{sceneId}</td>
        </tr>
        <tr>
            <td>{translate('platform')}</td>
            <td>{platform}</td>
        </tr>
        <tr>
            <td>{'Тип снимка'}</td>
            <td>{name}</td>
        </tr>
        <tr>
            <td>{translate('date')}</td>
            <td>{date}</td>
        </tr>
        <tr>
            <td>{translate('time')}</td>
            <td>{""}</td>
        </tr>
    </table>
</div>
