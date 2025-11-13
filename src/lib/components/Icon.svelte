<script lang="ts">
	export let name: string;
	export let size: number | string = 24;
	export let className = '';
	export let label: string | null = null;

	const fontSize = typeof size === 'number' ? `${size}px` : size;
</script>

<span
	class={`material-symbols-outlined ${className}`.trim()}
	style={`font-size: ${fontSize};`}
	aria-hidden={label ? undefined : 'true'}
>
	{name}
</span>
{#if label}
	<span class="sr-only">{label}</span>
{/if}

