<script lang="ts">
	import { userStore } from '$stores/user';
</script>

{#if $userStore}
	<slot />
{:else}
	<p class="text-sm text-neutral/80 flex items-center gap-2" role="note">
		<span aria-hidden="true">🔒</span>
		<span>Sign in to edit.</span>
	</p>
{/if}

