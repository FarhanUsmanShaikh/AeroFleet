import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
    };
    getApiHealth(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
        endpoints: {
            missions: string;
            fleet: string;
            websocket: string;
        };
    };
}
