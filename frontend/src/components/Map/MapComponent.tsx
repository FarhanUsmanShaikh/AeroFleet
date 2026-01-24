import React, { useRef, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Polygon, Marker, Popup, Polyline } from 'react-leaflet';
import { LatLng, Map as LeafletMap } from 'leaflet';
import type { LatLng as AppLatLng, Waypoint } from '../../../../shared/types';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  onPolygonDraw?: (coordinates: AppLatLng[]) => void;
  flightPath?: Waypoint[];
  dronePosition?: AppLatLng;
  missionBounds?: AppLatLng[];
  isDrawingMode?: boolean;
  className?: string;
}

interface PolygonDrawerProps {
  onPolygonDraw?: (coordinates: AppLatLng[]) => void;
  isDrawingMode?: boolean;
}

// Component for handling polygon drawing
const PolygonDrawer: React.FC<PolygonDrawerProps> = ({ onPolygonDraw, isDrawingMode }) => {
  const [drawingPoints, setDrawingPoints] = React.useState<AppLatLng[]>([]);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const map = useMapEvents({
    click: (e) => {
      if (!isDrawingMode) return;

      const newPoint: AppLatLng = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      };

      if (!isDrawing) {
        // Start drawing
        setIsDrawing(true);
        setDrawingPoints([newPoint]);
      } else {
        // Add point to current polygon
        const newPoints = [...drawingPoints, newPoint];
        setDrawingPoints(newPoints);
      }
    },
    dblclick: (e) => {
      if (!isDrawingMode || !isDrawing) return;

      // Finish drawing
      if (drawingPoints.length >= 3) {
        onPolygonDraw?.(drawingPoints);
      }
      setIsDrawing(false);
      setDrawingPoints([]);
    }
  });

  // Reset drawing when mode changes
  useEffect(() => {
    if (!isDrawingMode) {
      setIsDrawing(false);
      setDrawingPoints([]);
    }
  }, [isDrawingMode]);

  // Render current drawing polygon
  if (isDrawing && drawingPoints.length >= 2) {
    const leafletPoints: [number, number][] = drawingPoints.map(p => [p.latitude, p.longitude]);
    return (
      <Polygon
        positions={leafletPoints}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5'
        }}
      />
    );
  }

  return null;
};

// Component for displaying flight path
const FlightPathDisplay: React.FC<{ waypoints: Waypoint[] }> = ({ waypoints }) => {
  if (!waypoints || waypoints.length === 0) return null;

  const sortedWaypoints = [...waypoints].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const pathPoints: [number, number][] = sortedWaypoints.map(wp => [wp.latitude, wp.longitude]);

  return (
    <>
      {/* Flight path line */}
      <Polyline
        positions={pathPoints}
        pathOptions={{
          color: '#10b981',
          weight: 3,
          opacity: 0.8
        }}
      />

      {/* Waypoint markers */}
      {sortedWaypoints.map((waypoint, index) => (
        <Marker
          key={waypoint.id}
          position={[waypoint.latitude, waypoint.longitude]}
          icon={L.divIcon({
            className: 'waypoint-marker',
            html: `<div class="bg-gradient-to-br from-success-400 to-success-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">${waypoint.sequenceNumber}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span className="text-success-500">📍</span>
                Waypoint {waypoint.sequenceNumber}
              </div>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">Lat:</span>
                  <span className="font-mono text-xs">{waypoint.latitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-medium">Lng:</span>
                  <span className="font-mono text-xs">{waypoint.longitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-medium">Alt:</span>
                  <span>{waypoint.altitude}m</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-medium">Action:</span>
                  <span className="text-primary-600 font-semibold">{waypoint.action}</span>
                </div>
              </div>
              {waypoint.completed && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-success-600 font-semibold flex items-center gap-1">
                    <span>✓</span> Completed
                  </div>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

// Component for displaying drone position
const DroneMarker: React.FC<{ position: AppLatLng }> = ({ position }) => {
  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={L.divIcon({
        className: 'drone-marker',
        html: `<div class="bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow-xl border-3 border-white">🚁</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })}
    >
      <Popup>
        <div className="text-sm">
          <div className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <span className="text-primary-500">🚁</span>
            Drone Position
          </div>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between gap-3">
              <span className="font-medium">Lat:</span>
              <span className="font-mono text-xs">{position.latitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="font-medium">Lng:</span>
              <span className="font-mono text-xs">{position.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

// Component for displaying mission bounds
const MissionBounds: React.FC<{ bounds: AppLatLng[] }> = ({ bounds }) => {
  if (!bounds || bounds.length < 3) return null;

  const leafletPoints: [number, number][] = bounds.map(p => [p.latitude, p.longitude]);

  return (
    <Polygon
      positions={leafletPoints}
      pathOptions={{
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.1,
        weight: 2
      }}
    />
  );
};

const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom,
  onPolygonDraw,
  flightPath,
  dronePosition,
  missionBounds,
  isDrawingMode = false,
  className = ''
}) => {
  const mapRef = useRef<LeafletMap>(null);

  const handleMapReady = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      // Map is ready, can perform additional setup here
      console.log('Map initialized');
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        ref={mapRef}
        whenReady={handleMapReady}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Polygon drawing functionality */}
        <PolygonDrawer
          onPolygonDraw={onPolygonDraw}
          isDrawingMode={isDrawingMode}
        />

        {/* Mission bounds display */}
        {missionBounds && <MissionBounds bounds={missionBounds} />}

        {/* Flight path display */}
        {flightPath && <FlightPathDisplay waypoints={flightPath} />}

        {/* Drone position */}
        {dronePosition && <DroneMarker position={dronePosition} />}
      </MapContainer>

      {/* Drawing instructions */}
      {isDrawingMode && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border-2 border-primary-200 z-[1000] animate-slide-down">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-sky rounded-lg flex items-center justify-center animate-pulse-slow">
              <span className="text-lg">✏️</span>
            </div>
            <div className="text-sm font-bold text-slate-800">Drawing Mode Active</div>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-primary-500">●</span>
              <span>Click to add points</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-500">●</span>
              <span>Double-click to finish</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;