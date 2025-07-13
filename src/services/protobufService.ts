import * as protobuf from 'protobufjs';

// Load the protobuf schema
const protoPath = '/sensor.proto';

class ProtobufService {
  private root: protobuf.Root | null = null;
  private messageTypes: {
    TemperatureData?: protobuf.Type;
    CompassData?: protobuf.Type;
    GpsPositionData?: protobuf.Type;
    SensorData?: protobuf.Type;
    StatusMessage?: protobuf.Type;
  } = {};

  async initialize(): Promise<void> {
    try {
      // Load the protobuf schema
      this.root = await protobuf.load(protoPath);
      
      // Get message types
      this.messageTypes.TemperatureData = this.root.lookupType('sensor.TemperatureData');
      this.messageTypes.CompassData = this.root.lookupType('sensor.CompassData');
      this.messageTypes.GpsPositionData = this.root.lookupType('sensor.GpsPositionData');
      this.messageTypes.SensorData = this.root.lookupType('sensor.SensorData');
      this.messageTypes.StatusMessage = this.root.lookupType('sensor.StatusMessage');
      
      console.log('✅ Protobuf service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize protobuf service:', error);
      throw error;
    }
  }

  parseMessage(topic: string, message: Buffer): any {
    try {
      let messageType: protobuf.Type | undefined;
      
      // Determine message type based on topic
      switch (topic) {
        case 'sensor/temperature':
          messageType = this.messageTypes.TemperatureData;
          break;
        case 'sensor/compass':
          messageType = this.messageTypes.CompassData;
          break;
        case 'sensor/gps':
          messageType = this.messageTypes.GpsPositionData;
          break;
        case 'sensor/all':
          messageType = this.messageTypes.SensorData;
          break;
        case 'sensor/status':
          messageType = this.messageTypes.StatusMessage;
          break;
        default:
          console.log(`Unknown topic: ${topic}`);
          return null;
      }

      if (!messageType) {
        console.error(`No message type found for topic: ${topic}`);
        return null;
      }

      // Decode the protobuf message
      const decoded = messageType.decode(message);
      const object = messageType.toObject(decoded, {
        longs: String,
        enums: String,
        bytes: String,
      });

      console.log(`📦 Parsed protobuf message for ${topic}:`, object);
      return object;
    } catch (error) {
      console.error(`❌ Failed to parse protobuf message for ${topic}:`, error);
      return null;
    }
  }

  // Helper method to convert timestamp to ISO string
  timestampToISO(timestamp: string | number): string {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(ts).toISOString();
  }

  // Format sensor data for display
  formatSensorData(topic: string, parsedData: any): any {
    switch (topic) {
      case 'sensor/temperature':
        return {
          value: parsedData.temperature?.toString() || 'N/A',
          unit: parsedData.unit || '°C',
          timestamp: this.timestampToISO(parsedData.timestamp),
          description: 'CPU Temperature'
        };
      
      case 'sensor/compass':
        return {
          value: parsedData.heading?.toString() || 'N/A',
          unit: parsedData.unit || 'degrees',
          timestamp: this.timestampToISO(parsedData.timestamp),
          description: 'Compass Heading'
        };
      
      case 'sensor/gps':
        const gps = parsedData.position || parsedData;
        return {
          value: `${gps.latitude?.toFixed(6) || 'N/A'}, ${gps.longitude?.toFixed(6) || 'N/A'}`,
          unit: parsedData.unit || 'lat/lon',
          timestamp: this.timestampToISO(parsedData.timestamp),
          description: 'GPS Location'
        };
      
      case 'sensor/status':
        return {
          value: parsedData.status || 'unknown',
          unit: '',
          timestamp: this.timestampToISO(parsedData.timestamp),
          description: 'Sensor Status'
        };
      
      default:
        return {
          value: 'Unknown',
          unit: '',
          timestamp: new Date().toISOString(),
          description: 'Unknown Sensor'
        };
    }
  }
}

export const protobufService = new ProtobufService(); 