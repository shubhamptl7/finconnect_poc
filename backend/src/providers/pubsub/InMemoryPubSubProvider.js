import EventEmitter from 'events';
import PubSubProvider from './PubSubProvider.js';

class InMemoryPubSubProvider extends PubSubProvider {
  constructor() {
    super();
    this.emitter = new EventEmitter();
    // Increase limit if there are many users online
    this.emitter.setMaxListeners(1000); 
  }

  async publish(channel, message) {
    // We stringify and parse to mimic the serialization of external PubSub like Redis
    const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    this.emitter.emit(channel, serializedMessage);
  }

  async subscribe(channel, callback) {
    this.emitter.on(channel, callback);
  }

  async unsubscribe(channel, callback) {
    this.emitter.off(channel, callback);
  }
}

export default new InMemoryPubSubProvider();
