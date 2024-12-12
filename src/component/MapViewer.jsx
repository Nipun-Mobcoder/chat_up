import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import PropTypes from 'prop-types';

const MapViewer = ({ markerLocation }) => {

  return (
    <div style={{
      height: "200px",
      width: "100%",
      border: "1px solid black",
      borderRadius: "5px"
    }}>
      <MapContainer
        center={markerLocation}
        zoom={13}
        dragging={false}
        style={{ height: "100%", width: "100%", borderRadius: "20px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={markerLocation}>
          <Popup>
            Latitude: {markerLocation.lat.toFixed(4)}, Longitude: {markerLocation.lng.toFixed(4)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapViewer;

MapViewer.propTypes = {
    markerLocation: PropTypes.object.isRequired
  };