import { OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
export declare class DatabaseService implements OnModuleInit {
    private dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    onModuleInit(): Promise<void>;
    private initializeDatabase;
    private seedDatabaseIfNeeded;
    getConnectionStatus(): Promise<{
        isConnected: boolean;
        database: string | Uint8Array<ArrayBufferLike> | undefined;
        type: "mysql" | "mariadb" | "postgres" | "cockroachdb" | "sqlite" | "mssql" | "sap" | "oracle" | "cordova" | "nativescript" | "react-native" | "sqljs" | "mongodb" | "aurora-mysql" | "aurora-postgres" | "expo" | "better-sqlite3" | "capacitor" | "spanner";
    }>;
}
