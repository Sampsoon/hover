export enum APIProvider {
  OPEN_ROUTER = 'OpenRouter',
  CUSTOM = 'Custom',
}

export function isAPIProvider(provider: string): provider is APIProvider {
  return Object.values(APIProvider).includes(provider as APIProvider);
}
