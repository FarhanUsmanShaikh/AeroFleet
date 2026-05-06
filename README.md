# 🚁 AeroFleet - Mission Control

A premium, high-fidelity platform for planning, managing, and monitoring autonomous drone surveys. Designed for large organizations to coordinate remote drone operations with institutional-grade precision and real-time telemetry.

Live Link - https://aerofleet.vercel.app/ - After accessing the live application, please note that the backend is deployed on Render. Due to free-tier limitations, the service may go to sleep when there is no activity. If this happens, it may take 60 seconds to a few minutes for the server to wake up and re-establish the connection. Once it’s active, you can continue using AeroFleet normally.

## ✨ Premium Features

### 🎯 Strategic Mission Planning
- **Interactive Survey Definition**: Define precise operational boundaries using an advanced map-based polygon drawing tool.
- **Intelligent Path Generation**: Automated waypoint calculation supporting **GRID**, **CROSSHATCH**, and **PERIMETER** sweep patterns.
- **Telemetry Prediction**: Real-time estimation of mission trajectory distance and airborne duration before launch.
- **Sensor Optimization**: Fine-tune data collection via configurable altitudes, overlap percentages, and sensor trigger frequencies.

### 📡 Real-time Command & Telemetry
- **Live Flight Monitoring**: Visualize real-time drone positions and flight paths with zero-latency WebSocket synchronization.
- **Enhanced Telemetry Interface**: High-fidelity monitoring panel featuring live progress %, waypoint deltas, and "Hull Energy" (battery) tracking.
- **Remote Mission Control**: Instant operational authority to **Pause**, **Resume**, or **Abort** missions from anywhere in the world.

### 📊 Fleet Intelligence & Analytics
- **Org-wide Inventory**: Centralized dashboard for real-time monitoring of fleet-wide drone status (Available, In-Mission, Maintenance).
- **Advanced Performance Analytics**: Comprehensive metrics including mission success rates, total fleet airtime, and cumulative distance covered.
- **Operational Log**: Detailed historical record of all mission entries with deep telemetry summaries.

### 🛡️ Institutional-Grade Safety
- **Automatic Failsafe**: Intelligent mission termination (Abort) system that triggers if battery levels fall below the 20% safety threshold.
- **Resource Locking**: Sophisticated state management to prevent multi-mission drone conflicts.
- **Encrypted Telemetry Links**: Simulated encrypted data streams for secure drone-to-base communication.

## 🛠️ Technology Stack

### Frontend
- **React 18 & TypeScript**: Core component logic.
- **Leaflet & OpenStreetMap**: High-performance interactive map engine.
- **Tailwind CSS**: Premium **Glassmorphism** design system with GPU hardware acceleration.
- **Socket.IO Client**: Real-time telemetry and command stream.

### Backend
- **NestJS (Node.js)**: Scalable, enterprise-grade server architecture.
- **Socket.IO**: WebSocket gateway for live fleet updates.
- **TypeORM & MySQL**: Robust data persistence for missions and fleet inventory.
- **Mission Simulator**: Backend-driven drone behavior and status simulation.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Database Configuration:**
   - Create a MySQL database named `drone_survey_management`.
   - Update credentials in `backend/.env`.

3. **Launch Operational Center:**
   ```bash
   # Start both frontend and backend
   npm run dev
   ```

4. **Initialize Fleet:**
   - Open http://localhost:5173 and click `🔄 Seed Data` to populate the organizational fleet.

## 🧠 Development Reflection

### How did you approach the problem?
I approached the problem by first identifying the three main needs of a drone operator: **Planning**, **Monitoring**, and **Analysis**. I built a robust backend using NestJS to handle the "heavy lifting"—specifically waypoint generation and real-time mission simulation. Once the backbone was ready, I focused on creating a premium frontend experience that feels like a professional mission control center. I used modern AI development tools to rapidly iterate on complex UI components while maintaining high standards for code quality and design.

### The trade-offs you considered during development
One major trade-off was focusing on **high-quality features for a single dashboard** rather than attempting to build a multi-site organizational system. This allowed me to deliver a deeply polished monitoring and analytics experience that is both reliable and visually impressive. I also chose to use a simplified coordinate system for path calculations; while less complex than a full geographic GIS system, it provides high speed and accuracy for the scale of facility surveys required in this challenge.

### Your strategy for ensuring safety and adaptability in the system
Safety is built directly into the core mission loop. The system includes an **automatic "Abort and Return" protocol** that triggers immediately if a drone's battery falls below 20%. I also used WebSockets for real-time telemetry updates, ensuring operators have zero-latency visibility into fleet health. For adaptability, I used a modular service architecture. This makes it simple to add new survey patterns, support different drone models, or integrate new sensor types without rewriting the core mission logic.


## 📄 License
This project is build for educational purposes.