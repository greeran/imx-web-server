import mqtt, { MqttClient } from 'mqtt';
import { SensorData, MQTTConfig } from '../types';
import { protobufService } from './protobufService';

class MQTTService {
  private client: MqttClient | null = null;
  private config: MQTTConfig | null = null;
  private sensorData: { [key: string]: SensorData } = {};
  private listeners: ((data: { [key: string]: SensorData }) => void)[] = [];

  async connect(config: MQTTConfig): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Initialize protobuf service first
        await protobufService.initialize();
        
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
          this.handleMessage(topic, message);
        });

        this.client.on('error', (error) => {
          console.error('MQTT Error:', error);
          reject(error);
        });

        this.client.on('close', () => {
          console.log('MQTT Connection closed');
        });
      } catch (error) {
        console.error('Failed to initialize MQTT with protobuf:', error);
        reject(error);
      }
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

  private handleMessage(topic: string, message: Buffer): void {
    if (!this.config) return;

    console.log(`MQTT Message received - Topic: ${topic}, Message length: ${message.length} bytes`);

    // Find the sensor key for this topic
    const sensorKey = Object.keys(this.config.topics).find(
      key => this.config!.topics[key].topic === topic
    );

    if (sensorKey) {
      const topicConfig = this.config.topics[sensorKey];
      
      try {
        // Try to parse as protobuf first
        const parsedData = protobufService.parseMessage(topic, message);
        
        if (parsedData) {
          // Format the parsed protobuf data for display
          const formattedData = protobufService.formatSensorData(topic, parsedData);
          
          const sensorData: SensorData = {
            value: formattedData.value,
            description: formattedData.description,
            unit: formattedData.unit,
            timestamp: formattedData.timestamp,
          };

          this.sensorData[sensorKey] = sensorData;
          console.log(`📦 Protobuf sensor data updated for ${sensorKey}:`, sensorData);
          this.notifyListeners();
        } else {
          // Fallback to JSON parsing if protobuf fails
          const messageStr = message.toString();
          console.log(`🔄 Falling back to JSON parsing for ${topic}`);
          
          try {
            const jsonData = JSON.parse(messageStr);
            
            // Extract value based on topic type
            let parsedValue: string;
            let timestamp: string = new Date().toISOString();
            
            switch (sensorKey) {
              case 'temperature':
                parsedValue = jsonData.temperature?.toString() || 'N/A';
                timestamp = jsonData.timestamp || timestamp;
                break;
              case 'compass':
                parsedValue = jsonData.heading?.toString() || 'N/A';
                timestamp = jsonData.timestamp || timestamp;
                break;
              case 'gps':
                parsedValue = `${jsonData.latitude?.toFixed(6) || 'N/A'}, ${jsonData.longitude?.toFixed(6) || 'N/A'}`;
                timestamp = jsonData.timestamp || timestamp;
                break;
              case 'status':
                parsedValue = jsonData.toString();
                break;
              default:
                parsedValue = messageStr;
            }

            const sensorData: SensorData = {
              value: parsedValue,
              description: topicConfig.description,
              unit: topicConfig.unit,
              timestamp: timestamp,
            };

            this.sensorData[sensorKey] = sensorData;
            console.log(`📄 JSON sensor data updated for ${sensorKey}:`, sensorData);
            this.notifyListeners();
          } catch (jsonError) {
            console.error(`❌ Failed to parse message for ${topic}:`, jsonError);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to handle message for ${topic}:`, error);
      }
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