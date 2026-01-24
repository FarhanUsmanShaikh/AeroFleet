"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const drone_entity_1 = require("../../entities/drone.entity");
const uuid_1 = require("uuid");
async function seedDatabase(dataSource) {
    const droneRepository = dataSource.getRepository(drone_entity_1.Drone);
    const existingDrones = await droneRepository.count();
    if (existingDrones > 0) {
        console.log('Database already seeded with drones');
        return;
    }
    const sampleDrones = [
        {
            id: (0, uuid_1.v4)(),
            name: 'Falcon-01',
            model: 'DJI Matrice 300 RTK',
            status: 'AVAILABLE',
            batteryLevel: 100,
            currentLatitude: 37.7749,
            currentLongitude: -122.4194,
            maxFlightTime: 2700,
            maxSpeed: 17
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Eagle-02',
            model: 'DJI Phantom 4 RTK',
            status: 'AVAILABLE',
            batteryLevel: 95,
            currentLatitude: 37.7849,
            currentLongitude: -122.4094,
            maxFlightTime: 1800,
            maxSpeed: 15
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Hawk-03',
            model: 'Autel EVO II Pro',
            status: 'AVAILABLE',
            batteryLevel: 88,
            currentLatitude: 37.7649,
            currentLongitude: -122.4294,
            maxFlightTime: 2400,
            maxSpeed: 16
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Raven-04',
            model: 'DJI Mavic 3 Enterprise',
            status: 'AVAILABLE',
            batteryLevel: 92,
            currentLatitude: 37.7549,
            currentLongitude: -122.4394,
            maxFlightTime: 2100,
            maxSpeed: 14
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Osprey-05',
            model: 'Parrot ANAFI USA',
            status: 'MAINTENANCE',
            batteryLevel: 75,
            currentLatitude: 37.7949,
            currentLongitude: -122.3994,
            maxFlightTime: 1920,
            maxSpeed: 13
        }
    ];
    const drones = droneRepository.create(sampleDrones);
    await droneRepository.save(drones);
    console.log(`✅ Seeded database with ${drones.length} sample drones`);
}
//# sourceMappingURL=initial-seed.js.map