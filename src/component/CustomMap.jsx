import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import PropTypes from 'prop-types';

const CustomMap = ({ markerLocation, setMarkerLocation }) => {

const handleDragEnd = (event) => {
    const { lat, lng } = event.target.getLatLng();
    setMarkerLocation({ lat, lng });
  };

  return (
    <div style={{
      height: "500px",
      width: "100%",
      border: "2px solid black",
      borderRadius: "20px"
    }}>
      <MapContainer
        center={markerLocation}
        zoom={13}
        style={{ height: "100%", width: "100%", borderRadius: "20px" }}
        touchZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={markerLocation} draggable={true}
          eventHandlers={{
            dragend: handleDragEnd
          }}>
          <Popup>
            Latitude: {markerLocation.lat.toFixed(4)}, Longitude: {markerLocation.lng.toFixed(4)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default CustomMap;

CustomMap.propTypes = {
    markerLocation: PropTypes.object.isRequired,
    setMarkerLocation: PropTypes.func.isRequired
  };