import { DataSource } from 'typeorm';
import { Drone } from '../../entities/drone.entity';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const droneRepository = dataSource.getRepository(Drone);

  // Check if drones already exist
  const existingDrones = await droneRepository.count();
  if (existingDrones > 0) {
    console.log('Database already seeded with drones');
    return;
  }

  // Sample drone data
  const sampleDrones = [
    {
      id: uuidv4(),
      name: 'Falcon-01',
      model: 'DJI Matrice 300 RTK',
      status: 'AVAILABLE' as const,
      batteryLevel: 100,
      currentLatitude: 37.7749,
      currentLongitude: -122.4194,
      maxFlightTime: 2700, // 45 minutes
      maxSpeed: 17
    },
    {
      id: uuidv4(),
      name: 'Eagle-02',
      model: 'DJI Phantom 4 RTK',
      status: 'AVAILABLE' as const,
      batteryLevel: 95,
      currentLatitude: 37.7849,
      currentLongitude: -122.4094,
      maxFlightTime: 1800, // 30 minutes
      maxSpeed: 15
    },
    {
      id: uuidv4(),
      name: 'Hawk-03',
      model: 'Autel EVO II Pro',
      status: 'AVAILABLE' as const,
      batteryLevel: 88,
      currentLatitude: 37.7649,
      currentLongitude: -122.4294,
      maxFlightTime: 2400, // 40 minutes
      maxSpeed: 16
    },
    {
      id: uuidv4(),
      name: 'Raven-04',
      model: 'DJI Mavic 3 Enterprise',
      status: 'AVAILABLE' as const,
      batteryLevel: 92,
      currentLatitude: 37.7549,
      currentLongitude: -122.4394,
      maxFlightTime: 2100, // 35 minutes
      maxSpeed: 14
    },
    {
      id: uuidv4(),
      name: 'Osprey-05',
      model: 'Parrot ANAFI USA',
      status: 'MAINTENANCE' as const,
      batteryLevel: 75,
      currentLatitude: 37.7949,
      currentLongitude: -122.3994,
      maxFlightTime: 1920, // 32 minutes
      maxSpeed: 13
    }
  ];

  // Create and save drones
  const drones = droneRepository.create(sampleDrones);
  await droneRepository.save(drones);

  console.log(`✅ Seeded database with ${drones.length} sample drones`);
}
