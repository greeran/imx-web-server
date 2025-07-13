import mqtt, { MqttClient } from 'mqtt';
import { SensorData, MQTTConfig } from '../types';

class MQTTService {
  private client: MqttClient | null = null;
  private config: MQTTConfig | null = null;
  private sensorData: { [key: string]: SensorData } = {};
  private listeners: ((data: { [key: string]: SensorData }) => void)[] = [];

  connect(config: MQTTConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.config = config;
      
      // Use WebSocket protocol for browser compatibility
      const url = `ws://${config.host}:8083`;
      
      this.client = mqtt.connect(url, {
        clientId: config.client_id,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      this.client.on('connect', () => {
        console.log('MQTT Connected');
        this.subscribeToTopics();
        resolve();
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message.toString());
      });

      this.client.on('error', (error) => {
        console.error('MQTT Error:', error);
        reject(error);
      });

      this.client.on('close', () => {
        console.log('MQTT Connection closed');
      });
    });
  }

  private subscribeToTopics(): void {
    if (!this.client || !this.config) return;

    console.log('Starting to subscribe to topics...');
    console.log('Available topics:', Object.keys(this.config.topics));

    Object.entries(this.config.topics).forEach(([key, topicConfig]) => {
      console.log(`Attempting to subscribe to: ${topicConfig.topic}`);
      this.client!.subscribe(topicConfig.topic, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topicConfig.topic}:`, err);
        } else {
          console.log(`✅ Successfully subscribed to ${topicConfig.topic}`);
        }
      });
    });
  }

  private handleMessage(topic: string, message: string): void {
    if (!this.config) return;

    console.log(`MQTT Message received - Topic: ${topic}, Message: ${message}`);

    // Find the sensor key for this topic
    const sensorKey = Object.keys(this.config.topics).find(
      key => this.config!.topics[key].topic === topic
    );

    if (sensorKey) {
      const topicConfig = this.config.topics[sensorKey];
      const sensorData: SensorData = {
        value: message,
        description: topicConfig.description,
        unit: topicConfig.unit,
        timestamp: new Date().toISOString(),
      };

      this.sensorData[sensorKey] = sensorData;
      console.log(`Sensor data updated for ${sensorKey}:`, sensorData);
      this.notifyListeners();
    } else {
      console.log(`Received message for unknown topic: ${topic}`);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.sensorData }));
  }

  onSensorDataUpdate(callback: (data: { [key: string]: SensorData }) => void): void {
    this.listeners.push(callback);
  }

  getSensorData(): { [key: string]: SensorData } {
    return { ...this.sensorData };
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export const mqttService = new MQTTService(); 