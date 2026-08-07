class PubSubProvider {
  /**
   * Publish a message to a specific channel
   * @param {string} channel
   * @param {string} message
   */
  async publish(channel, message) {
    throw new Error('Method "publish" must be implemented.');
  }

  /**
   * Subscribe to a specific channel
   * @param {string} channel
   * @param {Function} callback
   */
  async subscribe(channel, callback) {
    throw new Error('Method "subscribe" must be implemented.');
  }

  /**
   * Unsubscribe from a specific channel
   * @param {string} channel
   * @param {Function} callback
   */
  async unsubscribe(channel, callback) {
    throw new Error('Method "unsubscribe" must be implemented.');
  }
}

export default PubSubProvider;
