export const enum ServiceWorkerMessageType {
  HOVER_HINT_RETRIEVAL = 'hoverHintRetrieval',
}

export interface ServiceWorkerMessage<T> {
  type: ServiceWorkerMessageType;
  payload: T;
}
