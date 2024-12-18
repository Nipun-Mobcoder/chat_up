import PropTypes from 'prop-types';

const PdfComponent = ({ pdfUrl }) => {
    const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
    
    return (
        <iframe
            src={googleViewerUrl}
            width="100%"
            height="250px"
            title="Docs Viewer"
            style={{ border: 'none' }}
            onError={(e) => e.target.src = pdfUrl}
        ></iframe>
    );
}

PdfComponent.propTypes = {
    pdfUrl: PropTypes.string.isRequired,
};

export default PdfComponent;