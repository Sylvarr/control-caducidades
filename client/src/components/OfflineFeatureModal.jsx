import PropTypes from "prop-types";
import { WifiOff } from "lucide-react";
import ModalContainer from "./ModalContainer";
import { useState } from "react";

const OfflineFeatureModal = ({ isOpen, onClose, featureName }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      isClosing={isClosing}
      onClose={handleClose}
      title={featureName}
      containerClassName="max-w-md"
    >
      <div className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-gray-50 rounded-full">
            <WifiOff className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Función no disponible sin conexión
            </h3>
            <p className="text-gray-600">
              Por razones de seguridad, esta función solo está disponible cuando
              tienes conexión a internet.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="mt-2 px-6 py-2.5 bg-[#1d5030] text-white rounded-lg
              hover:bg-[#1d5030]/90 transition-all duration-200
              shadow-sm hover:shadow-md active:scale-95
              font-medium"
          >
            Entendido
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

OfflineFeatureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  featureName: PropTypes.string.isRequired,
};

export default OfflineFeatureModal;
