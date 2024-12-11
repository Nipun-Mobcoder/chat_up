// // import { useState } from "react";
// import { Map, AdvancedMarker} from "@vis.gl/react-google-maps";

// const CustomMap = () => {
//   // shows marker on London by default
//   let markerLocation = {
//     lat: 28.615665435791016,
//     lng: 77.37452697753906,
//   };

//   return (
//     <div style={{
//         height: '500px',
//         width: '50%',
//         border: '2px solid black',
//         borderRadius: '20px'
//       }}>
//       <Map
//         style={{ borderRadius: "20px" }}
//         defaultZoom={13}
//         defaultCenter={markerLocation}
//         gestureHandling={"greedy"}
//         disableDefaultUI
//       >
//         <AdvancedMarker position={markerLocation} />
//       </Map>
//     </div>
//   );
// }

// export default CustomMap;
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import PropTypes from 'prop-types';

const CustomMap = ({ markerLocation, setMarkerLocation }) => {
//   const [markerLocation, setMarkerLocation] = useState({
//     lat: 28.615665435791016,
//     lng: 77.37452697753906,
//   });
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
        // onClick={handleMapClick}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <Marker position={markerLocation} draggable={true} // Make the marker draggable
          eventHandlers={{
            dragend: handleDragEnd, // Event listener for drag end
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