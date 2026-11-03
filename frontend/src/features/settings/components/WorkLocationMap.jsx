import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

function MapInteraction({ center, zoom, onSelect }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);

  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function WorkLocationMap({ latitude, longitude, radiusMeters, onSelect }) {
  const hasCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;
  const center = useMemo(
    () => (hasCoordinates ? [latitude, longitude] : [20, 0]),
    [hasCoordinates, latitude, longitude],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <MapContainer
        center={center}
        zoom={hasCoordinates ? 16 : 2}
        className="h-72 w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInteraction
          center={center}
          zoom={hasCoordinates ? 16 : 2}
          onSelect={onSelect}
        />
        {hasCoordinates && (
          <>
            <Circle
              center={center}
              radius={Number(radiusMeters) || 150}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#3b82f6",
                fillOpacity: 0.15,
              }}
            />
            <CircleMarker
              center={center}
              radius={7}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor: "#2563eb",
                fillOpacity: 1,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default WorkLocationMap;
