<script>
    import T from 'scanex-translations';
    import {createEventDispatcher} from 'svelte';
    import './Info.css';

    export let sceneId = '';
    export let platform = '';
    export let date = '';
    export let time = '';

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
        date: 'Дата съемки',
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
            <td>{translate('date')}</td>
            <td>{date}</td>
        </tr>
        <tr>
            <td>{translate('time')}</td>
            <td>{time}</td>
        </tr>
    </table>
</div>
